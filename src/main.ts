import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import './App.css'
import router from './router'
import { createStore, StoreSymbol } from './store'
import { createI18n, I18nSymbol } from './i18n'

const app = createApp(App)

// provide store and i18n similar to React context
const store = createStore()
const i18n = createI18n()
app.provide(StoreSymbol, store)
app.provide(I18nSymbol, i18n)

// top progress on route navigation
router.beforeEach((to, from, next) => { store.startProgress(); next() })
router.afterEach(() => { store.finishProgress() })

app.use(router)
app.mount('#app')