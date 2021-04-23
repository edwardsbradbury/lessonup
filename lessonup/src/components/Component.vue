<template>
  <div id="">

    ALL HTML CODE FOR THE PAGE STRUCTURE MUST BE INSIDE OF THIS DIV

  </div>
</template>

<script>
/* Import the Translate.js interface from services folder. We need to access its methods here. See comments in Translate.js for info about
    what it does */
import Translate from '@/services/Translate'
/* Make properties and methods of this Vue component reactive, i.e. update variables based on user interaction & then update the data that's
   rendered in the template above inside the {{variable references}} */
export default {
  name: '',
  /* Props are properties passed down from the parent component, which in this case is the root component, Vue.app. Effectively this makes
    the userLang property of App.vue available for us to work with in this component here */
  props: ['userLang', 'loggedIn', 'userType', 'username', 'userId'],
  data () {
    return {
      
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
  /* When an instance of this component is created - i.e. the Vue router registers that a link has asked for this component
    - if the userLang is not English, call the Translate method above to translate all text on this page */
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
