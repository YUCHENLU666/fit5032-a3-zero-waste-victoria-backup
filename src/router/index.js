import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RecyclingFinderView from '../views/RecyclingFinderView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AccountView from '../views/AccountView.vue'
import AdminView from '../views/AdminView.vue'

import { getCurrentUser } from '../services/authService'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    // =========================
    // Public pages
    // =========================
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    {
      path: '/recycle',
      name: 'recycle',
      component: RecyclingFinderView,
    },

    {
      path: '/results',
      name: 'results',
      component: SearchResultsView,
    },

    // =========================
    // Authentication pages
    // =========================
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },

    // =========================
    // Protected user page
    // =========================
    {
      path: '/account',
      name: 'account',
      component: AccountView,

      meta: {
        requiresAuth: true,
      },
    },

    // =========================
    // Admin-only page
    // =========================
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,

      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
  ],

  // Return to the top whenever route changes
  scrollBehavior() {
    return {
      top: 0,
      left: 0,
    }
  },
})


// ======================================================
// Global navigation guard
//
// Every time the user changes page,
// this code checks authentication and role.
// ======================================================

router.beforeEach((to) => {
  const currentUser = getCurrentUser()

  // -----------------------------------------
  // 1. User must log in before visiting
  //    protected pages such as /account
  // -----------------------------------------
  if (to.meta.requiresAuth && !currentUser) {
    return {
      name: 'login',

      // Remember where the user wanted to go
      query: {
        redirect: to.fullPath,
      },
    }
  }


  // -----------------------------------------
  // 2. Only administrators can access /admin
  // -----------------------------------------
  if (
    to.meta.requiresAdmin &&
    currentUser &&
    currentUser.role !== 'admin'
  ) {
    return {
      name: 'account',
    }
  }


  // -----------------------------------------
  // 3. If already logged in,
  //    do not allow Login/Register again
  // -----------------------------------------
  const isAuthPage =
    to.name === 'login' ||
    to.name === 'register'

  if (currentUser && isAuthPage) {
    if (currentUser.role === 'admin') {
      return {
        name: 'admin',
      }
    }

    return {
      name: 'account',
    }
  }


  // -----------------------------------------
  // 4. Everything else is allowed
  // -----------------------------------------
  return true
})


export default router