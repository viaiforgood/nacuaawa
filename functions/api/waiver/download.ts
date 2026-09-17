export interface Env {
  DB?: any;
  BUCKET?: any;
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
    return new Response(JSON.stringify({ error: "401 Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing waiver ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!env.BUCKET) {
    return new Response(JSON.stringify({ error: "R2 storage bucket is not configured on this environment" }), {
      status: 501,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Look up R2 key in DB or construct key
  let r2Key = "";
  if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT r2_pdf_key FROM waivers WHERE id = ?").bind(id).first();
      if (row && row.r2_pdf_key) r2Key = row.r2_pdf_key;
    } catch(e) {}
  }

  if (!r2Key) {
    // Try scanning common paths
    r2Key = `waivers/${new Date().toISOString().slice(0, 7)}/${id}.pdf`;
  }

  const object = await env.BUCKET.get(r2Key);
  if (!object) {
    return new Response(JSON.stringify({ error: "PDF object not found in R2 archive" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `attachment; filename="NACUAAWA_Release_${id}.pdf"`);

  return new Response(object.body, { headers });
};
