<template>

  <div id="faq">
    
    <div class="background">
      <header >
        <div class="imagetext">
          <h1>FAQ</h1>
        </div>
      </header>
    </div>

    <div id="about">
      <div id="abouttext">
        <h2>FAQ</h2>
      </div>
      <div v-for="aQuestion in questions" class="questionsarea" :key="aQuestion.question">
        <h4>{{aQuestion.question}}</h4>
        <p>{{aQuestion.answer}}</p>
      </div>
    </div>
          
          <!-- icons displayed on the bottom of faq page -->
    <div class="flex-containerfaq">
      <div>
        <img src="../assets/faqicon1.png" alt=" shield icon"> 
      </div>
      <div>
            <!-- <h6 style="color: black;"> JOIN OUR NEWSLETTER TO LEARN MORE ABOUT US  </h6> -->

        <img src="../assets/faqicon2.png" alt=" user icon"> 
      </div>
      <div>
        <img  src="../assets/faqicon3.png" alt="hq icon "> 
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

  name: 'FAQ',
  data () {
    return {
      /* Properties of this Vue component */
      question1: "How do I start using LessonUp?",
      answer1: "Choose whether you are a parent or a tutor, then register for an account. Once registered, if you are a parent, you can post a request for help. Tutors will send you replies, if they are able to offer help. Through our messaging feature, you make arrangements for the tutor to help you through whichever means is mutually convenient. If you registered as a tutor, you can view and reply to parents' requests for help. Use the app in your native language: write a request for help in your language. The app will automatically translate it for tutors to see. Any replies sent to you will be translated into your language.",
      question2: "Can I become a tutor on LessonUp if I am 16 years old?",
      answer2: "No, we only work with tutors who are at least 18 years old.",
      question3: "Does LessonUp only operate in the UK?",
      answer3: "Yes, at the moment. We do intend to expand to other countries in the future.",
      question4: "Do I have to pay to use LessonUp?",
      answer4: "You do not pay us, but a tutor who offers to help you may ask you to pay them for their time and effort. That is to be decided and arranged between yourselves.",
    }
  },

  /* Computed properties are updated whenever their dependencies update

    mapState is a Vuex method which makes this Menu.vue component have the listed data properties, based on the values assigned to those
    properties in the Vuex state store (src/vuex/store.js). Because they're added as 'computed' properties, the values assigned to these
    properties inside this component updates whenever their values in the Vuex store are updated */
  computed: {
    ...mapState(['userLang', 'userType', 'loggedIn', 'username', 'userId', 'timedOut']),

    questions: function() {
      return [
        {question: this.question1, answer: this.answer1},
        {question: this.question2, answer: this.answer2},
        {question: this.question3, answer: this.answer3},
        {question: this.question4, answer: this.answer4}
      ]
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
      this.translate(this.userLang);
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

#faq{
  background-color: none;
  padding-top: 1px;
}

#about{
  text-align: left;
  background-color:white;
  color:black;
  padding: 25px 0px 75px 0px;
}

#abouttext{
  text-align: left;
}
/* text inside an image */
.imagetext{
  color:black;
  font-weight: bold;
  font-display:Arial;
  padding:8vw 5vw 10vw 40vw;
}

p{
  text-align: left;
  max-width:100%;
  padding:1vw 2vw;
}

h4{
  background-color:lightgrey;
  max-width:100%;
  padding:2vw 4vw 2vw 10vw;
}
/* main image on top of faq page */
.background {
  background-image: url("../assets/faqimage2.jpg");  
  padding:2vw;
  background-size: cover;
  max-width: 100%;
  }
/* icons csss */
.flex-containerfaq {
  display: flex;
  flex-wrap: wrap;
  flex-grow: 1;
  max-width:100%;
  padding:14vw 2vw;

}

.flex-containerfaq div {
  flex-grow: 1;
}

</style>
