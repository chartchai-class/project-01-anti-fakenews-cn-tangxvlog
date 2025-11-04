import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import { useI18n } from "../i18n";

export default function VotePage() {
  const { id } = useParams();
  const newsId = Number(id);
  const nav = useNavigate();
  const { state, addVote } = useStore();
  const { t } = useI18n();
  const n = state.news.find((x) => x.id === newsId);
  const [choice, setChoice] = useState<"fake" | "not_fake">("fake");
  const [comment, setComment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [voter, setVoter] = useState("");

  if (!n) {
    return (
      <div className="container">
        <p>{t('notFound')}</p>
        <Link className="btn" to="/">{t('backHome')}</Link>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    addVote({ newsId, choice, comment: comment.trim() || undefined, imageUrl: imageUrl.trim() || undefined, voter: voter.trim() || undefined });
    nav(`/news/${newsId}`);
  };

  return (
    <div className="container">
      <h2>{t('votePageTitle', { title: n.title })}</h2>
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <label>{t('yourJudgement')}</label>
          <label><input type="radio" name="choice" checked={choice==='fake'} onChange={()=>setChoice('fake')} /> {t('fakeOption')}</label>
          <label><input type="radio" name="choice" checked={choice==='not_fake'} onChange={()=>setChoice('not_fake')} /> {t('notFakeOption')}</label>
        </div>
        <div className="form-row">
          <label>{t('yourName')}</label>
          <input value={voter} onChange={(e)=>setVoter(e.target.value)} placeholder="" />
        </div>
        <div className="form-row">
          <label>{t('commentNote')}</label>
          <textarea value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="" rows={5} />
        </div>
        <div className="form-row">
          <label>{t('evidenceUrl')}</label>
          <input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="actions">
          <button type="submit" className="btn primary">{t('submit')}</button>
          <Link to={`/news/${newsId}`} className="btn">{t('backDetails')}</Link>
        </div>
      </form>
    </div>
  );
}