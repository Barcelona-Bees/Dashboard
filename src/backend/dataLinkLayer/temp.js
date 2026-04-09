import * as dbutils from "./dbutils.js";

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
 * Exact match for one Temperature row at (hiveID, timestamp).
 *
 * @param {number} hiveID
 * @param {Date} timestamp
 */
async function getTemperatureReadingAt(hiveID, timestamp) {
    return await dbutils.getData("Temperature", ["reading"], {
        hiveID,
        timestamp,
    });
}

/**
 * Latest temperature reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getLatestTemperatureReading(hiveID) {
    const sql =
    "SELECT * FROM TEMPERATURE WHERE HIVEID = $1 AND tempid = (SELECT MAX(tempid) from Temperature where HIVEID = $1);";
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID]);
}

/**
 * Returns the temperatures between the startDate and endDate for given hiveID
 * 
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} startDate - the starting date to look for
 * @param {*} endDate - the ending date to look for
 */
async function getCustomRangeTemperature(hiveID, startDate, endDate){
    // Keep results ordered so frontend can treat "last row" as most recent.
    let sqlString =
        "SELECT timestamp, reading FROM Temperature WHERE hiveID = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC";
    let paramsArray = [hiveID, startDate, endDate];
    let rJson = await dbutils.runDirectSQLwithPrepared(sqlString, paramsArray );

    return rJson;
}


/**
 * Latest temperature reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getTempMeasurement(hiveID, timestamp, measurement = 'day') {
    const sql =
        "SELECT timestamp, reading FROM Temperature WHERE hiveID = $1 AND DATE_TRUNC($2,timestamp) = TO_TIMESTAMP($3)";
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID, measurement, timestamp]);
}

export {
    getCustomRangeTemperature,
    getLatestTemperatureReading,
    getTemperatureReadingAt,
    insertTemp,
    getTempMeasurement
};