const { remote, ipcRenderer } = require('electron');
const Store = require('electron-store');
const setStore = new Store({name:'settings'});

const StoreKey = require('../../class/StoreKey');

document.addEventListener('DOMContentLoaded',() => {
    let curSavePath = setStore.get(StoreKey.SAVE_PATH_KEY);
    curSavePath = curSavePath ? curSavePath : remote.app.getPath('userData');
    document.getElementById('customFileLangHTML').innerText = curSavePath;

    let curQiniuConfig = setStore.get(StoreKey.QINIU_CONFIG_KEY);
    if(curQiniuConfig){
        document.getElementById('accesskey').value = curQiniuConfig.accesskey;
        document.getElementById('secretkey').value = curQiniuConfig.secretkey;
        document.getElementById('bucket').value = curQiniuConfig.bucket;
    }

    document.getElementById('select-folder').addEventListener('click',(e) => {
        e.preventDefault();
        remote.dialog.showOpenDialog({
            title: '选择文件存储路径',
            defaultPath: curSavePath,
            properties: ['openDirectory'],
        }).then((result) => {
            if(result.canceled == true){
                return false;
            }
            if(!Array.isArray(result.filePaths)){
                return false;
            }
            document.getElementById('customFileLangHTML').innerText = result.filePaths[0];
        });
    });

    document.getElementById('save').addEventListener('click',(e) => {
        e.preventDefault();
        const qiniuConfig = {
            accesskey: document.getElementById('accesskey').value,
            secretkey: document.getElementById('secretkey').value,
            bucket: document.getElementById('bucket').value,
        };
        setStore.set(StoreKey.QINIU_CONFIG_KEY,qiniuConfig);
        ipcRenderer.send('change_cloud_config',null);
        const savePath = document.getElementById('customFileLangHTML').innerText;
        if(savePath && savePath.trim() != ''){
            ipcRenderer.send('change_save_path',savePath);
            setStore.set(StoreKey.SAVE_PATH_KEY,savePath);
            alert('保存成功');
        }
    });
});

