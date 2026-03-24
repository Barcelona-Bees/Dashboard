import {
    app,
    init,
    measurementHandler,
    dayHandler,
    twoWeeksHandler,
    verifyHandler,
} from "../appLayer/al.js";

beforeAll(async () => {
    await init();
});

function mockRes() {
    return { json: jest.fn() };
}

describe('GET /verify', ()=>{
    test("Verify the whole CSV is read", ()=>{
        const res = mockRes();
        verifyHandler({ params: {} }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ hiveData: expect.any(Array) }));
        expect(res.json.mock.calls[0][0].hiveData.length).toBe(2016);
    });
})

describe('GET /measurement/:datetime', ()=>{
    test("Get a valid measurement from the database", ()=>{
        const res = mockRes();
        measurementHandler({ params: { datetime: "2026-01-14T23:50:00" } }, res);
        expect(res.json).toHaveBeenCalledWith({ timestamp: "2026-01-14T23:50:00", temp: "34.66", humidity: "58.87" });
    });
    test("Try to get a measurement not in the database", ()=>{
        const res = mockRes();
        measurementHandler({ params: { datetime: "9999-12-31T23:50:00" } }, res);
        expect(res.json).toHaveBeenCalledWith({ timestamp: "9999-12-31T23:50:00", temp: "0", humidity: "0" });
    });
    test("Try to get a measurement formatted wrong", ()=>{
        const res = mockRes();
        measurementHandler({ params: { datetime: "notADate" } }, res);
        expect(res.json).toHaveBeenCalledWith({ timestamp: "notADate", temp: "0", humidity: "0" });
    });
});
describe('GET /day/:date', ()=>{
    test("Get a valid date of information from the database", ()=>{
        const res = mockRes();
        dayHandler({ params: { date: "2026-01-14" } }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ date: "2026-01-14", data: expect.any(Array) }));
        const body = res.json.mock.calls[0][0];
        expect(body.data.length).toBe(144);
        expect(body.data[0]).toEqual(["2026-01-14T00:00:00","34.78","60.12"]);
        expect(body.data[143]).toEqual(["2026-01-14T23:50:00","34.66","58.87"]);
    });
    test("Get an invalid date of information from the database", ()=>{
        const res = mockRes();
        dayHandler({ params: { date: "9999-12-31" } }, res);
        expect(res.json.mock.calls[0][0].data.length).toBe(0);
    });
    test("Get an invalidly formatted date from the database", ()=>{
        const res = mockRes();
        dayHandler({ params: { date: "notADate" } }, res);
        expect(res.json.mock.calls[0][0].data.length).toBe(0);
    });
});

describe('GET /two-weeks', ()=>{
    test("Get the previous two weeks of information from the database", ()=>{
        const res = mockRes();
        twoWeeksHandler({ params: {} }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Array) }));
        expect(res.json.mock.calls[0][0].data.length).toBe(2016);
    });
});