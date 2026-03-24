//  const { runDirectSQL } = require("./dbutils.js");

 import * as dbutils from "./dbutils.js";

 /**
  * Runs DIRECT SQL WITHOUT PREPARED STATMENT, do not use unless its something
  * users have no acess to and you are 100% sure on
  * 
  * dbutils.runDirectSQL('SELECT * FROM hive')
  * =
  * SELECT * FROM hive
  */
async function runDirectSQL(){

    let test = await dbutils.runDirectSQL('SELECT * FROM Hive;');

    console.log(test);
}
//runDirectSQL()

/**
 * Sample single table getData
 * 
 * dbutils.getData('hive')
 * =
 * SELECT * from hive
 * 
 */
async function getData(){
    let test = await dbutils.getData('hive');

    console.log(test);
}
//getData();

/**
 * Sample getdata with some paramaters and prepared statement
 * 
 * dbutils.getData('hive',['*'],{hiveID:hiveid});
 * =
 * SELECT * FROM hive WHERE hiveID = ?
 * 
 * prepare stament, ? = @param hiveid 
 * 
 * @param {*} hiveid 
 */
async function getDataPrepared(hiveid){
    let test = await dbutils.getData('hive',['*'],{hiveID : hiveid});

    console.log(test);
}
// getDataPrepared(1);

/**
 * Insert statemetn
 * 
 * dbutils.insertData('hive',{hiveID: 2, zipCode : 14602, name : 'test2', startDate: new Date()});
 * =
 * INSERT INTO hive (hiveID, zipCode, name, startDate) VALUES (?, ?, ?, ?)
 * prepare
 * ? = 2, ? = 14602, ? = 'test2', ? = currentDate
 */
async function insertData(){
    let test = await dbutils.insertData('hive',{hiveID: 2, zipCode : 14602, name : 'test2', startDate: new Date()});

    console.log(test)
}
// insertData();

/**
 * Inserts a Temperature reading
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} reading - the reading of the temperature
 * @param {*} timestamp - timestamp of the reading
 */
async function insertTemp(hiveID, reading, timestamp){
   
    await dbutils.insertData('Temperature',{hiveID:hiveID, reading: reading, timestamp : timestamp});

}

/**
 * Gets the last temperature for the Hive
 * 
 */
async function getLastTemp(){
    let sqlString = "SELECT * FROM TEMPERATURE WHERE HIVEID = 1 AND tempid = (SELECT MAX(tempid) from Temperature where HIVEID = 1);";
    let rJSON = await dbutils.runDirectSQL(sqlString);

    console.log(rJSON.rows[0]);
}

/**
 * Returns the temperatures between the startDate and endDate for given hiveID
 * 
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} startDate - the starting date to look for
 * @param {*} endDate - the ending date to look for
 */
async function getCustomRange(hiveID, startDate, endDate){
    let sqlString = "SELECT (timestamp, reading) FROM Temperature WHERE hiveID = $1 AND timestamp BETWEEN $2 AND $3 ;";
    let paramsArray = [hiveID, startDate, endDate];
    let rJson = await dbutils.runDirectSQLwithPrepared(sqlString, paramsArray );

    console.log (rJson);
}

// await getLastTemp();
// insertTemp();
await getCustomRange(1,'2026-02-01','2026-03-06');

export{
    getCustomRange,
    insertTemp
}