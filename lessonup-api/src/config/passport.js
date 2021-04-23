/* Configuration settings for the Passportjs authentication & authorization library which we'll use
    to prevent HTTP requests to the API from unauthenticated clients (e.g. a user of the frontend Vue
    app has been inactive too long and session has timed out or somebody more malicious is trying to
    connect to this Express API) */

// Import the dependancies
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const db = require('./database');
const bcrypt = require('bcrypt');

/* This function is passed to the Passport.authenticate method to check whether the client who has sent
    a request to a server route - where Passport.authentication is deployed as middleware - should
    be granted access to the data at that route.
    
    Note that the username & password are retrieved from the session store in the database - they're
    not user input sent with the HTTP request. Effectively we're checking that the user's session credentials
    match their credentials in the users table */
const verifyCallback = (username, password, done) => {
    
    const query = `SELECT * FROM users WHERE username = '${username}'`;
    
    db.query(query, (error, result) => {

        if (error) {
            return done(error);
        } else if (result.length < 1) {
            return done(null, false);
        } else {
            const passwordFromRecord = result[0].password;
            bcrypt.compare(password, passwordFromRecord, function(err, passValid) {
                if (err) {
                    return done(err);
                } else if (!passValid) {
                    return done(null, false);
                } else {
                    return done(null, result[0]);
                }
            })
        }

    })

}

const strategy  = new LocalStrategy(verifyCallback);

// Make the passportjs instance use this configuration
passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((userId, done) => {

    const query = `SELECT * FROM users WHERE id = ${userId}`;
    db.query(query, function(err, result) {
        if (err) {
            return done(err);
        } else {
            done(null, result[0]);
        }
    })
});