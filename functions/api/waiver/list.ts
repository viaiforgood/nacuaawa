export interface Env {
  DB?: any;
  BUCKET?: any;
  WAIVER_KV?: any;
  WAIVER_ADMIN_KEY?: string;
  ADMIN_KEY?: string;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const url = new URL(request.url);
  const providedKey = request.headers.get("X-Admin-Secret") ||
                      request.headers.get("x-admin-key") ||
                      url.searchParams.get("key") ||
                      "";

  const expectedKey = env.WAIVER_ADMIN_KEY || env.ADMIN_KEY || "Nacuaanc@2026";

  if (!providedKey || providedKey !== expectedKey) {
    return new Response(JSON.stringify({
      error: "401 Unauthorized",
      message: "Invalid or missing administrative secret key"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const query = url.searchParams.get("q")?.toLowerCase() || "";
  const clubFilter = url.searchParams.get("club") || "";

  let results: any[] = [];

  if (env.DB) {
    try {
      let sql = "SELECT * FROM waivers WHERE 1=1";
      const params: any[] = [];

      if (clubFilter) {
        if (clubFilter === "other") {
          sql += " AND club LIKE 'other:%'";
        } else {
          sql += " AND (club = ? OR club = ?)";
          params.push(clubFilter, `other:${clubFilter}`);
        }
      }
      if (query) {
        sql += " AND (LOWER(activity_name) LIKE ? OR LOWER(participant_name) LIKE ? OR LOWER(guardian_name) LIKE ? OR LOWER(club) LIKE ?)";
        const pattern = `%${query}%`;
        params.push(pattern, pattern, pattern, pattern);
      }

      sql += " ORDER BY created_at DESC LIMIT 500";

      const stmt = env.DB.prepare(sql).bind(...params);
      const rows = await stmt.all();
      results = rows.results || [];
    } catch (e: any) {
      console.warn("DB Query error:", e);
    }
  } else if (env.WAIVER_KV) {
    try {
      const keysList = await env.WAIVER_KV.list({ prefix: "waiver:" });
      for (const k of keysList.keys) {
        const val = await env.WAIVER_KV.get(k.name, "json");
        if (val) results.push(val);
      }
      results.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());
    } catch (e) {
      console.warn("KV Query error:", e);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    count: results.length,
    waivers: results
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};
