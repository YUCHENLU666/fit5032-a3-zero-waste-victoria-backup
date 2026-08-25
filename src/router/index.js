import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import RecyclingFinderView from '../views/RecyclingFinderView.vue'
import SearchResultsView from '../views/SearchResultsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
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
  ],

  // Return to the top of the page whenever the route changes
  scrollBehavior() {
    return {
      top: 0,
      left: 0,
    }
  },
})

export default router