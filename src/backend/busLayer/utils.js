import { login, validSessionToken } from "../dataLinkLayer/login.js";
import { getStartTime } from "../dataLinkLayer/hiveUtils.js";
import bcrypt from 'bcrypt';


/**
 * Checks if login information is valid
 *
 * @param username
 * @param password
 * @returns boolean
 */
async function isValidLogin(username, password) {
    return await login(username, password);
}

/**
 * Checks if hive id is in the database
 *
 * @param id
 * @returns boolean
 */
async function isValidHive(id) {
    if (typeof id === "string") {
        return false;
    }
    const row = await getStartTime(Number(id));
    return !!(row && row.startdate != null);
}

/**
 * Checks if input is an integer
 *
 * @param data - A number
 * @returns boolean
 */
function isNum(data) {
    if (typeof data == "number") return true;
    return false;
}

/**
 * Checks if input is a string
 *
 * @param data - A string
 * @returns boolean
 */
function isString(data) {
    return typeof data == "string";
}

/**
 * True if value is a Date instance and is not NaN.
 *
 * @param d
 * @returns boolean
 */
function isValidDateValue(d) {
    return d instanceof Date && !Number.isNaN(d.getTime());
}

/**
 * Converts a numeric input into a finite number.
 * Returns null when the value cannot be parsed as a finite number.
 *
 * @param value number | string
 * @returns number | null
 */
function toNumericReading(value) {
    if (isNum(value) && Number.isFinite(value)) return value;
    if (isString(value)) {
        const n = Number(value);
        if (Number.isFinite(n)) return n;
    }
    return null;
}

/**
 * Checks if date is valid for the hive (between hive start and now)
 *
 * @param hiveId
 * @param date - Date or ISO string
 * @returns boolean
 */
async function isValidDate(hiveId, date) {
    if (!(await isValidHive(hiveId))) {
        return false;
    }
    const row = await getStartTime(hiveId);
    if (!row?.startdate) {
        return false;
    }
    const start = new Date(row.startdate);
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
        return false;
    }
    const now = new Date();
    return d >= start && d <= now;
}

/**
 * Checks if phone number is valid
 *
 * @param num - A 10 digit phone number
 * @returns boolean
 */
function isValidPhone(num) {
    let numStr = "" + num;
    if (isNum(num) && numStr.length == 10) {
        return true;
    }
    return false;
}

/**
 * Checks if email is valid
 *
 * @param email - A string
 * @returns boolean
 */
function isValidEmail(email) {
    if (isString(email)) {
        let split = email.split("@");
        if (split.length == 2) return true;
    }
    return false;
}

/**
 * Checks if session token is valid (returns a user id when valid)
 *
 * @param token - Session token
 * @returns boolean
 */
async function isValidSessionToken(token) {
    const userId = await validSessionToken(token);
    return userId !== -1;
}

/**
 * Hashes input
 *
 * @param data - String to be hashed
 * @returns hashed string
 */
async function hashPassword(password) {
    const salt = "$2a$10$R9h/cIPz0gi.URNNX3kh2O";
    const hash = await bcrypt.hash(password, salt);
    return hash;
}

/**
 * Generates a new user token
 *
 * @returns
 */
function generateToken() {}

/**
 * Sanitizes the given string
 *
 * @param data - String to be sanitized
 * @returns sanitized string
 */
function sanitize(data) {}

export {
    isValidLogin,
    isValidHive,
    isNum,
    isString,
    isValidDateValue,
    toNumericReading,
    isValidDate,
    isValidPhone,
    isValidEmail,
    isValidSessionToken,
    hashPassword,
    sanitize,
    generateToken,
};
