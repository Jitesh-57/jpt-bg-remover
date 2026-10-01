/**
 * trial-batches.ts — countries grouped by how likely they are to pay for AI
 * image editing, for switching free trials on a batch at a time at /admin/trials.
 *
 * The order comes from what consumer AI photo apps (Remini, Lensa, Picsart,
 * Photoroom and the like) are known to earn per user by market: spending
 * power, card use for small online purchases, and how big creator and
 * e-commerce selling is there. It is a starting point; the "Which countries
 * buy" table on the same page replaces it with this site's own numbers as
 * they come in.
 */

export interface TrialBatch {
  id: string;
  name: string;
  /** Why this group, in one line. */
  why: string;
  /** Suggested trial size: richer markets earn back a bigger trial. */
  credits: number;
  countries: string[];
}

/** The rule that covers every country without its own row. Not a real country code. */
export const WORLDWIDE = "XX";

export const TRIAL_BATCHES: TrialBatch[] = [
  {
    id: "b1",
    name: "Batch 1 · Top payers",
    why: "English-speaking, highest spend per user on AI photo apps. The US alone is often 35–45% of revenue.",
    credits: 2,
    countries: ["US", "GB", "CA", "AU", "NZ", "IE"],
  },
  {
    id: "b2",
    name: "Batch 2 · Rich Europe & Nordics",
    why: "High income, high card use. Nordics and Switzerland pay the most per user in Europe.",
    credits: 2,
    countries: ["DE", "CH", "AT", "NL", "BE", "LU", "SE", "NO", "DK", "FI", "IS", "FR"],
  },
  {
    id: "b3",
    name: "Batch 3 · Rich Asia & Gulf",
    why: "Big spenders on photo and beauty apps (Japan, Korea) and high income per head (Singapore, Gulf).",
    credits: 2,
    countries: ["JP", "KR", "SG", "HK", "TW", "AE", "SA", "QA", "KW", "IL"],
  },
  {
    id: "b4",
    name: "Batch 4 · Growing payers",
    why: "Large creator and e-commerce scenes and a fair share of paying users. Lower spend per user.",
    credits: 2,
    countries: ["IT", "ES", "PT", "PL", "CZ", "BR", "MX", "CL", "MY", "ZA"],
  },
  {
    id: "b5",
    name: "Batch 5 · High volume, low price",
    why: "Many signups but few buy, and these see the most trial abuse. Switch on last, and only with a small trial.",
    credits: 2,
    countries: ["IN", "ID", "PH", "VN", "TH", "TR", "EG", "NG", "PK", "BD"],
  },
];
