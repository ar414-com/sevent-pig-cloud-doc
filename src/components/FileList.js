import React, {useState, useRef, useEffect, useContext} from "react";
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import {faEdit, faTimesCircle, faTrashAlt} from '@fortawesome/free-solid-svg-icons';
import useKeyPress from "../hooks/useKeyPress";
import KeyCodeMap from "../utils/KeyCodeMap";
import {FileFiledMap} from "../utils/FileIndex";
import useContextMenu from "../hooks/useContextMenu";
import {getParentNodeForClass} from "../utils/Helper";

const FileList = ({ files,onFileClick,onSaveEdit,onFileDelete,onUpload }) => {
    const [editStatus,setEditStatus] = useState(0);
    const [value,setValue] = useState('');

    const inputEditRef = useRef(null);

    const enterIsTrigger = useKeyPress(KeyCodeMap.ENTER);
    const escIsTrigger   = useKeyPress(KeyCodeMap.ESC);

    const clickedElement = useContextMenu({
        '打开': () => {
            const parentNode = getParentNodeForClass(clickedElement.current,'file-list-item');
            if(parentNode.dataset.id){
                return onFileClick(parentNode.dataset.id);
            }
        },
        '重命名': () => {
            const parentNode = getParentNodeForClass(clickedElement.current,'file-list-item');
            if(parentNode.dataset.id){
                _setEditStatus(parentNode.dataset.id,parentNode.dataset.title);
            }
        },
        '删除': () => {
            const parentNode = getParentNodeForClass(clickedElement.current,'file-list-item');
            if(parentNode.dataset.id){
                onFileDelete && onFileDelete(parentNode.dataset.id);
            }
        },
        '上传': () => {
            const parentNode = getParentNodeForClass(clickedElement.current,'file-list-item');
            if(parentNode.dataset.id){
                onUpload && onUpload(parentNode.dataset.id);
            }
        }
    },'.file-list');

    const closeEdit = () => {
        const editFile = files.find(file => file.id === editStatus);
        setEditStatus(0);
        setValue('');
        if(editFile[FileFiledMap.isNew] === true){
            onFileDelete(editFile.id);
        }
    };

    useEffect(() => {

        if(editStatus !== 0){
            if(enterIsTrigger && value.trim() !== ''){
                onSaveEdit && onSaveEdit(editStatus,value);
                setEditStatus(0);
                setValue('');
            }

            if(escIsTrigger){
                closeEdit();
            }
        }

    });

    const getNewFile = () => {
        const newFile = files.find(file => file[FileFiledMap.isNew] === true);
        if(newFile !== undefined){
            return newFile;
        }else{
            return null;
        }
    };

    useEffect(() => {
        const newFile = getNewFile();
        if(newFile){
            setEditStatus(newFile.id);
            setValue('');
            inputEditRef.current.focus();
        }
    },[files]);

    useEffect(() => {
        editStatus !== 0 && inputEditRef.current && inputEditRef.current.focus();
    },[editStatus]);

    const _setEditStatus = (id,title) => {
        const newFile = files.find(file => file[FileFiledMap.isNew] === true);
        if(newFile){
            onFileDelete(newFile.id);
        }
        setEditStatus(id);
        setValue(title);
    };

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files && files.map((file) =>
                (
                    editStatus !== file.id && file[FileFiledMap.isNew] !== true ?
                    <li key={file.id} data-id={file.id} data-title={file.title} className="list-group-item pl-0 bg-light d-flex align-items-center file-list-item">
                        <span className="col-2">
                            <FontAwesomeIcon icon={faMarkdown} size="lg" />
                        </span>
                        <span onClick={() => onFileClick && onFileClick(file.id)} className="col-7 font-weight-bold">{file.title}</span>
                        {/*<button type="button" onClick={() => {_setEditStatus(file.id,file.title)}} className="icon-btn col-1">*/}
                        {/*    <FontAwesomeIcon title="edit" icon={faEdit} size="lg" />*/}
                        {/*</button>*/}
                        <button onClick={() => onFileDelete && onFileDelete(file.id)} type="button" className="icon-btn col-1 ml-2">
                            <FontAwesomeIcon title="del" icon={faTrashAlt} size="lg" />
                        </button>
                    </li>
                    :
                    <li key={file.id} className="list-group-item pl-0 bg-light d-flex align-items-center">
                        {file[FileFiledMap.isNew] !== true && <span className="col-2">
                            <FontAwesomeIcon icon={faMarkdown} size="lg" />
                        </span>}
                        <input placeholder="请输入文件名称" ref={inputEditRef} type="text" className={"form-control ml-3 "+ (file[FileFiledMap.isNew] !== true ? "col-7" : "col-9")} value={value}
                               onChange={(e) => setValue(e.target.value)}/>
                        <button type="button" onClick={closeEdit} className="icon-btn col-2">
                            <FontAwesomeIcon icon={faTimesCircle} size="lg" />
                        </button>
                    </li>
                ))
            }
        </ul>
    );
};

FileList.propTypes = {
    files: PropTypes.array.isRequired,
    onFileClick: PropTypes.func,
    onSaveEdit: PropTypes.func,
    onFileDelete: PropTypes.func,
};

export default FileList;

