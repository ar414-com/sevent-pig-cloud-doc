const { BrowserWindow } = require('electron');

class AppWindow extends BrowserWindow {

    constructor(config,url) {

        const baseConfig = {
            height: 860,
            width: 640,
            webPreferences: {
                nodeIntegration:true
            },
            backgroundColor: '#efefef'
        };

        const finaConfig = { ...baseConfig, ...config };
        super(finaConfig);
        this.loadURL(url);
    }

}

module.exports = AppWindow;