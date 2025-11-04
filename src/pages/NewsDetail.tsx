import { useParams, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useStore, formatDate } from "../store";
import { useI18n } from "../i18n";

export default function NewsDetailPage() {
  const { id } = useParams();
  const newsId = Number(id);
  const { state, getStatus, getVoteCounts, getComments } = useStore();
  const { t } = useI18n();
  const n = state.news.find((x) => x.id === newsId);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const comments = useMemo(() => getComments(newsId), [newsId, getComments]);
  const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));
  const current = comments.slice((page - 1) * pageSize, page * pageSize);

  if (!n) {
    return (
      <div className="container">
        <p>{t('notFound')}</p>
        <Link className="btn" to="/">{t('backHome')}</Link>
      </div>
    );
  }

  const status = getStatus(n.id);
  const counts = getVoteCounts(n.id);

  return (
    <div className="container">
      <div className="detail">
        <h2 className="title">{n.title}</h2>
        <div className="meta">
          <span className={`status ${status === "Fake" ? "fake" : status === "Not Fake" ? "not-fake" : "undecided"}`}>{status === 'Fake' ? t('status_fake') : status === 'Not Fake' ? t('status_not_fake') : t('status_undecided')}</span>
          <span>{t('reporter')}：{n.reporter}</span>
          <span>{t('date')}：{formatDate(n.createdAt)}</span>
          {n.source && <span>{t('source')}：{n.source}</span>}
        </div>
        {n.imageUrl && (
          <img className="cover" src={n.imageUrl} alt={n.title} />
        )}
        <p className="content">{n.content}</p>
        <div className="results">
          <strong>{t('voteResults')}</strong>
          <span className="chip fake">{t('fakeShort')}：{counts.fake}</span>
          <span className="chip not-fake">{t('notFakeShort')}：{counts.not_fake}</span>
        </div>
        <div className="actions">
          <Link to={`/news/${n.id}/vote`} className="btn primary">{t('goVoteAddComment')}</Link>
          <Link to="/" className="btn">{t('backHome')}</Link>
          {n.link && <a className="btn" href={n.link} target="_blank" rel="noreferrer">{t('viewOriginal')}</a>}
        </div>
      </div>

      <section className="comments">
        <div className="comments-header">
          <h3>{t('commentsTitle')}</h3>
          <div>
            {t('perPage')}
            <select value={pageSize} onChange={(e)=>{setPageSize(Number(e.target.value)); setPage(1);}}>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            {t('items')}
          </div>
        </div>
        <ul className="comment-list">
          {current.length === 0 && <li>{t('noComments')}</li>}
          {current.map((c) => (
            <li key={c.id} className="comment">
              <div className="comment-meta">
                <span>{c.voter ?? t('anonymous')}</span>
                <span>{formatDate(c.createdAt)}</span>
                <span className={`chip ${c.choice === "fake" ? "fake" : "not-fake"}`}>{c.choice === "fake" ? t('fakeShort') : t('notFakeShort')}</span>
              </div>
              {c.comment && <p className="comment-text">{c.comment}</p>}
              {c.imageUrl && (
                <img className="comment-img" src={c.imageUrl} alt="evidence" />
              )}
            </li>
          ))}
        </ul>
        <div className="pagination">
          <button disabled={page===1} onClick={()=>setPage(page-1)}>{t('prev')}</button>
          <span>{t('page', { page, total: totalPages, count: comments.length })}</span>
          <button disabled={page===totalPages} onClick={()=>setPage(page+1)}>{t('next')}</button>
        </div>
      </section>
    </div>
  );
}