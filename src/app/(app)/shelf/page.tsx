import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listBooks, serializeBook } from "@/lib/queries";
import { ShelfView } from "@/components/shelf-view";

export const dynamic = "force-dynamic";

export default async function ShelfPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const all = await listBooks(user.id);
  return <ShelfView initialBooks={all.map(serializeBook)} />;
}
