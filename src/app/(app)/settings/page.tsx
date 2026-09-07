import { redirect } from "next/navigation";
import { getCurrentUser, toUserDTO } from "@/lib/auth";
import { SettingsView } from "@/components/settings-view";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <SettingsView user={toUserDTO(user)} />;
}
