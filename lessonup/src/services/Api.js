import axios from 'axios';

export default () => {
    
    return axios.create({
        baseURL: 'https://lessonup-api.herokuapp.com/',
        withCredentials: true
    })
}