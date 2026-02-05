const{ getTwoWeeks, getDay, getMeasurement, init, verifyCSV} = require("../appLayer/al.js");

beforeAll(async () => {
    await init();
});
describe('verifyCSV()', ()=>{
    test("Verify the whole CSV is read", async ()=>{
        expect(verifyCSV().length).toBe(2016);
    });
})

describe('getMeasurement()', ()=>{
    test("Get a valid measurement from the database", ()=>{
        expect(getMeasurement("2026-01-14T23:50:00"))
            .toEqual(["2026-01-14T23:50:00", "34.66", "58.87"]);
    });
    test("Try to get a measurement not in the database", ()=>{
        expect(getMeasurement("9999-12-31T23:50:00"))
            .toEqual(["9999-12-31T23:50:00", "0", "0"]);
    });
    test("Try to get a measurement formatted wrong", ()=>{
        expect(getMeasurement("notADate"))
            .toEqual(["notADate", "0", "0"]);
    });
});
describe('getDay()', ()=>{
    test("Get a valid date of information from the database", ()=>{
        expect(getDay("2026-01-14").length).toBe(144);
        expect(getDay("2026-01-14")[0]).toEqual(["2026-01-14T00:00:00","34.78","60.12"])
        expect(getDay("2026-01-14")[143]).toEqual(["2026-01-14T23:50:00","34.66","58.87"])
    });
    test("Get an invalid date of information from the database", ()=>{
        expect(getDay("9999-12-31").length).toBe(0);
    });
    test("Get an invalidly formatted date from the database", ()=>{
        expect(getDay("notADate").length).toBe(0);
    });
});

describe('getTwoWeeks()', ()=>{
    test("Get the previous two weeks of information from the database", ()=>{
        expect(getTwoWeeks().length).toBe(2016);
    });
});