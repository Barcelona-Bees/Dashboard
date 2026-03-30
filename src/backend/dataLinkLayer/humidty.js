import * as dbutils from "./dbutils.js";
/**
 * The humidty DLL
 * 
 */


/**
 * Inserts a Humidity reading
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} reading - the reading of the HUMIDTY
 * @param {*} timestamp - timestamp of the reading
 */
async function insertHumidity(hiveID, reading, timestamp){
   
    await dbutils.insertData('Humidity',{hiveID:hiveID, reading: reading, timestamp : timestamp});

}

/**
 * Gets the last HUMIDTY for the Hive
 * 
 */
async function getLastHumidty(){
    let sqlString = "SELECT * FROM HUMIDTY WHERE HIVEID = 1 AND tempid = (SELECT MAX(tempid) from HUMIDTY where HIVEID = 1);";
    let rJSON = await dbutils.runDirectSQL(sqlString);

    return rJSON.rows[0];
}

/**
 * Exact match for one HUMIDTY row at (hiveID, timestamp).
 *
 * @param {number} hiveID
 * @param {Date} timestamp
 */
async function getHumidityReadingAt(hiveID, timestamp) {
    return await dbutils.getData("HUMIDTY", ["reading"], {
        hiveID,
        timestamp,
    });
}

/**
 * Latest HUMIDTY reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getLatestHumidityReading(hiveID) {
    const sql =
    "SELECT * FROM HUMIDTY WHERE HIVEID = $1 AND tempid = (SELECT MAX(tempid) from HUMIDTY where HIVEID = $1);";
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID]);
}

/**
 * Returns the HUMIDTYs between the startDate and endDate for given hiveID
 * 
 * 
 * @param {*} hiveID - the hiveID
 * @param {*} startDate - the starting date to look for
 * @param {*} endDate - the ending date to look for
 */
async function getCustomRangeHumidity(hiveID, startDate, endDate){
    // Keep results ordered so frontend can treat "last row" as most recent.
    let sqlString =
        "SELECT timestamp, reading FROM HUMIDTY WHERE hiveID = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp ASC";
    let paramsArray = [hiveID, startDate, endDate];
    let rJson = await dbutils.runDirectSQLwithPrepared(sqlString, paramsArray );

    return rJson;
}


/**
 * Latest HUMIDTY reading for a hive (row with max timestamp).
 *
 * @param {number} hiveID
 */
async function getHumidityMeasurement(hiveID, timestamp, measurement = 'day') {
    const sql =
        "SELECT timestamp, reading FROM HUMIDTY WHERE hiveID = $1 AND DATE_TRUNC($2,timestamp) = TO_TIMESTAMP($3)";
        // console.log(timestamp);
    return await dbutils.runDirectSQLwithPrepared(sql, [hiveID, measurement, timestamp]);
}

// await getLastTemp();
// insertTemp();
// getCustomRange(1,'2026-02-01','2026-03-06'); // run manually when testing DB

export {
    getCustomRangeHumidity,
    getLastHumidty,
    getHumidityReadingAt,
    insertHumidity,
    getHumidityMeasurement
};