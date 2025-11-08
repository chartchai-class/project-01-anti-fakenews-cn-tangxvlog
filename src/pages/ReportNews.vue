<template>
  <div class="container">
    <h2>{{ t('nav_report') }}</h2>
    <form class="form" @submit.prevent="submit">
      <div class="form-row">
        <label>{{ t('reportTitle') }}</label>
        <input v-model="title" type="text" />
      </div>
      <div class="form-row">
        <label>{{ t('reportSummary') }}</label>
        <textarea v-model="summary" rows="3"></textarea>
      </div>
      <div class="form-row">
        <label>{{ t('reportContent') }}</label>
        <textarea v-model="content" rows="6"></textarea>
      </div>
      <div class="form-row">
        <label>{{ t('reportReporter') }}</label>
        <input v-model="reporter" type="text" />
      </div>
      <div class="form-row">
        <label>{{ t('reportImageUrl') }}</label>
        <input v-model="imageUrl" type="text" />
      </div>
      <div style="display:flex; gap:8px">
        <button class="btn" type="submit">{{ t('reportSubmit') }}</button>
        <RouterLink class="btn" to="/">{{ t('backHome') }}</RouterLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useStore } from '../store'
import { useI18n } from '../i18n'

const router = useRouter()
const { addNews } = useStore()
const { t } = useI18n()

const title = ref('')
const summary = ref('')
const content = ref('')
const reporter = ref('')
const imageUrl = ref('')

const submit = () => {
  if (!title.value.trim() || !summary.value.trim() || !content.value.trim() || !reporter.value.trim()) {
    alert(t('reportValidationAlert'))
    return
  }
  addNews({ title: title.value.trim(), summary: summary.value.trim(), content: content.value.trim(), reporter: reporter.value.trim(), imageUrl: imageUrl.value.trim() || undefined })
  router.push('/')
}
</script>

<style scoped>
.btn { border: 1px solid var(--border); padding:6px 10px; background:#fff; cursor:pointer }
.form { display:grid; gap:12px }
.form-row { display:grid; gap:6px }
.form-row input, .form-row textarea { padding:8px; border:1px solid var(--border); border-radius:4px }
</style>