/* =========================================================
   ADMR Côte-d'Or — /api/actus
   Lit les derniers posts de la page Facebook (API officielle Meta)
   et les renvoie en JSON pour le module vitrine.html.

   Réglages à faire UNE FOIS dans Cloudflare Pages
   (projet du site → Settings → Variables and Secrets) :
     FB_PAGE_ID      identifiant numérique de la page Facebook
     FB_TOKEN        jeton d'accès de la PAGE (longue durée) — en « Secret »
     FB_API_VERSION  (facultatif) version de l'API, ex. v23.0

   - Aucun cookie Facebook chez le visiteur : c'est Cloudflare qui interroge Facebook.
   - Résultat gardé en cache 30 min : Facebook n'est interrogé que quelques fois par heure.
   - En cas de souci (jeton expiré…), renvoie une liste vide : le module affiche
     alors simplement un bouton « Suivez-nous sur Facebook ».
   ========================================================= */

const NB_POSTS = 6;          // nombre de posts affichés
const CACHE_SECONDES = 1800; // 30 minutes

function json(data, maxAge) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}`,
      'X-Robots-Tag': 'noindex'
    }
  });
}

export async function onRequestGet({ env, request, waitUntil }) {
  const cache = caches.default;
  const cleCache = new Request(new URL('/api/actus', request.url).toString(), { method: 'GET' });
  const enCache = await cache.match(cleCache);
  if (enCache) return enCache;

  if (!env.FB_PAGE_ID || !env.FB_TOKEN) {
    return json({ posts: [], info: 'configuration manquante' }, 60);
  }

  const version = env.FB_API_VERSION || 'v23.0';
  const champs = 'message,full_picture,permalink_url,created_time,status_type';
  const url = `https://graph.facebook.com/${version}/${encodeURIComponent(env.FB_PAGE_ID)}/posts` +
    `?fields=${champs}&limit=20&access_token=${encodeURIComponent(env.FB_TOKEN)}`;

  let posts = [];
  try {
    const r = await fetch(url, { cf: { cacheTtl: 0 } });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error((data.error && data.error.message) || ('HTTP ' + r.status));

    posts = (data.data || [])
      .filter(p => p.permalink_url && (p.message || p.full_picture)) // posts avec texte et/ou photo
      .slice(0, NB_POSTS)
      .map(p => ({
        texte: p.message || '',
        image: p.full_picture ? '/api/fb-image?u=' + encodeURIComponent(p.full_picture) : null,
        lien: p.permalink_url,
        date: p.created_time
      }));
  } catch (e) {
    // jeton expiré, page introuvable… : on renvoie une liste vide, sans casser la page
    return json({ posts: [], info: 'facebook indisponible' }, 120);
  }

  const reponse = json({ posts, maj: new Date().toISOString() }, CACHE_SECONDES);
  waitUntil(cache.put(cleCache, reponse.clone()));
  return reponse;
}
