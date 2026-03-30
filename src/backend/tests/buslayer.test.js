import {
    isValidLogin,
    isValidHive,
    isNum,
    isString,
    isValidDate,
    isValidPhone,
    isValidEmail,
} from "../busLayer/utils.js";

/** Set TEST_DB=1 to run tests that require a live PostgreSQL database (see dbutils pool config). */
const integration = process.env.TEST_DB === "1" ? describe : describe.skip;

integration("isValidLogin()", () => {
    test("Username and password are correct", async () => {
        await expect(isValidLogin("username", "password")).resolves.toBe(true);
    });
    test("Username is incorrect", async () => {
        await expect(isValidLogin("badusername", "password")).resolves.toBe(false);
    });
    test("Password is incorrect", async () => {
        await expect(isValidLogin("username", "badpassword")).resolves.toBe(false);
    });
});

integration("isValidHive()", () => {
    test("Hive ID is in the database", async () => {
        await expect(isValidHive(1)).resolves.toBe(true);
    });
    test("Hive ID is not a number", async () => {
        await expect(isValidHive("string")).resolves.toBe(false);
    });
    test("Hive ID is not in the database", async () => {
        await expect(isValidHive(999999999)).resolves.toBe(false);
    });
});

describe("isNum()", () => {
    test("Value is a number", () => {
        expect(isNum(5)).toBe(true);
    });
    test("Value is not a number", () => {
        expect(isNum("string")).toBe(false);
    });
});

describe("isString()", () => {
    test("Value is a String", () => {
        expect(isString("string")).toBe(true);
    });
    test("Value is not a number", () => {
        expect(isString(5)).toBe(false);
    });
});

integration("isValidDate()", () => {
    test("Date is formatted correctly", async () => {
        let date = new Date();
        await expect(isValidDate(1, date)).resolves.toBe(true);
    });
    test("Date is invalid ", async () => {
        await expect(isValidDate(1, "notADate")).resolves.toBe(false);
    });
    test("Date is in the future", async () => {
        await expect(isValidDate(1, "2099-12-31T00:00:00")).resolves.toBe(false);
    });
    test("Date occurs before startDate", async () => {
        await expect(isValidDate(1, "2000-01-01T00:00:00")).resolves.toBe(false);
    });
});

describe("isValidPhone()", () => {
    test("Phone number is valid", () => {
        expect(isValidPhone(5555555555)).toBe(true);
    });
    test("Phone number is too long", () => {
        expect(isValidPhone(55555555555555555555555555)).toBe(false);
    });
    test("Phone number is too short", () => {
        expect(isValidPhone(5)).toBe(false);
    });
    test("Phone number is a not number", () => {
        expect(isValidPhone("string")).toBe(false);
    });
});

describe("isValidEmail()", () => {
    test("Email is valid", () => {
        expect(isValidEmail("test@email.com")).toBe(true);
    });
    test("Email is invalid", () => {
        expect(isValidEmail("notEmail")).toBe(false);
    });
    test("Email is not a string", () => {
        expect(isValidEmail(5)).toBe(false);
    });
});
