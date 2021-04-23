<template>
  <div id="conversation">

    <!-- If the Vuex state store property requestObject has an object assigned* to it (otherwise its value is null),
    current user is a tutor who wants to reply to a parent's request for help.  (*see Requests.vue lines 64 & 232) -->
    <div v-if="requestObject" class="request">

        <!-- Display data from that request object (a parent's request for help) in a table -->
        <table>
          <caption>{{subjectLabel}}: {{requestObject.subject}}</caption>
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
              <td>{{requestObject.studyLevel}}</td>
            </tr>
            <tr>  
              <td>{{dueByLabel}}</td>
              <td>{{formatDate(requestObject.dueDate)}}</td>
            </tr>
            <tr>
              <td>{{postedByLabel}}</td>
              <td>{{requestObject.username}}</td>
            </tr>
            <tr>
              <td>{{descriptionLabel}}</td>
              <td>{{requestObject.request}}</td>
            </tr>
            <tr>
              <td>{{datePostedLabel}}</td>
              <td>{{formatDate(requestObject.datePosted)}}</td>
            </tr>
            <tr>
              <td>{{timePostedLabel}}</td>
              <td>{{requestObject.timePosted}}</td>
            </tr>
          </tbody>
        </table>

        <!-- Display the NewMessage form so the tutor can type and send a reply to the request for help.
            requestId, recipient & firstReply are props used by the newMessage form, so it can tell our database which request the reply relates to and
            who the message is for (i.e. the parent who requested help).

            @newMessage is a listener for newMessage events emitted from inside the NewMessage.vue sendMessage() method (line 210). When a newMessage
            event is detected, run the getMessages() method defined from line 182 of this file.-->
        <NewMessage @newMessage="getMessages(requestObject.requestId)" :requestId="requestObject.requestId" :recipient="requestObject.username" :firstReply="true"/>

      </div>

      <!-- If no requestObject was passed as a prop when Conversation.vue as rendered but the messages property contains objects -->
      <div v-else-if="messages.length">

        <!-- Diplay the newMessage form, passing it  -->
        <!-- <NewMessage @cancel="$emit('messagesMode', 'conversations')" @newMessage="getMessages(messages[0].requestId)" :userLang="userLang" :loggedIn="loggedIn" :userType="userType" :username="username" :userId="userId" :requestId="conversation[0].requestId" :recipient="getRecipient()" :firstReply="false"/> -->
        <NewMessage @newMessage="getMessages(messages[0].requestId)" :requestId="currentConvo[0].requestId" :recipient="getRecipient()" :firstReply="false"/>
        
        <!-- If something went wrong trying to send or delete a message in the current conversation -->
        <div v-if="errors.length" class="error">
          <ul style="list-style-type:none;">
            <li v-for="error in errors" :key="error">{{error}}</li>
          </ul>
        </div>
        
        <!-- Display the messages in tables -->
        <div v-for="aMessage in messages" class="message" :key="aMessage.messageId">

          <table>
            <caption>{{aMessage.sender}} {{aMessage.timeSent}} {{formatDate(aMessage.dateSent)}}</caption>
            <tr>
              <td>{{aMessage.message}}</td>
            </tr>
            <tr v-if="username === aMessage.sender">
              <td>
                <button type="button" @click="deleteMessage(aMessage.messageId)">{{deleteLabel}}</button>
              </td>
            </tr>
          </table>

        </div>

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
/* Import the NewMessage.vue component which is a form and methods for creating a new Message & posting to server */
import NewMessage from './NewMessage'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Conversation',
  components: {NewMessage},
  data () {
    return {
      subjectLabel: "Subject",
      messages: [],
      errors: [],
      generalError: "Failed to get messages",
      deleteLabel: "Delete",
      confirmDeletion: "Are you sure you want to delete this message? Message will also be deleted for the recipient",
      deletionFailed: "Failed to delete your message"
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut', 'requestObject', 'currentConvo']),
  
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
        the Vue app - e.g. see line 182 below */
    sessionTimedoutRedirect() {
      this.$store.commit('setTimedOut', true);
      this.$router.push('/');
    },

    /* Using the array Conversations (passed as prop from Messages.vue) instead of Conversation.vue's message property because want to
      be able to sort Coneversation.vue's messages property to show most recent messages at top. But getRecipient needs to work with the very
      earliest (chronologically) message in the conversation */
    getRecipient() {
      if (this.userType === 'parent') {
        // return this.conversation[0].sender;
        return this.currentConvo[0].sender;
      } else {
        // return this.conversation[0].recipient;
        return this.currentConvo[0].recipient;
      }
    },

    // Used to make dates look tidy in the tables rendered for displaying messages
    formatDate(dateObject) {

      const unformattedDate = new Date(dateObject);
      const dayOfMonth = unformattedDate.getDate();
      const month = unformattedDate.getMonth() + 1;
      const year = unformattedDate.getFullYear();

      return `${dayOfMonth}/${month}/${year}`;
    },

    // After a new message is added to a Conversation, re-fetch the array of messages in the conversation (updated to include the one just sent)
    getMessages(requestId) {

      Messages.getMessages(this.username, requestId)
      .then(response => {
        if (response.data[0] === 'notAuthenticated') {
          this.sessionTimedoutRedirect();
        } else if (response.data[0] === 'generalError' || response.data[0] === 'noMessages') {
          this.errors = [];
          this.errors.push(this.generalError)
        } else {
          this.messages = response.data;
          this.$emit('newMessage');

          // Translate the message text if the message's language property doesn't match the app's userLang
          this.messages.forEach(aMessage => {
            if (aMessage.language !== this.userLang) {
              Translate.translate({
                text: aMessage.message,
                target: this.userLang
              })
              .then(response => aMessage.message = response.data.translatedText)
              .catch(error => console.log(error))
            }
          })

        }
        /* Sort the array of messages in this conversation so newest message is first (when rendered on page, newest message
          will be at the top and oldest message at the bottom) */
        this.messages.reverse();
      })
      .catch(error => console.log(error))
    },

    // Method to delete a message from the conversation, then call this.getMessages() to display updated list of messages
    deleteMessage(messageId) {

      /* Confirm is a built in JS method; creates a dialogue box (pop-up) with cancel & ok buttons. Messages.deleteMessage() is only called if
          the user clicked ok */
      if (confirm(this.confirmDeletion)) {
        Messages.deleteMessage(messageId)
        .then(response => {
          if (response.data[0] === 'notAuthenticated') {
            this.sessionTimedoutRedirect();
          } else if (response.data[0] === 'deletionFailed') {
            this.errors = [];
            this.errors.push(this.deletionFailed);
          } else {
            this.getMessages(this.messages[0].requestId);
            this.$emit('newMessage');
          }
        })
        .catch(error => console.log(error))
      }
    }

  },

  /* When an instance of this component is created - i.e. the Vue router registers that a link has asked for this component
    - if the userLang is not English, call the Translate method above to translate all text on this page */
  created () {
    if (this.userLang !== 'en') {
      this.translate(this.userLang);
    }

    if (this.currentConvo) {
      /* Deep clone the currentConvo (which is a reference to Messages.vue conversations[0]). We can't just do this.messages = this.currentConvo
        because then calling reverse on messages would reverse Messages.vue conversations[0], causing the conversation overview tables to sometimes
        show the wrong sender & time */
      this.messages = this.currentConvo.map(aMessage => ({...aMessage}));
      /* Sort the array of messages in this conversation so newest message is first (when rendered on page, newest message
      will be at the top and oldest message at the bottom) */
      this.messages.reverse();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
