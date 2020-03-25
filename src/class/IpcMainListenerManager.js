const { ipcMain, dialog } = require('electron');
const AppWindow = require('./AppWindow');
const path = require('path');
const applicationClass = require("./Application");

class IpcMainListenerManager {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.application = new applicationClass(this.mainWindow);
        this.onChangeSavePath();
        this.onChangeCloudConfig();
        if(applicationClass.getIsSetQiniuConfig()){
            this.onDownloadFile();
            this.onDelFile();
            this.onUploadFile();
            this.onUpdateFileIndex();
        }
    }

    initListener() {
        this.onOpenSettingWindow();
    }

    onUpdateFileIndex() {
        ipcMain.on('update_file_index',(event,args) => {
            applicationClass.getQiniuManager().uploadLocationFile(args).then((data) => {
                mainWindow.webContents.send('updateFileIndexDone');
            }).catch((err) => {
                dialog.showErrorBox('更新索引','请检查云配置是否正确');
            });
        });
    }

    onDelFile() {
        ipcMain.on('del_file',(event, args) => {
            applicationClass.getQiniuManager().deleteFile(args);
        });
    }

    onUploadFile() {
        ipcMain.on('upload_file', (event,args) => {
            applicationClass.getQiniuManager().uploadLocationFile(args).then((data) => {
                mainWindow.webContents.send('uploadFileSuccess',args);
            }).catch((err) => {
                dialog.showErrorBox('上传失败','请检查云配置是否正确');
            });
        });
    }

    onChangeSavePath() {
        ipcMain.on('change_save_path', (event,args) => {
            this.mainWindow.webContents.send('changeSavePath',args);
        });
    }

    onChangeCloudConfig() {
        ipcMain.on('change_cloud_config', (event,args) => {
            this.application.updateCloudSyncMenu();
            this.application.updateFileIndex();
        });
    }

    onDownloadFile() {
        ipcMain.on('download_file',(event, args) => {
            const _qiniuManger = applicationClass.getQiniuManager();
            this.mainWindow.webContents.send('startLoading');
            _qiniuManger.getFileStat(args.key).then((data) => {
                const putTime = Math.round(data.data.putTime / 10000);
                fs.access(args.path,fs.constants.F_OK,(err) => {
                    const isExist = err ? false : true;
                    console.log(isExist)
                    if((isExist && putTime > args.update_time) || !isExist){
                        _qiniuManger.downloadFile(args.key,args.path).then((data) => {
                            this.mainWindow.webContents.send('downloadFile',{status:0});
                        }).catch(error => {
                            this.mainWindow.webContents.send('downloadFile',{status:error.status});
                        });
                        return;
                    }
                    return this.mainWindow.webContents.send('downloadFile',{status:-1});
                });
            }).catch(error => {
                this.mainWindow.webContents.send('downloadFile',{status:error.status});
            });
        });
    }

    onOpenSettingWindow() {
        ipcMain.on('open-setting-window',() => {
            console.log(path.join(applicationClass.getAppRootPath(),'./src/html/setting/setting.html'))
            this.settingWindow =  new AppWindow({
                width: 580,
                height: 380,
                parent: this.mainWindow,
                autoHideMenuBar: true,
                maximizable: false,
                minimizable: false,
            },`file://${path.join(applicationClass.getAppRootPath(),'./src/setting/setting.html')}`);
            this.settingWindow.on('closed', () => {
                this.settingWindow = null;
            });
        });
    }

}

module.exports = IpcMainListenerManager;