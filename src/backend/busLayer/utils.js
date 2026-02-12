function isNum(data){
    return typeof(data) == "number";
}

function isString(data){
    return typeof(data) == "string";
}

function isValidDate(data){
    if(isString(data)){
        let x = new Date(data);
        return x !== "undefined"
    }
    return false;
}