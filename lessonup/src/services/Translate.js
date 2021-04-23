/* Import the Axios instance created in src/services/Api.js which serves as a tool for sending data to & from backend Express server
    using HTTP requests */
import Api from '@/services/Api';

// Allows us to import this module inside component.vue files and use its methods
export default {
    
    // Method which we can call from components with the command Translate.getLanguages(userLang)
    getLanguages(outputLang) {

        /* Sends get request to the backend server's /getlanguages route (in main.js). The backend retrieves the output (i.e. user's) language
        as req.body.target and sends GET request to Google Cloud Translate API asking for the supported languages, returned in the user's language.
        Supported languages are sent back to frontend as an array of objects: [{ language: 'en', name: 'English' }, ... ] Server sends this data back
        to wherever Translate.getLanguages() was called, i.e. in one of the Vue components */

        return Api().get(`getlanguages?target=${outputLang}`);
    },

    // Method which we can call from components with the command Translate.translate(userLang, toTranslate)
    // translate(outputLang, toTranslate) {
    translate(data) {

        /* Sends get request to the backend server's /translate route (in main.js). The backend retrieves the output (i.e. user's) language as
        req.body.target and the input text (to be translated) as req.body.text. Server sends GET request to Google Cloud Translate API asking for
        input text to be translated into the language provided. Server sends this data back to wherever Translate.translate() was called, i.e.
        in one of the Vue components. Resulting data is JSON object:
        { translatedText: "string of translated text", detectedSourceLanguage: "en", originalText: "the input string" } */

        return Api().post('translate', data);
    }

}