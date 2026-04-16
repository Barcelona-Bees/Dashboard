import * as dbutils from "./dbutils.js";

/**
 * Inserts a Humidity reading
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} reading - the reading of the humidity
 * @param {*} timestamp - timestamp of the reading
 */
async function insertHumidity(hiveID, reading, timestamp){
   
    await dbutils.insertData('Humidity',{hiveID:hiveID, reading: reading, timestamp : timestamp});

}

/**
 * Gets the last humidity for the Hive
 * 
 */
async function getLastHumidity(){
    let sqlString = "SELECT * FROM humidity WHERE HIVEID = 1 AND humidityid = (SELECT MAX(humidityid) from humidity where HIVEID = 1);";
    let rJSON = await dbutils.runDirectSQL(sqlString);

    return rJSON.rows[0];
}

/**
 * Exact match for one humidity row at (hiveID, timestamp).
 *
 * @param {number} hiveID
 * @param {Date} timestamp
 */
async function getHumidityReadingAt(hiveID, timestamp) {
    return await dbutils.getData("humidity", ["reading"], {
        hiveID,
        timestamp,
    });
}

/**
 * Latest humidity reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getLatestHumidityReading(hiveID) {
    const sql =
    "SELECT * FROM humidity WHERE HIVEID = $1 AND humidityid = (SELECT MAX(humidityid) from humidity where HIVEID = $1);";
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID]);
}

/**
 * Returns the Humiditys between the startDate and endDate for given hiveID
 * 
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} startDate - the starting date to look for
 * @param {*} endDate - the ending date to look for
 */
async function getCustomRangeHumidity(hiveID, startDate, endDate){
    // Keep results ordered so frontend can treat "last row" as most recent.
    let sqlString =
        "SELECT timestamp, reading FROM humidity WHERE hiveID = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC";
    let paramsArray = [hiveID, startDate, endDate];
    let rJson = await dbutils.runDirectSQLwithPrepared(sqlString, paramsArray );

    return rJson;
}


/**
 * Latest humidity reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getHumidityMeasurement(hiveID, timestamp, measurement = 'day') {
    const sql =
        "SELECT timestamp, reading FROM humidity WHERE hiveID = $1 AND DATE_TRUNC($2,timestamp) = TO_TIMESTAMP($3)";
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID, measurement, timestamp]);
}

export {
    getCustomRangeHumidity,
    getLastHumidity,
    getHumidityReadingAt,
    insertHumidity,
    getHumidityMeasurement,
    getLatestHumidityReading
};