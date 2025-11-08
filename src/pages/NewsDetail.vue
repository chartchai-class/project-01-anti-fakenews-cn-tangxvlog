<template>
  <div class="container" v-if="n">
    <div class="detail">
      <h2 class="title">{{ L?.title }}</h2>
      <div class="meta">
        <span class="status" :class="statusClass(status)">{{ statusLabel(status) }}</span>
        <span>{{ t('reporter') }}：{{ L?.reporter }}</span>
        <span>{{ t('date') }}：{{ formatDate(n.createdAt) }}</span>
        <span v-if="L?.source">{{ t('source') }}：{{ L?.source }}</span>
      </div>
      <img :src="cover(n)" alt="image" class="cover" @error="onImgError($event)" />
      <p>{{ L?.content }}</p>
      <div style="display:flex; gap:8px; margin:8px 0">
        <RouterLink class="btn" :to="`/news/${n.id}/vote`">{{ t('goVoteAddComment') }}</RouterLink>
        <a v-if="n && n.link" class="btn" :href="n.link" target="_blank" rel="noopener">View Original</a>
      </div>

      <h3 style="margin-top:16px">{{ t('voteResults') }}</h3>
      <div style="display:flex; gap:12px">
        <span>{{ t('fakeShort') }}: {{ counts.fake }}</span>
        <span>{{ t('notFakeShort') }}: {{ counts.not_fake }}</span>
      </div>

      <h3 style="margin-top:16px">{{ t('commentsTitle') }}</h3>
      <div v-if="current.length === 0" style="color:var(--muted)">{{ t('noComments') }}</div>
      <div class="comments" style="display:grid; gap:8px" v-else>
        <div v-for="c in current" :key="c.id" class="comment" style="border:1px solid var(--border); padding:8px; border-radius:6px">
          <div style="display:flex; gap:8px; color:var(--muted)">
            <span>{{ c.voter ?? t('anonymous') }}</span>
            <span>{{ formatDate(c.createdAt) }}</span>
            <span>{{ c.choice === 'fake' ? t('fakeShort') : t('notFakeShort') }}</span>
          </div>
          <p v-if="c.comment">{{ c.comment }}</p>
          <img v-if="c.imageUrl" :src="c.imageUrl" alt="comment image" style="max-width:100%" />
        </div>
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; margin-top:12px">
        <span>{{ t('page', { page, total: totalPages, count: comments.length }) }}</span>
        <div style="display:flex; gap:8px">
          <button class="btn" @click="prev" :disabled="page<=1">{{ t('prev') }}</button>
          <button class="btn" @click="next" :disabled="page>=totalPages">{{ t('next') }}</button>
        </div>
      </div>
    </div>
  </div>
  <div class="container" v-else>
    <p>{{ t('notFound') }}</p>
    <RouterLink class="btn" to="/">{{ t('backHome') }}</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useStore, formatDate } from '../store'
import { useI18n } from '../i18n'

const route = useRoute()
const id = Number(route.params.id)
const { state, getStatus, getVoteCounts, getComments, localize } = useStore()
const { t, lang } = useI18n()
const n = computed(() => state.news.find((x) => x.id === id))
const L = computed(() => n.value ? localize(n.value, lang.value as 'zh' | 'en') : undefined)
const page = ref(1)
const pageSize = ref(5)
const comments = computed(() => getComments(id))
const totalPages = computed(() => Math.max(1, Math.ceil(comments.value.length / pageSize.value)))
const current = computed(() => comments.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const status = computed(() => n.value ? getStatus(n.value.id) : 'Undecided')
const counts = computed(() => n.value ? getVoteCounts(n.value.id) : { fake:0, not_fake:0 })
const prev = () => { if (page.value > 1) page.value -= 1 }
const next = () => { if (page.value < totalPages.value) page.value += 1 }

const statusClass = (st: ReturnType<typeof getStatus>) => st === 'Fake' ? 'fake' : st === 'Not Fake' ? 'not-fake' : 'undecided'
const statusLabel = (st: ReturnType<typeof getStatus>) => st === 'Fake' ? t('status_fake') : st === 'Not Fake' ? t('status_not_fake') : t('status_undecided')

const PLACEHOLDER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540"><rect width="100%" height="100%" fill="%23eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="24" font-family="Arial">No Image</text></svg>'
const cover = (n: any) => n?.imageUrl || PLACEHOLDER
const onImgError = (e: Event) => { (e.target as HTMLImageElement).src = PLACEHOLDER }
</script>

<style scoped>
.status.fake { color: var(--fake) }
.status.not-fake { color: var(--not-fake) }
.status.undecided { color: var(--muted) }
.btn { border: 1px solid var(--border); padding:6px 10px; background:#fff; cursor:pointer }
.cover { width: 100%; max-height: 420px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); margin:8px 0 }
</style>