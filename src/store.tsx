import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { News, Vote, VoteCounts, VoteChoice, NewsStatus } from "./types";
import { importRSSItems } from "./rss";

type State = {
  news: News[];
  votesByNews: Record<number, Vote[]>;
};

type Action =
  | { type: "ADD_NEWS"; payload: Omit<News, "id" | "createdAt"> & { createdAt?: string } }
  | { type: "ADD_VOTE"; payload: Omit<Vote, "id" | "createdAt"> & { createdAt?: string } }
  | { type: "CLEAR_IMPORTED" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_NEWS": {
      const nextId = (state.news.length === 0
        ? 1
        : Math.max(...state.news.map((n) => n.id)) + 1);
      const createdAt = action.payload.createdAt ?? new Date().toISOString();
      const news: News = { id: nextId, createdAt, ...action.payload };
      return { ...state, news: [news, ...state.news] };
    }
    case "ADD_VOTE": {
      const createdAt = action.payload.createdAt ?? new Date().toISOString();
      const id = `${action.payload.newsId}-${createdAt}-${Math.random().toString(36).slice(2)}`;
      const vote: Vote = { id, createdAt, ...action.payload } as Vote;
      const arr = state.votesByNews[action.payload.newsId] ?? [];
      return {
        ...state,
        votesByNews: { ...state.votesByNews, [action.payload.newsId]: [vote, ...arr] },
      };
    }
    case "CLEAR_IMPORTED": {
      const kept = state.news.filter((n) => !n.link);
      const keptIds = new Set(kept.map((n) => n.id));
      const nextVotes: Record<number, Vote[]> = {};
      for (const [k, v] of Object.entries(state.votesByNews)) {
        const id = Number(k);
        if (keptIds.has(id)) nextVotes[id] = v;
      }
      return { news: kept, votesByNews: nextVotes };
    }
    default:
      return state;
  }
}

function seedNews(count = 24): News[] {
  const reporters = ["Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry"];
  const topics = [
    "City event draws crowd",
    "New tech launch surprises market",
    "Weather alert issued for region",
    "Policy change impacts commuters",
    "Sports team secures dramatic win",
    "Museum opens new exhibition",
    "Community cleanup initiative",
    "Health advisory released",
  ];
  const arr: News[] = Array.from({ length: count }, (_, i) => {
    const title = `${topics[i % topics.length]} #${i + 1}`;
    const reporter = reporters[i % reporters.length];
    const createdAt = new Date(Date.now() - i * 36e5).toISOString();
    return {
      id: i + 1,
      title,
      summary:
        "This is a short summary to help readers quickly grasp the context of the report.",
      content:
        "Full details of the news including background, quotes, and context. This content is mock data used to demonstrate pagination and filtering in the UI.",
      reporter,
      createdAt,
      imageUrl: `https://picsum.photos/seed/news_${i + 1}/960/540`,
    };
  });
  return arr;
}

function seedVotes(news: News[]): Record<number, Vote[]> {
  const votes: Record<number, Vote[]> = {};
  for (const n of news) {
    const sample = Math.floor(Math.random() * 6); // 0..5 votes
    votes[n.id] = Array.from({ length: sample }).map((_, j) => {
      const choice: VoteChoice = Math.random() < 0.5 ? "fake" : "not_fake";
      const createdAt = new Date(Date.now() - (j + 1) * 12e5).toISOString();
      return {
        id: `${n.id}-${j}-${Math.random().toString(36).slice(2)}`,
        newsId: n.id,
        choice,
        comment:
          j % 2 === 0
            ? "Providing context and links to support the vote."
            : undefined,
        imageUrl: j % 3 === 0 ? `https://picsum.photos/seed/vote_${n.id}_${j}/320/180` : undefined,
        voter: ["UserA", "UserB", "UserC"][j % 3],
        createdAt,
      } as Vote;
    });
  }
  return votes;
}

const LS_KEY = "fakeNews_state_v1";

function loadFromStorage(): State | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // basic shape validation
    if (!Array.isArray(parsed?.news) || typeof parsed?.votesByNews !== "object") return null;
    return parsed as State;
  } catch {
    return null;
  }
}

function saveToStorage(state: State) {
  try {
    const toSave = JSON.stringify(state);
    localStorage.setItem(LS_KEY, toSave);
  } catch {
    // ignore
  }
}

const initialState: State = loadFromStorage() ?? { news: seedNews(), votesByNews: {} };
if (Object.keys(initialState.votesByNews).length === 0) {
  initialState.votesByNews = seedVotes(initialState.news);
}

const StoreContext = createContext<{
  state: State;
  addNews: (payload: Omit<News, "id" | "createdAt"> & { createdAt?: string }) => void;
  addVote: (payload: Omit<Vote, "id" | "createdAt"> & { createdAt?: string }) => void;
  getVoteCounts: (newsId: number) => VoteCounts;
  getStatus: (newsId: number) => NewsStatus;
  getComments: (newsId: number) => Vote[];
  clearImported: () => void;
} | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const api = useMemo(() => {
    const addNews: (payload: Omit<News, "id" | "createdAt"> & { createdAt?: string }) => void = (
      payload,
    ) => dispatch({ type: "ADD_NEWS", payload });

    const addVote: (payload: Omit<Vote, "id" | "createdAt"> & { createdAt?: string }) => void = (
      payload,
    ) => dispatch({ type: "ADD_VOTE", payload });

    const clearImported = () => dispatch({ type: "CLEAR_IMPORTED" });

    const getVoteCounts = (newsId: number): VoteCounts => {
      const arr = state.votesByNews[newsId] ?? [];
      return arr.reduce(
        (acc, v) => {
          if (v.choice === "fake") acc.fake += 1;
          else acc.not_fake += 1;
          return acc;
        },
        { fake: 0, not_fake: 0 } as VoteCounts,
      );
    };

    const getStatus = (newsId: number): NewsStatus => {
      const { fake, not_fake } = getVoteCounts(newsId);
      if (fake === 0 && not_fake === 0) return "Undecided";
      if (fake > not_fake) return "Fake";
      if (not_fake > fake) return "Not Fake";
      return "Undecided"; // tie
    };

    const getComments = (newsId: number): Vote[] => {
      const arr = state.votesByNews[newsId] ?? [];
      return arr.filter((v) => v.comment && v.comment.trim().length > 0);
    };

    return { addNews, addVote, getVoteCounts, getStatus, getComments, clearImported };
  }, [state]);

  // Persist to localStorage on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Auto import 20 RSS items on mount, with simple de-dup by link
  useEffect(() => {
    const existingLinks = new Set<string>();
    for (const n of state.news) if (n.link) existingLinks.add(n.link);
    const run = async () => {
      try {
        await importRSSItems({ count: 20, existingLinks, addNews });
      } catch (e) {
        // best-effort; ignore
        console.warn("RSS auto import failed", e);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreContext.Provider value={{ state, ...api }}>{children}</StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}