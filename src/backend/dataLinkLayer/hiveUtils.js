import { query } from "./dbutils.js";

export async function getHiveById(hiveId) {
  const result = await query(
    `
      SELECT hiveid, name, zipcode, startdate
      FROM hive
      WHERE hiveid = $1
    `,
    [hiveId],
  );

  return result.rows[0] ?? null;
}
