import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listBooks, serializeBook } from "@/lib/queries";
import { LibraryView } from "@/components/library-view";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const all = await listBooks(user.id);

  return <LibraryView initialBooks={all.map(serializeBook)} initialAddOpen={sp.add === "1"} />;
}
