const { ipcMain,dialog } = require('electron');

const isMac = process.platform === 'darwin'

const Store = require('electron-store');

const StoreKey = require('./class/StoreKey');
const appSetting = new Store({name:'settings'});
const qiniuConfigArr = Object.values(appSetting.get(StoreKey.QINIU_CONFIG_KEY) || {});
const isSetQiniuConfig = qiniuConfigArr.length === 0 ? false : qiniuConfigArr.every((value) => {
    return !!value;
});



const isAutoSyncStatus = appSetting.get(StoreKey.AUTO_SYNC_STATUS_KEY);

const menuTemplate = [
    {
        label: '文件',
        submenu: [
            {
                label: '新建文档',
                accelerator: 'CmdOrCtrl+N',
                click: (menuItem,browserWindow,event) => {
                    browserWindow.webContents.send('MenuAction','create_file');
                }
            }, {
                label: '导入文档',
                accelerator: 'CmdOrCtrl+O',
                click: (menuItem,browserWindow,event) => {
                    browserWindow.webContents.send('MenuAction','import_file');
                }
            },
            {
                label: '搜索文档',
                accelerator: 'CmdOrCtrl+F',
                click: (menuItem,browserWindow,event) => {
                    browserWindow.webContents.send('MenuAction','search_file');
                }
            },
            {
                type: 'separator'
            },
            {
                label: '退出程序',
                accelerator: 'Alt+F4',
                role: 'quit'
            }
        ],
    },
    {
        label: '编辑',
        submenu: [
            {
                label: '撤销',
                role: 'undo'
            },
            {
                label: '剪切',
                role: 'cut'
            },
            {
                label: '复制',
                role: 'copy'
            },
            {
                label: '黏贴',
                role: 'paste'
            },
        ],
    },
    {
        label: '应用',
        submenu: [
            {
                label: '设置',
                accelerator: 'CmdOrCtrl+,',
                click: (menuItem,browserWindow,event) => {
                    ipcMain.emit('open-setting-window');
                }
            },
        ]
    },
    {
        label: '云同步',
        submenu: [
            {
                label: '设置',
                accelerator: 'CmdOrCtrl+,',
                click: (menuItem,browserWindow,event) => {
                    ipcMain.emit('open-setting-window');
                }
            },
            {
                label: '自动同步',
                type: 'checkbox',
                enabled: isSetQiniuConfig,
                checked: isAutoSyncStatus,
                click: (menuItem,browserWindow,event) => {
                    const cloudSyncStatus = menuItem.checked;
                    appSetting.set(StoreKey.AUTO_SYNC_STATUS_KEY,cloudSyncStatus);
                    browserWindow.webContents.send('MenuAction','change_cloud_sync_status');
                    cloudSyncStatus && ipcMain.emit('change_cloud_config');
                }
            },
            {
                label: '全部同步至云端',
                enabled: isSetQiniuConfig,
                click: (menuItem,browserWindow,event) => {
                    ipcMain.emit('open-setting-window');
                }
            },
            {
                label: '从云端同步到本地',
                enabled: isSetQiniuConfig,
                click: (menuItem,browserWindow,event) => {
                    ipcMain.emit('open-setting-window');
                }
            },
        ]
    },
    {
        label: '视图',
        submenu: [
            {
                label: '重新加载',
                role: 'reload',
                accelerator: 'CmdOrCtrl+R',
            },
            {
                label: '打开控制台',
                accelerator: 'CmdOrCtrl+Alt+I',
                click: (menuItem,browserWindow,event) => {
                    browserWindow.webContents.openDevTools({mode:'bottom'});
                }
            }
        ]
    },
    {
        label: '窗口',
        submenu: [
            {
                label: '最小化',
                role: 'minimize',
                accelerator: 'CmdOrCtrl+M',
            },
            {
                label: '关闭',
                accelerator: 'CmdOrCtrl+W',
                role: 'close',
            }
        ]
    },
    {
        label: '帮助',
        submenu: [
            {
                label: '关于',
                role: 'about',
                // accelerator: 'CmdOrCtrl+M',
            },
        ]
    }
];

module.exports = menuTemplate;