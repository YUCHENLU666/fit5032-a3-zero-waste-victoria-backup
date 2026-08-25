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
})

export default router