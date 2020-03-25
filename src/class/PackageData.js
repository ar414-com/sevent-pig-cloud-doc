const PackageJson = require('../../package');
class PackageData {

    static packageData;

    static getVar(_var) {
        if(!PackageData.packageData){
            PackageData.packageData = PackageJson;
        }
        const vars = _var.split('.');
        let value = this.packageData;
        vars.map((filed) => {
            if(value[filed]){
                value = value[filed];
            }else{
                throw Error("Package.json not found "+filed);
            }
        });
        return value;
    }
}

module.exports = PackageData;