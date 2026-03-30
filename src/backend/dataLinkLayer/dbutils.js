import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  database: "siteinfo",
  user: "student",
  password: "student",
  port: 5432,
});

pool.on("error", (err) => {
  console.error("[dbutils] Pool error:", err.message);
});
/**
 * 
 * A generic SELECT statement function that takes in a single table as a string, columns in the form of an array of strings,
 *  and criteria in the form of JSON wher key is column name, and value is column value:
 * 
 * EX: getData('users', ['id'], {username: var}) = SELECT id FROM users WHERE username = var;
 * 
 * @param {*} table the table name
 * @param {*} columns the list of columns
 * @param {*} criteria the table constraints
 * @returns 
 */
async function getData( table, columns = `*`, criteria = null) {
    try {
        const qryColumns = Array.isArray(columns)
            ? columns.join(", ")
            : String(columns);
        const critList = [],
          paramList = [];

        if(criteria != null){
          let tempIndex = 1;  

          Object.entries( criteria ).forEach( ( crit ) => {
            critList.push( `${crit[0]} = $${tempIndex}` );
            paramList.push(crit[1]);
            tempIndex++; //increment tempIndex
          });
          
        }
          
        const qryCriteria = ( critList.length ) ? `WHERE ${ critList.join( ` AND ` ) }` : ``,
              qryString = `SELECT ${ qryColumns } FROM ${ table } ${ qryCriteria }`;
        if (process.env.DEBUG_DB) {
          console.log(qryString);
        }

        var queryResult;

        if (paramList.length > 0){
          queryResult = await pool.query( qryString, paramList );
        }
        else{
          queryResult = await pool.query( qryString );
        }

        // console.log("query results", queryResult);

        //Returns JSON
        return queryResult;
      }
      catch ( error ) {
        console.error( error );

        return error;
      }
}

/**
 * A generic INSERT statement function that takes in a single table as a string, 
 *  and columnsAndValues in the form of JSON wher key is column name, and value is column value:
 * 
 * EX: updateData('users', {username: var, password: var2, role: var3}); = 
 *          INSERT INTO users(username, password, role) VALUES (var, var2, var3);
 * @param {*} table the table name to be inserted
 * @param {*} columnsAndValues JSON of cols and values
 * @returns 
 */
async function insertData( table, columnsAndValues, returnID = false){
  try {

    //Holding vars
    var qryColumns = [],
    qryValues = [],
    qryParams = [];

    let tempIndex = 1;

    Object.entries( columnsAndValues ).forEach( ( crit ) => {
      qryColumns.push(crit[0]);
      qryValues.push(`$${tempIndex}`);
      qryParams.push(crit[1]);
      tempIndex++;
    });

    const colString = qryColumns.join(", ");
    const valString = qryValues.join(", ");

    let qryString;

    if (returnID) {  
      qryString = `INSERT INTO ${ table } ( ${ colString } ) VALUES ( ${ valString }) RETURNING ID`;
    } else {
      qryString = `INSERT INTO ${ table } ( ${ colString } ) VALUES ( ${ valString })`;
    }



    if (process.env.DEBUG_DB) {
      console.log(qryString);
    }

    const queryResult = await pool.query( qryString , qryParams);

    //Returns JSON
    return queryResult;
  }
  catch ( error ) {
    console.error( error );

    return error;
  }
}

/**
 * A generic UPDATE statement function that takes in a single table as a string, 
 *  and columnsAndValues in the form of JSON where key is column name, and value is column value
 *  and criteria in the form of JSON where key is column name, and value is column value
 * 
 * EX. updateData('users', {username: var, password: var2, role: var3}, {username: var}); =
 *    UPDATE users SET username = var, password = var2, role = var3 WHERE username = var;
 * @param {*} table table name
 * @param {*} columnsAndValues column names and new values 
 * @param {*} criteria for specified criteria
 * @returns 
 */
async function updateData( table, columnsAndValues, criteria){
  try {

    // 'UPDATE users SET sessionToken = ?, col2 = ? WHERE id = ?; 

    //Holding vars
    var qryColVals = [];
    var critList = [];
    var params = [];

    let tempIndex = 1;

    Object.entries( columnsAndValues ).forEach( ( val ) => {
      qryColVals.push( `${val[0]} = $${tempIndex}`);
      params.push(val[1]);
      tempIndex++;
    });

    const size = qryColVals.length;

    //If no sets, get out and return error
    if(size < 1){
      return {error: true};
    }

    var setString = `${qryColVals[0]}`;

    for(let i = 1; i < size; i++){
      setString = setString.concat(`, `,qryColVals[i]);
    }
  
    //Criteria
    Object.entries( criteria ).forEach( ( crit ) => {
      critList.push( `${crit[0]} = $${tempIndex}` )
      params.push(crit[1]);
      tempIndex++;
    });
  
    const qryCriteria = ( critList.length ) ? `WHERE ${ critList.join( ` AND ` ) }` : ``,
      qryString = `UPDATE ${ table } SET ${ setString } ${qryCriteria}`;


    if (process.env.DEBUG_DB) {
      console.log(qryString + "\n" + params);
    }

    const queryResult = await pool.query( qryString , params);

    //Returns JSON
    return queryResult;
  }
  catch ( error ) {
    console.error( error );

    return error;
  }
}

/**
 * 
 * @param {*} table 
 * @param {*} columns 
 * @param {*} criteria 
 * @returns 
 */
async function getDataMulti( table, columns = `*`, criteria ) {
  try {
      const qryColumns = Array.isArray(columns)
          ? columns.join(", ")
          : String(columns),
            critList = [];

      Object.entries( criteria ).forEach( ( crit ) => {
          critList.push( `${crit[0]}='${crit[1]}'` )
      });
      
      const qryCriteria = ( critList.length ) ? `WHERE ${ critList.join( ` AND ` ) }` : ``,
            qryString = `SELECT ${ qryColumns } FROM ${ table } ${ qryCriteria }`;
      // console.log( qryString );

      const queryResult = await pool.query( qryString );

      //Returns JSON
      return queryResult.rows;
    }
    catch ( error ) {
      console.error( error );

      return error;
    }
}


/**
 * A function to run sql directly
 * 
 * @param {*} sql the sql string
 * @returns 
 */
export async function runDirectSQL(sql){
  return await pool.query( sql );
}

/**
 * 
 * A function that runs sql directyl, usings $1, $2 for values and an [] of values
 * for the prepared statment
 * 
 * @param {*} sql the sql string
 * @param {*} params the params for prepared statment that replace $1, $2, etc.
 * @returns 
 */
async function runDirectSQLwithPrepared(sql, params){
  return await pool.query( sql, params)
}
/**
 * Start a transaction (uses a pool connection; for multi-statement transactions use pool.connect() and one client).
 *
 * @returns
 */
async function startTransaction(){
  return await pool.query('BEGIN');
}

/**
 * 
 * Commit a transaction
 * 
 * @returns 
 * 
 */
async function commitTransaction(){
  return await pool.query('COMMIT');
}

/**
 * 
 * Rolls back transaction
 * 
 * @returns 
 */
async function rollbackTransaction(){
  return await pool.query('ROLLBACK');
}

export {
    // connectClient,
    // disconnectClient,
    getData,
    insertData,
    updateData,
    // runDirectSQL,
    runDirectSQLwithPrepared,
    startTransaction,
    rollbackTransaction,
    commitTransaction,
    getDataMulti
};