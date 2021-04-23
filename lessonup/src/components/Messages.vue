<template>
  <div id="messages">
      
      <!-- Create a Conversation.vue component here if requestObject property in Vuex store was assigned an object
          at the time that Messages.vue was rendered. If a new message is sent, update the conversations array -->
      <Conversation v-if="requestObject" @newMessage="getConversations()" />
      
      <!-- If there was no requestObject (user isn't a tutor trying to reply and offer help) and the user has no conversations -->
      <div v-else-if="!requestObject && !conversations.length">
        
        <h2>{{noConversations}}</h2>
        <br>
        <!-- Conditionally display error messages to the user if something went wrong fetching the Conversations from backend -->
        <div v-if="errors.length" class="error">
          <ul style="list-style-type:none;">
            <li v-for="error in errors" :key="error">{{error}}</li>
          </ul>
        </div>

      </div>

      <!-- How Messages.vue should be displayed if the mode property in state store  = conversations (display an overview of the user's ongoing
          conversations, rather than the messages within a given conversation) -->
      <div v-else-if="mode === 'conversations'">

        <h2>{{conversationsLabel}}</h2>

        <div v-for="aConversation in conversations" class="conversation" :key="aConversation.requestId" @click="addToConversation(aConversation)">
          
          <table>
            <!-- If the user is a parent, display the name of the tutor who first replied to a particular help request and display date/time of most recent message -->
            <caption v-if="userType === 'parent'">{{aConversation[0].sender}} {{aConversation[aConversation.length - 1].timeSent}} {{formatDate(aConversation[aConversation.length - 1].dateSent)}}</caption>
            <!-- If the user is a tutor, display the name of the parent whose help request the conversation is about and display date/time of most recent message -->
            <caption v-else>{{aConversation[0].recipient}} {{aConversation[aConversation.length - 1].timeSent}} {{formatDate(aConversation[aConversation.length - 1].dateSent)}}</caption>
            <tr>
              <!-- The actual text of the most recent message -->
              <td>{{aConversation[aConversation.length - 1].message}}</td>
            </tr>
          </table>

        </div>
      
      </div>

      <!-- How Messages.vue should be displayed if the mode property in state store  = messages (display all the messages in the current conversation) -->
      <div v-else-if="mode === 'messages'">
        <Conversation @newMessage="getConversations()" />
      </div>

  </div>
</template>

<script>

import {mapState} from 'vuex'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Import interface from Messages.js for retrieving/sending/deleting messages */
import Messages from '@/services/Messages'
/* Import the Conversation.vue component which organises the messages related to a given conversation & has methods for sending new messages */
import Conversation from './Conversation'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Messages',
  components: {Conversation},
  data () {
    return {
      noConversations: "You have not started any conversations",
      conversationsLabel: "These are your conversations. Click or tap a conversation to see all messages and reply to the conversation",
      postedByLabel: "Posted by",
      datePostedLabel: "Posted on",
      timePostedLabel: "Posted at",
      subjectLabel: "Subject",
      studyLevelLabel: "Level of study",
      dueByLabel: "Deadline",
      descriptionLabel: "Description",
      conversations: [],
      generalError: "Failed to get messages",
      errors: [],
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut', 'mode', 'requestObject']),
  
  // Methods of this Vue component
  methods: {

    translate(outputLang) {

      // Iterate through the properties of this component's data object
      for (const[key, value] of Object.entries(this.$data)) {
        // If the value assigned to a property is a string
        if (typeof value === "string" && key !== 'mode') {
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
        the Vue app - e.g. see line 126 below */
    sessionTimedoutRedirect() {
      this.$store.commit('setTimedOut', true);
      this.$router.push('/');
    },

    /* Method to get a user's conversations (i.e. arrays of message objects related to a given help request, with the current user as
      either sender or recipient) */
    getConversations() {

      Messages.getConversations(this.username)
      .then(response => {
        if (response.data[0] === 'notAuthenticated') {
          this.sessionTimedoutRedirect();
        } else if (response.data[0] === 'generalError') {
          // Something went wrong trying to get the messages from the database and return from our Express API
          this.errors = [];
          this.errors.push(this.generalError);
        } else if (response.data[0] !== 'noMessages') {
          this.conversations = response.data;
          if (this.conversations.length) {
            /* Take each sub-array (i.e. a conversation) in this component's conversations propety and translate its messages
              if either the current user's languge isn't English (user is probably a parent) or if user's language is English but some
              messages aren't in English (user is probably a tutor) */
            this.conversations.forEach(aConversation => {
              this.translateConversation(aConversation);
            })
          }
        }
      })
      .catch(error => console.log(error))
    },

    // JS Date objects are unnecessarily long - we want to show a concise date that most recent message in conversation was sent
    formatDate(dateObject) {

      const unformattedDate = new Date(dateObject);
      const dayOfMonth = unformattedDate.getDate();
      const month = unformattedDate.getMonth() + 1;
      const year = unformattedDate.getFullYear();

      return `${dayOfMonth}/${month}/${year}`;
    },

    /* Translate the messages in a conversation if either current user's language isn't English (probably user is a parent) or
    if userLang is English but some messages in the conversation are not in English (most likely user is a tutor) */
    translateConversation(aConversation) {

      aConversation.forEach(aMessage => {
        if (aMessage.language !== this.userLang) {
          Translate.translate({
            text: aMessage.message,
            target: this.userLang
          })
          .then(response => aMessage.message = response.data.translatedText)
          .catch(error => console.log(error))
        }
      })

    },

    addToConversation(aConversation) {
      this.$store.commit('setCurrentConvo', aConversation);
      this.$store.commit('setMode', 'messages');
    }

  },

  /* When an instance of Login component is created - i.e. the Vue router registers that a link has asked for the Login component from somebody clicking the login button on
    the Index page - if the userLang is not English, call the login method above to translate all text on our Login page */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }

    this.getConversations();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
