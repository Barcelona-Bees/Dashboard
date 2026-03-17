import * as dbutils from "./dbutils.js";

async function getStartTime(hiveID){
    let data = await dbutils.getData('hive',['startdate'],{hiveID : hiveID});

    console.log(data.rows[0])
    return data.rows[0];
}

getStartTime(1)

async function testPasskey(passkey, hiveID){
    let data = await dbutils.getData('hive',['1'],{hiveID : hiveID, passkey: passkey});

    console.log(data)
}