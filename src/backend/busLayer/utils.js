const { login, getSessionToken } = require("../dataLinkLayer/login.js");
const { getStartTime } = require("../dataLinkLayer/hiveUtils.js");

/**
 * Checks if login information is valid
 * 
 * @param username 
 * @param password 
 * @returns boolean
 */
function isValidLogin(username, password){
    return login(username, password);
}

/**
 * Checks if hive id is in the database
 * 
 * @param id
 * @returns boolean
 */
function isValidHive(id){
    let data = getStartTime(id);
    if(data != "undefined"){
        return true
    }
}

/**
 * Checks if input is an integer
 * 
 * @param data - A number
 * @returns boolean
 */
function isNum(data){
    if(typeof(data)=="number")return true;
    return false;
}

/**
 * Checks if input is a string
 * 
 * @param data - A string
 * @returns boolean
 */
function isString(data){
    return typeof(data) == "string";
}

/**
 * Checks if date is valid
 * 
 * @param date - A js date string
 * @returns boolean
 */
function isValidDate(hiveId, date){
    if(isValidHive(hiveId) && isString(date)){
        let x = new Date(date);
        if(x == "undefined"){
            return false;
        }

        let now = new Date();
        let start = new Date(startTime(hiveId));

        if(date<=now && date>=start){
            return true;
        }
    }
    return false;
}

/**
 * Checks if phone number is valid
 * 
 * @param num - A 10 digit phone number
 * @returns boolean
 */
function isValidPhone(num){
    let numStr = ""+num;
    if(isNum(num) && numStr.length == 10){
        return true;
    }
    return false;
}

/**
 * Checks if email is valid
 * 
 * @param email - A string
 * @returns boolean
 */
function isValidEmail(email){
    // const pattern = "/.*@.*/";
    if(isString(email)){
        let split = email.split("@");
        if(split.length == 2)return true;
    }
    return false
}

/**
 * Checks if session token is Valid
 * 
 * @param token - Session token
 * @returns boolean
 */
function isValidSessionToken(token){
    return getSessionToken();
}

/**
 * Hashes input
 * 
 * @param data - String to be hashed
 * @returns hashed string
 */
async function hash(data){

}

/**
 * Generates a new user token
 * 
 * @returns
 */
function generateToken(){

}

/**
 * Sanitizes the given string
 * 
 * @param data - String to be sanitized 
 * @returns sanitized string
 */
function sanitize(data){
    
}

module.exports = {
    isValidLogin,
    isValidHive,
    isNum,
    isString,
    isValidDate,
    isValidPhone,
    isValidEmail,
    isValidSessionToken,
    hash,
    sanitize
}