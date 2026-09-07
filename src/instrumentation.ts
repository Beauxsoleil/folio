export async function register() {
  // On boot: provision tables and, if the DB is empty, seed the demo library.
  // Set FOLIO_DISABLE_SEED=1 in production to skip this entirely.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.FOLIO_DISABLE_SEED !== "1") {
    try {
      const { ensureSeed } = await import("@/db/seed");
      await ensureSeed();
    } catch (error) {
      console.error("[folio] auto-seed skipped:", error);
    }
  }
}
