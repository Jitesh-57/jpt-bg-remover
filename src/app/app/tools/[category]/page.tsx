import { notFound } from "next/navigation";
import ToolsBrowser from "../../_components/ToolsBrowser";
import { CAT_META, type AppCat } from "@/lib/app-catalog";
import type { CategoryId } from "@/lib/dashboard-catalog";

const VALID_CATS = new Set<string>(Object.keys(CAT_META) as AppCat[]);

function resolveCategory(param: string): CategoryId | null {
  if (param === "free" || param === "utility") return "utility";
  if (VALID_CATS.has(param)) return param as AppCat;
  return null;
}

export default function ToolsCategoryPage({ params }: { params: { category: string } }) {
  const category = resolveCategory(params.category);
  if (!category) notFound();
  return <ToolsBrowser initialCategory={category} />;
}
