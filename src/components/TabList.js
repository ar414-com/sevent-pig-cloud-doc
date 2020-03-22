import React from "react";
import PropTypes from "prop-types";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCircle } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import "../sass/TabList.scss";

const TabList = ({ files, activeId, unSaveFileIds, onTabClick, onTabClose}) => {
    return (
        <ul className="nav nav-pills tab-list-component">
            {
                files && files.map((file) => {
                    const isUnSave = unSaveFileIds && unSaveFileIds.includes(file.id);
                    const fClassName = classNames({
                        'nav-link': true, 'no-border': true, 'tab-item': true,
                        'd-flex': true,'flex-row':true,'align-items-center': true,
                        'is-un-save': isUnSave,
                        'active': file.id === activeId,
                    });
                    return <li key={file.id} className="nav-item">
                        <a className={fClassName} href="#" onClick={(e) => {e.preventDefault();onTabClick(file.id)} }>
                            {file.title}
                            {isUnSave && <span className="file-un-save-icon ml-1">
                                <FontAwesomeIcon icon={faCircle} />
                            </span>}
                            <span onClick={(e) => {e.preventDefault();e.stopPropagation();onTabClose(file.id);}} className="file-close-icon ml-1">
                                <FontAwesomeIcon icon={faTimes} />
                            </span>
                        </a>
                    </li>
                })
            }
        </ul>
    );
};

TabList.propTypes = {
    files: PropTypes.array.isRequired,
    // activeId: PropTypes.interval,
    unSaveFileIds: PropTypes.array,
    onTabClick: PropTypes.func,
    onTabClose: PropTypes.func
};

export default TabList;


