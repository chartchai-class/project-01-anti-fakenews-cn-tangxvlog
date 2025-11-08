<template>
  <div class="layout">
    <div v-show="state.progressActive" class="top-progress"><div class="bar" :style="{ width: state.progressValue + '%' }"></div></div>
    <header class="header">
      <div class="brand">
        <RouterLink to="/">{{ t('brand') }}</RouterLink>
      </div>
      <nav class="nav" style="display:flex; align-items:center">
        <span style="color:#666">{{ t('language') }}</span>
        <select :value="lang" @change="onLangChange" style="margin-left:8px">
          <option value="zh">{{ t('zh') }}</option>
          <option value="en">{{ t('en') }}</option>
        </select>
        <span style="margin-left:12px"></span>
        <RouterLink to="/" active-class="active" exact>{{ t('nav_home') }}</RouterLink>
        <RouterLink to="/report" active-class="active">{{ t('nav_report') }}</RouterLink>
        <RouterLink to="/import" active-class="active">{{ t('nav_import') }}</RouterLink>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
    <footer class="footer">© {{ new Date().getFullYear() }} {{ t('brand') }} Demo</footer>
  </div>
  
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useI18n } from './i18n'
import { useStore } from './store'

const { t, lang, setLang } = useI18n()
const { state } = useStore()
const onLangChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  setLang(target.value as any)
}
</script>

<style>
/* styles are imported via main.ts (App.css, index.css) */
.top-progress { position: fixed; top: 0; left: 0; width: 100%; height: 3px; background: transparent; z-index: 9999 }
.top-progress .bar { height: 100%; background: linear-gradient(90deg, #4f46e5, #06b6d4); transition: width .2s ease }
</style>