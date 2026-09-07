import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, toUserDTO } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));

  const patch: Partial<typeof users.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return Response.json({ error: "Name is too short." }, { status: 400 });
    patch.name = name.slice(0, 80);
  }
  if (body.readingGoal !== undefined) {
    const goal = Math.round(+body.readingGoal);
    if (!Number.isFinite(goal) || goal < 1 || goal > 500)
      return Response.json({ error: "Goal must be between 1 and 500 books." }, { status: 400 });
    patch.readingGoal = goal;
  }

  const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
  return Response.json({ user: toUserDTO(updated) });
}
