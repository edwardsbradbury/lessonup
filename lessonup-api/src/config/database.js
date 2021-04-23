/* Database configuration settings, exported to src/app.js once configured */

/* Use MySQL */
const mysql = require('mysql');

/* Create a pool of database connections - had to use a pool rather than a single connection because the ClearDB database
    server hosting the database closes connections after a short period of inactivity - so the app was crashing when trying
    to perform database operations after database connections timed out. Pool handles closing connections & opening new ones */
const db = mysql.createPool({
    host: 'eu-cdbr-west-01.cleardb.com',
    user: 'bb286357b5b020',
    password: '76136d3b',
    database: 'heroku_29cf767a8e27919'
});

/* Export the connection pool so it can be:
    1) imported in src/app.js - enabling session manager to access its session store and Express app instance to make global db property
        which routes/main can then use to query the database
    2) allow config/passport.js to query the database for user authentication */
module.exports = db;