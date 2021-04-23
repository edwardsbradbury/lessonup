/* Import the Axios instance created in src/services/Api.js which serves as a tool for sending data to & from backend Express server
    using HTTP requests */
import Api from '@/services/Api';

    export default {

        newMessage(messageData) {
            return Api().post('new-message', messageData);
        },

        getConversations(username) {
            return Api().get(`conversations?username=${username}`);
        },

        getMessages(username, requestId) {
            return Api().get(`messages?username=${username}&requestId=${requestId}`);
        },

        deleteMessage(id) {
            return Api().delete(`delete-message/${id}`);
        }

    }