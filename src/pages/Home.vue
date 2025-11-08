<template>
  <div class="container">
    <div class="toolbar">
      <div class="filters">
        <button :class="{ active: filter==='all' }" @click="setFilter('all')">{{ t('all') }}</button>
        <button :class="{ active: filter==='fake' }" @click="setFilter('fake')">{{ t('fake') }}</button>
        <button :class="{ active: filter==='not_fake' }" @click="setFilter('not_fake')">{{ t('not_fake') }}</button>
      </div>
      <div style="display:flex; align-items:center; gap:8px">
        <span>{{ t('perPage') }}</span>
        <select :value="pageSize" @change="onPageSizeChange">
          <option :value="5">5 {{ t('items') }}</option>
          <option :value="10">10 {{ t('items') }}</option>
          <option :value="20">20 {{ t('items') }}</option>
        </select>
        <RouterLink class="btn" to="/report">{{ t('reportButton') }}</RouterLink>
        <button class="btn" @click="onClearImported">{{ t('clearImported') }}</button>
        <button class="btn" @click="onBoostVotes">{{ t('boostVotes') }}</button>
      </div>
    </div>

    <div class="summary" style="color:var(--muted)">
      <span>{{ t('page', { page, total: totalPages, count: filtered.length }) }}</span>
      <span style="margin-left:12px">Fake: {{ counts.fake }}, Not Fake: {{ counts.notFake }}</span>
    </div>

    <div v-if="current.length === 0" style="padding:12px; color:var(--muted)">{{ t('noMatch') }}</div>

    <div class="news-list" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px">
      <div v-for="n in current" :key="n.id" class="card">
        <img :src="cover(n)" alt="cover" class="card-cover" @error="onImgError($event)" />
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h3 class="title" style="margin:0">{{ n.title }}</h3>
          <span class="status" :class="statusClass(getStatus(n.id))">{{ statusLabel(getStatus(n.id)) }}</span>
        </div>
        <div class="meta" style="display:flex; gap:8px; color:var(--muted)">
          <span>{{ t('reporter') }}：{{ n.reporter }}</span>
          <span>{{ t('date') }}：{{ formatDate(n.createdAt) }}</span>
          <span v-if="n.source">{{ t('source') }}：{{ n.source }}</span>
        </div>
        <p style="margin:6px 0">{{ n.summary }}</p>
        <div style="display:flex; gap:8px; align-items:center">
          <RouterLink class="btn" :to="`/news/${n.id}`">{{ t('details') }}</RouterLink>
          <RouterLink class="btn" :to="`/news/${n.id}/vote`">{{ t('vote') }}</RouterLink>
          <button class="btn" @click="onLike(n.id)">👍 {{ likes(n.id) }}</button>
        </div>
      </div>
    </div>

    <div class="pager" style="display:flex; gap:8px; align-items:center; margin-top:12px">
      <button :disabled="page<=1" @click="prev">{{ t('prev') }}</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page>=totalPages" @click="next">{{ t('next') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useStore, formatDate } from '../store'
import { useI18n } from '../i18n'

type Filter = 'all' | 'fake' | 'not_fake'

const { state, getStatus, clearImported, boostSeedVotes, likeNews, startProgress, finishProgress, localize } = useStore()
const { t, lang } = useI18n()

const filter = ref<Filter>('all')
const page = ref(1)
const pageSize = ref<number>((() => {
  try {
    const raw = localStorage.getItem('home_page_size')
    const n = raw ? Number(raw) : 10
    return [5,10,20].includes(n) ? n : 10
  } catch { return 10 }
})())

const statusMap = computed(() => {
  const m = new Map<number, ReturnType<typeof getStatus>>()
  for (const n of state.news) m.set(n.id, getStatus(n.id))
  return m
})

const filtered = computed(() => {
  const byDateDesc = (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  if (filter.value === 'all') {
    // 仅按时间倒序，允许 Fake 与 Not Fake 自然夹杂
    return state.news.slice().sort(byDateDesc)
  }
  return state.news
    .filter((n) => {
      const st = statusMap.value.get(n.id)
      if (filter.value === 'fake') return st === 'Fake'
      if (filter.value === 'not_fake') return st === 'Not Fake'
      return true
    })
    .sort(byDateDesc)
})

const counts = computed(() => {
  let fake = 0, notFake = 0
  for (const n of state.news) {
    const st = statusMap.value.get(n.id)
    if (st === 'Fake') fake += 1
    else if (st === 'Not Fake') notFake += 1
  }
  return { fake, notFake }
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const current = computed(() => {
  const arr = filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
  const L = lang.value as 'zh' | 'en'
  const localized = arr.map((n: any) => {
    const x = localize(n, L)
    return { ...n, title: x.title, summary: x.summary, content: x.content, reporter: x.reporter, source: x.source }
  })
  if (L === 'en') {
    const isEnglish = (s?: string) => !s || !/[\u4e00-\u9fa5]/.test(s)
    return localized.filter((n: any) => isEnglish(n.title) && isEnglish(n.summary))
  }
  return localized
})

watch([filtered, pageSize], () => { page.value = 1 })

const setFilter = (f: Filter) => { filter.value = f }
const onPageSizeChange = (e: Event) => {
  const n = Number((e.target as HTMLSelectElement).value)
  pageSize.value = n
  localStorage.setItem('home_page_size', String(n))
}
const prev = () => { if (page.value > 1) page.value -= 1 }
const next = () => { if (page.value < totalPages.value) page.value += 1 }

const onClearImported = () => {
  if (confirm(t('confirmClearImported') as any)) {
    startProgress()
    try { clearImported() } finally { finishProgress() }
  }
}
const onBoostVotes = () => {
  if (confirm(t('confirmBoostVotes') as any)) {
    startProgress()
    try { boostSeedVotes(18, 23) } finally { finishProgress() }
  }
}

const statusClass = (st: ReturnType<typeof getStatus>) => st === 'Fake' ? 'fake' : st === 'Not Fake' ? 'not-fake' : 'undecided'
const statusLabel = (st: ReturnType<typeof getStatus>) => st === 'Fake' ? t('status_fake') : st === 'Not Fake' ? t('status_not_fake') : t('status_undecided')

const likes = (id: number) => state.likesByNews[id] ?? 0
const onLike = (id: number) => {
  startProgress()
  try { likeNews(id) } finally { finishProgress() }
}

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="100%" height="100%" fill="%23eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="24" font-family="Arial">No Image</text></svg>'
const cover = (n: any) => n.imageUrl || PLACEHOLDER
const onImgError = (e: Event) => { (e.target as HTMLImageElement).src = PLACEHOLDER }
</script>

<style scoped>
.card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: #fff; transition: transform .15s ease, box-shadow .15s ease; will-change: transform; }
.card:hover { transform: scale(1.1); box-shadow: 0 10px 24px rgba(0,0,0,.08); cursor: pointer; position: relative; z-index: 2; }
</style>
