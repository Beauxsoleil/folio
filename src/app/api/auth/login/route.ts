import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, toUserDTO } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/db/seed";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    let email = String(body.email ?? "").trim().toLowerCase();
    let password = String(body.password ?? "");
    if (body.demo === true) {
      email = DEMO_EMAIL;
      password = DEMO_PASSWORD;
    }

    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Demo resilience: on a fresh/empty database (e.g. seeding was disabled or
    // is still running), materialize a bare demo reader instead of failing.
    if (!user && body.demo === true) {
      try {
        const { ensureSeed } = await import("@/db/seed");
        await ensureSeed();
      } catch {
        // seeding is best-effort here
      }
      [user] = (
        await db.select().from(users).where(eq(users.email, email)).limit(1)
      );
      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            email: DEMO_EMAIL,
            name: "Avery Quinn",
            passwordHash: hashPassword(DEMO_PASSWORD),
            readingGoal: 30,
          })
          .onConflictDoNothing()
          .returning();
        [user] = user ? [user] : await db.select().from(users).where(eq(users.email, email)).limit(1);
      }
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ error: "Incorrect email or password." }, { status: 401 });
    }
    await createSession(user.id);
    return Response.json({ user: toUserDTO(user) });
  } catch (error) {
    console.error("login failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
