<template>
  <div id="newRequest">
      
    <!-- If a new Request is successfully posted, show success message to user here -->
    <h3 v-if="success" class="success">{{sucessMessage}}</h3>

    <!-- Form to create a new Request for help -->
    <form id="newRequestForm" @submit="checkInput" action="" method="post">

      <!-- If input fails validation here or at the server or there's an error inserting the request in the database -->
      <div v-if="errors.length" class="error">
        <p>{{correctionLabel}}</p>
        <ul style="list-style-type:none;">
          <li v-for="error in errors" :key="error">{{error}}</li>
        </ul>
      </div>

       <!-- Conditionally add error class to input labels if there's an error in the input for that field - allows highlighting of the label -->
      <label for="subject" :class="(errors.includes(subjectEmpty) || errors.includes(subjectLength) || errors.includes(subjectInvalid)) ? 'error' : null">{{subjectLabel}}</label>
      <input name="subject" type="text" v-model.trim="subject" :placeholder="subjectPlaceholder">
      <br>
      <label for="studyLevel" :class="(errors.includes(studyLevelEmpty) || errors.includes(studyLevelLength) || errors.includes(studyLevelInvalid)) ? 'error' : null">{{studyLevelLabel}}</label>
      <input name="studyLevel" type="text" v-model.trim="studyLevel" :placeholder="studyLevelPlaceholder">
      <br>
      <label for="dueDate" :class="(errors.includes(dueDateEmpty) || errors.includes(dueDateInvalid)) ? 'error' : null">{{dueDateLabel}}</label>
      <input name="dueDate" type="date" :min="currentDate" v-model="dueDate">
      <br>
      <label for="requestText" :class="(errors.includes(requestEmpty) || errors.includes(requestLength)) ? 'error' : null">{{requestTextLabel}}</label>
      <br>
      <!-- Multi-line text input which takes up to 750 characters -->
      <textarea name="requestText" form="newRequestForm" maxlength="750" v-model.trim="request" :placeholder="requestPlaceholder">
      </textarea>
      <br>
      <label>{{charactersRemaining}}/750</label>
      <br>
      <!-- Disable the button if any input field is empty -->
      <input type="submit" class="button" :value="buttonLabel" :disabled="!allFieldsFilled">


    </form>

  </div>
  
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Import the Request.js interface from services. We need to use its method for sending new requests to the database via Express API */
import Requests from '@/services/Requests'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'NewRequest',
  data () {
    return {
      subjectLabel: "Subject of the homework: ",
      subjectPlaceholder: "e.g. maths, science, English, history",
      studyLevelLabel: "Level of study (or child's age): ",
      studyLevelPlaceholder: "e.g. key stage 2, year 8, GCSE, A-level",
      dueDateLabel: "Homework due date (dd/mm/yyyy): ",
      requestTextLabel: "Describe what you need help with: ",
      requestPlaceholder: "e.g. My son is stuck on his homework about quadratic equations",
      buttonLabel: "Request help",
      currentDate: this.getTodaysDate(),
      subject: null,
      studyLevel: null,
      dueDate: null,
      request: null,
      errors: [],
      correctionLabel: "Correct the following:",
      subjectEmpty: "Enter a subject",
      subjectLength: "Subject length must be longer than 3 characters long and a maximum of 30 characters ",
      subjectInvalid: "Subject can only contain letters and spaces",
      studyLevelEmpty: "Enter your child's level of study",
      studyLevelLength: "Study level should be at least 2 characters long and a maximum of 30 characters",
      studyLevelInvalid: "Study level can only contain letters, numbers and spaces",
      dueDateEmpty: "When should the homework be finishd by?",
      dueDateInvalid: "Homework cannot be due before today",
      requestEmpty: "Describe the homework you need help with",
      requestLength: "Description must be less than 750 characters long",
      subjectRegex: /^[a-zA-Z ]*$/,
      studyLevelRegex: /^[a-zA-Z0-9 ]*$/,
      generalError: "Your request could not be posted! Check your input and try again",
      success: false,
      sucessMessage: "Your request for help has been posted"
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: {

    ...mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),

    /* allFieldsFilled property used to control whether Request Help button is disabled or enabled (see line 37) and whether registration form should be  submitted to
      server (see line 215) */
    allFieldsFilled: function() {
      return (this.subject && this.studyLevel && this.dueDate && this.request) ? true : false;
    },

    // Used on line 34 to display how many characters the user can still enter in their Request description
    charactersRemaining: function() {
      if (this.request) {
        return 750 - this.request.length;
      } else {
        return 750;
      }
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

    /* When HTTP requests are sent to our Express API, the API routes use Passportjs authentication to check that the requesting
        user has a current login session. If they haven't (e.g. their session has timed-out), API sends the string 'notAuthenticated'
        in reponse and doesn't process the request data. We need to handle this 'notAuthenticated' response by logging user out of
        the Vue app - e.g. see line 282 */
    sessionTimedoutRedirect() {
      this.$store.commit('setTimedOut', true);
      this.$router.push('/');
    },

    /* Method to get the current data, as a string in the format 'yyyy-mm-dd'. Used to set the minimum date on the dueDate input field and
        to verify (since somebody could still set an invalid date using devtools) the dueDate input in checkInput method below */
    getTodaysDate() {

      const dateObject = new Date();
      const todaysYear = dateObject.getFullYear();
      // Months are helpfully 0-indexed (range from 0-11) so have to add 1 to get correct number
      let todaysMonth = dateObject.getMonth()  + 1;
      let todaysDate = dateObject.getDate();

      // Make the month and date double digits if less than 10
      if (todaysMonth < 10) {
        todaysMonth = `0${todaysMonth}`;
      }

      if (todaysDate < 10) {
        todaysDate = `0${todaysDate}`;
      }

      // Return date as string: 'yyyy-mm-dd'
      return `${todaysYear}-${todaysMonth}-${todaysDate}`;

    },

    // Need to format timestamps to include with the Request record in the database at the backend - needs to be in format hh:mm:ss
    getTimeStamp() {

      const dateObject = new Date();
      
      let currentHour = dateObject.getHours();
      let currentMinute = dateObject.getMinutes();
      let currentSecond = dateObject.getSeconds();

      /* Javascript's Date().getHours/getMinutes/getSeconds methods will return single digit values if the hour/second/minute is less than 10.
        Need to prefix single digits with a 0 so the database accepts them & also so Requests.vue can compare times they were posted when it
        displays all of the requests */
      if (currentHour < 10) {
        currentHour = `0${currentHour}`;
      }

      if (currentMinute < 10) {
        currentMinute = `0${currentMinute}`;
      }

      if (currentSecond < 10) {
        currentSecond = `0${currentSecond}`;
      }

      return `${currentHour}:${currentMinute}:${currentSecond}`;

    },

    /* Input validation for the new request form. Very similar to registration & login components' checkInput methods */
    checkInput: function (e) {

      /* this.success controls whether the message on line 5 is displayed as confirmation of a Request sucessfully being posted.
          Somebody trying to create another request after successfully sending one will still see the success message if not reset to false */
      this.success = false;

      const subjectLength = this.subject && !(this.subject.length < 3 || this.subject.length > 30);
      const subjectValid = subjectLength && this.subjectRegex.test(this.subject);
      const studyLevelLength = this.studyLevel && !(this.studyLevel.length < 2 || this.studyLevel.length > 30);
      const studyLevelValid = studyLevelLength && this.studyLevelRegex.test(this.studyLevel);
      const today = new Date(this.currentDate);
      today.setHours(0, 0, 0, 0);
      const formattedDueDate = new Date(this.dueDate);
      const dueDateValid = !(formattedDueDate < today);
      const requestValid = this.request && !(this.request.length > 750);
      const allFieldsValid = (subjectLength && subjectValid && studyLevelLength && studyLevelValid && dueDateValid && requestValid) ? true : false;
      
      // If all fields have input & all input is valid
      if (this.allFieldsFilled) {
        if (allFieldsValid) {
          // Send the new Request to the database via our Express API
          this.postRequest();
        }
      }

      // Execution only reaches here if some input failed validation. Clear out any errors in the array from previous clicks on submit button
      this.errors = [];

      if (!this.subject) {
        this.errors.push(this.subjectEmpty);
      } else if (this.subject.length < 3 || this.subject.length > 30) {
        this.errors.push(this.subjectLength);
      }

      if (!subjectValid) {
        this.errors.push(this.subjectInvalid);
      }

      if (!this.studyLevel) {
        this.errors.push(this.studyLevelEmpty);
      } else if (this.studyLevel.length < 2 || this.studyLevel.length > 30) {
        this.errors.push(this.studyLevelLength);
      }

      if (!studyLevelValid) {
        this.errors.push(this.studyLevelInvalid);
      }

      if (!this.dueDate) {
        this.errors.push(this.dueDateEmpty);
      }

      if (!dueDateValid) {
        this.errors.push(this.dueDateInvalid);
      }

      if (!this.request) {
        this.errors.push(this.requestEmpty);
      }

      if (this.request.length > 750) {
        this.errors.push(this.requestLength);
      }

      e.preventDefault();

    },

    // Post the help request to the lessonup Express API to save in MySQL database
    postRequest: function() {
      Requests.newRequest({
        userId: this.userId,
        username: this.username,
        userLang: this.userLang,
        subject: this.subject,
        studyLevel: this.studyLevel,
        dueDate: this.dueDate,
        request: this.request,
        datePosted: this.getTodaysDate(),
        timePosted: this.getTimeStamp()
      })
      .then(response => {
        if (response.data[0] === 'notAuthenticated') {
          this.sessionTimedoutRedirect();
        } else if (response.data[0] === 'success') {
          /* emitting a newRequest event tells the parent component Requests.vue to fetch an updated list of requests
            (including the one just posted), which will be re-rendered in browser */
          this.$emit('newRequest');
          // this.success displays the confirmation message on line 5
          this.success = true;
          // Empty all the form input fields
          this.subject = null;
          this.studyLevel = null;
          this.dueDate = null;
          this.request = null;
        } else {
          // Failed to create new record in the database (probably due to failed input validation at backend)
          this.errors = [];
          // Server will have returned the names of which error messages (in this Vue component's data properties) to display
          for (let anError of response.data) {
            // Don't display duplicate errors
            if (!this.errors.includes(anError)) {
              this.errors.push(this.$data[anError]);
            }
          }
        }
      })
      .catch(error => console.log(error));;
    }

  },
  /* When an instance of NewRequest component is created - i.e. when the Requests component (parent of NewRequest) is loaded
    if the userLang is not English, call the Translate method above to translate all text on our NewRequest form */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
