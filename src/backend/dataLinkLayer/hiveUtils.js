import * as dbutils from "./dbutils.js";

async function getStartTime(hiveID){
    let data = await dbutils.getData('hive',['startdate'],{hiveID : hiveID});

    console.log(data.rows[0])
    return data.rows[0];
}

getStartTime(1)