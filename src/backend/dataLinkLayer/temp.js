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

