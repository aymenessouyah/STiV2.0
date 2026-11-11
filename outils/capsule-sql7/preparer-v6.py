"""Construit un storyboard vérifié d'après le corrigé PDF remis par l'utilisateur.
Dépendance : pypdf. Les valeurs affichées proviennent de boutique.sql.
"""
from pathlib import Path
from pypdf import PdfReader
import json, re, sqlite3
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
PDF=HERE/'references-v6/Corrige_SQL_Boutique.pdf'
pages=PdfReader(PDF).pages
text='\n'.join(p.extract_text() for p in pages)
correction=text.split('Partie D : solution 1, avec une jointure',1)[1]
def sql(heading):
 m=re.search(re.escape(heading)+r'\s*(SELECT\s+[\s\S]*?;)',correction)
 if not m:raise ValueError('Requête absente du PDF : '+heading)
 raw=m.group(1).strip()
 # Le PDF utilise de grands retraits pour aligner les sous-requêtes ; les
 # normaliser pour que les trois colonnes restent lisibles à l'écran.
 raw=re.sub(r'\(\s*SELECT', '(\nSELECT', raw, flags=re.I)
 raw=re.sub(r'\)\s*;\s*$', '\n);', raw) if re.search(r'\(\s*\n\s*SELECT',raw,re.I) else raw
 lines=[]; inner=False
 for original in raw.splitlines():
  line=original.strip()
  if not line:continue
  if line.startswith(')'):inner=False
  lines.append(('    ' if inner else '')+line)
  if re.search(r'\(\s*$',line):inner=True
 return '\n'.join(lines)
def res(db,q):
 cur=db.execute(q);return {'colonnes':[x[0] for x in cur.description],'lignes':[list(x) for x in cur.fetchall()]}
db=sqlite3.connect(':memory:');db.executescript((ROOT/'exercices/sql/serie-7/boutique.sql').read_text(encoding='utf8'))
entries=[
 ('Mission 1 — Le registre','Afficher, pour chaque vente, l’article, sa catégorie et le nom du vendeur.','Mission 1',None,'Aucune solution par sous-requête n’est proposée pour cette mission dans le corrigé.'),
 ('Mission 2 — Le classement','Afficher le CA de chaque vendeur avec son nom.','Mission 2',None,'La jointure donne trois vendeurs. Aucune sous-requête n’est proposée pour cette mission dans le corrigé.'),
 ('Mission 3 — Les vendeurs performants','Afficher les vendeurs dont le CA dépasse 700.','Mission 3','E1 : sous-requête avec IN (mission 3)','Mêmes vendeurs ; les colonnes diffèrent : IN ne renvoie que les noms.'),
 ('Mission 4 — Les polyvalents','Afficher les vendeurs ayant vendu dans au moins 3 catégories différentes.','Mission 4','E2 : sous-requête avec IN (mission 4, polyvalents)','Mêmes vendeurs ; IN ne renvoie pas le nombre de catégories.'),
 ('Mission 5 — Le tri du vendeur','Ignorer les articles de prix inférieur à 40 et afficher les vendeurs dont le CA dépasse 500.','Mission 5','E3 : mission 5 avec IN','Mêmes vendeurs ; IN ne renvoie que les noms. La boîte intérieure filtre les ventes avant GROUP BY.')]
data={'source':'outils/capsule-sql7/references-v6/Corrige_SQL_Boutique.pdf','representation':['VENDEUR(id_vendeur, nom)','VENTE(id, article, categorie, quantite, prix_unitaire, id_vendeur)','VENTE.id_vendeur → VENDEUR.id_vendeur'],'tables':{},'missions':[],'supplements':[]}
for n in ['VENDEUR','VENTE']:data['tables'][n]=res(db,'SELECT * FROM '+n+' ORDER BY 1')
for title,question,a,b,note in entries:
 q=sql(a); sq=sql(b) if b else None
 item={'titre':title,'enonce':question,'jointure':{'sql':q,'resultat':res(db,q)},'sous_requete':None,'remarque':note}
 if sq:item['sous_requete']={'sql':sq,'resultat':res(db,sq)}
 data['missions'].append(item)
for title,heading,inside in [('E4 — prix supérieur à la moyenne','E4 : sous-requête qui renvoie une valeur','SELECT AVG(prix_unitaire) FROM VENTE;'),('Bonus — vendeurs sans vente','Bonus : NOT IN','SELECT id_vendeur FROM VENTE;'),('Pour aller plus loin — vente la plus chère','Pour aller plus loin : la vente la plus chère','SELECT MAX(prix_unitaire) FROM VENTE;')]:
 q=sql(heading);data['supplements'].append({'titre':title,'sql':q,'resultat':res(db,q),'interieur':{'sql':inside,'resultat':res(db,inside)}})
assert len(data['tables']['VENDEUR']['lignes'])==4 and len(data['tables']['VENTE']['lignes'])==12
expected=[(12,None),(3,None),(2,2),(2,2),(2,2)]
for e,(n,m) in zip(data['missions'],expected):
 assert len(e['jointure']['resultat']['lignes'])==n
 assert (len(e['sous_requete']['resultat']['lignes']) if e['sous_requete'] else None)==m
assert data['missions'][4]['sous_requete']['resultat']['lignes']==[['Sana'],['Lina']]
assert data['supplements'][0]['resultat']['lignes']==[['Jean',60],['Robe',90],['Baskets',100],['Bottines',120],['Parfum',150]]
assert data['supplements'][1]['resultat']['lignes']==[['Walid']]
assert data['supplements'][2]['resultat']['lignes']==[['Parfum',150]]
(HERE/'storyboard-v6.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Storyboard v6 vérifié : 5 missions, E4, NOT IN et MAX.')
