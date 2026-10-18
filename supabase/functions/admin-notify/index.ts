import { createClient } from "npm:@supabase/supabase-js@2.49.8";

// Notification générique sans donnée personnelle.
// Secret requis côté Supabase : ADMIN_PUSH_WEBHOOK_URL.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messages: Record<string, string> = {
  nouvelle_demande: "Une nouvelle demande est disponible dans le tableau de bord sécurisé.",
  alerte_securite: "Une nouvelle alerte est disponible dans le tableau de bord sécurisé.",
  synchronisation_erreur: "Une synchronisation nécessite une vérification dans le tableau de bord.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Méthode refusée", { status: 405, headers: cors });

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return new Response("Authentification requise", { status: 401, headers: cors });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  if (!supabaseUrl || !anonKey) return new Response("Configuration serveur absente", { status: 503, headers: cors });

  // Le client transmet le JWT reçu à Auth : aucune clé de service n’est exposée ou nécessaire.
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) return new Response("Session refusée", { status: 401, headers: cors });

  let body: { type?: string } = {};
  try { body = await req.json(); } catch (_) {}
  const type = String(body.type || "");
  const message = messages[type];
  if (!message) return new Response("Type refusé", { status: 400, headers: cors });

  // Une demande peut provenir d’un candidat authentifié. Les alertes techniques sont admin + AAL2.
  if (type !== "nouvelle_demande") {
    const estAdmin = String(userData.user.email || "").toLowerCase() === "aymenessouyah@gmail.com";
    const { data: aal } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (!estAdmin || !aal || aal.currentLevel !== "aal2") {
      return new Response("Droits administrateur AAL2 requis", { status: 403, headers: cors });
    }
  }

  const webhook = Deno.env.get("ADMIN_PUSH_WEBHOOK_URL") || "";
  if (!webhook) {
    return new Response(JSON.stringify({ ok: true, delivered: false }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const rep = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, message, source: "STI V2.0" }),
  });
  return new Response(JSON.stringify({ ok: rep.ok, delivered: rep.ok }), {
    status: rep.ok ? 200 : 502,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
