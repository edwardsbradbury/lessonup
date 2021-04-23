<template>
  <div id="app">

    <!-- Display the Menu component -->
    <Menu />

    <!-- The <router-view> element is what makes the app work as a single page. When users click links, Vue's router fetches the code
      from the .vue component file at the file path (e.g. "/login") defined in src/routes/index.js. Then it inserts all of the code from the
      .vue component file into App.vue here -->
    <router-view />
      <div> <p>ja</p>
       </div>
     <div class="row" >
  <div class="column" >
    <h3 style="font-color: black;"> JOIN OUR NEWSLETTER TO LEARN MORE ABOUT US  </h3>
      <input type="text" id="Email" name="Email" placeholder="Your Email address">
    <input type="submit" value="Submit">
    <div class="container"  >
   <img id="book logo" src="./assets/book.png" alt=" Book logo">
   
  </div>

  <div class="flag"> 
    <img id="flag" src="./assets/flag.png" alt=" The location that the users currently at">
    </div> 

  </div>
</div> 

  </div>  

 

 
</template>

<script>

import {mapState} from 'vuex'
// Import the Vuex state store
import store from './vuex/store'

// Import the menu component to use
import Menu from './components/Menu'

export default {
  name: 'App',
  store: store,
  components: {Menu},
  data() {
    return {
 
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),

  // Watch says to watch a property in this component for changes and run a provided function when there is a change
  watch: {

    // If loggedIn property changes due to logout, perform the logout state mutation (see src/vuex/store.js line 55)
    loggedIn: function() {
      if (!this.loggedIn) {
        this.$store.commit('logout');
      }
    },

    /* If an HTTP request has been sent to our Express API and recieved a 'notAuthenticated' response (user's login session has expired)
      This might happen when user opens messages or requests components and the app tries to retrieve the messages or requests,
      or when the user tries to send or delete a request or a message */
    timedOut: function() {
      if (this.timedOut) {
        // Perform the logout state mutation (see src/vuex/store.js line 55)
        this.$store.commit('logout');
      }
    }
    
  },
}
</script>

<style>

#app {
  

      font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #ffffff;
  font-size: 30px;
  
    

}
h2 {
    text-align: center;
    
}
.navigation {
    top: 20px;
    right: 15px;
    font-size: 60px;
    padding-right:30px;
 
 
}
#branding {
    position: absolute;
    top: 40px;
    left: 15px;
    padding-left:15px;
    
}
#menu {
  display: grid;
  padding-top: 20vh;
   left:0 px;

   
}

#branding, .navigation {
  display: inline-block;
   position: absolute;

}

.navigation a {
  display: inline-block;
  padding-left: 0.5vw;
  padding-right: 0.5vw;
  color: black;
  font-size: 2vh;
  font-weight: bold;
  text-decoration: none;
  
  
}

.navigation a:hover {
  color: #62D2E4;
  
  
}

.navigation a:active {
  color: #04E4B9;
}

#current {
  border-bottom: 0.5vh solid #ffffff;
}

#current:hover {
  color: #ffffff;
}

#logo {
  max-height: 15vh;
  max-width: 18vw;

}

#languageSelector {
  margin: 1vh 1vw 1vh 1vw;
  text-align: center ;
}

select {
  border-radius: 8px;
}

.button {
  margin-top: 1.5vh;
}

button, .button {
  border-radius: 12px;
  border-style: none;
  font-size: 125%;
  padding: 2vh 1vw 2vh 1vw;
  background-color: #62D2E4;
  color: #ffffff;
  box-shadow: 1px 1px 5px black;
}

button:hover, .button:hover {
  background-color: #04E4B9;
}

:disabled {
  opacity: 0.8;
  box-shadow: none;
}

:disabled:hover {
  background-color: #62D2E4;
}

#userType {
  margin-top: 3vh;
  padding-bottom: 5vh;
  text-align: center;
}

#userType button {
  display: inline-block;
  margin-left: 0.75vw;
  margin-right: 0.75vw;
}

#access {
  margin: 3vh;
  padding-bottom: 5vh;
  text-align: center;
}

#access button {
  margin: 1vh 1vw 1vh 1vw;
  text-align: center;
}

li {
  display: default;
}

.error {
  background-color: #70809099;
  color: #800000;
  font-weight: bold;
}

.success {
  background-color: #70809099;
  color: #04E4B9;
  font-weight: bold;
}

#registerForm, #loginForm, #newRequest {
  padding-bottom: 5vh;
  text-align: center;
}
p {
  text-align: center;
  font-size: 30px;
}
input, textarea {
  margin: 0.5vh 0px 0.5vh 0px;
  border-radius: 8px;
}

textarea {
  min-width: 25vw;
  min-height: 25vh;
  max-width: 40vw;
  max-height: 40vh;
}

div.request {
  background-color: #ffffff !important;
  color: black !important;
  border-radius: 8px;
  opacity: 0.9;
  max-width: 50vw;
  margin-top: 2vh;
  margin-bottom: 2vh;
  margin-left: 25vw;
  margin-right: 25vw;
}

table {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  text-align: center;
  font-weight: bold;
  table-layout: fixed;
}

.request-labels {
  width: 15%;
  word-wrap: break-word;
}

.request-values {
  width: 85%;
  word-wrap: break-word;
}

table button {
  margin-top: 2vh;
}

div.conversation {
  background-color: #ffffff !important;
  color: black !important;
  border-radius: 8px;
  opacity: 0.9;
  max-width: 50vw;
  margin-top: 2vh;
  margin-bottom: 2vh;
  margin-left: 25vw;
  margin-right: 25vw;
}

div.conversation:hover {
  box-shadow: 1px 1px 5px black;
}

div.message {
  background-color: #ffffff !important;
  color: black !important;
  border-radius: 8px;
  opacity: 0.9;
  max-width: 50vw;
  /* margin-top: 2vh; */
  margin-bottom: 2vh;
  margin-left: 25vw;
  margin-right: 25vw;
}
.column {
  float: bottom;
  width: 100%;
  padding-top: 10vw;
  height: 15vh; 
  color: black;
  
  
}
div.container {
    float: right;
   
    
}

#flag{
  float: left;
  bottom:0
}
</style>
