const AppWindow     = require("./src/class/AppWindow");
const { app } = require('electron');
const applicationClass = require("./src/class/Application");
const ipcMainListenerManagerClass  = require("./src/class/IpcMainListenerManager");
let mainWindow;

app.on('ready',() => {

    mainWindow = new AppWindow({
        width: 1024,
        height: 680,
    },applicationClass.getMainUrl());
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    const application = new applicationClass(mainWindow);
    const ipcMainListenerManager  = new ipcMainListenerManagerClass(mainWindow);
    application.onAppAutoUpdate();
    application.createTray();
    application.createAppMenu();
    ipcMainListenerManager.initListener();
});