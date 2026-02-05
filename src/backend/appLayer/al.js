// calls bl functions to send data to frontend

const fs = require("fs/promises");
const path = require("path");

// MOCK Functions
var hiveData = [];

/**
 * Gets data from a single timestamp.
 * 
 * @param datetime Timestamp as a string: 2026-01-14T23:50:00
 *  
 * @returns [timestamp, temp, humidity]
*/
function getMeasurement(datetime){
    let len = hiveData.length;
    for(let i=0; i<len; i++){
        let timestamp = hiveData[i];
        let ts = timestamp.split(",");
        if(ts[0] == datetime){
            return ts;
        }
    }
    return [datetime, "0", "0"]
}

/**
 * Gets all the data from a day.
 * 
 * @param date Date as a string: 2026-01-14
 *  
 * @returns [[timestamp, temp, humidity], ...]
*/
function getDay(date){
    let len = hiveData.length;
    var data = [];
    for(let i=0; i<len; i++){
        let timestamp = hiveData[i];
        let ts = timestamp.split(",");
        let tsDate = ts[0].split("T");
        if(tsDate[0] == date){
            data.push(ts)
        }
    }
    return data
}

/**
 * Gets the past two weeks of data. (hardcoded to 1/14/26 for now)
 *  
 * @returns [[timestamp, temp, humidity], ...]
*/
function getTwoWeeks() {
    const currentDatetime = "2026-01-14T23:50:00";
    const today = new Date(currentDatetime);

    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const ENTRIES = 2016;

    const twoWeeks = new Date(today.getTime() - ENTRIES * TEN_MINUTES_MS);

    const data = [];

    for (let i = 0; i < hiveData.length; i++) {
        const tsString = hiveData[i].split(",")[0];
        const tsDate = new Date(tsString);

        // start inclusive, end exclusive
        if (tsDate > twoWeeks && tsDate <= today) {
            data.push(getMeasurement(tsString));
        }
    }

    return data;
}


async function readCSV(){
    let data;
    if (typeof window === "undefined") {
        // Running in Node (Jest)
        const filePath = path.join(__dirname, "../../public/testData/beehive_measurements.csv");
        data = await fs.readFile(filePath, "utf-8");
    } else {
        // Running in browser
        const response = await fetch("/testData/beehive_measurements.csv");
        data = await response.text();
    }

    let parsedData = data.split("\r\n");

    for (let i = 1; i < parsedData.length; i++) {
        hiveData.push(parsedData[i]);
        // console.log(parsedData[i]);
    }
}

/**
 * Initializes the data when reading from csv
 * 
 * Always run this before trying to access data
 */
async function init(){
    await readCSV();
}

function verifyCSV(){
    return hiveData
}

// ----------------------------------------------------------------------------------------------------------
// REAL Functions

module.exports = {
    getTwoWeeks,
    getDay,
    getMeasurement,
    init,
    verifyCSV
}