export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item;
        return map;
    },{})
};

export const objToArr = (obj) => {
    return Object.keys(obj).map(key => obj[key]);
};

export const $ = (id) => {
    return document.getElementById(id);
};

export const getParentNodeForClass = (node,parentClassName) => {
    let curNode = node;
    while (curNode){
        let curNodeClass = curNode.classList;
        if(!curNodeClass){
            return null;
        }
        if(curNodeClass.contains(parentClassName) === true){
            return curNode;
        }
        curNode = curNode.parentNode;
    }
    return null;
};

export const timestampToString = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
};