<template>
  <div v-if="n" class="container">
    <h2>{{ t('votePageTitle', { title: n.title }) }}</h2>
    <p class="question">{{ t('voteQuestion') }}</p>

    <div class="vote-area">
      <button type="button" class="vote-btn real" :class="{ active: choice==='not_fake' }" @click="choice='not_fake'">
        <span class="emoji">👍</span>
        <span>{{ t('realNews') }}</span>
      </button>
      <button type="button" class="vote-btn fake" :class="{ active: choice==='fake' }" @click="choice='fake'">
        <span class="emoji">👎</span>
        <span>{{ t('fakeNews') }}</span>
      </button>
    </div>

    <form class="form" @submit.prevent="submit">
      <div class="form-row">
        <label>{{ t('yourComment') }}</label>
        <textarea v-model="comment" rows="4" :autofocus="mode==='comment'"></textarea>
      </div>
      <div class="form-row">
        <label>{{ t('imageUrl') }}</label>
        <input v-model="imageUrl" placeholder="https://..." />
      </div>
      <div class="form-row">
        <label>{{ t('yourName') }}</label>
        <input v-model="voter" />
      </div>
      <div style="display:flex; gap:8px">
        <button type="submit" class="btn">{{ t('submit') }}</button>
        <RouterLink class="btn" :to="`/news/${n.id}`">{{ t('backToDetail') }}</RouterLink>
      </div>
    </form>
  </div>
  <div v-else class="container">
    <p>{{ t('notFound') }}</p>
    <RouterLink class="btn" to="/">{{ t('backHome') }}</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useStore } from '../store'
import { useI18n } from '../i18n'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)
const { state, addVote } = useStore()
const { t } = useI18n()
const n = computed(() => state.news.find((x) => x.id === id))
const choice = ref<'fake' | 'not_fake'>('fake')
const comment = ref('')
const imageUrl = ref('')
const voter = ref('')
const mode = computed(() => String(route.query.mode || ''))

const submit = () => {
  if (!n.value) return
  addVote({ newsId: n.value.id, choice: choice.value, comment: comment.value.trim() || undefined, imageUrl: imageUrl.value.trim() || undefined, voter: voter.value.trim() || undefined })
  router.push(`/news/${n.value.id}`)
}
</script>

<style scoped>
.question { margin: 8px 0 12px; color: var(--muted) }
.vote-area { display:flex; gap:16px; margin-bottom:16px }
.vote-btn { flex:1; display:flex; align-items:center; gap:10px; padding:14px 16px; border:1px solid var(--border); border-radius:10px; background:#fff; cursor:pointer; transition: box-shadow .2s ease, transform .1s ease }
.vote-btn .emoji { font-size:20px }

/* Real News: green theme */
.vote-btn.real { border-color: #22c55e; color: #14532d }
.vote-btn.real .emoji { color: #16a34a }
.vote-btn.real:hover { box-shadow: 0 8px 20px rgba(22,163,74,.12); transform: translateY(-1px) }
.vote-btn.real.active { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22,163,74,.20); background: #ecfdf5 }

/* Fake News: red theme */
.vote-btn.fake { border-color: #ef4444; color: #7f1d1d }
.vote-btn.fake .emoji { color: #dc2626 }
.vote-btn.fake:hover { box-shadow: 0 8px 20px rgba(220,38,38,.12); transform: translateY(-1px) }
.vote-btn.fake.active { border-color: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,.20); background: #fef2f2 }

.btn { border: 1px solid var(--border); padding:6px 10px; background:#fff; cursor:pointer }
.form { display:grid; gap:12px }
.form-row { display:grid; gap:6px }
.form-row input, .form-row textarea { padding:8px; border:1px solid var(--border); border-radius:4px }
</style>