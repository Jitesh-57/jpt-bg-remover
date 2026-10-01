import type { Metadata } from "next";
import UsersAdmin from "./UsersAdmin";

export const metadata: Metadata = { title: "Users & credits — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  return <UsersAdmin />;
}
