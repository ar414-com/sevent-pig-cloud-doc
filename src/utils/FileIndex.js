import {objToArr} from "./Helper";
import FileHandle from "./FileHandle";
const { ipcRenderer } = window.require('electron');
const Store = window.require('electron-store');
const Key   = "files_index";
const store = new Store({'name':Key});

export const FileFiledMap = {
    title: 'title',
    content: 'content',
    creatTime: 'create_time',
    updateTime: 'update_time',
    isNew: 'is_new',
    isLoad: 'is_load',
    isSynced: 'is_synced',
    syncTime: 'sync_time',
    path: 'path',
};

const FileIndex = {
    getList: () => {
        return store.get(Key) || {};
    },
    save: (files) => {
        if(!files){
            return false;
        }
        files = !files[0] ? objToArr(files) : files;
        const saveFiles = files.reduce((result,file) => {
            const {id,title,create_time,update_time,path,sync_time,is_synced} = file;
            result[file.id] = {
                id,title,create_time,update_time,path,sync_time,is_synced
            };
            return result;
        },{});
        store.set(Key,saveFiles);
        store.set('update_time',new Date().getTime());
        store.set('is_synced',false);
        if(FileHandle.getCloudSyncStatus()){
            ipcRenderer.on('updateFileIndexDone',updateFileIndexCallBack);
            ipcRenderer.send('update_file_index',store.path);
        }
        return true;
    }
};

const updateFileIndexCallBack = () => {
    store.set('sync_time',new Date().getTime());
    store.set('is_synced',true);
    ipcRenderer.removeListener('updateFileIndexDone',updateFileIndexCallBack);
};
export default FileIndex;
