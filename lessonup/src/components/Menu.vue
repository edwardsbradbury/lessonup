<template>
  <div id="menu">

    <!-- Logo and home button -->
    <div id="branding">
      <router-link to="/" @click="updateState()">
        <img id="logo" src="../assets/logo.png" alt="Lesson Up logo">
      </router-link>
    </div>

    <!-- Navigation options -->
    <div class="navigation" >

      <!-- When somebody first visits the URL, they won't be logged in or have chosen whether they are a parent or tutor
          Index.vue component already has dedicated login & register buttons, so the only link we need to show is FAQ -->
      <div v-if="!loggedIn && !userType">
        <router-link to="/faq" :id="$route.name === 'FAQ' ? 'current' : null ">F.A.Q</router-link>
      </div>

      <!-- User has chosen whether they're a parent or tutor but is still on Index, so only sees FAQ link -->
      <div v-else-if="userType && !loggedIn && $route.name === 'Index'">
        <router-link to="/faq">F.A.Q</router-link>
      </div>

      <!-- User is not logged in but has chosen userType & is on either Login, Register or FAQ page -->
      <div v-else-if="userType && !loggedIn && $route.name !== 'Index'">
        <router-link to="/login" :id="$route.name === 'Login' ? 'current' : null ">{{login}}</router-link>
        <router-link to="/register" :id="$route.name === 'Register' ? 'current' : null ">{{register}}</router-link>
        <router-link to="/faq" :id="$route.name === 'FAQ' ? 'current' : null ">F.A.Q</router-link>
      </div>

      <!-- Links shown to users who are logged in -->
      <div v-else-if="loggedIn">
        <router-link to="/faq" :id="$route.name === 'FAQ' ? 'current' : null ">F.A.Q</router-link>
        <router-link to="/" @click="updateState()" :id="$route.name === 'Index' ? 'current' : null ">{{changeLang}}</router-link>
        <router-link to="/requests" @click="updateState()" :id="$route.name === 'Requests' ? 'current' : null ">{{requests}}</router-link>
        <router-link to="/messages" @click="updateState()" :id="$route.name === 'Messages' ? 'current' : null ">{{messages}}</router-link>
        <router-link @click.native="logout" to="/">{{logoutLabel}}</router-link>
      </div>
    </div>

  </div>
</template>

<script>
import {mapState} from 'vuex'
import Api from '@/services/Api'
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: 'Menu',
  data () {
    return {
      login: "Login",
      register: "Register",
      changeLang: "Change language",
      requests: "Request help",
      messages: "Messages",
      logoutLabel: "Logout"
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

    /* State management when user switches to a different component (e.g. home/requests/mesages) of the app using the menu links. Whichever component was
      currently rendered - in the <router-view> in App.vue - at the time the user clicked a menu link, it will have been conditionally rendering certain
      elements and hiding others, based on the values of the state properties in the Vuex store at the time. E.g. if user had been viewing requests & clicked
      a reply button, then Messages.vue will have been rendered to show the request for help they were replying to and a NewMessage.vue form. The user has then
      used the menu to navigate away from Messages & NewMessage. We want the state store property to forget that it was in 'reply to a request for help' mode.
      Otherwise, if the user navigates back to messages hoping to see their conversations, instead they're going to see a request for help and a NewMessage
      form and it's not necessarily obvious they need to click 'cancel' to see an overview of all conversations */
    updateState() {
      this.$store.commit('mode', 'conversations');
      this.$store.commit('setRequestObject', null);
      this.$store.commit('currentConvo', null);
    },

    // When user logs out, reset these properties of the root App.vue component (& props of other components)
    logout() {
      this.$store.commit('setLoginStatus', false);
      Api().get('logout');
    }

  },
  // Watch data properties for changes and run this code if something changes
  watch: {

    // If userLang changes
    userLang: function () {
      // Translate the menu labels
      this.translate(this.userLang);
    },

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

