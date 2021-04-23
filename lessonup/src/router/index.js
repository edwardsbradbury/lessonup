import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/components/Index'
import Login from '@/components/Login'
import Register from '@/components/Register'
import Requests from '@/components/Requests'
import Messages from '@/components/Messages'
import Conversation from '@/components/Conversation'
import FAQ from '@/components/FAQ'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/register',
      name: 'Register',
      component: Register
    },
    {
      path: '/requests',
      name: 'Requests',
      component: Requests,
    },
    {
      path: '/messages',
      name: 'Messages',
      component: Messages,
    },
    {
      path: '/conversation',
      name: 'Conversation',
      component: Conversation,
    },
    {
      path: '/faq',
      name: 'FAQ',
      component: FAQ,
    }

  ]
})
