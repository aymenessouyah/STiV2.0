/* Atelier SQL : exécution locale sur une base SQLite temporaire, dans un worker.
   Les requêtes ne sont jamais envoyées à un serveur et rien n'est sauvegardé. */
'use strict';
importScripts('sqljs/sql-wasm.js');
var moteur = null;
self.onmessage = async function (event) {
  var source = String((event.data && event.data.sql) || '');
  if (!source.trim() || source.length > 20000) {
    self.postMessage({ erreur: 'Saisissez une requête de 20 000 caractères maximum.' }); return;
  }
  var db;
  try {
    if (!moteur) moteur = await initSqlJs({ locateFile: function (f) { return 'sqljs/' + f; } });
    db = new moteur.Database();
    db.run("CREATE TABLE eleves (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, moyenne REAL, classe TEXT);" +
      "INSERT INTO eleves VALUES (1,'Amine',14.5,'4SI'),(2,'Salma',16.25,'4SI'),(3,'Yasmine',9,'3SI'),(4,'Ali',11,'3SI');");
    var resultats = db.exec(source);
    self.postMessage({ resultats: resultats.map(function (r) {
      return { colonnes: r.columns, lignes: r.values.slice(0,100), tronque: r.values.length > 100 };
    }), modifications: db.getRowsModified() });
  } catch (e) {
    self.postMessage({ erreur: 'SQLite : ' + (e && e.message ? e.message : 'erreur de requête.') });
  } finally { if (db) db.close(); }
};
