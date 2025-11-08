import type { News } from "./types";

// 通过多重代理抓取RSS，提升在不同网络环境下的可用性
export async function fetchRSS(url: string) {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://allorigins.hexlet.app/raw?url=${encodeURIComponent(u)}`,
    // r.jina.ai 可对任意URL做转发，支持https/http
    (u: string) => `https://r.jina.ai/http/${u}`,
    // isomorphic-git 的简易CORS代理（只支持https）
    (u: string) => u.startsWith("https://") ? `https://cors.isomorphic-git.org/${u}` : `https://cors.isomorphic-git.org/http://${u.replace(/^http:\/\//, "")}`,
  ];

  const errors: unknown[] = [];
  for (const p of proxies) {
    const target = p(url);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(target, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`代理失败(${res.status}) ${target}`);
      const text = await res.text();
      if (!text || text.trim().length === 0) throw new Error(`空响应 ${target}`);
      return text;
    } catch (e) {
      errors.push(e);
      // 尝试下一个代理
    }
  }
  const toMessage = (e: unknown) => {
    if (typeof e === 'object' && e && 'message' in e) {
      // Narrow to an object with optional message
      const msg = (e as { message?: unknown }).message;
      return String(msg ?? '') || String(e);
    }
    return String(e);
  };
  throw new Error(`RSS获取失败（所有代理均不可用）: ${errors.map(toMessage).join(" | ")}`);
}

export function parseRSS(xmlText: string) {
  const dom = new DOMParser().parseFromString(xmlText, "text/xml");
  const channelTitle = dom.querySelector("channel > title")?.textContent
    ?? dom.querySelector("feed > title")?.textContent
    ?? undefined;

  // 支持 RSS 的 <item> 与 Atom 的 <entry>
  const nodes = ((): Element[] => {
    const rssItems = Array.from(dom.querySelectorAll("item"));
    if (rssItems.length > 0) return rssItems;
    const atomEntries = Array.from(dom.querySelectorAll("entry"));
    return atomEntries;
  })();

  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

  return nodes.map((node) => {
    const title = node.querySelector("title")?.textContent ?? "(无标题)";

    // 描述/内容
    const description = node.querySelector("description")?.textContent
      ?? node.querySelector("summary")?.textContent
      ?? node.querySelector("content")?.textContent
      ?? "";

    // 发布时间（Atom优先 published/updated）
    const pubDateRaw = node.querySelector("pubDate")?.textContent
      ?? node.querySelector("published")?.textContent
      ?? node.querySelector("updated")?.textContent
      ?? new Date().toISOString();
    const createdAt = new Date(pubDateRaw).toISOString();

    // 链接（Atom为 <link href="...">，RSS可能存在 <guid> 作为唯一标识）
    let link: string | undefined = node.querySelector("link")?.textContent ?? undefined;
    if (!link) {
      const atomLink = node.querySelector('link[rel="alternate"]')?.getAttribute('href')
        ?? node.querySelector('link')?.getAttribute('href');
      if (atomLink) link = atomLink;
    }
    if (!link) {
      const guid = node.querySelector('guid')?.textContent ?? undefined;
      if (guid) link = guid; // 作为去重的唯一键回退
    }

    // 作者（RSS author/dc:creator；Atom author > name）
    const author = node.querySelector("author")?.textContent
      ?? (node.querySelector("dc\\:creator") as Element | null)?.textContent
      ?? node.querySelector("author > name")?.textContent
      ?? channelTitle
      ?? "RSS";

    // 图片（enclosure/media:content/从HTML解析img）
    const enclosure = node.querySelector("enclosure")?.getAttribute("url") ?? undefined;
    const mediaContent = (node.querySelector("media\\:content") as Element | null)?.getAttribute("url") ?? undefined;
    let imageUrl = enclosure || mediaContent;
    if (!imageUrl) {
      const m = description.match(/<img[^>]*src=["']([^"']+)["']/i);
      if (m) imageUrl = m[1];
    }

    const summary = stripHtml(description);
    return { title, summary, content: summary, reporter: author, createdAt, imageUrl, source: channelTitle, link } as Omit<News, "id">;
  });
}

// 默认使用在中国大陆网络环境下通常可访问的RSS源（优先）+国际源（回退）
const DEFAULT_SOURCES = [
  "https://36kr.com/feed",               // 36氪（Atom）
  "https://www.ithome.com/rss/",         // IT之家（RSS）
  "https://www.cnbeta.com/backend.php",  // cnBeta（RSS）
  "https://www.solidot.org/index.rss",   // Solidot（RSS）
  "https://www.sspai.com/feed",          // 少数派（RSS）
  "https://www.ifanr.com/feed",          // 爱范儿（RSS）
  // 国际源补充
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://feeds.reuters.com/reuters/worldNews",
  "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
  "https://www.aljazeera.com/xml/rss/all.xml",
];

export async function importRSSItems({
  count,
  addNews,
  existingLinks,
  sources = DEFAULT_SOURCES,
}: {
  count: number;
  addNews: (payload: Omit<News, "id" | "createdAt"> & { createdAt?: string }) => void;
  existingLinks?: Set<string>;
  sources?: string[];
}) {
  let added = 0;
  for (const src of sources) {
    if (added >= count) break;
    try {
      const xml = await fetchRSS(src);
      const items = parseRSS(xml);
      for (const it of items) {
        if (added >= count) break;
        if (existingLinks && it.link && existingLinks.has(it.link)) continue;
        addNews(it);
        added += 1;
      }
    } catch (e) {
      console.warn("RSS导入失败", src, e);
    }
  }
}
