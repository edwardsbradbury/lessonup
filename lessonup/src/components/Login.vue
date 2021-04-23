<template>

  <div id="login">

    
    <p>
      {{loginMessage}}
    </p>

    <!-- Run the checkInput method (defined below from line 110) when Login button is clicked. Method will block data being
        sent to the server whilst there are errors -->
    <form id="loginForm" @submit="checkInput" action="" method="post">
      
      <!-- Conditionally display error messages to the user if input data missing or incorrectly formatted or the database query at
          our backend Express API returns an error -->
      <div v-if="errors.length" class="error">
        <p>{{correctionLabel}}</p>
        <ul style="list-style-type:none;">
          <li v-for="error in errors" :key="error">{{error}}</li>
        </ul>
      </div>

      <!-- If errors array in data includes the missing email or invalid email error, give the <label> tag a class="error" attribute.
          This will turn the label text colour to red (.error selector has CSS rule in App.vue) -->
      <label for="username" :class="(errors.includes(usernameEmpty) || errors.includes(usernameInvalid)) ? 'error' : null">{{usernameLabel}}</label>
      <input name="username" type="text" v-model.trim="usernameInput">
      <br>
      <!-- If errors array in data includes the missing password error, give the <label> tag a class="error" attribute. -->
      <label for="password" :class="(errors.includes(passwordEmpty) || errors.includes(passwordInvalid)) ? 'error' : null">{{passwordLabel}}</label>
      <input name="password" type="password" v-model="password">
      <br>
      <input class="button" type="submit" :value="login" :disabled="!bothFieldsFilled">

    </form>
    
  </div>
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Import the Login.js interface from services folder. We need to access its methods here. See comments in Login.js for info about
    what it does */
import Login from '@/services/Login'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Login',
  data () {
    return {
      // Properties of this Vue component. All labels & messages are automatically on page load if userLang !== 'en'
      loginMessage: "Enter your username and password below, then click the Login button",
      usernameLabel: "Username: ",
      passwordLabel: "Password: ",
      login: "Login",
      usernameInput: null, /* Automatically assumes the value input in the username field, using Vue 'v-model' directive (see HTML template above) */
      password: null, /* Automatically assumes the value input in the password field, using Vue 'v-model' directive (see HTML template above) */
      errors: [], /* The "v-if" & "v-for" directives in the HTML template will render error prompts on screen, based on strings pushed to this array by the checkInput method */
      correctionLabel: "Correct the following:",
      usernameEmpty: "Enter your username",
      usernameInvalid: "Invalid username",
      passwordEmpty: "Enter your password",
      passwordInvalid: "The password entered is not a valid password",
      userNotFound: "The username provided does not have a registered account",
      passwordRejected: "Incorrect password for the username provided",
      generalError: "Login failed! Check your input and try again",
      /* usernameRegex is used in checkInput method to test whether input in username contains only letters, digits & underscores */
      usernameRegex: /^[a-zA-Z0-9_]*$/,
      /* passwordRegex tests whether a string: is at least 8 characters long, has at least 1 uppercase letter, at least 1 lowercase letter, at least 1 number and at least 
        1 symbol */
      passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: {
    ...mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),

    // bothFieldsFilled is used to disable the login button until both username and password fields have input
    bothFieldsFilled: function () {
      return this.usernameInput && this.password;
    },
  },

  // Methods of this Vue component
  methods: {

    translate(outputLang) {

      // Iterate through the properties of this component's data object
      for (const[key, value] of Object.entries(this.$data)) {
        // If the value assigned to a property is a string
        if (typeof value === "string") {
          // Translate that string
          Translate.translate({text: this.$data[key], target: outputLang})
          .then(response => this.$data[key] = response.data.translatedText)
          .catch(error => console.log(error));
        }
      }
    },

    /* Method to check both form fields have something entered into them. Triggered when login button is clicked; in the template above, see the opening <form> tag & the last
    <input> tag with submit attribute */
    checkInput: function (e) {

      let usernameValid = this.usernameInput && this.usernameRegex.test(this.usernameInput);
      let passwordValid = this.password && this.passwordRegex.test(this.password);

      // If both fields hold values, use the sendLogin method (defined below) to HTTP POST the user credentials to backend server
      if (this.bothFieldsFilled) {
        // this.sendLogin();
        if (usernameValid && passwordValid) {
          this.sendLogin();
        }
      }

      /* If execution reaches here, username or password (or both) field(s) is blank
        Clear any error messages that may be in the array from previous form checking */
      this.errors = [];

      if (!this.usernameInput) {
        this.errors.push(this.usernameEmpty);
      } else if (!usernameValid) {
        this.errors.push(this.usernameInvalid);
      }

      if (!this.password) {
        this.errors.push(this.passwordEmpty);
      } else if (!passwordValid) {
        this.errors.push(this.passwordInvalid);
      }

      // Prevent the form data being sent to server whilst there are data errors
      e.preventDefault();

    },

    /* Method called from checkInput method, when there are no errors in the form input
      Sends the input data to the backend server's /login route. See comments on server/src/routes/main.js */
    sendLogin () {
      Login.login({
        username: this.usernameInput,
        password: this.password,
        userType: this.userType})
      .then(response => {
        // If login successful
        if (response.data[0] === 'success') {
          // Change the username property of Vuex store's state object to the username input by user
          this.$store.commit('setUsername', this.usernameInput);
          if (response.data.length > 1 && !(response.data.includes('parent') || response.data.includes('tutor'))) {
            // Change the userId property of Vuex store's state object to the id of user's record in backend database
            this.$store.commit('setUserId', response.data[1]);
          }
          // Set the loggedIn state property to 'true' for conditional rendering
          this.$store.commit('setLoginStatus', true);
          /* Backend Express API checks whether the userType of the account record in db matches the userType selected by user on
            index page. If it doesn't, response data will contain the correct type of user for their account */
          if (response.data.length > 1 && (response.data.includes('parent') || response.data.includes('tutor'))) {
            // Change the userType of user logged in here at frontend to the correct type
            this.$store.commit('setUserType', response.data[1]);
            // Change the userId property of Vuex store's state object to the id of user's record in backend database
            this.$store.commit('setUserId', response.data[2]);
          }
          // Redirect to index
          this.$router.push('/');
        } else {
          this.errors = [];
          // Server will have returned the names of which error messages (in this Vue component's data properties) to display
          for (let anError of response.data) {
            // Don't display duplicate errors
            if (!this.errors.includes(anError)) {
              this.errors.push(this.$data[anError]);
            }
          }
        }
      });
    }
  },

  /* When an instance of Login component is created - i.e. the Vue router registers that a link has asked for the Login component from somebody clicking the login button on
    the Index page - if the userLang is not English, call the login method above to translate all text on our Login page */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }
  }
 
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#login{
  background-color:white ;
  padding-top: 50px;
  color: black;
}
h2 {
  color: black;
}
</style>
