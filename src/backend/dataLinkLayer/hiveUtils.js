import * as dbutils from "./dbutils.js";

/**
 * Returns the starttime for the given hiveID
 * 
 * @param {*} hiveID
 * @returns the startime
 */
async function getStartTime(hiveID){
    let data = await dbutils.getData('hive',['startdate'],{hiveID : hiveID});
    if (!data || !Array.isArray(data.rows)) {
        return undefined;
    }
    return data.rows[0];
}

/**
 * Tests the given passkey and returns the hiveID if valid or -1 if invalid
 * 
 * @param {*} passkey 
 * @returns the hiveID if valid or -1 if invalid
 */
async function testPasskey(passkey){
    let data = await dbutils.getData('hive',['hiveid'],{passkey: passkey});
    
    //return hiveID if exists
    if(parseInt(data['rowCount']) == 1){
        return data['rows'][0]['hiveid'];
    }
    else{
        return -1;
    }
}

export { getStartTime, testPasskey };
