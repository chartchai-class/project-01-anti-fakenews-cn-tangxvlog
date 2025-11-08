<template>
  <div class="container">
    <h2>{{ t('nav_import') }}</h2>
    <form class="form" @submit.prevent="submit">
      <div class="form-row">
        <label>RSS URL</label>
        <input v-model="url" type="text" placeholder="https://example.com/feed" />
      </div>
      <div class="form-row">
        <label>Presets</label>
        <select v-model="preset">
          <option value="">--</option>
          <option v-for="p in presets" :key="p.url" :value="p.url">{{ p.name }}</option>
        </select>
      </div>
      <button class="btn" type="submit">{{ t('nav_import') }}</button>
    </form>
    <div v-if="message" style="margin-top:8px; color:var(--muted)">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useStore } from '../store'
import { useI18n } from '../i18n'
import { fetchRSS, parseRSS } from '../rss'

const { addNewsImported, state } = useStore()
const { t } = useI18n()

const presets = [
  { name: '36氪', url: 'https://36kr.com/feed' },
  { name: 'IT之家', url: 'https://www.ithome.com/rss/' },
  { name: 'cnBeta', url: 'https://www.cnbeta.com/backend.php' },
  { name: 'Solidot', url: 'https://www.solidot.org/index.rss' },
  { name: '少数派', url: 'https://www.sspai.com/feed' },
  { name: '爱范儿', url: 'https://www.ifanr.com/feed' },
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews' },
]

const url = ref('')
const preset = ref('')
const message = ref('')

watch(preset, (v) => { if (v) url.value = v })

const submit = async () => {
  const target = (url.value || preset.value).trim()
  if (!target) return
  try {
    message.value = 'Fetching RSS...'
    const xml = await fetchRSS(target)
    const items = parseRSS(xml)
    const existing = new Set<string>()
    for (const n of state.news) if (n.link) existing.add(n.link)
    let added = 0
    for (const it of items) {
      if (it.link && existing.has(it.link)) continue
      addNewsImported(it)
      added += 1
    }
    message.value = `Imported ${added} items.`
  } catch (e: any) {
    message.value = e?.message ?? String(e)
  }
}
</script>

<style scoped>
.btn { border: 1px solid var(--border); padding:6px 10px; background:#fff; cursor:pointer }
.form { display:grid; gap:12px }
.form-row { display:grid; gap:6px }
.form-row input, .form-row select { padding:8px; border:1px solid var(--border); border-radius:4px }
</style>