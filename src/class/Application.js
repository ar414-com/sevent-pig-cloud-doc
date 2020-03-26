const { app, Menu, dialog, BrowserWindow, Tray } = require('electron');
const Store = require('electron-store');
const isDev = require('electron-is-dev');
const QiniuManager = require('./QiniuManager');
const packageData = require('./PackageData');
const menuTemplate  = require("../menuTemplate");
const path = require('path');
const appSetting = new Store({name:'settings'});
const StoreKey = require('./StoreKey');
const { autoUpdater } = require("electron-updater");
let tray = null;
let OnlyID = null;
let OnlyID2 = null;
class Application {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.appMenu = Menu.buildFromTemplate(menuTemplate);
    }

    createAppMenu() {
        Menu.setApplicationMenu(this.appMenu);
    }

    createTray() {
        tray = new Tray(path.join(Application.getAppRootPath(),'./assets/tray26.ico'));
        const trayContextMenu = Menu.buildFromTemplate([
            { label: 'Item1', type: 'radio' },
            { label: 'Item2', type: 'radio' },
            { label: 'Item3', type: 'radio', checked: true },
            { label: 'Item4', type: 'radio' }
        ]);
        tray.setToolTip(packageData.getVar('cnName'));
        tray.setContextMenu(trayContextMenu);
        OnlyID = setInterval(() => {
            console.log(OnlyID);
            tray.setImage(path.join(Application.getAppRootPath(),'./assets/tray-pink.ico'));
            setTimeout(() => {
                // 写逻辑代码
                tray.setImage(path.join(Application.getAppRootPath(),'./assets/tray26.ico'));
            }, 750)
        }, 1500);
        tray.addListener('double-click',((event, bounds) => {
            this.mainWindow.show();
        }));
    }

    updateCloudSyncMenu() {

        const isSetQiniuConfig = Object.values(appSetting.get(StoreKey.QINIU_CONFIG_KEY) || {}).every((value) => {
            return !!value;
        });

        for(let i = 1;i <= 3;i++){
            this.appMenu.items[3].submenu.items[i].enabled = isSetQiniuConfig;
        }

        Menu.setApplicationMenu(this.appMenu);

    }

    onAppAutoUpdate() {

        autoUpdater.autoDownload = false;

        if(isDev){
            autoUpdater.updateConfigPath = path.join(Application.getAppRootPath(),"./app-update.yml");
        }

        autoUpdater.checkForUpdates();

        autoUpdater.on('error',(e) => {
            //更新错误
            console.log('更新错误',e);
        });

        autoUpdater.on('checking-for-update',(ret) => {
            //开始检测更新
            console.log('checking-for-update',ret);
        });

        autoUpdater.on('update-available',(ret) => {
            //发现新版本
            this.mainWindow.show();
            Application.showBox({
                    type: 'info',
                    title: '发现新版本',
                    message: ret.releaseNotes,
                    cancelId:0,
                    defaultId:1,
                    buttons: ['稍后再说','立即更新']
            }).then((ret) => {
                if(ret.response === 1) {
                    autoUpdater.downloadUpdate();
                }
            });
            console.log('update-available',ret);
        });

        autoUpdater.on('update-not-available',(ret) => {
            //没有发现更新
            console.log('update-not-available',ret);
        });

        autoUpdater.on('download-progress',(ret) => {
            //下载进度
            // mainWindow.setProgressBar
            console.log('download-progress',ret);
            if(ret.total && ret.total > 0){
                this.mainWindow.setProgressBar(ret.percent / 100);
            }
        });

        autoUpdater.on('update-downloaded',(ret) => {
            //完成更新包下载
            console.log('update-downloaded',ret);
        });
    }

    static showBox(option) {
        return dialog.showMessageBox(new BrowserWindow({
            show: false,
            modal:true,
            alwaysOnTop: true
        }),option);
    }

    static getAppRootPath() {
        return path.dirname(require.main.filename);
    }

    static getMainUrl() {
        return isDev ? "http://localhost:3000/" : `file://${path.join(Application.getAppRootPath(),'./build/index.html')}`;
    }

    static getQiniuManager() {

        const qiniuConfig = Application.getQiniuConfig();

        const qiniuManager = new QiniuManager(qiniuConfig.accesskey,
            qiniuConfig.secretkey,qiniuConfig.bucket);

        return qiniuManager;
    }

    static getQiniuConfig() {
        const qiniuConfig = appSetting.get(StoreKey.QINIU_CONFIG_KEY);
        const isSetQiniuConfig = Object.values( qiniuConfig || {}).every((value) => {
            return !!value;
        });
        if(!isSetQiniuConfig){
            return dialog.showErrorBox('云同步','请检查云配置是否正确');
        }
        return qiniuConfig;
    }

    static getIsSetQiniuConfig() {
        const qiniuConfig = appSetting.get(StoreKey.QINIU_CONFIG_KEY);
        const isSetQiniuConfig = Object.values( qiniuConfig || {}).every((value) => {
            return !!value;
        });
        return isSetQiniuConfig;
    }

    updateFileIndex() {
        if(appSetting.get(StoreKey.AUTO_SYNC_STATUS_KEY))
        {
            const store = new Store({'name':StoreKey.FILES_INDEX_KEY});
            const _qiniuManger = Application.getQiniuManager();
            const fileKey = path.basename(store.path);
            _qiniuManger.getFileStat(fileKey).then((data) => {
                const putTime = Math.round(data.data.putTime / 10000);
                const updateTime = store.get('update_time');
                if(!updateTime || putTime > store.get('update_time')){
                    this.mainWindow.webContents.send('startLoading');
                    _qiniuManger.downloadFile(fileKey,store.path).then((data) => {
                        let fileSavePath = store.get(StoreKey.SAVE_PATH_KEY);
                        fileSavePath = fileSavePath ? fileSavePath : app.getPath('userData');
                        let oldFileIndex = store.get(StoreKey.FILES_INDEX_KEY);
                        if(!oldFileIndex){
                            return;
                        }
                        oldFileIndex = Object.values(oldFileIndex);
                        let newFileIndex = oldFileIndex.map((item) => {
                            return {...item,path:path.join(fileSavePath,item.id+path.extname(item.path))}
                        });
                        newFileIndex = Object.fromEntries(newFileIndex.map(item => [item.id, item]));
                        store.set(StoreKey.FILES_INDEX_KEY,newFileIndex);
                        //TODO 刷新文件索引
                        this.mainWindow.webContents.send('reloadFileIndex',null);
                        this.mainWindow.webContents.send('endLoading',null);
                    }).catch(error => {
                        this.mainWindow.webContents.send('endLoading',null);
                        return dialog.showErrorBox('云同步','请检查云配置是否正确');
                    });
                }
            }).catch(() => {
                this.mainWindow.webContents.send('endLoading',null);
                dialog.showErrorBox('云同步','请检查云配置是否正确');
            });
        }
    }

}

module.exports = Application;