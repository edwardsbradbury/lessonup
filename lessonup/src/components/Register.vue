<template>
  <div id="register">
    
    <p>
      {{namePrompt}}
      <br>
      {{passwordPrompt}}
    </p>

    <!-- Run the checkInput method (defined below, line 161) when Register button is clicked. Method will block data being
        sent to the server whilst there are errors (line 241) -->
    <form id="registerForm" @submit="checkInput" action="" method="post">

      <!-- Conditionally display error messages to the user if input data missing or incorrectly formatted -->
      <div v-if="errors.length" class="error">
        <p>{{correctionLabel}}</p>
        <ul style="list-style-type:none;">
          <li v-for="error in errors" :key="error">{{error}}</li>
        </ul>
      </div>

      <!-- If errors array in data includes the missing first name error or first name invalid error, give the <label> tag a class="error" attribute.
          This will turn the label text colour to red (.error selector has CSS rule in App.vue) -->
      <label for="first" :class="(errors.includes(firstNameEmpty) || errors.includes(firstNameInvalid)) ? 'error' : null">{{firstLabel}}</label>
      <input type="text" name="first" placeholder="e.g. Katarzyna" v-model.trim="first">
      <br>
      <!-- Give the 'last' label a class='error' attribute if no name entered or input contains anything other than letters and hyphens -->
      <label for="last" :class="(errors.includes(lastNameEmpty) || errors.includes(lastNameInvalid)) ? 'error' : null">{{lastLabel}}</label>
      <input type="text" name="last" placeholder="e.g. Nowak" v-model.trim="last">
      <br>
      <!-- Give the 'age' label a class='error' attribute if no age entered or age < 18 -->
      <label for="age" :class="(errors.includes(ageEmpty) || errors.includes(ageInvalid)) ? 'error' : null">{{ageLabel}}</label>
      <input type="number" name="age" v-model.trim="age">
      <br>
      <!-- Give the 'username' label a class='error' attribute if no username entered or input contains anything other than letters, digits & underscores -->
      <label for="username" :class="(errors.includes(usernameEmpty) || errors.includes(usernameInvalid) || errors.includes(usernameDuplicate)) ? 'error' : null">{{usernameLabel}}</label>
      <input type="text" name="username" placeholder="e.g. knowak96" v-model.trim="usernameInput">
      <br>
      <!-- Give the 'email' label a class='error' attribute if no email or invalid email entered -->
      <label for="email" :class="(errors.includes(emailEmpty) || errors.includes(emailInvalid)) ? 'error' : null">{{emailLabel}}</label>
      <input type="text" name="email" placeholder="e.g. knowak96@gmail.com" v-model.trim="email">
      <br>
      <!-- Give the 'password' label a class='error' attribute if no password entered or password & confirm inputs don't match -->
      <label for="password" :class="(errors.includes(passwordEmpty) || errors.includes(passwordLength) || errors.includes(mismatchedPasswords)) ? 'error' : null">{{passwordLabel}}</label>
      <input type="password" name="password" v-model.trim="password">
      <br>
      <!-- Give the 'confirm' label a class='error' attribute if no password entered or password & confirm inputs don't match -->
      <label for="confPassword" :class="(errors.includes(confirmEmpty) || errors.includes(passwordLength) || errors.includes(mismatchedPasswords)) ? 'error' : null">{{confirmLabel}}</label>
      <input type="password" name="confPassword" v-model.trim="confirm">
      <br>
      <!-- Disable the Register button if not all input fields have values entered -->
      <input class="button" type="submit" :value="registerButton" :disabled="!allFieldsFilled">

    </form>

  </div>
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
// Import the Register.js interface from services. We will use its sendForm method to HTTP POST the form input data to our server
import Register from '@/services/Register'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Register',
  // Properties of this Vue component. All labels and messages automatically translated on page load, if userLang !== 'en'
  data () {
    return {
      namePrompt: "First and last name can only contain letters and hyphen - characters.",
      passwordPrompt: "Password must be 8-20 characters long, with at least 1 uppercase letter, at least 1 lowercase letter, at least 1 digit and at least 1 symbol.",
      agePrompt: "This app is for parents and tutors: age should be at least 18",
      firstLabel: "First name: ",
      lastLabel: "Last name: ",
      ageLabel: "Age: ",
      usernameLabel: "Username: ",
      emailLabel: "Email address: ",
      passwordLabel: "Password: ",
      confirmLabel: "Confirm password: ",
      registerButton: "Register",
      first: null,
      last: null,
      age: null,
      usernameInput: null,
      email: null,
      password: null,
      confirm: null,
      errors: [],
      correctionLabel: "Correct the following:",
      firstNameEmpty: "Enter your first name",
      lastNameEmpty: "Enter your last name",
      nameLength: "Names should be 2-30 characters long",
      firstNameInvalid: "First name can only contain letters and hyphens",
      lastNameInvalid: "Last name name can only contain letters and hyphens",
      ageEmpty: "Enter your age",
      ageInvalid: "Age must be a a whole number greater than or equal to 18",
      usernameEmpty: "Enter a username",
      usernameInvalid: "Username should be 8-25 characters long, containing only letters, numbers and underscores",
      usernameDuplicate: "There is already an account with the username you entered. Try a different username or log into your account",
      emailEmpty: "Enter an email address",
      emailInvalid: "Invalid email address",
      emailLength: "Email should be less than 100 characters long",
      passwordLength: "Password must be 8-20 characters long",
      passwordEmpty: "Enter a password",
      passwordStrength: "Password should contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 symbol",
      confirmEmpty: "Re-enter the password",
      mismatchedPasswords: "Passwords must match",
      generalError: "Registration failed! Check your input and try again",
      /* checkInput method below uses these regular expressions to check that the first & last name fields don't contain anything other than letters and hyphens and
        the email input matches an email address format pattern, i.e.
        <some letters and numbers> @ <some letters and numbers> . <some letters and numbers>*/
      nameRegEx: /^[a-zA-Z]+(-[a-zA-Z]+)*$/,
      usernameRegex: /^[a-zA-Z0-9_]*$/,
      emailRegEx: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
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
    ...mapState(['userLang', 'userType']),

    /* allFieldsFilled property used to control whether Register button is disabled or enabled (see line 52) and whether registration form should be  submitted to
      server (see line (174) */
    allFieldsFilled: function () {
      return (this.first && this.last && this.age && this.usernameInput && this.email && this.password && this.confirm) ? true : false;
    }

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

    /* Method to check all form fields have something entered into them. Triggered when register button is clicked; in the template above, see the opening <form> tag & the last
    <input> tag with submit attribute */
    checkInput: function (e) {

      let firstNameValid = this.first && (this.nameRegEx.test(this.first) && !(this.first.length < 2 || this.first.length > 30));
      let lastNameValid = this.last && (this.nameRegEx.test(this.last) && !(this.last.length < 2 || this.last.length > 30));
      let ageValid = this.age && !(this.age < 18);
      let usernameValid = this.usernameInput && (this.usernameRegex.test(this.usernameInput) && !(this.usernameInput.length < 8 || this.usernameInput.length > 25));
      let emailValid = this.email && (this.emailRegEx.test(this.email) && this.email.length < 101);
      let passwordValid = this.password && (this.passwordRegex.test(this.password) && !(this.password.length > 20));
      let confirmValid = this.confirm && (this.passwordRegex.test(this.confirm) && !(this.confirm.length > 20));
      let passwordsMatch = this.password && this.confirm && (this.password === this.confirm);
      let fieldsValid = (firstNameValid && lastNameValid && ageValid && usernameValid && passwordValid && confirmValid) ? true : false;

      // If all fields hold valid values, use the sendLogin method (defined below) to HTTP POST the user credentials to backend server
      if (this.allFieldsFilled) {
        if (fieldsValid && passwordsMatch) {
          this.register();
        }
      }

      /* If execution reaches here at least 1 input field's value is empty or invalid.
        Clear any error messages that may be in the array from previous form checking */
      this.errors = [];

      if (!this.first) {
        this.errors.push(this.firstNameEmpty);
      }

      if (!firstNameValid) {
        this.errors.push(this.firstNameInvalid);
      }
      
      if (!this.last) {
        this.errors.push(this.lastNameEmpty);
      }
      
      if (!lastNameValid) {
        this.errors.push(this.lastNameInvalid);
      }

      if (!this.age) {
        this.errors.push(this.ageEmpty);
      } else if (this.age < 18) {
        this.errors.push(this.ageInvalid);
      }

      if (!this.usernameInput) {
        this.errors.push(this.usernameEmpty);
      }

      if (!usernameValid) {
        this.errors.push(this.usernameInvalid);
      }
      
      if (!this.email) {
        this.errors.push(this.emailEmpty);
      }

      if (!emailValid) {
        this.errors.push(this.emailInvalid);
      }

      if (!this.password) {
        this.errors.push(this.passwordEmpty);
      } else if (this.password.length < 8 || this.password.length > 20) {
        this.errors.push(this.passwordLength);
      }

      if (!this.passwordRegex.test(this.password)) {
        this.errors.push(this.passwordStrength);
      }

      if (!this.confirm) {
        this.errors.push(this.confirmEmpty);
      }

      if (!passwordsMatch) {
        this.errors.push(this.mismatchedPasswords);
      }

      // Prevent the form being sent to server whilst there is invalid input
      e.preventDefault();

    },

    // Method to send registration form inputa data to our server
    register() {
      // Call the sendForm method from our Register.js interface file
      Register.sendForm({
        // It takes an argument 'formData', which is this JSON object
        first: this.first,
        last: this.last,
        age: this.age,
        username: this.usernameInput,
        email: this.email,
        password: this.password,
        confirm: this.confirm,
        userType: this.userType,
        userLang: this.userLang})
        // Check response from backend
      .then(response => {
        // If registration successful
        if (response.data[0] === 'success') {
          // Set the loggedIn status to 'true' for conditional rendering
          this.$store.commit('setLoginStatus', true);
          // Update the username & userId properties in Vuex state storage (useful for other components to have access to these)
          this.$store.commit('setUsername', this.usernameInput);
          this.$store.commit('setUserId', response.data[1]);
          // Redirect to index
          this.$router.push('/');
        } else {
          // Registration failed (probably due to failed input validation at backend)
          this.errors = [];
          // Server will have returned the names of which error messages (in this Vue component's data properties) to display
          for (let anError of response.data) {
            // Don't display duplicate errors
            if (!this.errors.includes(anError)) {
              this.errors.push(this.$data[anError]);
            }
          }
        }})
        .catch(error => console.log(error));
    }

  },
  /* When an instance of Register component is created - i.e. the Vue router registers that a link has asked for the Register component from somebody clicking the Register
    link in Menu - if the userLang is not English, call the Translate method above to translate all text on our Register page */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#register{
    /* background-color: teal; */
      padding-top: 20px;
      color:black;
      width:70%;
     text-align: center;
       margin: auto;

}

</style>
