const { app, Menu, dialog, BrowserWindow, Tray, nativeImage, screen } = require('electron');
const Store = require('electron-store');
const isDev = require('electron-is-dev');
const AppWindow = require('./AppWindow');
const QiniuManager = require('./QiniuManager');
const ElectronTrayTips = require('electron-tray-tips');
const packageData = require('./PackageData');
const menuTemplate  = require("../menuTemplate");
const path = require('path');
const appSetting = new Store({name:'settings'});
const StoreKey = require('./StoreKey');
const { autoUpdater } = require("electron-updater");
let tray = null;
let OnlyID = null;
let OnlyID2 = null;
let TipShowTimerId = null;
class Application {

    constructor(mainWindow) {
        this.mainWindow = mainWindow;
        this.appMenu = Menu.buildFromTemplate(menuTemplate);
        this.screenSize = screen.getPrimaryDisplay().size;
        console.log(this.screenSize)
    }

    createAppMenu() {
        Menu.setApplicationMenu(this.appMenu);
    }

    showTrayTips(x = 0,y = 0) {

        if(!this.tipsWin){
            const taskArea = this.getTaryArea();
            const trayPosition = this.tray.getBounds();
            const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
            console.log(taskArea)
            switch (taskArea) {
                case 39:
                    x = workAreaSize.width - 230;
                    y = trayPosition.y - 40;
                    break;
                case 40:
                    x = trayPosition.x - 95;
                    y = workAreaSize.height - 115;
                    break;
                case 37:
                    x = this.screenSize.width - workAreaSize.width;
                    y = trayPosition.y - 35;
                    break;
                default:
                    x = trayPosition.x - 110;
                    y = this.screenSize.height - workAreaSize.height;
                    break;
            }
            this.tipsWin = new BrowserWindow({
                width: 230,
                height: 115,
                x:x,
                y:y,
                skipTaskbar:true,
                alwaysOnTop:true,
                frame:false,
                show: false
            });
            this.tipsWin.loadURL(`file://${path.join(Application.getAppRootPath(),'./src/html/tips/tips.html')}`);
            this.tipsWin.once('ready-to-show', () => {
                this.tipsWin.show();
            });
        }



        if(TipShowTimerId === null){
            TipShowTimerId = setInterval(() => {
                const cursorPosition = screen.getCursorScreenPoint();
                const trayPosition = this.tray.getBounds();
                const tipWinPosition = this.tipsWin.getBounds();

                //托盘icon
                if((cursorPosition.x >  trayPosition.x && cursorPosition.x <= trayPosition.x + trayPosition.width) && (cursorPosition.y >  trayPosition.y && cursorPosition.y <= trayPosition.y + trayPosition.height))
                {
                    return;
                }

                //消息框
                if((cursorPosition.x >  tipWinPosition.x && cursorPosition.x <= tipWinPosition.x + tipWinPosition.width) && (cursorPosition.y >  tipWinPosition.y && cursorPosition.y <= tipWinPosition.y + tipWinPosition.height))
                {
                    return;
                }

                this.closeTrayTips();
            }, 250);
        }

        //定时器 监听鼠标是否停留在托盘上
    }

    closeTrayTips() {
        if(this.tipsWin){
            console.log(this.tipsWin);
            this.tipsWin.close();
            this.tipsWin = null;
            this.isBalloonShow = false;
            clearInterval(TipShowTimerId);
            TipShowTimerId = null;
        }
    }

    getTaryArea() {

        if(!this.tray){
            throw Error('tray not create');
        }

        //可显示区域
        const workAreaSize = screen.getPrimaryDisplay().workAreaSize;

        console.log(workAreaSize);
        //app托盘位置信息
        const trayPosition = this.tray.getBounds();

        if(workAreaSize.height < this.screenSize.height)
        {
            if(trayPosition.y < this.screenSize.height / 2)
            {
                return 38;
            }
            else
            {
                return 40;
            }
        }
        else if(workAreaSize.height === this.screenSize.height)
        {
            if(trayPosition.x > -100 && trayPosition.x < this.screenSize.width / 2)
            {
                return 37;
            }
            else
            {
                return 39;
            }
        }

        throw Error('get task area error');
    }

    setShowMsgTip() {
        OnlyID = setInterval(() => {
            this.tray.setImage(path.join(Application.getAppRootPath(),'./assets/tray26.ico'));
            setTimeout(() => {
                // 写逻辑代码
                // this.tray.setImage(path.join(Application.getAppRootPath(),'./assets/tray26.ico'));
                this.tray.setImage(nativeImage.createEmpty());
            }, 500)
        }, 1000);

    }

    createTray() {

        this.tray = new Tray(path.join(Application.getAppRootPath(),'./assets/tray26.ico'));
        const trayContextMenu = Menu.buildFromTemplate([
            {...this.appMenu.items[2].submenu.items[0],icon:path.join(Application.getAppRootPath(),'./src/images/setting.png'),accelerator:null},
            { label: '退出', role: 'quit',icon:path.join(Application.getAppRootPath(),'./src/images/quit.png') }
        ]);
        // this.tray.setToolTip(packageData.getVar('cnName'));
        this.tray.setToolTip('ar414');
        this.tray.setContextMenu(trayContextMenu);

        this.tray.addListener('double-click',((event, bounds) => {
            this.mainWindow.show();
        }));
        //MAC
        this.tray.addListener('mouse-enter',((event, position) => {
            console.log('mouse-enter');
            // this.mainWindow.show();
        }));

        this.tray.addListener('mouse-move',((event, position) => {
            // console.log(this.tray.getBounds());
            // console.log(position);
            //判断鼠标是否在托盘上
            // max x+width y+height
            if(!this.isBalloonShow && OnlyID != null){
                this.isBalloonShow = true;
                const ElectronTrayTipsClass = new ElectronTrayTips(this.tray);
                ElectronTrayTipsClass.showTrayTips(`file://${path.join(Application.getAppRootPath(),'./src/html/tips/tips.html')}`,() => {
                    this.isBalloonShow = false;
                });
                // this.showTrayTips();
            }
            //{ x: 1887, y: 849, width: 24, height: 24 }
            //max
            // if(!this.isBalloonShow){
            //     this.tray.displayBalloon({
            //         iconType:'info',
            //         title:'新消息',
            //         content:'Hi,this is mouse-move event'
            //     });
            // }
            // this.isBalloonShow = true;
        }));
        this.setShowMsgTip();
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

    //TODO 需要区分开发环境和打完完成的环境
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