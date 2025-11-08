import { inject, ref } from 'vue'
import type { News, Vote, VoteCounts, NewsStatus, VoteChoice } from './types'

export const StoreSymbol = Symbol('store')

// util: simple date formatter used by pages
export const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}`
  } catch {
    return iso
  }
}

type InternalNews = News & { __seed?: boolean; __imported?: boolean }

function nextId(list: { id: number }[]) {
  return list.length === 0 ? 1 : Math.max(...list.map((x) => x.id)) + 1
}

function genVoteId() { return Math.random().toString(36).slice(2) }

function createSeedNews(): InternalNews[] {
  const total = 60
  const list: InternalNews[] = []
  const now = Date.now()
  const subjects = [
    'City council', 'Government', 'Tech giant', 'Researchers', 'Local police', 'Health agency', 'School board', 'Bank', 'Weather service', 'Sports team',
    'Energy firm', 'Transit authority', 'University', 'Travel sector', 'Housing market', 'Environmental group', 'Food company', 'Startup', 'E-commerce platform', 'Hospital',
    'Community', 'Airport', 'Railway', 'Telecom provider', 'Agriculture sector'
  ]
  const actions = [
    'debates new policy', 'issues warning', 'faces data breach', 'announces layoffs', 'launches investigation', 'releases study', 'introduces fee', 'approves budget', 'questions report', 'recalls product',
    'plans protest', 'reports outage', 'updates guidelines', 'halts service', 'raises prices', 'cuts interest rates', 'expands program', 'faces lawsuit', 'secures funding', 'warns of fraud',
    'proposes reform', 'sees demand surge', 'declines sharply', 'posts record profits', 'tests new system'
  ]
  const sources = ['Global Times', 'Daily Watch', 'Metro News', 'TechWire', 'HealthLine', 'City Herald', 'Eco Monitor', 'Finance Post']
  for (let i = 0; i < total; i += 1) {
    const id = i + 1
    const createdAt = new Date(now - i * 3600_000).toISOString() // staggered by hour
    const sbj = subjects[i % subjects.length]
    const act = actions[(i * 3) % actions.length]
    const enTitle = `${sbj} ${act}`
    const enSummary = `${sbj} ${act}. Initial reports indicate mixed reactions from stakeholders.`
    const enContent = `${sbj} ${act}. Officials and experts provided brief comments while independent verification is still ongoing. Citizens are advised to follow official channels for updates.`
    const enReporter = `Reporter ${String.fromCharCode(65 + (i % 26))}`
    const zhTitle = `${sbj} ${act}（示例）`
    const zhSummary = `示例：${sbj} 正在 ${act}，相关部门与公众反应不一。`
    const zhContent = `示例正文：${sbj} 正在 ${act}。官方与专家给出简短回应，进一步核查仍在进行。`
    const source = sources[i % sources.length]
    const imageUrl = `https://picsum.photos/seed/news-${id}/960/540`
    list.push({
      id,
      title: zhTitle,
      summary: zhSummary,
      content: zhContent,
      reporter: `示例记者${String.fromCharCode(65 + (i % 26))}`,
      createdAt,
      imageUrl,
      source,
      link: `https://example.com/news/${id}`,
      translations: { en: { title: enTitle, summary: enSummary, content: enContent, reporter: enReporter, source } },
      __seed: true,
    })
  }
  return list
}

