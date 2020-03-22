const fs = window.require('fs').promises;
const path = window.require('path');
const {remote} = window.require('electron');
const Store = window.require('electron-store');
const setStore = new Store({name:'settings'});

const StoreKey = window.require('../src/class/StoreKey');
// const StoreKey = {
//      SAVE_PATH_KEY : 'save_path',
//      QINIU_CONFIG_KEY : 'qiniu',
//      AUTO_SYNC_STATUS_KEY : 'auto_sync_status',
//      FILES_INDEX_KEY : 'files_index'
// }
const FileHandle = {
    getCloudSyncStatus: () => {
        return setStore.get(StoreKey.AUTO_SYNC_STATUS_KEY);
    },
    getPathForTitle: (id) => {
        const fileName = id + '.md';
        return path.join(FileHandle.getLocationSavePath(),fileName)
    },
    readFile: ( path ) => {
        return fs.readFile(path,{ encoding : 'utf8' });
    },
    writeFile: ( path, data ) => {
        return fs.writeFile( path, data, {encoding :'utf8'});
    },
    delFile: ( path ) => {
        return fs.unlink(path);
    },
    renameFile: ( oldPath, newPath ) => {
        return fs.rename( oldPath, newPath );
    },
    getLocationSavePath: () => {
        const settingSavePath = setStore.get(StoreKey.SAVE_PATH_KEY);
        return settingSavePath ? settingSavePath : remote.app.getPath('userData');
    }
};

export default FileHandle;