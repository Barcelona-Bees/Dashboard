const dl = require("../dataLayer/dl.js");

/**
 * Checks if login information is valid
 * 
 * @param username 
 * @param password 
 * @returns boolean
 */
export function isValidLogin(username, password){
    return dl.login(username, password);
}

/**
 * Checks if input is an integer
 * 
 * @param data - A number
 * @returns boolean
 */
export function isNum(data){
    return typeof(data) == "number";
}

/**
 * Checks if input is a string
 * 
 * @param data - A string
 * @returns boolean
 */
export function isString(data){
    return typeof(data) == "string";
}

/**
 * Checks if date is valid
 * 
 * @param date - A js date string
 * @returns boolean
 */
export function isValidDate(date){
    if(isString(data)){
        let x = new Date(data);
        return x !== "undefined"
    }
    return false;
}
/**
 * Checks if phone number is valid
 * 
 * @param num - A 10 digit phone number
 * @returns boolean
 */
export function isValidPhone(num){
    if(num.length = 10){
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
export function isValidPhone(email){
    const pattern = "/.*@.*/";
    return pattern.test(email);
}

/**
 * Checks if date is within the database
 * 
 * @param date -A js date string
 * @returns boolean
 */
export function dateOutOfRange(date){
    let now = new Date();
    let start = new Date(dl.startTime());

    if(date.isValidDate() && date<=now && date>=start){
        return true;
    }
    return false;
}

/**
 * Checks if session token is Valid
 * 
 * @param token - Session token
 * @returns boolean
 */
export function isValidSessionToken(token){
    return dl.getSessionToken();
}

/**
 * Hashes input
 * 
 * @param data - String to be hashed
 * @returns hashed string
 */
export async function hash(data){
    return bcrypt.hash(data, 10);
}

/**
 * Generates a new user token
 * 
 * @returns
 */
export function generateToken(){

}

/**
 * Sanitizes the given string
 * 
 * @param data - String to be sanitized 
 * @returns sanitized string
 */
export function sanitize(data){
    
}