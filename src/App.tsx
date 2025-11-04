import './App.css'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { useI18n } from './i18n'
import HomePage from './pages/Home'
import NewsDetailPage from './pages/NewsDetail'
import VotePage from './pages/Vote'
import ReportNewsPage from './pages/ReportNews'
import ImportRSSPage from './pages/ImportRSS'

function App() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="layout">
      <header className="header">
        <div className="brand">
          <Link to="/">{t('brand')}</Link>
        </div>
        <nav className="nav" style={{display:'flex', alignItems:'center'}}>
          <span style={{color:'#666'}}>{t('language')}</span>
          <select value={lang} onChange={(e)=>setLang(e.target.value as any)} style={{marginLeft:8}}>
            <option value="zh">{t('zh')}</option>
            <option value="en">{t('en')}</option>
          </select>
          <span style={{marginLeft:12}}></span>
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>{t('nav_home')}</NavLink>
          <NavLink to="/report" className={({isActive}) => isActive ? 'active' : ''}>{t('nav_report')}</NavLink>
          <NavLink to="/import" className={({isActive}) => isActive ? 'active' : ''}>{t('nav_import')}</NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/news/:id/vote" element={<VotePage />} />
          <Route path="/report" element={<ReportNewsPage />} />
          <Route path="/import" element={<ImportRSSPage />} />
        </Routes>
      </main>
      <footer className="footer">© {new Date().getFullYear()} {t('brand')} Demo</footer>
    </div>
  )
}

export default App
