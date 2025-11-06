import React, { createContext, useContext, useMemo, useState } from "react";

export type UILang = "zh" | "en";

const dict = {
  zh: {
    // 通用与首页
    brand: "Social Anti-Fake News",
    nav_home: "首页",
    nav_report: "报料新闻",
    nav_import: "RSS导入",
    all: "全部",
    fake: "假新闻",
    not_fake: "非假新闻",
    status_fake: "假",
    status_not_fake: "非假",
    status_undecided: "未定",
    perPage: "每页显示",
    items: "条",
    reportButton: "+ 报料新闻",
    clearImported: "清空导入新闻",
    confirmClearImported: "确定只清空导入的新闻？本地投票与评论保留。",
    boostVotes: "补充示例投票（约20/条）",
    confirmBoostVotes: "为预设新闻补充投票至约20条/条？不影响导入新闻。",
    details: "详情",
    vote: "投票/评论",
    page: "第 {page} / {total} 页， 共 {count} 条",
    prev: "上一页",
    next: "下一页",
    noMatch: "暂无符合筛选的新闻",
    language: "语言",
    zh: "中文",
    en: "英文",
    reporter: "记者",
    date: "时间",
    source: "来源",
    notFound: "该新闻不存在。",
    backHome: "返回首页",

    // 详情页
    voteResults: "投票结果：",
    fakeShort: "假",
    notFakeShort: "非假",
    goVoteAddComment: "去投票/添加评论",
    viewOriginal: "查看原文",
    commentsTitle: "评论列表",
    noComments: "暂无评论，欢迎发表你的看法。",
    anonymous: "匿名",

    // 投票页
    votePageTitle: "为“{title}”投票与评论",
    yourJudgement: "你的判断：",
    fakeOption: "假",
    notFakeOption: "非假",
    yourName: "你的昵称：",
    commentNote: "评论说明：",
    evidenceUrl: "佐证图片链接（URL）：",
    submit: "提交",
    backDetails: "返回详情",

    // 报料页
    reportPageTitle: "报料新闻",
    titleLabel: "标题：",
    summaryLabel: "摘要：",
    contentLabel: "全文：",
    reporterLabel: "记者名：",
    imageUrlLabel: "事件图片链接（URL）：",
    submitReport: "提交报料",
    returnHome: "返回首页",
    reportValidationAlert: "请填写标题、摘要、全文和记者名",

    // RSS导入页
    importTitle: "从 RSS 导入新闻",
    importDesc: "此功能通过内置多重代理抓取跨域 RSS（适配国内网络），仅用于演示。导入后新闻将出现在首页，并可参与投票与评论。",
    rssAddressLabel: "RSS 地址：",
    importCountLabel: "导入条数：",
    importToHome: "导入到首页",
    presetsTitle: "常用预设：",
    usePreset: "使用",
    importHint: "提示：RSS 导入可能会失败；成功率最高的是 BBC World。",
    importSuccess: "导入成功：新增 {added} 条，跳过重复 {skipped} 条。",
  },
  en: {
    // Common & Home
    brand: "Social Anti-Fake News",
    nav_home: "Home",
    nav_report: "Report",
    nav_import: "Import RSS",
    all: "All",
    fake: "Fake",
    not_fake: "Not Fake",
    status_fake: "Fake",
    status_not_fake: "Not Fake",
    status_undecided: "Undecided",
    perPage: "Per page",
    items: "items",
    reportButton: "+ Report News",
    clearImported: "Clear Imported News",
    confirmClearImported: "Clear only imported news? Local votes/comments retained.",
    boostVotes: "Boost Seed Votes (~20 each)",
    confirmBoostVotes: "Boost votes for seeded news to ~20 each? Imported unaffected.",
    details: "Details",
    vote: "Vote/Comment",
    page: "Page {page} / {total}, total {count}",
    prev: "Prev",
    next: "Next",
    noMatch: "No news matches the filter",
    language: "Language",
    zh: "Chinese",
    en: "English",
    reporter: "Reporter",
    date: "Date",
    source: "Source",
    notFound: "News not found.",
    backHome: "Back to Home",

    // Detail page
    voteResults: "Vote results:",
    fakeShort: "Fake",
    notFakeShort: "Not Fake",
    goVoteAddComment: "Go Vote / Add Comment",
    viewOriginal: "View Original",
    commentsTitle: "Comments",
    noComments: "No comments yet. Share your thoughts!",
    anonymous: "Anonymous",

    // Vote page
    votePageTitle: "Vote & Comment for \"{title}\"",
    yourJudgement: "Your judgement:",
    fakeOption: "Fake",
    notFakeOption: "Not Fake",
    yourName: "Your name:",
    commentNote: "Comment:",
    evidenceUrl: "Evidence image URL:",
    submit: "Submit",
    backDetails: "Back to Details",

    // Report page
    reportPageTitle: "Report News",
    titleLabel: "Title:",
    summaryLabel: "Summary:",
    contentLabel: "Content:",
    reporterLabel: "Reporter:",
    imageUrlLabel: "Image URL:",
    submitReport: "Submit Report",
    returnHome: "Back to Home",
    reportValidationAlert: "Please fill title, summary, content and reporter",

    // Import RSS
    importTitle: "Import News from RSS",
    importDesc: "This uses built-in multi-proxy fetching (Mainland-friendly) to bypass CORS. After import, items appear on Home and can be voted and commented.",
    rssAddressLabel: "RSS URL:",
    importCountLabel: "Count:",
    importToHome: "Import to Home",
    presetsTitle: "Presets:",
    usePreset: "Use",
    importHint: "Note: RSS import may fail; BBC World has the highest success rate.",
    importSuccess: "Imported successfully: added {added} items, skipped {skipped} duplicates.",
  },
} as const;

function format(template: string, params: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
}

const I18nContext = createContext<{
  lang: UILang;
  setLang: (l: UILang) => void;
  t: (key: keyof typeof dict["zh"], params?: Record<string, string | number>) => string;
} | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<UILang>((localStorage.getItem("ui_lang") as UILang) || "zh");
  const api = useMemo(() => {
    const t = (key: keyof typeof dict["zh"], params?: Record<string, string | number>) => {
      const s = dict[lang][key] as string;
      return params ? format(s, params) : s;
    };
    return { t };
  }, [lang]);

  const setLangPersist = (l: UILang) => {
    setLang(l);
    try { localStorage.setItem("ui_lang", l); } catch {}
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangPersist, t: api.t }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}