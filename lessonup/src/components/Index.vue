<template>
  <div id="index">

    <div class='background' style="background-color: black;">
  
    <header>

      <!-- Welcome message -->
      <h2 >
        {{welcome}}
      </h2>
    

      <!-- Language dropdown selector -->
      <form id="languageSelector" name="languageSelector">
        <label for="languageDropdown">{{dropdownLabel}}</label>
        <!-- v-model binds the currently selected option to this component's selectedLanguage property (line 64).
            @change calls this component's setUserLang() method, defined on line 95 -->
        <select name="languageDropdown" v-model="selectedLanguage" @change="setUserLang()">
          <option v-for="language in languageList" :key="language.language" :value="language.language">
            {{language.name}}
          </option>
        </select>
      </form>

      <!-- Where the user chooses whether they want to use the app as a parent or a tutor
          This section only displayed to the user if they haven't chosen which type of user they are and aren't logged in -->
      <div id="userType" v-if="!userType && !loggedIn">
        <h3>{{userTypeMessage}}</h3>
        <!-- Clicking one of the buttons triggers this component's setUserType() method, defined on line 120 -->
        <p><button type="button" @click="setUserType('parent')" >{{parentLabel}}</button>  <button type="button" @click="setUserType('tutor')">{{tutorLabel}}</button></p>
      </div>
    
      <!-- v-if directive to only display login/register buttons if user isn't logged in but has chosen which type of user they are -->
      <div id="access" v-if="!loggedIn && userType">
        <router-link to="/login">
          <button type="button">{{login}}</button>
        </router-link>
        
        <router-link to="/register">
          <button type="button">{{register}}</button>
        </router-link>
      </div>
    </header>
      
          <!-- about section  -->
    </div>
        <div id="about">
          <p id="abouttext" style="color:black;">{{about}}</p> </div>
        <div id="numberone">
         
<!-- home pahe section with ullustration using displayinlone block to have it all in one line at 100% while making sure it is resposive while zooming in and out-->
        <div class="inline">
            <li style="width:60vw;color: black;"> <p>{{tutors}}</p></li>
            <li >   <img src="../assets/illustrationhome.png" alt="Illustration"></li>
        </div>
    </div>
                    <!-- home pag e image under text secntions-->
        <div class="backgroundslide">
             <div class="imagetext">
                 <h1>{{join}}</h1>
                  </div>
        </div>

            
            
        </div>

  

</template>

<script>

import {mapState} from 'vuex'

/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'

/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {

  name: 'Index',
  data () {
    return {
      /* Properties of this Vue component
        welcome, dropdownLabel, languageList, login & register are all automatically translated by the watch method
         when the userLang property is anything other than 'en' */
      welcome: "Welcome to LessonUp",
      about: "An app for parents whose native language is not English to get help for their childrens homework",
      tutors: "Tutors in England speaking over 21 languages",
      join: "JOIN US",
      dropdownLabel: 'Select language: ',
      languageList: [],
      selectedLanguage: 'en',
      userTypeMessage: 'Are you a:',
      parentLabel: 'Parent',
      tutorLabel: 'Tutor',
      login: 'Login',
      register: 'Register'
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),
  // Methods of this Vue component
  methods: {

    getLanguages(outputLang) {
      /* Populate the languageList property with an array of languages retrieved from Google Cloud Translate API, via the interface in
        src/services/Translate.js */
      return Translate.getLanguages(outputLang)
        .then(response => this.languageList = response.data)
        .catch(error => console.log(error))
    },

    /* Called when the language currently selected in the dropdown changes (see line 14).
    
      This method updates the userLang property in the Vuex state store (src/vuex/store.js) to the new language chosen by user.
      Since the Vuex store is a 'single source of truth' for the app and all components have userLang as a computed property,
      the userLang property in the vue components will change to reflect the new userLang value in store */
    setUserLang() {
      this.$store.commit('setUserLang', this.selectedLanguage);
    },

    translate(outputLang) {

      // Get the list of supported languages
      this.getLanguages(outputLang);

      // Iterate through the properties of this component's data object
      for (const[key, value] of Object.entries(this.$data)) {
        // If the value assigned to a property is a string
        if (typeof value === "string" && key !== "selectedLanguage") {
          // Translate that string
          Translate.translate({text: this.$data[key], target: outputLang})
          .then(response => this.$data[key] = response.data.translatedText)
          .catch(error => console.log(error));
        }
      }
    },

    /* Called when user clicks either the 'parent' or 'tutor' button (line 26) to say which type of user they are
    
      Updates the value of userType property in the Vuex state store (src/vuex/store.js). All components have userType as a computed
      property, which reacts to changes in the state store. */
    setUserType(userType) {
      this.$store.commit('setUserType', userType);
    }

  },
  
  // Watch component properties for changes
  watch: {

      // Whenever the userLang property changes, automatically run this function
      userLang: function() {
        // Use our translate method to translate all text on the page
        this.translate(this.userLang);
      }

    },

  // Code to be run when this component is first created
  created () {

    // Use our translate method to translate all text on page if userLang isn't English
    if (this.userLang !== 'en') {
      this.selectedLanguage = this.userLang;
      this.translate(this.userLang);
    } else {
      // Get the list of supported languages, userLang is English by default
      this.getLanguages(this.userLang);
    }

    if (this.timedOut) {
      this.$store.commit('logout');
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
header{
  background-color:none;
}

/* css  for text section withillustration */
#numberone{
  background-color:#E8E8E8;
  text-align: left;
  color:black;
  padding: 20px 0px 19px 100px;
}

#numberone p{
  text-align: left;
}

#numberonetext{
  text-align: left;
}

.background {
  background-image: url("../assets/kid-studying.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  padding:2vw;
}

img{
  background: #E8E8E8;
}


#slide{
  /* background-color: white; */
   text-align: left;
         color:black;
         padding: 300px 50px 75px 120px; 
         max-width: 100vw;
         background-size: 100%;

}

 h2  {
   color: white;
   font-size: 70px;
   text-align: center;
   padding: 10px;

 }

 /* css for illstration and text field */
 .inline{
   /* siplaying illustration and text in one line */
    display: inline;
    text-align: left;
 }

.inline li{
  display: inline-block;
}

/* css for about area */
#about{
  width: 100%;
}

#abouttext{
  background: rgb(242, 242, 242);
  padding: 5vw 4vw 4vw 7vw;
  margin-top: 0;
  margin-bottom: 0;
  /* making sure width is never bigger than 100% so app won't become scrollable horizontally */
  max-width: 100%;
  text-align: left;
}

img{
  width: 51%;
}

/* join us blue image css */
.backgroundslide {
 background-image: url("../assets/toys.jpg");  
  padding:1vw;
  background-size: cover;
  max-width: 100%;
  margin-bottom:16vw;
}

.imagetext{
  color:black;
  font-weight: bold;
  font-display:Arial;
  padding:4vw 56vw 9vw 1vw; 
}
</style>
