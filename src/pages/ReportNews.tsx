import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { useI18n } from "../i18n";

export default function ReportNewsPage() {
  const nav = useNavigate();
  const { addNews } = useStore();
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [reporter, setReporter] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim() || !reporter.trim()) {
      alert(t('reportValidationAlert'));
      return;
    }
    addNews({ title: title.trim(), summary: summary.trim(), content: content.trim(), reporter: reporter.trim(), imageUrl: imageUrl.trim() || undefined });
    nav("/");
  };

  return (
    <div className="container">
      <h2>{t('reportPageTitle')}</h2>
      <form className="form" onSubmit={submit}>
        <div className="form-row">
          <label>{t('titleLabel')}</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t('summaryLabel')}</label>
          <textarea rows={3} value={summary} onChange={(e)=>setSummary(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t('contentLabel')}</label>
          <textarea rows={6} value={content} onChange={(e)=>setContent(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t('reporterLabel')}</label>
          <input value={reporter} onChange={(e)=>setReporter(e.target.value)} />
        </div>
        <div className="form-row">
          <label>{t('imageUrlLabel')}</label>
          <input value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="actions">
          <button type="submit" className="btn primary">{t('submitReport')}</button>
          <Link to="/" className="btn">{t('returnHome')}</Link>
        </div>
      </form>
    </div>
  );
}