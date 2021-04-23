/* Import the Axios instance created in src/services/Api.js which serves as a tool for sending data to & from backend Express server
    using HTTP requests */
import Api from '@/services/Api';

    export default {

        newRequest(requestData) {
            return Api().post('new-request', requestData);
        },

        getAllRequests() {
            return Api().get('all-requests');
        },

        deleteRequest(id) {
            return Api().delete(`delete-request/${id}`);
        }

    }