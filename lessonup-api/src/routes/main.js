// Routes/endpoints for handling HTTP requests

module.exports = function(app) {

	// Middleware to protect routes so that only users with a valid session can send requests to those routes
	const isAuth = require('./authMiddleware').isAuth;
	// Use the Express validator module
	const { check, validationResult } = require('express-validator');
	/* emailRegEx is used in login & register routes below to test whether email addresses sent from frontend match an email address format pattern, i.e.
	<some letters and numbers> @ <some letters and numbers> . <some letters and numbers> */
	const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	// nameRegex is used in login & register routes to check that first & last names only contain letters and hyphen (dash -) characters
	const nameRegEx = /^[a-zA-Z]+(-[a-zA-Z]+)*$/;
	// Username regex used to validate username in registration route
	const usernameRegex = /^[a-zA-Z0-9_]*$/;
	/* Regex to test validity of userLang sent from frontend. They're mostly in the format "en", "fr" but some (Chinese tradition / Chinese simplified are "zh-CN" or "zh-TW") have
		more than 2 characters and not all alphabetic characters */
	const userLangRegex = /^[a-zA-Z-]*$/;
	// Regex to test that the subject of a new Request for help contains only letters and spaces
	const subjectRegex = /^[a-zA-Z ]*$/;
	// Regex to test the 'study level' of a new help Request
	const studyLevelRegex = /^[a-zA-Z0-9 ]*$/;
	// Time format regex (used in Requests routes) to check the time a request was posted is in format hh:mm:ss
	const timeFormatRegex = /^(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])$/;

	// API key used by Google Cloud services to link HTTP requests to our Google user account
	const api = '*****';

	/* Create a Google Translate API instance so we can use its methods.
		You can look at the methods in server/src/node_modules/google-translate/lib/main.js
		User guides from Google are here https://cloud.google.com/translate/docs/how-to */
	const googleTranslate = require('google-translate')(api);

	// Use the bcrypt password module
	const bcrypt = require('bcrypt');
	// Number of salting rounds for password hashing
	const saltRounds = 10;

	
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Route to retrieve the list of languages which Google Cloud Translate API supports translation into and return to frontend as an array
    app.get('/getlanguages', function (req, res) {

		// User's selection from the dropdown menu on the frontend
		const userLanguage = req.sanitize(req.query.target);

        /* Get the list of languages we can translate the app into, from Google Translate API. The userLanguage parameter (e.g. 'en' or 'fr')
		tells Google Translate which language to return the list in (i.e. list of languages in English or French etc) */
		googleTranslate.getSupportedLanguages(userLanguage, function(err, languages) {
    		if (err) {
        		throw err;
    		} else {
			/* Languages is an array of objects, e.g. [{ language: 'en', name: 'English' }, { language: 'fr', name: 'french' }, ... ] and
				we send it back to whatever accessed this route, i.e. the Index.vue component, via the Translate.js interface */
				res.send(languages);
    		}
		})

    })

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Route to send translation requests to the Google Translate API
	app.post('/translate', function (req, res) {

		// Store the text sent from the frontend to be translated
		const textToTranslate = req.sanitize(req.body.text);
		// Store the language which the input is to be translated to
		const outputLang = req.sanitize(req.body.target);

		/* Request the translation from Google and send it back to whatever connected to this route, i.e. a frontend Vue component, via the
		interface in client/src/services/Translate.js. The translation variable (i.e. result from the API) is an object in the format:
		{ translatedText: "string of translated text", detectedSourceLanguage: "en", originalText: "the input string" }. Data is accessed in
		the frontend as result.data.translatedText etc */
		googleTranslate.translate(textToTranslate, outputLang, function(err, translation) {
			if (err) {
				throw err
			} else {
				res.send(translation);
			}
		})

	})

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Handler for HTTP requests from unauthenticated clients
	
	app.get('/unauthenticated', function(req, res) {
		res.send(['notAuthenticated']);
	})
	

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Route to receive login credentials from frontend, check them against the database and send result back to frontend
	app.post('/login', [check('username').matches(usernameRegex).withMessage('usernameInvalid')], [check('password').isStrongPassword().withMessage('passwordInvalid')], [check('userType').isAlpha().withMessage('generalError')], function (req, res) {
		
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			let errMessages = [];
            for (let anError of errors.errors) {
                errMessages.push(anError.msg);
            }
			res.send(errMessages);
		} else {
			// Store the credentials sent from frontend. See comment above bodyParser in server/src/app.js for more info about how data is passed from frontend
            const username = req.sanitize(req.body.username);
            const password = req.sanitize(req.body.password);
			const userType = req.sanitize(req.body.userType);
            // Construct SQL 'prepared statement' to search the database for a record with matching email address
			const sqlQuery = 'SELECT * FROM users WHERE username = ?;';
		
			// Execute the SQL query to retrieve matching record (if there is one)
		 	db.query(sqlQuery, [username], (err, result) => {
			 	if (err) {
			 		res.send(['generalError']);
		 		// If the result variable is empty, no records were found in the database with matching username
			 	} else if (result.length < 1) {
			 		res.send(['userNotFound']);
		 		} else {
			 	// Check the password from the matching db record
		 			const passwordFromRecord = result[0].password;
			 		bcrypt.compare(password, passwordFromRecord, function (error, passResult) {
						if (error) {
			 				res.send(['generalError']);
			 			} else if (passResult === false) {
			 				// Passwords didn't match - send failure message back to frontend
			 				res.send(['passwordRejected']);
			 			} else {
							
							/* Frontend UI makes user choose whether they're a parent or tutor before they see the login/register options. If the userType
								they selected before login doesn't match the userType stored in their record in the database, login succeeds and also
								sends back the correct userType, so frontend can update the userType of the current user to reflect their account type */
							if (result[0].userType !== userType) {
								// Try to create a login session (valid for 24 hours without having to login again)
								req.login(result[0], function (anErr) {
									if (anErr) {
										return res.send(['generalError'])
									} else {
										// Send success message back to frontend
										res.send(['success', result[0].userType, result[0].id]);
									}
								})
							/* Userype selected on Index of frontend UI - & sent with login request - matches userType on record, so only need to send the
								user's userId to frontend */
							} else {
								req.login(result[0], function(anErr) {
									if (anErr) {
										res.send(['generalError'])
									} else {
										// Send success message back to frontend
										res.send(['success', result[0].id]);
									}
								})
							}
			 			}
			 		})
		 		}
			})
		
		}
	})

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Route to receive registration form data, sanitize it, then post it to the database

	app.post('/register', [check('first').matches(nameRegEx).withMessage('firstNameInvalid').isLength({min: 2, max: 30}).withMessage('nameLength')], [check('last').matches(nameRegEx).withMessage('lastNameInvalid').isLength({min: 2, max: 30}).withMessage('nameLength')], [check('age').isInt({min: 18, max: 100}).withMessage('ageInvalid')], [check('username').matches(usernameRegex).withMessage('usernameInvalid').isLength({min: 8, max: 25}).withMessage('usernameInvalid')], [check('email').matches(emailRegEx).withMessage('emailInvalid').isLength({max: 100}).withMessage('emailLength')], [check('password').isStrongPassword().withMessage('passwordStrength').isLength({max: 20}).withMessage('passwordLength')], [check('userLang').matches(userLangRegex).withMessage('generalError')], function (req, res) {

		/* Whether the Express validator raised any errors (invalid names, email or password) determines whether the form data is posted to database or not.
			If not, error prompts will be sent back to frontend to be displayed to user. Although data is validated before sending from frontend, we still need to
			validate it again because somebody could change it in-transit (using browser developer tools) and potentially crash the server or get access to the db */
        const errors = validationResult(req);
		if (!errors.isEmpty() || !(req.body.userType === 'parent' || req.body.userType === 'tutor')) {
			let errMessages = [];
			for (let anError of errors.errors) {
				errMessages.push(anError.msg);
			}
			if (req.body.password !== req.body.confirm) {
				errMessages.push('mismatchedPasswords');
			}
			if (!(req.body.userType === 'parent' || req.body.userType === 'tutor')) {
				errMessages.push('generalError');
			}
			res.send(errMessages);
		} else {
			// Form input all passed the validation checks

			// Check there's not already a user record in db with the email address (we don't want duplicate accounts)
			const checkAlreadyExists = 'SELECT username FROM users WHERE username = ?;';
			const username = req.sanitize(req.body.username);

			db.query(checkAlreadyExists, [username], (error, result) => {
				if (error) {
		 			res.send(['generalError']);
				// If there's a result from the database, we know there's already a user account with that username
		 		} else if (result.length > 0) {
		 			// Send message back to frontend
		 			res.send(['usernameDuplicate']);
				
		 		// At this point, form input passed validation & username isn't already associated wtih an account
		 		} else {

		 			// Store the form data from the frontend registration form
		 			const first = req.sanitize(req.body.first);
		 			const last = req.sanitize(req.body.last);
					const age = req.sanitize(req.body.age);
					const email = req.sanitize(req.body.email);
		 			const password = req.sanitize(req.body.password);
					const userType = req.sanitize(req.body.userType);
					const userLang = req.sanitize(req.body.userLang);

		 			// Create SQL query string
		 			let sqlQuery = 'INSERT INTO users (first, last, age, username, email, password, userType, userLang) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';

		 			// Hash the password, then connect to the database and insert new user record in database
		 			bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
		 				if (err) res.send(['generalError']);
		 				else {
							const newRecord = [first, last, age, username, email, hashedPassword, userType, userLang];
		 					db.query(sqlQuery, newRecord, (someErr, result) => {
		 						if (someErr) {
		 							res.send(['generalError']);
		 						} else {
									// Need to get the id property of the record just created & return to frontend with sucsess
									db.query('SELECT * FROM users WHERE username = ?', [username], (anError, user) => {
										if (anError) {
											res.send(['generalError']);
										} else {
											req.login(user[0], function (someErr) {
												if (someErr) {
													res.send(['generalError']);
												} else {
													// Send confirmation back to frontend
													res.send(['success', user[0].id]);
												}
											})
										}
									});
		 						}
		 					})
		 				}
		 			})

		 		}
			})
		}

    })

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Logout route/endpoint

	app.get('/logout', function (req, res) {
		// Delete the Passportjs user object
		req.logout();
		// Delete the session
		req.session.destroy();
		res.send();
	})

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Process new Requests for help (validate, sanitize and push to database)

	app.post('/new-request', isAuth, [check('userId').isInt({min:1}).withMessage('generalError')], [check('username').matches(usernameRegex).withMessage('generalError').isLength({min: 8, max: 25}).withMessage('generalError')], [check('userLang').matches(userLangRegex).withMessage('generalError')], [check('subject').matches(subjectRegex).withMessage('subjectInvalid')], [check('studyLevel').matches(studyLevelRegex).withMessage('studyLevelInvalid')], [check('dueDate').isDate().withMessage('generalError')], [check('request').isLength({max: 750}).withMessage('requestLength')], [check('datePosted').isDate().withMessage('generalError')], [check('timePosted').matches(timeFormatRegex).withMessage('generalError')], function (req, res) {
		
		// We need to validate that the homework due date sent from the frontend isn't before the current date
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tempDueDate = new Date(req.body.dueDate);
		const tempDatePosted = new Date(req.body.datePosted);
		const datePostedInvalid = tempDatePosted < today;
		const dueDateInvalid = tempDueDate < today;

		const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errMessages = [];
            for (let anError of errors.errors) {
                errMessages.push(anError.msg);
            }
			res.send(errMessages);
		} else if (dueDateInvalid) {
				res.send('dueDateInvalid');
		} else if (datePostedInvalid) {
				res.send('generalError');
		} else {
			// Check the userId & username correspond to a registered user (somebody could just change them in browser devtools & create a load of requests otherwise)
			const userId = req.sanitize(req.body.userId);
			const username = req.sanitize(req.body.username);
			const userQuery = 'SELECT * FROM users WHERE id = ? AND username = ?;';
			
			db.query(userQuery, [userId, username], (error, result) => {
				if (error) {
					res.send(['generalError']);
				} else if (!(result.length > 0)) {
				// No user record with the userId & username received from frontend - user might've used browser devtools to send bogus data
					res.send(['generalError']);
				} else {
				// User is legit
					let insertQuery = 'INSERT INTO requests(userId, username, userLang, subject, studyLevel, dueDate, request, datePosted, timePosted) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?);';
					const userLang = req.sanitize(req.body.userLang);
					const subject = req.sanitize(req.body.subject);
					const studyLevel = req.sanitize(req.body.studyLevel);
					const dueDate = req.sanitize(req.body.dueDate);
					const request = req.sanitize(req.body.request);
					const datePosted = req.sanitize(req.body.datePosted);
					const timePosted = req.sanitize(req.body.timePosted);
					const newRequest = [userId, username, userLang, subject, studyLevel, dueDate, request, datePosted, timePosted];
					
					db.query(insertQuery, newRequest, (anError, result) => {
						if (anError) {
							res.send(['generalError']);
						} else {
							res.send(['success']);
						}
					})
				}
			})

		}


	})


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Retrieve all help Requests in database and return to frontend

	app.get('/all-requests', isAuth, function (req, res) {
		
		const query = 'SELECT * FROM requests';

		db.query(query, (err, result) => {
			if (err) {
				res.send(['generalError']);
			} else if (result.length < 1) {
				res.send(['noRequests']);
			} else {
				res.send(result);
			}
		})

	})
	

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Delete a Request for help from the database

	app.delete('/delete-request/:id', isAuth, function (req, res){
		const requestId = req.params.id;
		const query = 'DELETE FROM requests WHERE requestId = ?;';

		db.query(query, [requestId], (err, result) => {
			if (err) {
				console.log(err);
				res.send(['deletionFailed']);
			} else {
				res.send(['success']);
			}
		})
	})

	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Save a new message to the database

	app.post('/new-message', isAuth, [check('requestId').isInt({min: 1}).withMessage('generalError')], [check('userLang').matches(userLangRegex).withMessage('generalError')], [check('sender').matches(usernameRegex).withMessage('generalError').isLength({min: 8, max: 25}).withMessage('generalError')], [check('recipient').matches(usernameRegex).withMessage('generalError').isLength({min: 8, max: 25}).withMessage('generalError')], [check('message').isLength({min: 2, max: 500}).withMessage('lengthError')], [check('dateSent').isDate().withMessage('generalError')], [check('timeSent').matches(timeFormatRegex).withMessage('generalError')], function (req, res) {

		// We need to validate that the message sent date from the frontend isn't before the current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tempDateSent = new Date(req.body.dateSent);
        const dateSentInvalid = tempDateSent < today;

		const errors = validationResult(req);
        if (!errors.isEmpty()) {
            let errMessages = [];
            for (let anError of errors.errors) {
				console.log(anError.param);
                errMessages.push(anError.msg);
            }
            res.send(errMessages);
		} else if (dateSentInvalid) {
			res.send(['generalError']);
		} else {
			
			let query = 'INSERT INTO messages(requestId, language, sender, recipient, message, dateSent, timeSent) VALUES(?, ?, ?, ?, ?, ?, ?);';
			const requestId = req.sanitize(req.body.requestId);
			const language = req.sanitize(req.body.userLang);
			const sender = req.sanitize(req.body.sender);
			const recipient = req.sanitize(req.body.recipient);
			const message = req.sanitize(req.body.message);
			const dateSent = req.sanitize(req.body.dateSent);
			const timeSent = req.sanitize(req.body.timeSent);
			const newMessage = [requestId, language, sender, recipient, message, dateSent, timeSent];

			db.query(query, newMessage, (error, result) => {
				if (error) {
					console.log("SQL insertion error");
					res.send(['generalError']);
				} else {
					res.send(['success']);
				}
			})
		}

	})


	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Retrieve a user's chats/conversations and send them to the frontend Vue app

	app.get('/conversations', isAuth, function (req, res) {
		
		const username = req.sanitize(req.query.username);

		const queryRequestIds = 'SELECT DISTINCT requestId FROM messages WHERE sender = ? OR recipient = ? ;';

		db.query(queryRequestIds, [username, username], (error, result) => {
			if (error) {
				console.log("Error getting unique requestIds");
				res.send(['generalError']);
			} else if (result.length < 1) {
				console.log("User has no messages");
				res.send(['noMessages']);
			} else {
				/* Conversations will hold arrays of Message objects. Each sub-array in conversations will only contain messages objects which share the
                        		same requestId property - i.e. messages which all relate to one specific Request object will be grouped in their own sub-array */
				let conversations = [];
				result.forEach(aResult => {
					let convoQuery = `SELECT * FROM messages WHERE requestId = ${aResult.requestId} AND (sender = ? OR recipient = ?);`;
					db.query(convoQuery, [username, username], (err, outcome) => {
                        if (err) {
							console.log("Error getting conversations");
                            res.send(['generalError']);
                        } else {
                            conversations.push(outcome);
							if (aResult === result[result.length - 1]) {
								res.send(conversations);
							}
                        }
                    })
				})
			}
		})

	})
	

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Retrieve an updated (when a new reply has been sent) list of messages in a conversation and send back to frontend Vue app

	app.get('/messages', isAuth, function (req, res) {

		const username = req.sanitize(req.query.username);
		const requestId = req.sanitize(req.query.requestId);
		const query = 'SELECT * FROM messages WHERE requestId = ? AND (sender = ? OR recipient = ?);';

		db.query(query, [requestId, username, username], (error, result) => {
			if (error) {
				console.log("Error getting messages in chat from database");
				res.send(['generalError']);
			} else if (result.length < 1) {
				res.send(['noMessages'])
			} else {
				res.send(result);
			}
		})

	})

	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Delete the message with the specified messageId

	app.delete('/delete-message/:id', isAuth, function (req, res) {
		const messageId = req.params.id;
		const query = 'DELETE FROM messages WHERE messageId = ?;';

		db.query(query, [messageId], (err, result) => {
			if (err) {
				console.log(err);
				res.send(['deletionFailed']);
			} else {
				res.send(['success']);
			}
		})
	})

	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
}
