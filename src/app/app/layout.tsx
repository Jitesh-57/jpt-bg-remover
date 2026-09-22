import type { Metadata } from "next";
import AppShell from "./_components/AppShell";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/**
 * The logged-in app shell. Everything under /app renders inside AppShell —
 * a client component because it needs the session, the sidebar's collapsed
 * state and the ⌘K listener, none of which exist on the server. NavBar and
 * Footer stop themselves rendering on /app/* paths (see their own pathname
 * guards) so this is the only chrome this segment gets.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
