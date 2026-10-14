import {
  createRouter,
  createWebHistory,
} from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RecyclingFinderView from '../views/RecyclingFinderView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'
import DataExplorerView from '../views/DataExplorerView.vue'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AccountView from '../views/AccountView.vue'
import AdminView from '../views/AdminView.vue'
import EmailView from '../views/EmailView.vue'

import {
  getCurrentUser,
  waitForAuthReady,
} from '../services/authService'


const router = createRouter({
  history: createWebHistory(
    import.meta.env.BASE_URL,
  ),

  routes: [
    // =====================================================
    // Public pages
    // =====================================================
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

    // =====================================================
    // Interactive Data Explorer
    //
    // This public page demonstrates:
    // - Two independent interactive tables
    // - Global search
    // - Individual column filters
    // - Ascending / descending sorting
    // - Pagination with 10 rows per page
    // - Accessible table controls
    // =====================================================
    {
      path: '/data-explorer',
      name: 'data-explorer',
      component: DataExplorerView,
    },


    // =====================================================
    // Authentication pages
    // =====================================================
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


    // =====================================================
    // Protected user account page
    //
    // Only authenticated Firebase users
    // can access this route.
    // =====================================================
    {
      path: '/account',
      name: 'account',
      component: AccountView,

      meta: {
        requiresAuth: true,
      },
    },


    // =====================================================
    // Protected Email page
    //
    // Only authenticated Firebase users
    // can access the email composition page.
    //
    // The backend Cloud Function also checks
    // request.auth, providing server-side protection.
    // =====================================================
    {
      path: '/email',
      name: 'email',
      component: EmailView,

      meta: {
        requiresAuth: true,
      },
    },


    // =====================================================
    // Administrator-only page
    //
    // The user must:
    // 1. Be authenticated
    // 2. Have role === 'admin' in Firestore
    // =====================================================
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


  // =====================================================
  // Scroll behaviour
  //
  // Return to the top whenever the route changes.
  // =====================================================
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
// Firebase Authentication restores the login session
// asynchronously when the application first loads.
//
// Therefore, before checking whether a user is logged in,
// the router waits until Firebase has finished restoring
// the authentication state.
// ======================================================

router.beforeEach(
  async (to) => {

    // --------------------------------------------------
    // Wait for Firebase Authentication to finish
    // restoring the current session.
    //
    // Without this step, refreshing protected routes
    // such as /account, /email, or /admin could
    // incorrectly redirect the user to /login before
    // Firebase has finished loading the session.
    // --------------------------------------------------
    await waitForAuthReady()


    // --------------------------------------------------
    // Read the latest authenticated user profile.
    //
    // This profile combines:
    // - Firebase Authentication identity
    // - Firestore application profile
    // - Firestore role information
    // --------------------------------------------------
    const currentUser =
      getCurrentUser()


    // ==================================================
    // 1. Protect authenticated routes
    // ==================================================
    //
    // If a route requires authentication and no user
    // is currently logged in, redirect to Login.
    //
    // This protects:
    // - /account
    // - /email
    // - /admin
    //
    // The original destination is stored so that after
    // successful login the user can return to the page
    // they originally requested.
    // ==================================================

    if (
      to.meta.requiresAuth &&
      !currentUser
    ) {
      return {
        name: 'login',

        query: {
          redirect:
            to.fullPath,
        },
      }
    }


    // ==================================================
    // 2. Protect administrator-only routes
    // ==================================================
    //
    // The /admin route requires role === 'admin'.
    //
    // Normal authenticated users are redirected to
    // their own Account page.
    // ==================================================

    if (
      to.meta.requiresAdmin &&
      currentUser &&
      currentUser.role !==
        'admin'
    ) {
      return {
        name: 'account',
      }
    }


    // ==================================================
    // 3. Prevent authenticated users from reopening
    //    Login or Register pages
    // ==================================================

    const isAuthPage =
      to.name === 'login' ||
      to.name === 'register'


    if (
      currentUser &&
      isAuthPage
    ) {

      // Administrator goes directly
      // to the Admin Dashboard.
      if (
        currentUser.role ===
          'admin'
      ) {
        return {
          name: 'admin',
        }
      }


      // Normal authenticated user goes
      // directly to their Account page.
      return {
        name: 'account',
      }
    }


    // ==================================================
    // 4. Allow navigation
    // ==================================================

    return true
  },
)


export default router