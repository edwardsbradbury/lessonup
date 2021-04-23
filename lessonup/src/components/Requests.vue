<template>
  <div id="requests">

    <h2>{{browseRequests}}</h2>

    <!-- If the user is a parent, show them the form to create a new Request for help @newRequest is listening for a newRequest event emitted when NewRequest.vue successfully
        posts a new Request to the database. Event listener tells Requests.vue to update its array of Requests in allRequests -->
    <NewRequest v-if="userType === 'parent'" @newRequest="getAllRequests()" />

    <!-- Conditionally display error messages to the user if something went wrong fetching the Requests from backend -->
    <div v-if="errors.length" class="error">
      <ul style="list-style-type:none;">
        <li v-for="error in errors" :key="error">{{error}}</li>
      </ul>
    </div>
    
    <!-- If there are request messages retrieved from the databse, display them in tables -->
    <div id="allRequests" v-if="allRequests.length">

      <div v-for="aRequest in allRequests" class="request" :key="aRequest.requestId">

        <table>
          <caption>{{subjectLabel}}: {{aRequest.subject}}</caption>
          <!-- Give both whole columns classes for setting sizes with CSS -->
          <colgroup>
            <col class="request-labels">
            <col class="request-values">
          </colgroup>
          <thead>
            <tr>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{studyLevelLabel}}</td>
              <td>{{aRequest.studyLevel}}</td>
            </tr>
            <tr>  
              <td>{{dueByLabel}}</td>
              <td>{{formatDate(aRequest.dueDate)}}</td>
            </tr>
            <tr>
              <td>{{postedByLabel}}</td>
              <td>{{aRequest.username}}</td>
            </tr>
            <tr>
              <td>{{descriptionLabel}}</td>
              <td>{{aRequest.request}}</td>
            </tr>
            <tr>
              <td>{{datePostedLabel}}</td>
              <td>{{formatDate(aRequest.datePosted)}}</td>
            </tr>
            <tr>
              <td>{{timePostedLabel}}</td>
              <td>{{aRequest.timePosted}}</td>
            </tr>
            
              <button type="button" v-if="userType === 'tutor'" @click="reply(aRequest)">{{replyLabel}}</button>
                <button type="button" v-else-if="userType === 'parent' && username === aRequest.username" @click="deleteRequest(aRequest.requestId)">{{deleteLabel}}</button>
              
            
          </tbody>
        </table>

      </div>

    </div>

    <!-- If there are no Request messages retrieved from the database (either database is empty or query caused an error) -->
    <h2 v-else-if="!allRequests.length">
      {{noRequestsMessage}}
    </h2>

  </div>
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Import the interface for communicating with the Request message related server routes/endpoints (fetching/deleting data from db) */
import Requests from '@/services/Requests'
/* Import the NewRequest.vue component which is a form and methods for creating a new Request message & posting to server */
import NewRequest from './NewRequest'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Requests',
  components: {NewRequest},
  data () {
    return {
      browseRequests: "All requests for help are listed below:",
      noRequests: false,
      noRequestsMessage: "Nobody has requested help yet",
      newRequestPosted: false,
      allRequests: [],
      postedByLabel: "Posted by:",
      datePostedLabel: "Posted on:",
      timePostedLabel: "Posted at:",
      subjectLabel: "Subject",
      studyLevelLabel: "Level of study:",
      dueByLabel: "Deadline:",
      descriptionLabel: "Description:",
      replyLabel: "Reply",
      deleteLabel: "Delete",
      confirmDeletion: "Are you sure you want to delete this request for help?",
      deletionFailed: "Could not delete your request",
      errors: [],
      generalError: "Failed to fetch the requests from database"
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),
  
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
        the Vue app - e.g. see line 165 */
    sessionTimedoutRedirect() {
      this.$store.commit('setTimedOut', true);
      this.$router.push('/');
    },

    // Method to retrieve all the help Requests from the database
    getAllRequests() {

      /* newRequestPosted is a control variable used to call getAllRequests (line 15) after a new Request has been posted to database
          (to get an updated list which includes the newly inserted Request) */
      this.newRequestPosted = false;

      Requests.getAllRequests()
      .then(response => {
        if (typeof response.data[0] === 'string') {
          if (response.data[0] === 'notAuthenticated') {
            this.sessionTimedoutRedirect();
          } else if (response.data[0] === 'noRequests') {
            this.noRequests = true;
          } else if (response.data[0] === 'generalError') {
            this.errors = [];
            this.errors.push(this.generalError);
            this.noRequests = true;
          }
        } else {
          this.allRequests = response.data;
          this.noRequests = false;
        }

      // If the userLang isn't English, translate any Request text data which is going to be displayed in browser
      if (this.allRequests.length) {
        for (const aRequest of this.allRequests) {
          for (let[key, value] of Object.entries(aRequest)) {
            const isOutputText = (key === 'subject' || key === 'studyLevel' || key === 'request');
            if (aRequest.language !== this.userLang && typeof value === 'string' && isOutputText) {
              Translate.translate({text: value, target: this.userLang})
              .then(response => aRequest[key] = response.data.translatedText)
              .catch(error => console.log(error));
            }
          }
        }
      }

      })
      .catch(error => console.log(error));
    },

    deleteRequest(requestId) {

      this.newRequestPosted = false;

      if (confirm(this.confirmDeletion)) {

        Requests.deleteRequest(requestId)
        .then(response => {
          if (response.data[0] === 'notAuthenticated') {
            // If user's login session at backend API server has expired
            this.sessionTimedoutRedirect();
          } else if (response.data[0] === 'deletionFailed') {
            this.errors = [];
            this.errors.push(this.deletionFailed);
          } else if (response.data[0] === 'success') {
            this.getAllRequests();
          }
        })
        .catch(error => console.log(error));
      }
    },

    /* The dates recorded in the Request object in the database have a bunch of superfluous data attached by default;
      we only want dd/mm/yyyy */
    formatDate(dateObject) {

      const unformattedDate = new Date(dateObject);
      const dayOfMonth = unformattedDate.getDate();
      const month = unformattedDate.getMonth() + 1;
      const year = unformattedDate.getFullYear();

      return `${dayOfMonth}/${month}/${year}`;
    },

    reply(request) {
      this.$store.commit('setRequestObject', request);
      this.$router.push('/messages');
    }

  },
  /* When an instance of Requests component is created - i.e. the Vue router registers that a link has asked for the Requests component from somebody
  clicking the Request help link from Menu.vue - if the userLang is not English, call the Translate method above to translate all text on our Requests page */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }

    // Fetch the help Requests from the database, if there are any
    this.getAllRequests();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
