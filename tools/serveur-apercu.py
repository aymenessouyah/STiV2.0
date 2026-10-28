#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""STI V2.0 — serveur d'APERÇU local (design uniquement).

Le site charge normalement acces.js, qui redirige tout visiteur non connecté
vers portail.html : impossible de voir le nouveau design sans compte Supabase.
Ce serveur NE MODIFIE AUCUN FICHIER DU DÉPÔT : il se contente de répondre par
un fichier vide (ou une feuille vide) pour les quelques ressources du verrou,
uniquement le temps de la démonstration. Les fichiers restent intacts sur le
disque et sur GitHub Pages, où le verrou fonctionne normalement.

Ressources neutralisées pour l'aperçu :
  assets/js/acces.js          -> verrou d'accès / redirection portail.html
  assets/js/protection.js     -> blocage clic droit / interlude de protection
  assets/css/protection.css   -> désactivation de la sélection de texte
  sw.js                       -> service worker d'origine (cache périmé) ; on sert
                                 un SW minimal qui vide les caches puis se désinscrit

Tout le reste (config.js, supabase-umd.js, sync-progressions.js, profil.js,
app.js, theme.css, vidéos, polices, pages HTML…) est servi tel quel.
Sans session, le front affiche donc l'état « Non connecté » du badge abonné,
ce qui correspond exactement au comportement local-first demandé.

Usage : python3 tools/serveur-apercu.py [port]   (port 8000 par défaut)
"""
import functools
import http.server
import os
import sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Fichiers neutralisés : (suffixe de chemin, type MIME)
NEUTRES = (
    ("/assets/js/acces.js", "application/javascript; charset=utf-8"),
    ("/assets/js/protection.js", "application/javascript; charset=utf-8"),
    ("/assets/css/protection.css", "text/css; charset=utf-8"),
)


# Service worker minimal : purge les caches de l'ancienne version puis se
# désinscrit, pour que l'aperçu affiche toujours les fichiers frais du disque.
SW_APERCU = b"""/* STI V2.0 - apercu design : pas de cache persistant */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function () {});
"""


class GestionnaireApercu(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler avec quelques réponses vides pour la démo."""

    def _neutralise(self):
        chemin = self.path.split("?", 1)[0].split("#", 1)[0]
        if chemin.endswith("/sw.js"):
            self._repondre(SW_APERCU, "application/javascript; charset=utf-8")
            return True
        for suffixe, mime in NEUTRES:
            if chemin.endswith(suffixe):
                corps = b"/* STI V2.0 - apercu design : verrou desactive cote serveur */\n"
                self._repondre(corps, mime)
                return True
        return False

    def _repondre(self, corps, mime):
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(corps)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(corps)

    def do_GET(self):
        if self._neutralise():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._neutralise():
            return
        super().do_HEAD()

    def log_message(self, fmt, *args):
        # Logs compacts : on ne garde que les navigations et les erreurs.
        msg = fmt % args
        if '" 4' in msg or '" 5' in msg or ".html" in msg or " / " in msg:
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = functools.partial(GestionnaireApercu, directory=RACINE)
    with http.server.ThreadingHTTPServer(("0.0.0.0", port), handler) as srv:
        print("Apercu STI V2.0 : http://0.0.0.0:%d/ (verrou desactive)" % port, flush=True)
        srv.serve_forever()
