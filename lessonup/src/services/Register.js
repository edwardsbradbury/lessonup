/* Import the Axios instance created in src/services/Api.js which serves as a tool for sending data to & from backend Express server
    using HTTP requests */
    import Api from '@/services/Api';

    // Allows us to import this module inside component.vue files and use its methods
    export default {

        /* Send the formData object to the /register route on the Express server, which retrieves the data as req.query.first, req.query.last, req.query.email
            & req.query.password. Server validates & sanitizes data using Express sanitizer, then creates new user record in the database. If Express validator
            finds data format errors (e.g. the email isn't a valid email), server sends back error messages as strings. Otherwise, sends back registration
            confirmation message */

        sendForm (formData) {
            return Api().post('register', formData);
        }
    }