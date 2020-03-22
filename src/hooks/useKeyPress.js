import { useState,useEffect } from "react";

const useKeyPress = ( triggerKeyCode, isCtrlKey = false ) => {
    const [isTrigger,setIsTrigger] = useState(false);

    useEffect(() => {
        const keyDownHandle = ({keyCode,ctrlKey}) => {
            if(isCtrlKey){
                if(ctrlKey && keyCode === triggerKeyCode){
                    setIsTrigger(true);
                }
            }else{
                if(keyCode === triggerKeyCode){
                    setIsTrigger(true)
                }
            }
        };
        const keyUpHandle = ({keyCode,ctrlKey}) => {

            if(isCtrlKey){
                if(ctrlKey && keyCode === triggerKeyCode){
                    setIsTrigger(false)
                }
            }else{
                if(keyCode === triggerKeyCode){
                    setIsTrigger(false)
                }
            }
        };
        document.addEventListener('keyup',keyUpHandle);
        document.addEventListener('keydown',keyDownHandle);

        return () => {
            document.removeEventListener('keyup',keyUpHandle);
            document.removeEventListener('keydown',keyDownHandle);
        }
    },[]); //设置空deps 仅挂载时调用

    return isTrigger;
};

export default useKeyPress;