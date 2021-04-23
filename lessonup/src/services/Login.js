/* Import the Axios instance created in src/services/Api.js which serves as a tool for sending data to & from backend Express server
    using HTTP requests */
import Api from '@/services/Api';

// Allows us to import this module inside component.vue files and use its methods
export default {
    
    // Method which we can call from Login.vue component with the command Login.login({ email: this.email, password: this.password})
    login(credentials) {

        /* Send the credentials object to the /login route on the Express server, which retrieves the data as req.query.email & req.query.password
            Backend then checks the database for a record with a matching username and checks password using bcrypt. If no matching user found,
            or password incorrect, server sends back warning prompt, which will be rendered in the Login.vue form page. Otherwise, TBC */

        return Api().post('login', credentials);
    }

}