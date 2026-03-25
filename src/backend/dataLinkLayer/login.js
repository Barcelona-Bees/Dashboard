import { query } from "./dbutils.js";

export async function login(username, password) {
  const result = await query(
    `
      SELECT userid
      FROM users
      WHERE username = $1
      AND password = $2
    `,
    [username, password],
  );

  return result.rows[0] ?? null;
}
