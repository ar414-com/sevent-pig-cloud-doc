const qiniu = require('qiniu');
const path  = require('path');
const fs = require('fs');
const axios = require('axios');
class QiniuManager {

    constructor(accessKey,secreKey,bucket,zone = qiniu.zone.Zone_z2) {
        this.bucket = bucket;
        this.mac = new qiniu.auth.digest.Mac(accessKey,secreKey);
        this.config = new qiniu.conf.Config();
        this.config.zone = zone;
        this.bucketManager = new qiniu.rs.BucketManager(this.mac,this.config);
    }

    uploadLocationFile(filePath) {
        const key = path.basename(filePath);
        const options = {scope: this.bucket+':'+key};
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(this.mac);
        const formUploader = new qiniu.form_up.FormUploader(this.config);
        const putExtra = new qiniu.form_up.PutExtra();
        return new Promise((resolve, reject) => {
            formUploader.putFile(uploadToken,key,filePath,putExtra,this.respHandle(resolve,reject));
        });
    }

    getBucketDomain() {
        const api = `https://api.qiniu.com/v6/domain/list?tbl=${this.bucket}`;
        const token = qiniu.util.generateAccessToken(this.mac,api);
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(api,token,this.respHandle(resolve,reject));
        });
    }

    getFileStat(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.stat(this.bucket,key,this.respHandle(resolve,reject));
        });
    }

    generateDownloadLink(key) {
        return this.getBucketDomain().then((res) => {
            if(res.status === 0 && res.data.length > 0){
                let bucketDoamin = res.data[0];
                bucketDoamin = /^https?/.test(bucketDoamin) ? bucketDoamin : 'http://'+bucketDoamin;
                const deadline = parseInt(Date.now() / 1000) + 3600;
                const downLoadLink =  this.bucketManager.privateDownloadUrl(bucketDoamin, key, deadline);
                return Promise.resolve(downLoadLink)
                return downLoadLink;
            }
            throw new Error('get bucket domain error');
        });
    }

    downloadFile(key,downloadPath) {
        const getDownLoadLink = this.generateDownloadLink(key);
        return getDownLoadLink.then((url) => {
            url = `${url}&timestamp=${new Date().getTime()}`;
            return axios({
                url:url,
                method:'GET',
                responseType: 'stream',
                headers: {'Cache-control': 'no-cache'}
            }).then((response) => {
                const writerStream = fs.createWriteStream(downloadPath);
                response.data.pipe(writerStream);
                return new Promise((resolve, reject) => {
                    writerStream.on('finish', () => {
                        return resolve({status:0});
                    });
                    writerStream.on('error', () => {
                        throw new Error('下载错误');
                    });
                });
            }).catch((err) => {
                throw new Error('获取文件错误');
            });
        });
    }

    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket,key,this.respHandle(resolve,reject));
        });
    }

    respHandle(resolve,reject) {
        return (respErr,respBody,respInfo) => {
            if (respErr) {
                throw respErr;
            }
            if (respInfo.statusCode == 200) {
                resolve({
                    status: 0,
                    data: respBody
                });
            } else {
                reject({
                    status: respInfo.statusCode,
                    data: respBody
                });
            }
        }
    }
}

module.exports = QiniuManager;