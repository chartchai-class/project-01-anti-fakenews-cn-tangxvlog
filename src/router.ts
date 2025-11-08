import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Home from './pages/Home.vue'
import NewsDetail from './pages/NewsDetail.vue'
import Vote from './pages/Vote.vue'
import ReportNews from './pages/ReportNews.vue'
import ImportRSS from './pages/ImportRSS.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/news/:id', component: NewsDetail },
  { path: '/news/:id/vote', component: Vote },
  { path: '/report', component: ReportNews },
  { path: '/import', component: ImportRSS },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
  linkExactActiveClass: 'active',
})

export default router