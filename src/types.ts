export type VoteChoice = "fake" | "not_fake";

export interface News {
  id: number;
  title: string;
  summary: string;
  content: string;
  reporter: string;
  createdAt: string; // ISO string
  imageUrl?: string;
  source?: string; // 来源（RSS 站点名）
  link?: string; // 原文链接
  translations?: {
    en?: {
      title: string;
      summary: string;
      content: string;
      reporter?: string;
      source?: string;
    }
  };
}

export interface Vote {
  id: string;
  newsId: number;
  choice: VoteChoice;
  comment?: string;
  imageUrl?: string;
  voter?: string;
  createdAt: string; // ISO
}

export interface VoteCounts {
  fake: number;
  not_fake: number;
}

export type NewsStatus = "Fake" | "Not Fake" | "Undecided";
