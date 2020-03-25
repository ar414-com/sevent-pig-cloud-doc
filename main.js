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
const { autoUpdater } = require("electron-updater");
const applicationClass = require("./src/class/Application");
const ipcMainListenerManagerClass  = require("./src/class/IpcMainListenerManager");
let mainWindow;
let appMenu;
let qiniuManager;
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

    application.createTray();
    application.createAppMenu();
    ipcMainListenerManager.initListener();
});