import { useEffect, useRef } from 'react';
const { remote } = window.require('electron');
const { Menu,MenuItem } = remote;
const useContextMenu = ( menuItemObj, targetSelector) => {
    let clickedElement = useRef(null);
    useEffect(() => {
        const menu = new Menu();
        for(var label in menuItemObj){
            menu.append(new MenuItem({
                label: label,
                click: menuItemObj[label]
            }));
        }
        const handleContextMenu = (e) => {
            //判断是否属于指定区域
            if(document.querySelector(targetSelector).contains(e.target))
            {
                e.preventDefault();
                clickedElement.current = e.target;
                menu.popup();
            }
        };
        document.addEventListener('contextmenu',handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu',handleContextMenu);
        }
    });

    return clickedElement;
};

export default useContextMenu;