import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, toUserDTO } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    if (password.length < 8)
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0)
      return Response.json({ error: "An account with this email already exists." }, { status: 409 });

    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: hashPassword(password) })
      .returning();
    await createSession(user.id);
    return Response.json({ user: toUserDTO(user) }, { status: 201 });
  } catch (error) {
    console.error("signup failed", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
