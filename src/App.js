import React, {useEffect, useState} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.js';

import FileSearch from "./components/FileSearch";
import FileList from "./components/FileList";
import BottomBtn from "./components/BottomBtn";
import TabList from "./components/TabList";
import SimpleMDE from "react-simplemde-editor";
import uuidv4 from 'uuid/v4';
import "easymde/dist/easymde.min.css";
import {flattenArr, objToArr, timestampToString} from "./utils/Helper";
import FileIndex, {FileFiledMap} from "./utils/FileIndex";
import FileHandle from "./utils/FileHandle";
import useKeyPress from "./hooks/useKeyPress";
import Loading from "./components/Loading";

const { remote,ipcRenderer } = window.require('electron');
const path = window.require('path');

function App() {

    const [files, setFiles] = useState(FileIndex.getList());
    const [activeFileId, setActiveFileId] = useState(0);
    const [openFileIds, setOpenFileIds] = useState([]);
    const [unSaveFileIds, setUnSaveFileIds] = useState([]);
    const [searchResultList, setSearchResultList] = useState(objToArr(files));
    const [searchIng, setSearchIng] = useState(false);
    const [isShow, setIsShow] = useState(false);
    const [savePath, setSavePath] = useState(FileHandle.getLocationSavePath());
    const [cloudSyncStatus,setCloudSyncStatus] = useState(FileHandle.getCloudSyncStatus());

    const filesArr = objToArr(files);

    const isTriggerSave = useKeyPress(83, true);
    const fileList = searchIng === true ? searchResultList : filesArr;

    // useFileDrop();
    useEffect(() => {
        let appElement = document.getElementsByClassName('App');
        appElement = appElement[0];
        const dropCallBack = (e) => {
            e.preventDefault();
            const filePath = [objToArr(e.dataTransfer.files)[0]['path']];
            if(path.extname(filePath[0]) != '.md'){
                return remote.dialog.showMessageBox({
                    type: 'warning',
                    title: '导入失败',
                    message: '目前只支持导入 Markdown 文件'
                });
            }
            importFilesForFilePaths(filePath);
        };

        const dragoverCallBack = (e) => {
            e.preventDefault();
        };

        appElement.addEventListener('drop', dropCallBack);

        appElement.addEventListener('dragover', dragoverCallBack);

        return () => {
            appElement.removeEventListener('drop', dropCallBack);
            appElement.removeEventListener('dragover', dragoverCallBack);
        }
    });

    useEffect(() => {
        if (isTriggerSave && unSaveFileIds.length > 0 && activeFileId !== 0 && openFileIds.length > 0) {
            //当前窗口是否未保存状态
            const activeFileIsUnSave = unSaveFileIds.includes(activeFileId);
            if (activeFileIsUnSave) {
                FileHandle.writeFile(files[activeFileId][FileFiledMap.path], files[activeFileId][FileFiledMap.content]).then((err) => {
                    if (!err) {
                        const newUnSaveFileIds = unSaveFileIds.filter(fileId => fileId !== activeFileId);
                        setUnSaveFileIds(newUnSaveFileIds);
                        //标记未同步
                        updateFile(activeFileId,FileFiledMap.isSynced,false);
                        cloudSyncStatus && ipcRenderer.send('upload_file',files[activeFileId][FileFiledMap.path]);
                    }
                });
            }
        }
    }, [isTriggerSave]);

    const openFiles = openFileIds.map(openId => {
        return files[openId];
    });

    const loadLocationFile = (id,reload = false) => {
        if(!files[id]){
            return;
        }
        if (!files[id][FileFiledMap.isLoad] || reload) {
            FileHandle.readFile(files[id][FileFiledMap.path]).then((data) => {
                if (data) {
                    files[id][FileFiledMap.content] = data;
                    files[id][FileFiledMap.isLoad] = true;
                }
                setFiles({...files});
            });
        }
    };

    const downloadFileCallback = (event,args) => {
        setIsShow(false);
        loadLocationFile(activeFileId,true);
    };

    const openFile = (id) => {
        const isExist = openFileIds.includes(id);
        if (isExist) {
            activeFileId !=id && setActiveFileId(id);
            return;
        }
        //check if load to ram
        if(cloudSyncStatus){
            const curFileInfo = {key:id+'.md',[FileFiledMap.path]:files[id][FileFiledMap.path],[FileFiledMap.updateTime]:files[id][FileFiledMap.updateTime]};
            ipcRenderer.send('download_file',curFileInfo)
        }else{
            loadLocationFile(id)
        }
        setOpenFileIds([id, ...openFileIds]);
        setActiveFileId(id);
    };

    const tabClose = (id) => {
        const newOpenFileIds = openFileIds.filter(openId => openId !== id);
        setOpenFileIds([...newOpenFileIds]);
        if (newOpenFileIds.length > 0) {
            setActiveFileId(newOpenFileIds[0]);
        } else {
            setActiveFileId(0);
        }
    };

    const delFile = (id) => {
        if (openFileIds.includes(id)) {
            tabClose(id);
        }
        let newFiles = objToArr(files).filter(file => file.id !== id);
        FileHandle.delFile(files[id].path).then((err) => {
            if(!err){
                newFiles = flattenArr(newFiles)
                setFiles({...newFiles});
                FileIndex.save({...newFiles});
                cloudSyncStatus && ipcRenderer.send('del_file',path.basename(files[id][FileFiledMap.path]));
            }
        });
    };

    const changeContent = (content) => {
        //check is change
        if (content === files[activeFileId][FileFiledMap.content]) {
            return false;
        }
        const isExist = unSaveFileIds.includes(activeFileId);
        if (!isExist) {
            setUnSaveFileIds([...unSaveFileIds, activeFileId]);
        }
        updateFile(activeFileId, FileFiledMap.content, content);
    };


    const updateFile = (id, field, value) => {
        let newFile = {...files[id], [field]: value,[FileFiledMap.updateTime]:new Date().getTime()};
        let newFiles = {...files, [id]: newFile};
        if (field === FileFiledMap.title)
        {
            if (files[id][FileFiledMap.isNew] === true)
            {
                const newFilePath = path.join(savePath, id + '.md');
                FileHandle.writeFile(newFilePath, "#### " + value).then((err) => {
                    if (!err) {
                        newFile[FileFiledMap.path] = newFilePath;
                        newFile[FileFiledMap.isNew] = false;
                        newFiles[id] = newFile;
                        FileIndex.save(newFiles);
                        setFiles({...newFiles});
                    }
                });
                cloudSyncStatus && ipcRenderer.send('upload_file',newFilePath);
                return;
            }
        }
        setFiles({...newFiles});
        FileIndex.save(newFiles);
    };

    const searchFileList = (keyword) => {
        //处理大小写问题
        let serachFilesArr = filesArr.map((item) => {
            return {...item,serach_title:item.title.toLowerCase()}
        });
        let searchKeyword = keyword.toLowerCase();
        const searchResultList = serachFilesArr.filter(file => file.serach_title.includes(searchKeyword));
        setSearchResultList(searchResultList);
    };

    const createFile = () => {
        if(objToArr(files).find(file => file[FileFiledMap.isNew] === true)){
            return;
        }
        const fileId = uuidv4();
        const newFile = {
            id: fileId,
            title: '',
            content: '',
            create_time: new Date().getTime(),
            [FileFiledMap.isNew]: true
        };
        setFiles({...files, [fileId]: newFile});
    };

    const importFilesForFilePaths = (filePaths) => {
        const importFilePaths = filePaths.filter(path => {
            const alreadyAdded = Object.values(files).find(file => {
                return file.path === path;
            });
            return !alreadyAdded;
        });
        //generate store data format
        if (importFilePaths.length > 0) {
            const importFilesArr = importFilePaths.map(filePath => {
                //将文件复制一份放在保存的目录
                const newFileId = uuidv4();
                const newFilePath = path.join(savePath, newFileId + '.md');
                const newFileTitle = path.basename(filePath, path.extname(filePath));
                const fileInfo = {
                    id: newFileId,
                    [FileFiledMap.title]: newFileTitle,
                    [FileFiledMap.creatTime]: (new Date().getTime()),
                    [FileFiledMap.path]: newFilePath
                };
                startLoading();
                FileHandle.readFile(filePath).then((data) => {
                    FileHandle.writeFile(newFilePath,data).then(data => {
                        cloudSyncStatus && ipcRenderer.send('upload_file',newFilePath);
                        endLoading();
                    });
                });
                return fileInfo;
            });
            // save to store and location content
            const newFiles = {...files, ...flattenArr(importFilesArr)};
            setFiles({...newFiles});
            FileIndex.save(newFiles);
        }

        remote.dialog.showMessageBox({
            type: 'info',
            title: '操作成功',
            message: `成功导入 ${importFilePaths.length} 个文件`
        });
    }

    const importFiles = () => {
        remote.dialog.showOpenDialog({
            title: '导入 Markdown 文件',
            properties: ['openFile', 'multiSelections'],
            filters: [{name: 'markdown', extensions: ['md']}]
        }).then((ret) => {
            const {canceled, filePaths} = ret;
            if (canceled) {
                return;
            }
            importFilesForFilePaths(filePaths);
        });
    };

    const uploadLocationFile = (id) => {
        ipcRenderer.send('upload_file',files[id][FileFiledMap.path]);
    };

    const uploadFileSuccess = (filePath) => {
        let file = objToArr(files).find(file => file[FileFiledMap.path] === filePath);
        file = {...file,[FileFiledMap.isSynced]:true,[FileFiledMap.syncTime]:new Date().getTime()}
        setFiles({...files,[file.id]:file});
        FileIndex.save({...files,[file.id]:file});
    };

    const menuAction = (event,args) => {
        switch (args) {
            case 'create_file':
                createFile();
                break;
            case 'import_file':
                importFiles();
                break;
            case 'search_file':
                setSearchIng(true);
                break;
            case 'change_cloud_sync_status':
                setCloudSyncStatus(FileHandle.getCloudSyncStatus());
            default:
                break;
        }
    };

    const changeSavePath = (event,args) => {
        setSavePath(args);
    };

    const uploadFileSuccessCallback = (event,args) => {
        uploadFileSuccess(args);
    };

    const startLoading = (event,args) => {
        setIsShow(true);
    };

    const endLoading = (event,args) => {
        setIsShow(false);
    };

    const reloadFileIndex = (event,args) => {
        setFiles(FileIndex.getList());
    };

    //TODO 封装HOOK
    useEffect(() => {
        ipcRenderer.on('MenuAction',menuAction);
        ipcRenderer.on('changeSavePath',changeSavePath);
        ipcRenderer.on('uploadFileSuccess',uploadFileSuccessCallback);
        ipcRenderer.on('downloadFile',downloadFileCallback);
        ipcRenderer.on('startLoading',startLoading);
        ipcRenderer.on('endLoading',endLoading);
        ipcRenderer.on('reloadFileIndex',reloadFileIndex);
        return () => {
            ipcRenderer.removeListener('MenuAction',menuAction)
            ipcRenderer.removeListener('changeSavePath',changeSavePath)
            ipcRenderer.removeListener('uploadFileSuccess',uploadFileSuccessCallback)
            ipcRenderer.removeListener('downloadFile',downloadFileCallback)
        }
    });

    return (
        <div className="App container-fluid px-0 mx-0">
            <Loading isShow={isShow} title='Loading...' />
            <div className="row no-gutters">
                <div className="col-3 bg-light left-panel">
                    <FileSearch setSearchIng={setSearchIng} inputActiveStatus={searchIng} onFileSearch={searchFileList}/>
                    <FileList
                        files={fileList}
                        onFileClick={openFile}
                        onFileDelete={delFile}
                        onUpload={uploadLocationFile}
                        onSaveEdit={(id, value) => updateFile(id, FileFiledMap.title, value)}
                    />
                    <div className="row no-gutters bottom-btn-group">
                        <div className="col-6">
                            <BottomBtn onBtnClick={createFile} colorClass="btn-primary" text="新建"/>
                        </div>
                        <div className="col-6">
                            <BottomBtn onBtnClick={importFiles} colorClass="btn-success" text="导入"/>
                        </div>
                    </div>
                </div>
                <div className="col-9 right-panel">
                    {
                        openFiles.length > 0 ? <>
                            <TabList
                                activeId={activeFileId}
                                unSaveFileIds={unSaveFileIds}
                                files={openFiles}
                                onTabClose={tabClose}
                                onTabClick={(id) => setActiveFileId(id)}
                            />
                            <SimpleMDE
                                options={{minHeight: '76vh'}}
                                key={activeFileId}
                                value={files[activeFileId][FileFiledMap.content] && files[activeFileId][FileFiledMap.content]}
                                onChange={changeContent}
                            />
                            {
                                files[activeFileId][FileFiledMap.isSynced] ? <span className="sync-info">
                                    已同步，上次同步时间：{files[activeFileId][FileFiledMap.syncTime] > 0 ? timestampToString(files[activeFileId][FileFiledMap.syncTime]) : '无'}
                                </span> : <span className="sync-info">
                                    未同步，上次同步时间：{files[activeFileId][FileFiledMap.syncTime] > 0 ? timestampToString(files[activeFileId][FileFiledMap.syncTime]) : '无'}
                                </span>
                            }
                        </> : <div className="start-page">
                            选择或者创建新的 Markdown 文档
                        </div>
                    }
                </div>
            </div>
        </div>
    );
}

export default App;






