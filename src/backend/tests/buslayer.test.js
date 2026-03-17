const{ isValidLogin, isValidHive, isNum, isString, isValidDate, isValidPhone, isValidEmail } = require("../busLayer/utils.js");

describe('isValidLogin()', ()=>{
    test("Username and password are correct", ()=>{
        expect(isValidLogin("username","password")).toBe(true);
    })
    test("Username is incorrect", ()=>{
        expect(isValidLogin("badusername","password")).toBe(false)
    })
    test("Password is incorrect", ()=>{
        expect(isValidLogin("username","badpassword")).toBe(false);
    })
})

describe('isValidHive()', ()=>{
    test("Hive ID is in the database", ()=>{
        expect(isValidHive(1)).toBe(true);
    })
    test("Hive ID is not a number", ()=>{
        expect(isValidHive("string")).toBe(false);
    })
    test("Hive ID is not in the database", ()=>{
        expect(isValidHive(999999999)).toBe(false);
    })
})

describe('isNum()', ()=>{
    test("Value is a number", ()=>{
        expect(isNum(5)).toBe(true);
    })
    test("Value is not a number", ()=>{
        expect(isNum("string")).toBe(false);
    })
})

describe('isString()', ()=>{
    test("Value is a String", ()=>{
        expect(isString("string")).toBe(true);
    })
    test("Value is not a number", ()=>{
        expect(isString(5)).toBe(false);
    })
})

describe('isValidDate()', ()=>{
    test("Date is formatted correctly", ()=>{
        let date = new Date();
        expect(isValidDate(1, date)).toBe(true);
    })
    test("Date is invalid ", ()=>{
        expect(isValidDate(1, "notADate")).toBe(false);
    })
    test("Date is in the future", ()=>{
      
        expect(isValidDate(1, '2099-12-31T00:00:00')).toBe(false);
    })
    test("Date occurs before startDate", ()=>{
        expect(isValidDate(1, '2000-01-01T00:00:00')).toBe(false);
    })
})

describe('isValidPhone()', ()=>{
    test("Phone number is valid", ()=>{
        expect(isValidPhone(5555555555)).toBe(true);
    })
    test("Phone number is too long", ()=>{
        expect(isValidPhone(55555555555555555555555555)).toBe(false);
    })
    test("Phone number is too short", ()=>{
        expect(isValidPhone(5)).toBe(false);
    })
    test("Phone number is a not number", ()=>{
        expect(isValidPhone("string")).toBe(false);
    })
})

describe('isValidEmail()', ()=>{
    test("Email is valid", ()=>{
        expect(isValidEmail("test@email.com")).toBe(true);
    })
    test("Email is invalid", ()=>{
        expect(isValidPhone("notEmail")).toBe(false);
    })
    test("Email is not a string", ()=>{
        expect(isValidPhone(5)).toBe(false);
    })
})