import React from "react";
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faMarkdown} from "@fortawesome/free-brands-svg-icons";

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => (
    <button onClick={onBtnClick} type="button" className={`btn btn-block no-border ${colorClass}`}>
        <FontAwesomeIcon icon={icon} size="lg" />
        <span className="ml-2">{text}</span>
    </button>
);

BottomBtn.propTypes = {
    text: PropTypes.string.isRequired,
    colorClass: PropTypes.string,
    // icon: PropTypes.element,
    onBtnClick: PropTypes.func
};

BottomBtn.defaultProps = {
    text: 'Btn',
    icon: faMarkdown
};

export default BottomBtn;