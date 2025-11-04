import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { fetchRSS, parseRSS } from "../rss";
import { useI18n } from "../i18n";

const presets = [
  { name: "36氪", url: "https://36kr.com/feed" },
  { name: "IT之家", url: "https://www.ithome.com/rss/" },
  { name: "cnBeta", url: "https://www.cnbeta.com/backend.php" },
  { name: "Solidot", url: "https://www.solidot.org/index.rss" },
  { name: "少数派", url: "https://www.sspai.com/feed" },
  { name: "爱范儿", url: "https://www.ifanr.com/feed" },
  { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "Reuters World", url: "https://feeds.reuters.com/reuters/worldNews" },
];

export default function ImportRSSPage() {
  const { addNews, state } = useStore();
  const { t } = useI18n();
  const [rssUrl, setRssUrl] = useState(presets[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [success, setSuccess] = useState<string | null>(null);

  const presetNames = useMemo(() => presets.map((p) => p.name), []);

  const load = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      const xml = await fetchRSS(rssUrl);
      const parsed = parseRSS(xml);
      // 构建已有链接/唯一键集合（避免重复导入）
      const existingKeys = new Set<string>();
      for (const n of state.news) {
        const key = (n.link && n.link.trim().length > 0) ? n.link : `${n.title}|${n.createdAt.slice(0,10)}`;
        existingKeys.add(key);
      }
      const seen = new Set<string>();
      let added = 0;
      let skipped = 0;
      // 先按时间从新到旧遍历，遇到重复则向下递推更旧的条目
      for (const it of parsed) {
        if (added >= count) break;
        const key = (it.link && it.link.trim().length > 0) ? it.link : `${it.title}|${(it as any).createdAt?.slice(0,10) ?? ""}`;
        if (seen.has(key)) { skipped++; continue; }
        seen.add(key);
        if (existingKeys.has(key)) { skipped++; continue; }
        addNews(it);
        added += 1;
      }
      setSuccess(t('importSuccess', { added, skipped }));
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>{t('importTitle')}</h2>
      <p>{t('importDesc')}</p>
      <div style={{padding:'10px 12px', border:'1px solid #f0c36d', background:'#fff8e1', color:'#8a6d3b', borderRadius:6, margin:'10px 0'}}>
        {t('importHint')}
      </div>
      <form className="form" onSubmit={load}>
        <div className="form-row">
          <label>{t('rssAddressLabel')}</label>
          <input value={rssUrl} onChange={(e)=>setRssUrl(e.target.value)} placeholder="https://.../rss.xml" />
        </div>
        <div className="form-row">
          <label>{t('importCountLabel')}</label>
          <select value={count} onChange={(e)=>setCount(Number(e.target.value))}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <div className="actions">
          <button type="submit" className="btn primary" disabled={loading}>{loading?"Loading...":t('importToHome')}</button>
          <Link to="/" className="btn">{t('backHome')}</Link>
        </div>
      </form>
      {error && <p style={{color:'red'}}>{error}</p>}
      {success && <p style={{color:'#2f7a1f', background:'#e9f7ef', border:'1px solid #b6e2c9', padding:'8px 10px', borderRadius:6}}>{success}</p>}

      <div>
        <strong>{t('presetsTitle')}</strong>
        <ul className="news-list">
          {presets.map(p => (
            <li key={p.url} className="news-card" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <span>{p.name}</span>
              <button className="btn" onClick={()=>setRssUrl(p.url)}>{t('usePreset')}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}