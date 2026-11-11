"""Prépare les données vérifiées du storyboard SQL v5 sans publier de vidéo.
Source : corrigé Série 7 et boutique.sql ; résultats calculés par SQLite.
"""
from pathlib import Path
import html, json, re, sqlite3
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
page=(ROOT/'exercices/sql/serie-7/corrige.html').read_text(encoding='utf-8')

def requete(title):
 pattern=r'<h2>'+re.escape(title)+r'</h2><pre>(.*?)</pre>'
 m=re.search(pattern,page,re.S)
 if not m: raise ValueError('Requête absente du corrigé : '+title)
 return html.unescape(m.group(1)).strip()

def resultat(db,sql):
 cur=db.execute(sql)
 return {'colonnes':[col[0] for col in cur.description], 'lignes':[list(row) for row in cur.fetchall()]}

missions=[
 ('Mission 1 — Le registre', 'Afficher, pour chaque vente, l’article, sa catégorie et le nom du vendeur.', 'Partie D — Mission 1',None,'Aucune solution par sous-requête n’est proposée dans la partie E du corrigé.'),
 ('Mission 2 — Le classement', 'Afficher le CA de chaque vendeur avec son nom.', 'Partie D — Mission 2','Partie E — E1 — Sous-requête dans SELECT','DIFFÉRENTS : la jointure exclut Walid ; la sous-requête affiche Walid avec NULL.'),
 ('Mission 3 — Les vendeurs performants', 'Afficher les vendeurs dont le CA dépasse 700.', 'Partie D — Mission 3','Partie E — E2 — Sous-requête avec IN','Mêmes vendeurs, colonnes différentes : IN affiche les noms mais pas le CA.'),
 ('Mission 4 — Les polyvalents', 'Afficher les vendeurs qui ont vendu dans au moins 3 catégories différentes.', 'Partie D — Mission 4','Partie E — Mission 4 avec IN','Mêmes vendeurs, colonnes différentes : IN n’affiche pas le nombre de catégories.'),
 ('Mission 5 — Le tri du vendeur', 'Ignorer les articles de prix inférieur à 40 et afficher les vendeurs dont le CA dépasse 500.', 'Partie D — Mission 5','Partie E — E3 — Mission 5 dans FROM','Résultats identiques ; le WHERE intérieur filtre les ventes avant le calcul du CA.')]

db=sqlite3.connect(':memory:');db.executescript((ROOT/'exercices/sql/serie-7/boutique.sql').read_text(encoding='utf-8'))
data={'source':'exercices/sql/serie-7/Corrigé_SQL_Boutique_Jointure_SousRequetes.pdf',
      'representation':['VENDEUR(id_vendeur, nom)', 'VENTE(id, article, categorie, quantite, prix_unitaire, id_vendeur)', 'VENTE.id_vendeur → VENDEUR.id_vendeur'], 'tables':{}, 'missions':[]}
for name in ['VENDEUR','VENTE']:
 data['tables'][name]=resultat(db,'SELECT * FROM '+name+' ORDER BY 1')
for title,enonce,d,e,remarque in missions:
 jointure=requete(d); sous=requete(e) if e else None
 item={'titre':title,'enonce':enonce,'jointure':{'sql':jointure,'resultat':resultat(db,jointure)}, 'sous_requete':None,'remarque':remarque}
 if sous:item['sous_requete']={'sql':sous,'resultat':resultat(db,sous)}
 if title.startswith('Mission 3'):
  alternative=requete('Partie E — E2 bis — Sous-requête dans FROM')
  item['autre_sous_requete']={'sql':alternative,'resultat':resultat(db,alternative)}
 data['missions'].append(item)
assert len(data['tables']['VENDEUR']['lignes'])==4
assert len(data['tables']['VENTE']['lignes'])==12
expected=[(12,None),(3,4),(2,2),(2,2),(2,2)]
for item,(a,b) in zip(data['missions'],expected):
 assert len(item['jointure']['resultat']['lignes'])==a
 assert (len(item['sous_requete']['resultat']['lignes']) if item['sous_requete'] else None)==b
(HERE/'storyboard-v5.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Storyboard validé : 2 tables, 5 missions, résultats calculés depuis boutique.sql.')