export function createStore() {
  const news = ref<InternalNews[]>(createSeedNews())
  const votes = ref<Vote[]>([])
  const initLikes = () => {
    try {
      const raw = localStorage.getItem('likes_by_news')
      return raw ? JSON.parse(raw) as Record<number, number> : {}
    } catch { return {} }
  }
  const likesByNews = ref<Record<number, number>>(initLikes())

  // Global progress bar state
  const progressActive = ref(false)
  const progressValue = ref(0)
  let progressTimer: number | undefined
  const startProgress = () => {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = undefined }
    progressActive.value = true
    progressValue.value = 0
    progressTimer = window.setInterval(() => {
      // Ease towards 95%
      const inc = 5 + Math.random() * 10
      progressValue.value = Math.min(95, progressValue.value + inc)
    }, 150)
  }
  const finishProgress = () => {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = undefined }
    progressValue.value = 100
    setTimeout(() => { progressActive.value = false; progressValue.value = 0 }, 300)
  }

  const persistLikes = () => {
    try { localStorage.setItem('likes_by_news', JSON.stringify(likesByNews.value)) }
    catch (e) { void e /* ignore storage write errors */ }
  }

  const addNews = (n: { title: string; summary: string; content: string; reporter: string; imageUrl?: string }) => {
    const id = nextId(news.value)
    const item: InternalNews = {
      id,
      title: n.title.trim(),
      summary: n.summary.trim(),
      content: n.content.trim(),
      reporter: n.reporter.trim(),
      createdAt: new Date().toISOString(),
      imageUrl: n.imageUrl?.trim() || undefined,
      __imported: false,
    }
    news.value = [item, ...news.value]
  }

  const addNewsImported = (n: Omit<News, 'id' | 'createdAt'> & { createdAt?: string }) => {
    const id = nextId(news.value)
    const item: InternalNews = {
      id,
      title: n.title,
      summary: n.summary,
      content: n.content,
      reporter: n.reporter,
      createdAt: n.createdAt ?? new Date().toISOString(),
      imageUrl: n.imageUrl,
      source: n.source,
      link: n.link,
      __imported: true,
    }
    news.value = [item, ...news.value]
  }

  const addVote = (v: { newsId: number; choice: VoteChoice; comment?: string; imageUrl?: string; voter?: string }) => {
    const item: Vote = {
      id: genVoteId(),
      newsId: v.newsId,
      choice: v.choice,
      comment: v.comment,
      imageUrl: v.imageUrl,
      voter: v.voter,
      createdAt: new Date().toISOString(),
    }
    votes.value = [item, ...votes.value]
  }

  const getVoteCounts = (newsId: number): VoteCounts => {
    let fake = 0, not_fake = 0
    for (const v of votes.value) {
      if (v.newsId !== newsId) continue
      if (v.choice === 'fake') fake += 1
      else if (v.choice === 'not_fake') not_fake += 1
    }
    return { fake, not_fake }
  }

  const getStatus = (newsId: number): NewsStatus => {
    const c = getVoteCounts(newsId)
    if (c.fake > c.not_fake) return 'Fake'
    if (c.not_fake > c.fake) return 'Not Fake'
    return 'Undecided'
  }

  const getComments = (newsId: number) => {
    return votes.value.filter((v) => v.newsId === newsId && (v.comment || v.imageUrl))
  }

  const clearImported = () => {
    const keep = news.value.filter((n) => !n.__imported)
    const removedIds = new Set(news.value.filter((n) => n.__imported).map((n) => n.id))
    news.value = keep
    // drop votes associated with removed imported news
    votes.value = votes.value.filter((v) => !removedIds.has(v.newsId))
  }

  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const boostSeedVotes = (min: number, max: number) => {
    for (const n of news.value) {
      if (!n.__seed) continue
      const counts = getVoteCounts(n.id)
      const total = counts.fake + counts.not_fake
      const target = rand(min, max)
      const add = Math.max(0, target - total)
      for (let i = 0; i < add; i += 1) {
        const choice: VoteChoice = Math.random() < 0.5 ? 'fake' : 'not_fake'
        addVote({ newsId: n.id, choice })
      }
    }
  }

  // Prime half seeds to Fake, half to Not Fake to make statuses visible
  const primeSeedStatuses = () => {
    const half = Math.floor(news.value.length / 2)
    for (let i = 0; i < news.value.length; i += 1) {
      const n = news.value[i]
      if (!n.__seed) continue
      const makeFakeMajority = i < half
      const fakeCount = makeFakeMajority ? 14 : 6
      const notFakeCount = makeFakeMajority ? 6 : 14
      for (let f = 0; f < fakeCount; f += 1) addVote({ newsId: n.id, choice: 'fake' })
      for (let nf = 0; nf < notFakeCount; nf += 1) addVote({ newsId: n.id, choice: 'not_fake' })
    }
  }

  const likeNews = (id: number) => {
    likesByNews.value[id] = (likesByNews.value[id] ?? 0) + 1
    persistLikes()
  }

  // Auto randomize likes, votes and comments for all news
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const randomizeEngagement = (opts?: { likeMin?: number; likeMax?: number; voteMin?: number; voteMax?: number; commentRate?: number; imageRate?: number }) => {
    const likeMin = opts?.likeMin ?? 5
    const likeMax = opts?.likeMax ?? 60
    const voteMin = opts?.voteMin ?? 8
    const voteMax = opts?.voteMax ?? 24
    const commentRate = opts?.commentRate ?? 0.35
    const imageRate = opts?.imageRate ?? 0.12
    const phrases = [
      'Needs more evidence', 'Looks suspicious', 'Seems legitimate', 'Source is reliable',
      'Unverified claim', 'Eyewitness report', 'Possible misinformation', 'Cross-check required',
    ]
    for (const n of news.value) {
      const likeAdd = rand(likeMin, likeMax)
      likesByNews.value[n.id] = (likesByNews.value[n.id] ?? 0) + likeAdd
      const vCount = rand(voteMin, voteMax)
      for (let i = 0; i < vCount; i += 1) {
        const choice: VoteChoice = Math.random() < 0.5 ? 'fake' : 'not_fake'
        const withComment = Math.random() < commentRate
        const withImage = Math.random() < imageRate
        const comment = withComment ? pick(phrases) : undefined
        const imageUrl = withImage ? `https://picsum.photos/seed/cmt-${n.id}-${i}/400/240` : undefined
        const voter = Math.random() < 0.4 ? `User${rand(1000,9999)}` : undefined
        addVote({ newsId: n.id, choice, comment, imageUrl, voter })
      }
    }
    persistLikes()
  }

  // Expose a simple state object
  const state = {
    get news() { return news.value as News[] },
    get votes() { return votes.value },
    get likesByNews() { return likesByNews.value },
    get progressActive() { return progressActive.value },
    get progressValue() { return progressValue.value },
  }

  // Optional: auto import RSS is disabled by default; can be re-enabled via env
  const autoImport = String(import.meta.env?.VITE_AUTO_IMPORT_RSS ?? '').toLowerCase() === 'true'
  // Initialize demo votes to make half of seeds show different statuses
  primeSeedStatuses()
  // Optional randomization to vary counts
  boostSeedVotes(18, 24)
  // Pre-populate engagement so news already has likes/votes/comments from different users
  randomizeEngagement({ likeMin: 12, likeMax: 48, voteMin: 10, voteMax: 26, commentRate: 0.5, imageRate: 0.18 })
  if (autoImport) {
    // Intentionally left as a no-op here to avoid网络错误日志; manual import page handles RSS
  }

  return {
    state,
    addNews,
    addNewsImported,
    addVote,
    getVoteCounts,
    getStatus,
    getComments,
    clearImported,
    boostSeedVotes,
    likeNews,
    randomizeEngagement,
    startProgress,
    finishProgress,
    localize: (n: News, lang: 'zh' | 'en') => {
      if (lang === 'en' && n.translations?.en) {
        const en = n.translations.en
        return {
          title: en.title || n.title,
          summary: en.summary || n.summary,
          content: en.content || n.content,
          reporter: en.reporter || n.reporter,
          source: en.source || n.source,
        }
      }
      return {
        title: n.title,
        summary: n.summary,
        content: n.content,
        reporter: n.reporter,
        source: n.source,
      }
    },
  }
}

export function useStore() {
  const store = inject<ReturnType<typeof createStore>>(StoreSymbol)
  if (!store) throw new Error('useStore must be used within app with Store provided')
  return store
}