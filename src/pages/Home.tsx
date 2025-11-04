import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore, formatDate } from "../store";
import { useI18n } from "../i18n";

type Filter = "all" | "fake" | "not_fake";

export default function HomePage() {
  const { state, getStatus, clearImported } = useStore();
  const { lang, setLang, t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // 统一计算当前所有新闻的状态，确保过滤与展示使用同一份数据
  const statusMap = useMemo(() => {
    const m = new Map<number, ReturnType<typeof getStatus>>();
    for (const n of state.news) m.set(n.id, getStatus(n.id));
    return m;
  }, [state.news, getStatus]);

  const filtered = useMemo(() => {
    return state.news.filter((n) => {
      const st = statusMap.get(n.id);
      if (filter === "all") return true;
      if (filter === "fake") return st === "Fake";
      if (filter === "not_fake") return st === "Not Fake";
      return true;
    });
  }, [state.news, statusMap, filter]);

  const counts = useMemo(() => {
    let fake = 0, notFake = 0;
    for (const n of state.news) {
      const st = statusMap.get(n.id);
      if (st === "Fake") fake += 1;
      else if (st === "Not Fake") notFake += 1;
    }
    return { fake, notFake };
  }, [state.news, statusMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const changePage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
  };

  return (
    <div className="container">
      <div className="toolbar">
        <div className="page-size" style={{marginRight: 'auto'}}>
          {t('language')}
          <select value={lang} onChange={(e)=>setLang(e.target.value as any)} style={{marginLeft: 6}}>
            <option value="zh">{t('zh')}</option>
            <option value="en">{t('en')}</option>
          </select>
        </div>
        <div className="filters">
          <button className={filter === "all" ? "active" : ""} onClick={() => {setFilter("all"); setPage(1);}}>{t('all')}</button>
          <button className={filter === "fake" ? "active" : ""} onClick={() => {setFilter("fake"); setPage(1);}}>{t('fake')} ({counts.fake})</button>
          <button className={filter === "not_fake" ? "active" : ""} onClick={() => {setFilter("not_fake"); setPage(1);}}>{t('not_fake')} ({counts.notFake})</button>
        </div>
        <div className="page-size">
          {t('perPage')}
          <select value={pageSize} onChange={(e) => {setPageSize(Number(e.target.value)); setPage(1);}}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          {t('items')}
        </div>
        <Link className="report-btn" to="/report">{t('reportButton')}</Link>
        <button className="btn" style={{marginLeft: 8}} onClick={() => {
          if (window.confirm(t('confirmClearImported'))) {
            clearImported();
            setPage(1);
          }
        }}>{t('clearImported')} ({state.news.filter(n=>!!n.link).length})</button>
      </div>

      <ul className="news-list">
        {current.length === 0 && <li className="news-card" style={{textAlign:'center'}}>{t('noMatch')}</li>}
        {current.map((n) => {
          const status = statusMap.get(n.id);
          const statusLabel = status === "Fake" ? t('status_fake') : status === "Not Fake" ? t('status_not_fake') : t('status_undecided');
          return (
            <li key={n.id} className="news-card">
              <div className="card-header">
                <h3 className="title">{n.title}</h3>
                <span className={`status ${status === "Fake" ? "fake" : status === "Not Fake" ? "not-fake" : "undecided"}`}>{statusLabel}</span>
              </div>
              <div className="card-body">
                <p className="summary">{n.summary}</p>
                <div className="meta">
                  <span>{t('reporter')}：{n.reporter}</span>
                  <span>{t('date')}：{formatDate(n.createdAt)}</span>
                </div>
                <div className="actions">
                  <Link to={`/news/${n.id}`} className="btn">{t('details')}</Link>
                  <Link to={`/news/${n.id}/vote`} className="btn primary">{t('vote')}</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="pagination">
        <button onClick={() => changePage(page - 1)} disabled={page === 1}>{t('prev')}</button>
        <span>
          {t('page', { page, total: totalPages, count: filtered.length })}
        </span>
        <button onClick={() => changePage(page + 1)} disabled={page === totalPages}>{t('next')}</button>
      </div>
    </div>
  );
}