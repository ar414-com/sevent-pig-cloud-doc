const { app, ipcMain, Menu, dialog } = require('electron');
const AppWindow = require("./AppWindow");
const path = require('path');

class IpcMainListener {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }



    run() {

    }

    /**
     * 监听修改文件存储目录
     */
    onChangeSavePath() {
        ipcMain.on('change_save_path', (event,args) => {
            this.mainWindow.webContents.send('uploadFileSuccess',args);
        });
    }

    /**
     * 监听打开配置页面
     */
    onOpenSettingWindow() {
        ipcMain.on('open-setting-window',() => {
            // const settingFilePath =
            settingWindow =  new AppWindow({
                width: 580,
                height: 380,
                parent: this.mainWindow,
                autoHideMenuBar: true,
                maximizable: false,
                minimizable: false,
            },`file://${path.join(__dirname,'src/html/setting/setting.html')}`);
            settingWindow.on('closed', () => {
                settingWindow = null;
            })
        });
    }


}