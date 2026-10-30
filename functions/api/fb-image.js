/* =========================================================
   ADMR Côte-d'Or — /api/fb-image?u=…
   Relais des photos des posts Facebook : les images sont servies
   depuis admr-21.fr, donc le navigateur du visiteur ne contacte pas
   Facebook (pas de traceur) et les liens d'images expirés sont
   régénérés à chaque mise à jour du cache.
   N'accepte que les images hébergées par Facebook (fbcdn.net).
   ========================================================= */

export async function onRequestGet({ request }) {
  const u = new URL(request.url).searchParams.get('u');
  let cible;
  try { cible = new URL(u); } catch (e) { return new Response('Paramètre invalide', { status: 400 }); }

  if (cible.protocol !== 'https:' || !/(^|\.)fbcdn\.net$/.test(cible.hostname)) {
    return new Response('Source non autorisée', { status: 403 });
  }

  const r = await fetch(cible.toString(), { cf: { cacheTtl: 86400, cacheEverything: true } });
  const type = r.headers.get('Content-Type') || '';
  if (!r.ok || !type.startsWith('image/')) return new Response('Image indisponible', { status: 502 });

  return new Response(r.body, {
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=86400',
      'X-Robots-Tag': 'noindex'
    }
  });
}
