import React, {useEffect} from "react";

const Loading = ({title,isShow}) => {
    useEffect(() => {
        if(isShow){
            document.getElementById('showLoading').click();
            //兼容网络异常
            setTimeout("document.getElementById('closeLoading').click()",30000);
        }else{
            //className 使用了 fade 有动画时间 所以需要延迟执行
            setTimeout("document.getElementById('closeLoading').click()",700);
        }
    },[isShow]);
    return (
        <>
            <button id="showLoading" type="button" className="d-none" data-toggle="modal" data-target="#staticBackdrop">
                Launch static backdrop modal
            </button>
            <div className="modal fade" id="staticBackdrop" data-backdrop="static" tabIndex="-1" role="dialog"
                 aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog" role="document">
                    <div className="modal-content bg-transparent border-0">
                        <button id="closeLoading" type="button" className="d-none" data-dismiss="modal" aria-label="Close">
                        </button>
                        <div className="d-flex flex-column justify-content-center align-items-center h-100">
                            <div className="spinner-border text-light" role="status">
                                <span className="sr-only">Loading...</span>
                            </div>
                            <span className="mt-1 text-light">{title?title:'加载中'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>


    );
};

export default Loading;