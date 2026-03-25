import * as dbutils from "./dbutils.js";

/**
 * Attempts to login with username and password, returns true or false
 * 
 * @param {*} username 
 * @param {*} password 
 * @returns true or false
 */
async function login(username, password){
    let data = await dbutils.getData("Users", ["*"], { username: username, password: password });

    if (data && typeof data.rowCount === "number" && parseInt(data.rowCount, 10) === 1) {
        return true;
    }
    return false;
} 

/**
 * Tries to validate the sessionToken, returns userID or -1 if invalid
 * 
 * @param {*} sessionToken 
 * @returns userID if true, -1 if invalid
 */
async function validSessionToken(sessionToken){
    let data = await dbutils.getData("Users", ["userID"], { sessionToken: sessionToken });

    if (data && typeof data.rowCount === "number" && parseInt(data.rowCount, 10) === 1) {
        return data.rows[0]["userID"];
    }
    return -1;
}

export { login, validSessionToken };