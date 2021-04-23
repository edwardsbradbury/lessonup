/* Middleware to add to protected routes for access control

Uses Passportjs' isAuthenticated method.
isAuthenticated checks whether the client's browser has a cookie relevant to this app.
If so, the cookie contains a sessionId.
Passportjs will retrieve the relevant session object/record (the row in the sessions table of the database which has that sessionId).
If the session hasn't expired and the credentials (username & password) associated with that session match those in the user's record in the database
users table, then continue to next middleware and eventually the route callback function.
If not, redirect to the /unauthenticated route */

module.exports.isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/unauthenticated');
    }
}