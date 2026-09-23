"use client";

import { createContext, useContext } from "react";

export interface DashboardUser {
  userId: string;
  email?: string;
  name: string;
  picture?: string;
  credits: number;
  plan: string;
  /** True once the account has ever completed a purchase. */
  hasPurchased: boolean;
}

const Ctx = createContext<DashboardUser | null>(null);

export const DashboardUserProvider = Ctx.Provider;

/** The signed-in user powering the dashboard. AppShell guarantees this exists for anything rendered inside it. */
export function useDashboardUser(): DashboardUser {
  const u = useContext(Ctx);
  if (!u) throw new Error("useDashboardUser() called outside the /app shell");
  return u;
}
