<template>
  <div class="newMessage">

    <!-- Form for creating a new message, with back/cancel and send buttons -->
    <form id="newMessageForm" @submit="checkInput" action="" method="post">

      <!-- If something went wrong with trying to send or delete a message, show an error message to user here -->
      <div v-if="errors.length" class="error">
        <ul style="list-style-type:none;">
          <li v-for="error in errors" :key="error">{{error}}</li>
        </ul>
      </div>

      <!-- The text input field, with a maximum input length of 500 characters & a placeholder showing example text
        until something is typed in the field (placeholder disappears) -->
      <textarea form="newMessageForm" v-model.trim="message" maxlength="500" :placeholder="messagePlaceholder"></textarea>
      <br>
      <button type="button" @click="cancel">{{firstReply ? cancelButton : backButton}}</button>
      <input class="button" type="submit" :value="sendButton" :disabled="!message || message.length < 2">
      <br>
      <!-- Visual cue for how many characters the user has remaining -->
      <label>{{charactersRemaining}}/500</label>

    </form>

  </div>
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
// Import messages API for transmitting message data to/from backend API
import Messages from '@/services/Messages'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'NewMessage',
  /* Props are properties passed down from the parent component, which in this case is Conversation.vue (see lines 56 & 65).
  This helps us determine whether the user is replying to a request for the first time or is responding to an existing conversation */
  props: ['recipient', 'requestId', 'firstReply'],

  // Properties exclusive to this particular component
  data () {
    return {
      cancelButton: "Cancel",
      backButton: "Back",
      sendButton: "Send",
      messagePlaceholder: "Enter your message",
      message: null,
      errors: [],
      lengthError: "Message must be 2-500 characters long",
      generalError: "Message could not be sent. Check your input and try again",
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: {

    ...mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),

    // Used on line 22 to display how many characters the user can still enter in their Request description
    charactersRemaining: function() {
      if (this.message) {
        return 500 - this.message.length;
      } else {
        return 500;
      }
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

    /* When HTTP requests are sent to our Express API, the API routes use Passportjs authentication to check that the requesting
        user has a current login session. If they haven't (e.g. their session has timed-out), API sends the string 'notAuthenticated'
        in reponse and doesn't process the request data. We need to handle this 'notAuthenticated' response by logging user out of
        the Vue app - e.g. see line 204 */
    sessionTimedoutRedirect() {
      this.$store.commit('setTimedOut', true);
      this.$router.push('/');
    },

    /* If user clicks the cancel button in the NewMessage form, return them to where they were in the app before and update the state
      properties so that the component renders as expected next time it's rendered */
    cancel() {
      if (this.firstReply) {
        this.$store.commit('setRequestObject', null);
        this.$router.push('/requests');
      } else {
        this.$store.commit('setRequestObject', null);
        this.$store.commit('setCurrentConvo', null);
        this.$store.commit('setMode','conversations');
      }
    },

    /* Method to get the current date, as a string in the format 'yyyy-mm-dd'. Messages.vue component (parent of NewMessage) will use
       the sent date to sort messages before displaying them */
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

    // Need to format timestamps to include with the Message record in the database at the backend - needs to be in format hh:mm:ss
    getTimeStamp() {

      const dateObject = new Date();
      
      let currentHour = dateObject.getHours();
      let currentMinute = dateObject.getMinutes();
      let currentSecond = dateObject.getSeconds();

      /* Javascript's Date().getHours/getMinutes/getSeconds methods will return single digit values if the hour/second/minute is less than 10.
        Need to prefix single digits with a 0 so the database accepts them & also so Messages.vue can compare times they were sent when it
        displays the conversation */
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

    // Input validation
    checkInput: function(e) {

      if (this.message && !(this.message.length < 2 || this.message.length > 500)) {
        this.sendMessage();
      }

      this.errors = [];

      if (!this.message) {
        this.errors.push(this.messagePlaceholder);
      } else if (this.message.length < 2 || this.message.length > 500) {
        this.errors.push(this.lengthError);
      }

      // Stop the HTTP POST request being submitted to the server because the input is invalid
      e.preventDefault();

    },

    sendMessage() {

      Messages.newMessage({
        requestId: this.requestId,
        userLang: this.userLang,
        sender: this.username,
        recipient: this.recipient,
        message: this.message,
        dateSent: this.getTodaysDate(),
        timeSent: this.getTimeStamp()

      })
      .then(response => {
        if (response.data[0] === 'notAuthenticated') {
          this.sessionTimedoutRedirect();
        } else if (response.data[0] === 'success') {
          /* emitting a newMessage event tells the parent component Messages.vue to fetch an updated list of messages
            (including the one just sent), which will be re-rendered in browser */
          this.message = null;
          this.firstReply = false;
          this.$emit('newMessage');
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
      .catch(error => console.log(error))

    }

  },
  /* When an instance of NewMessage component is created - i.e. when the Messages (parent of NewMessage) component is loaded
    - if the userLang is not English, call the Translate method above to translate all text on our NewMessage form */
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
