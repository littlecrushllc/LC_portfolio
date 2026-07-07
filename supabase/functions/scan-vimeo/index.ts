// Supabase Edge Function: scan-vimeo
// Holds the Vimeo token as a secret (server-side) so the browser never sees it.
// The app POSTs the ids it already has; this returns Vimeo videos that are NEW.
//
// Deploy: Supabase dashboard → Edge Functions → create "scan-vimeo" → paste this → Deploy.
// Secret: add VIMEO_TOKEN (your Vimeo personal access token) in Edge Function secrets.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const token = Deno.env.get("VIMEO_TOKEN");
    if (!token) throw new Error("VIMEO_TOKEN secret is not set");

    const body = await req.json().catch(() => ({}));
    const known = new Set((body.knownIds ?? []).map(String));

    const fields =
      "uri,name,link,duration,privacy.view,parent_folder.name,pictures.sizes";
    let url =
      `https://api.vimeo.com/me/videos?per_page=100&sort=date&fields=${encodeURIComponent(fields)}`;

    const films: unknown[] = [];
    while (url) {
      const r = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.vimeo.*+json;version=3.4",
        },
      });
      if (!r.ok) throw new Error(`Vimeo ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const data = await r.json();

      for (const v of data.data ?? []) {
        const id = String(v.uri ?? "").split("/").pop();
        if (!id || known.has(id)) continue;

        const parts = String(v.link ?? "")
          .split("vimeo.com/").pop()!.split("?")[0].split("/").filter(Boolean);
        const hash = parts[1] ?? null;

        const sizes = v.pictures?.sizes ?? [];
        const usable = sizes.filter((s: { width?: number }) => (s.width ?? 0) <= 1280);
        const pick = (usable.length ? usable : sizes)
          .sort((a: { width?: number }, b: { width?: number }) => (b.width ?? 0) - (a.width ?? 0))[0];

        films.push({
          id,
          hash,
          title: v.name ?? "",
          vimeoUrl: v.link ?? "",
          playerUrl: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`,
          thumbnail: pick?.link ?? "",
          duration: v.duration ?? null,
          folder: v.parent_folder?.name ?? "",
        });
      }
      url = data.paging?.next ? `https://api.vimeo.com${data.paging.next}` : "";
    }

    return new Response(JSON.stringify({ films }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
