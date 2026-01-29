// calls bl functions to send data to frontend
import * as fs from 'fs/promises';

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
 * Gets the past two weeks of data. (hardcoded to 1/10/26 for now)
 *  
 * @returns [[timestamp, temp, humidity], ...]
*/
function getTwoWeeks(){
    const currentDatetime = "2026-01-10T23:50:00";
    const today = new Date(currentDatetime);
    const twoWeeks = new Date(currentDatetime);

    let currentDay = today.getDate();
    twoWeeks.setDate(currentDay - 14);

    let len = hiveData.length;
    var data = [];

    for(let i=0; i<len; i++){
        let timestamp = hiveData[i];
        let ts = timestamp.split(",")[0];
        if(ts>=twoWeeks.toISOString() && ts<=today.toISOString()){
            let measurement = getMeasurement(ts);
            data.push(measurement);
        }
    }
    return data
}

async function readCSV(){
    let data = await fs.readFile("testData/beehive_measurements.csv", 'utf-8');
    let parsedData = data.split("\r\n");

    for (let i = 0; i < parsedData.length; i++) {
        hiveData.push(parsedData[i]);
        // console.log(parsedData[i]);
    }
}

await readCSV();
console.log("getMeasurement: "+getMeasurement("2026-01-14T23:50:00"))
console.log("getDay: "+getDay("2026-01-14").length+" timestamps");
console.log("getTwoWeeks: "+getTwoWeeks().length+" timestamps");