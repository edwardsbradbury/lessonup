/* App state store to serve as a 'single source of truth' (Google it)
    
    This is data which may need to be passed to all (or several of) components in the app, with all components
    having the same value for each corresponding property. E.g. no matter which component is rendered in App.vue
    (or if NewMessage.vue is rendered in Messages/Conversations, inside of App.vue), all of them will have the same
    values for userLang, userType, loggedIn, username, password and timedOut as the values of those properties in
    this file.
    
    Mutations are methods which components can use to update the values of the state properties, e.g. see Index.vue line 96 */

import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from "vuex-persistedstate";

Vue.use(Vuex);

const state = {
    userLang: 'en',
    userType: null,
    loggedIn: false,
    username: null,
    userId: null,
    timedOut: false,
    mode: 'conversations',
    requestObject: null,
    currentConvo: null,
}

const mutations = {

    setUserLang(state, language) {
        state.userLang = language;
    },

    setUserType(state, typeOfUser) {
        state.userType = typeOfUser;
    },

    setLoginStatus(state, newStatus) {
        state.loggedIn = newStatus;
    },

    setUsername(state, username) {
        state.username = username;
    },

    setUserId(state, id) {
        state.userId = id;
    },

    setTimedOut(state, timedOut) {
        state.timedOut = timedOut;
    },

    logout(state) {
        state.userType = null;
        state.username = null,
        state.userId = null;
        state.timedOut = false;
    },

    setMode(state, mode) {
        state.mode = mode;
    },

    setRequestObject(state, request) {
        state.requestObject = request;
    },

    setCurrentConvo(state, conversation) {
        state.currentConvo = conversation;
    }

}

/* Store is imported in App.vue (line 19) and appended to the Vue app instance (line 26), which is what makes the state properties
    and mutations available to components in the app */
export default new Vuex.Store({
    state: state,
    mutations: mutations,
    plugins: [createPersistedState()]
})