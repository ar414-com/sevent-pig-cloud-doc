const menuTemplate  = require("./src/menuTemplate");
const AppWindow     = require("./src/class/AppWindow");
const fs = require('fs');
const { app, ipcMain, Menu, dialog } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const QiniuManager = require("./src/class/QiniuManager");
const Store = require('electron-store');
const StoreKey = require('./src/class/StoreKey');
const appSetting = new Store({name:'settings'});
let mainWindow;
let appMenu;
let qiniuManager;
app.on('ready',() => {

    const url = isDev ? "http://localhost:3000/" : `file://${path.join(__dirname,'./build/index.html')}`;

    mainWindow = new AppWindow({
        width: 1024,
        height: 680,
    },url);

    initAppMenu();
    updateFileIndex();
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    ipcMain.on('open-setting-window',() => {
        // const settingFilePath =
        settingWindow =  new AppWindow({
            width: 580,
            height: 380,
            parent: mainWindow,
            autoHideMenuBar: true,
            maximizable: false,
            minimizable: false,
        },`file://${path.join(__dirname,'src/html/setting/setting.html')}`);
        settingWindow.on('closed', () => {
            settingWindow = null;
        })
    });
    ipcMain.on('change_save_path', (event,args) => {
        mainWindow.webContents.send('changeSavePath',args);
    });

    ipcMain.on('change_cloud_config', (event,args) => {
        updateCloudSyncMenu();
        updateFileIndex();
    });

    ipcMain.on('download_file',(event, args) => {
        const _qiniuManger = getQiniuManager();
        mainWindow.webContents.send('startLoading');
        _qiniuManger.getFileStat(args.key).then((data) => {
            const putTime = Math.round(data.data.putTime / 10000);
            fs.access(args.path,fs.constants.F_OK,(err) => {
                const isExist = err ? false : true;
                console.log(isExist)
                if((isExist && putTime > args.update_time) || !isExist){
                    _qiniuManger.downloadFile(args.key,args.path).then((data) => {
                        mainWindow.webContents.send('downloadFile',{status:0});
                    }).catch(error => {
                        mainWindow.webContents.send('downloadFile',{status:error.status});
                    });
                    return;
                }
                return mainWindow.webContents.send('downloadFile',{status:-1});
            });
        }).catch(error => {
            mainWindow.webContents.send('downloadFile',{status:error.status});
        });
    });

    ipcMain.on('del_file',(event, args) => {
        const _qiniuManger = getQiniuManager();
        _qiniuManger.deleteFile(args);
    });

    ipcMain.on('upload_file', (event,args) => {
        const _qiniuManger = getQiniuManager();
        _qiniuManger.uploadLocationFile(args).then((data) => {
            mainWindow.webContents.send('uploadFileSuccess',args);
        }).catch((err) => {
            dialog.showErrorBox('上传失败','请检查云配置是否正确');
        });
    });

    ipcMain.on('update_file_index',(event,args) => {
        const _qiniuManger = getQiniuManager();
        _qiniuManger.uploadLocationFile(args).then((data) => {
            mainWindow.webContents.send('updateFileIndexDone');
        }).catch((err) => {
            dialog.showErrorBox('更新索引','请检查云配置是否正确');
        });
    });

});

function initAppMenu()
{
    appMenu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(appMenu);
}

/**
 * 更新云菜单
 */
function updateCloudSyncMenu()
{
    const isSetQiniuConfig = Object.values(appSetting.get(StoreKey.QINIU_CONFIG_KEY) || {}).every((value) => {
        return !!value;
    });

    for(let i = 1;i <= 3;i++){
        appMenu.items[3].submenu.items[i].enabled = isSetQiniuConfig;
    }
}

function getQiniuManager()
{
    const qiniuConfig = appSetting.get(StoreKey.QINIU_CONFIG_KEY);
    const isSetQiniuConfig = Object.values( qiniuConfig || {}).every((value) => {
        return !!value;
    });

    if(!isSetQiniuConfig){
        return dialog.showErrorBox('云同步','请检查云配置是否正确');
    }

    qiniuManager = new QiniuManager(qiniuConfig.accesskey,
        qiniuConfig.secretkey,qiniuConfig.bucket);
    return qiniuManager
}

function updateFileIndex() {
    if(appSetting.get(StoreKey.AUTO_SYNC_STATUS_KEY)){
        const store = new Store({'name':StoreKey.FILES_INDEX_KEY});
        const _qiniuManger = getQiniuManager();
        const fileKey = path.basename(store.path);
        _qiniuManger.getFileStat(fileKey).then((data) => {
            const putTime = Math.round(data.data.putTime / 10000);
            if(putTime > store.get('update_time')){
                mainWindow.webContents.send('startLoading');
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
                    mainWindow.webContents.send('endLoading',null);
                }).catch(error => {
                    mainWindow.webContents.send('endLoading',null);
                    return dialog.showErrorBox('云同步','请检查云配置是否正确');
                });
            }
        }).catch(() => {
            mainWindow.webContents.send('endLoading',null);
            dialog.showErrorBox('云同步','请检查云配置是否正确');
        });
    }
}