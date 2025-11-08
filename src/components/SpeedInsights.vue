<template></template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { injectSpeedInsights } from '@vercel/speed-insights'

onMounted(() => {
  try { injectSpeedInsights() } catch {}
})
</script>

<style scoped>
/* This component renders nothing; it only injects Speed Insights */
</style>