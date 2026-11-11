"""Capsule SQL série 7 : storyboard, tableau au stylo, duels et montage reproductible.
Dépendances : Python 3, Pillow, imageio-ffmpeg. La durée s'adapte aux prises voix.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, tempfile, wave, os, re, math
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe(); W,H=1920,1080
OUT=ROOT/'assets/videos/sql-serie7-having-groupby-sous-requetes-v2.mp4'; VTT=ROOT/'assets/subtitles/sql-serie7-having-groupby-sous-requetes-v2-fr.vtt'
FNT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def font(n,b=False,m=False):return ImageFont.truetype(MONO if m else BOLD if b else FNT,n)
INK='#182e4b'; MUTED='#4f6379'; ORANGE='#b64b0d'; BG='#f5f7fa'; LINE='#b5c3d4'; GREEN='#087353'; RED='#bd2b32'

def base(title, subtitle=''):
 im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
 d.rectangle((0,0,W,14),fill='#ee741c');d.text((60,35),'STI V2.0 By A’e   •   SÉRIE 7  /  4ème SI',font=font(25,True),fill=ORANGE)
 d.text((60,86),title,font=font(41,True),fill=INK)
 if subtitle:d.text((60,147),subtitle,font=font(25),fill=MUTED)
 return im

def lines(d,txt,x,y,sz=26,color=INK,step=None,mono=False):
 for line in txt.split('\n'):
  d.text((x,y),line,font=font(sz,m=mono),fill=color);y+=(step or int(sz*1.4))

def pen(d,x,y,color=ORANGE):
 # Pointe précise au niveau du repère ; elle se déplace avec les marques.
 d.polygon([(x,y),(x+15,y-54),(x+30,y-46),(x+7,y+4)],fill=color,outline=INK,width=2)
 d.line((x+5,y-6,x+20,y-43),fill='white',width=3)

def table(d,x,y,width,headers,rows,rowh=45,fs=25,cols=None, highlight=None):
 cols=cols or [width/len(headers)]*len(headers); n=len(rows)+1
 d.rounded_rectangle((x,y,x+width,y+n*rowh),radius=8,fill='white',outline=LINE,width=2)
 d.rectangle((x,y,x+width,y+rowh),fill='#dce7f3');
 yy=y
 for idx,row in enumerate([headers]+rows):
  if idx and highlight and idx in highlight: d.rectangle((x+1,yy+1,x+width-1,yy+rowh-1),fill='#fff0c9')
  xx=x
  for j,cell in enumerate(row):
   d.text((xx+9,yy+(rowh-fs)//2-1),str(cell),font=font(fs,b=idx==0),fill=INK)
   xx+=cols[j]
   if j<len(row)-1:d.line((xx,yy,xx,yy+rowh),fill=LINE,width=1)
  if idx<n-1:d.line((x,yy+rowh,x+width,yy+rowh),fill=LINE,width=1)
  yy+=rowh

def box(d,x,y,w,h,title,sql,fs=24,active=None):
 d.rounded_rectangle((x,y,x+w,y+h),radius=12,fill='#142b45');d.text((x+17,y+12),title,font=font(21,True),fill='#ffc97a')
 for i,line in enumerate(sql.split('\n')):
  yy=y+51+i*33
  if active is not None and i==active:d.rounded_rectangle((x+8,yy-3,x+w-8,yy+31),radius=4,fill='#31465e')
  d.text((x+16,yy),line,font=font(fs,m=True),fill='white')

def single(title,sql,headers,rows,note='',active=None,marked=0):
 im=base(title);d=ImageDraw.Draw(im);box(d,60,185,1800,390,'REQUÊTE SQL',sql,fs=27,active=active)
 d.text((64,595),'RÉSULTAT  •  '+str(len(rows))+' ligne'+('s' if len(rows)!=1 else ''),font=font(25,True),fill=GREEN)
 table(d,64,635,900,headers,rows,55,27)
 if active is not None:
  pen(d,1785,245+active*33)
  d.text((1635,600),'REPÈRE',font=font(18,True),fill=ORANGE)
 for i in range(min(marked,len(rows))):
  yy=635+(i+1)*55+17; color=group_colors.get(i+1,ORANGE)
  d.line((986,yy,1006,yy+20),fill=color,width=5); d.line((1006,yy,986,yy+20),fill=color,width=5)
  d.text((1020,yy-3),'ligne calculée' if 'temporaire' in title else 'retenu',font=font(20,True),fill=INK)
 if marked: pen(d,996,635+min(marked,len(rows))*55+18)
 if note:d.text((64,940),note,font=font(24,True),fill=ORANGE)
 return im

def duel(title,left,right,lefthead,leftrows,righthead,rightrows,identical):
 im=base(title,'Même question, deux méthodes : comparons les résultats');d=ImageDraw.Draw(im)
 box(d,45,185,875,380,'✕ ERREUR' if title.startswith('PIÈGE') else 'GAUCHE  •  REQUÊTE A',left,fs=21)
 box(d,1000,185,875,380,'✓ CORRECT' if title.startswith('PIÈGE') else 'DROITE  •  REQUÊTE B',right,fs=21)
 msg=('=  RÉSULTATS IDENTIQUES' if identical else '≠  RÉSULTATS DIFFÉRENTS')+f'   •   {len(leftrows)} ligne(s) / {len(rightrows)} ligne(s)'
 d.rounded_rectangle((475,585,1445,639),radius=12,fill='#e1e9f4',outline=INK,width=2);bbox=d.textbbox((0,0),msg,font=font(23,True));d.text(((W-(bbox[2]-bbox[0]))/2,597),msg,font=font(23,True),fill=INK)
 d.text((55,661),'RÉSULTAT GAUCHE',font=font(23,True),fill=GREEN);d.text((1010,661),'RÉSULTAT DROITE',font=font(23,True),fill=GREEN)
 table(d,55,701,855,lefthead,leftrows,49,25);table(d,1010,701,855,righthead,rightrows,49,25,highlight={4} if len(rightrows)==4 else None)
 if not leftrows:d.text((65,766),'Aucun résultat',font=font(24),fill=MUTED)
 if len(rightrows)==4:d.text((1550,950),'← ligne en plus',font=font(23,True),fill=ORANGE)
 return im

def err(title,sql,msg,fix,head,rows):
 im=base(title,'La requête erronée, puis sa correction et son résultat');d=ImageDraw.Draw(im)
 box(d,45,190,875,380,'✕ ERREUR',sql,fs=21);box(d,1000,190,875,380,'✓ CORRECT',fix,fs=21)
 d.text((55,600),'RÉSULTAT / MESSAGE',font=font(23,True),fill=RED);lines(d,msg,55,645,23,RED,34)
 d.text((1010,600),f'RÉSULTAT CORRIGÉ  •  {len(rows)} lignes',font=font(23,True),fill=GREEN)
 table(d,1010,645,855,head,rows,53,25)
 return im

sale=[(1,'T-shirt','Vêtements',10,25,1),(2,'Jean','Vêtements',4,60,2),(3,'Robe','Vêtements',3,90,1),(4,'Sac','Accessoires',5,40,3),(5,'Ceinture','Accessoires',6,20,2),(6,'Écharpe','Accessoires',2,15,3),(7,'Baskets','Chaussures',3,100,1),(8,'Sandales','Chaussures',8,35,2),(9,'Bottines','Chaussures',2,120,3),(10,'Casquette','Accessoires',7,18,2),(11,'Chemise','Vêtements',5,45,1),(12,'Parfum','Parfumerie',1,150,3)]
group_colors={1:'#d33c37',2:'#1264b1',3:'#11845e'}
def sales_frame(mark=0,remove=False):
 im=base('Les ventes : observer puis regrouper','Le stylo marque les lignes : une étiquette et une croix par vendeur.');d=ImageDraw.Draw(im)
 headers=['id','article','catégorie','qté','prix (DT)','vendeur']; rows=[list(map(str,r)) for r in sale]
 table(d,65,210,1290,headers,rows,53,24,[70,260,300,130,220,310]);
 d.text((1630,232),'LÉGENDE',font=font(23,True),fill=INK)
 for j,(n,name) in enumerate([(1,'Sana'),(2,'Karim'),(3,'Lina')]):
  yy=290+j*60; d.line((1635,yy,1655,yy+20),fill=group_colors[n],width=6);d.line((1655,yy,1635,yy+20),fill=group_colors[n],width=6);d.text((1675,yy-5),f'{name} • vendeur {n}',font=font(20,True),fill=INK)
 d.text((1630,505),'Walid : aucune vente',font=font(20,True),fill=INK)
 targets=[0,4,5,9] if remove else list(range(12))
 for index in targets[:mark]:
  yy=210+53*(index+1)+15; color=RED if remove else group_colors[sale[index][-1]]
  d.line((1375,yy,1395,yy+20),fill=color,width=6);d.line((1395,yy,1375,yy+20),fill=color,width=6)
  if remove:d.text((1410,yy-2),'écarté : prix < 30',font=font(18,True),fill=RED)
 if mark: pen(d,1385,210+53*(targets[min(mark,len(targets))-1]+1)+18)
 if remove:d.text((1630,550),'WHERE : 8 lignes gardées',font=font(18,True),fill=INK)
 return im

q1='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\nGROUP BY ve.id_vendeur, ve.nom;'
q4='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\n  AND v.prix_unitaire >= 30\nGROUP BY ve.id_vendeur, ve.nom\nHAVING SUM(v.quantite * v.prix_unitaire) > 700;'
qin='SELECT nom FROM VENDEUR\nWHERE id_vendeur IN (SELECT id_vendeur FROM VENTE\n                     GROUP BY id_vendeur\n                     HAVING SUM(quantite * prix_unitaire) > 700);'
qfrom='SELECT ve.nom, t.ca\nFROM VENDEUR ve,\n     (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\n      FROM VENTE GROUP BY id_vendeur) t\nWHERE ve.id_vendeur = t.id_vendeur\n  AND t.ca > 700;'
ql1='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\nGROUP BY ve.id_vendeur, ve.nom;'
qr1='SELECT nom,\n (SELECT SUM(quantite * prix_unitaire) FROM VENTE\n  WHERE VENTE.id_vendeur = VENDEUR.id_vendeur) AS ca\nFROM VENDEUR;'
ql2=ql1[:-1]+'\nHAVING SUM(v.quantite * v.prix_unitaire) > 700;'
qr2='SELECT ve.nom, t.ca\nFROM VENDEUR ve,\n (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\n  FROM VENTE GROUP BY id_vendeur) t\nWHERE ve.id_vendeur = t.id_vendeur\n AND t.ca > 700;'
ql3='SELECT ve.nom\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\nGROUP BY ve.id_vendeur, ve.nom\nHAVING COUNT(*) = 0;'
qr3='SELECT nom FROM VENDEUR\nWHERE id_vendeur NOT IN\n (SELECT id_vendeur FROM VENTE);'
qavg='SELECT SUM(quantite * prix_unitaire) /\n       COUNT(DISTINCT id_vendeur) FROM VENTE;'
qavgfull='SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\nFROM VENTE\nGROUP BY id_vendeur\nHAVING SUM(quantite * prix_unitaire) >\n       (SELECT SUM(quantite * prix_unitaire) /\n               COUNT(DISTINCT id_vendeur) FROM VENTE);'
qbad1='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\n AND SUM(v.quantite * v.prix_unitaire) > 700\nGROUP BY ve.id_vendeur, ve.nom;'
qbad2='SELECT ve.nom, v.categorie,\n SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\nGROUP BY ve.id_vendeur, ve.nom;'
qbad3='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nGROUP BY ve.id_vendeur, ve.nom;'
r3=[['Sana','1045'],['Karim','766'],['Lina','620']];r2=r3[:2]

slides=[[] for _ in range(10)]
def add(i,weight,im): slides[i].append((weight,im))
intro=base('Capsule SQL : Mieux comprendre sous-requête, GROUP BY, HAVING','Pour mieux comprendre GROUP BY et HAVING');d=ImageDraw.Draw(intro)
d.rounded_rectangle((300,300,1620,780),radius=22,fill='white',outline=LINE,width=3);d.text((390,390),'SÉRIE 7  •  CAPSULE SQL',font=font(54,True),fill=INK);d.text((390,485),'GROUP BY  /  HAVING  /  SOUS-REQUÊTE',font=font(40,True),fill=ORANGE);d.text((390,585),'Comprendre avec les tableaux et les résultats',font=font(30),fill=MUTED);d.rectangle((1350,495,1500,635),fill='#e7edf5',outline=INK,width=4);d.rectangle((1335,465,1515,510),fill='#f1b276',outline=INK,width=4);d.rectangle((1400,550,1450,635),fill='white',outline=INK,width=3);d.text((1363,424),'BOUTIQUE',font=font(18,True),fill=INK)
add(0,.30,intro)
v=base('Quels vendeurs sont les plus performants ?','La boutique : quatre vendeurs, douze ventes.');d=ImageDraw.Draw(v);table(d,100,240,850,['id_vendeur','nom'],[['1','Sana'],['2','Karim'],['3','Lina'],['4','Walid']],80,30);d.text((1000,300),'CA = quantité × prix unitaire',font=font(32,True),fill=INK);d.text((1000,360),'Montants en dinars',font=font(28),fill=ORANGE);add(0,.32,v)
add(0,.38,sales_frame())
# La pointe du stylo avance ligne par ligne et laisse une croix persistante.
for n in range(1,13):add(1,.016,sales_frame(n))
for active in range(4): add(1,.202,single('GROUP BY : total par vendeur',q1,['nom','ca (DT)'],r3,'Total boutique : 2431 DT  •  Walid : aucune vente',active))
for n in range(1,5):add(2,.06,sales_frame(n,True))
a=base('WHERE filtre les lignes ; HAVING filtre les groupes','Le film du tableau : du produit cartésien au résultat final');d=ImageDraw.Draw(a)
for i,(label,val) in enumerate([('FROM','4 × 12 = 48 lignes'),('WHERE : jointure','12 lignes'),('WHERE : prix ≥ 30','8 lignes'),('GROUP BY','3 groupes'),('HAVING : CA > 700','1 groupe'),('SELECT','1 ligne')]):
 y=220+i*100;d.rounded_rectangle((100,y,1800,y+76),radius=12,fill='white',outline=LINE,width=2);d.text((125,y+18),label,font=font(28,True),fill=ORANGE);d.text((720,y+18),val,font=font(28),fill=INK)
add(2,.24,a)
for active in [2,4,5]: add(2,.52/3,single('WHERE avant GROUP BY, HAVING après',q4,['nom','ca (DT)'],[['Sana','795']],'Groupes : Sana 795 OUI  •  Karim 520 NON  •  Lina 590 NON',active))
# Chaque sous-requête est montrée séparément avec ses lignes avant la requête externe.
inner='SELECT id_vendeur FROM VENTE\nGROUP BY id_vendeur\nHAVING SUM(quantite * prix_unitaire) > 700;'
temp='SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\nFROM VENTE GROUP BY id_vendeur;'
for n in [1,2]: add(3,.23/2,single('Sous-requête IN : la boîte intérieure',inner,['id_vendeur'],[['1'],['2']],active=2,marked=n))
for n in [1,2]: add(3,.26/2,single('Sous-requête IN : la réponse extérieure',qin,['nom'],[['Sana'],['Karim']],active=1,marked=n))
for n in [1,3]: add(3,.23/2,single('Sous-requête FROM : table temporaire t',temp,['id_vendeur','ca (DT)'],[['1','1045'],['2','766'],['3','620']],active=0,marked=n))
for n in [1,2]: add(3,.28/2,single('Sous-requête FROM : résultat final',qfrom,['nom','ca (DT)'],r2,'Le CA est une colonne : WHERE peut la filtrer.',active=2,marked=n))
add(4,1,duel('DUEL 1  •  Le chiffre d’affaires de chaque vendeur',ql1,qr1,['nom','ca (DT)'],r3,['nom','ca (DT)'],r3+[['Walid','NULL']],False))
add(5,1,duel('DUEL 2  •  Les vendeurs dont le CA dépasse 700',ql2,qr2,['nom','ca (DT)'],r2,['nom','ca (DT)'],r2,True))
add(6,1,duel('DUEL 3  •  Qui n’a réalisé aucune vente ?',ql3,qr3,['nom'],[],['nom'],[['Walid']],False))
add(7,.32,single('DUEL 4  •  Calcul préalable de la moyenne',qavg,['moyenne (DT)'],[['810,33…']],'2431 / 3 ≈ 810,33 dinars'))
add(7,.42,single('DUEL 4  •  Dépasser la moyenne',qavgfull,['id_vendeur','ca (DT)'],[['1','1045']],'Vendeur 1 : Sana'))
r=base('Quel outil choisir ?','Un outil peut compléter l’autre.');d=ImageDraw.Draw(r)
for i,(a,b) in enumerate([('JOINTURE + GROUP BY + HAVING','Relier les tables, regrouper et filtrer les groupes'),('SOUS-REQUÊTE','Garder les vendeurs, chercher une absence, calculer d’abord'),('LES DEUX','Comparer un total de groupe à une valeur calculée')]):
 y=240+i*170;d.rounded_rectangle((90,y,1830,y+130),radius=15,fill='white',outline=LINE,width=2);d.text((115,y+19),a,font=font(26,True),fill=ORANGE);d.text((115,y+73),b,font=font(25),fill=INK)
add(7,.26,r)
add(8,.5,err('PIÈGE 1  •  SUM dans WHERE',qbad1,'Erreur : agrégat interdit dans WHERE.',ql2,['nom','ca (DT)'],r2))
add(8,.5,err('PIÈGE 2  •  Colonne hors GROUP BY',qbad2,'Mode SQL strict : colonne categorie\nabsente du GROUP BY.',ql1,['nom','ca (DT)'],r3))
add(9,.62,duel('PIÈGE 3  •  Jointure oubliée',qbad3,ql1,['nom','ca (DT)'],[['Sana','2431'],['Karim','2431'],['Lina','2431'],['Walid','2431']],['nom','ca (DT)'],r3,False))
end=base('À retenir','Pour t’entraîner, reprends la fiche d’exercices de la série 7.');d=ImageDraw.Draw(end)
for i,(a,b) in enumerate([('JOINTURE','Recoller les tables'),('WHERE','Filtrer les lignes'),('GROUP BY','Former les groupes'),('HAVING','Filtrer les groupes'),('SOUS-REQUÊTE','Calculer d’abord')]):
 y=215+i*115;d.rounded_rectangle((100,y,1800,y+90),radius=12,fill='white',outline=LINE,width=2);d.text((125,y+26),a,font=font(27,True),fill=ORANGE);d.text((700,y+26),b,font=font(27),fill=INK)
d.text((105,880),'Capsule SQL — Enseignant : Aymen Essouyah — Lycée Rafèha',font=font(27,True),fill=INK);add(9,.38,end)
# Sous-titres français : phrases des prises, repères rapprochés des pauses audio.
texts=[
"Bienvenue dans cette nouvelle capsule SQL. Aujourd'hui, nous allons comprendre GROUP BY, HAVING et les sous-requêtes. Pour chaque requête, nous regarderons son résultat. Tu es le gérant d'une boutique. Voici quatre vendeurs : Sana, Karim, Lina et Walid. Chaque vente est liée à un vendeur. Douze lignes, c'est difficile à lire. Il nous faut un total par vendeur. Le chiffre d'affaires de chaque ligne est la quantité multipliée par le prix unitaire, en dinars.",
"GROUP BY transforme plusieurs lignes en paquets, un paquet par vendeur. Pour chaque paquet, SUM calcule le total. La condition WHERE relie chaque vente à son vendeur : c'est la jointure. Le résultat contient trois lignes. Sana : mille quarante-cinq dinars. Karim : sept cent soixante-six dinars. Lina : six cent vingt dinars. Le total de la boutique est deux mille quatre cent trente et un dinars. Walid n'apparaît pas : il n'a aucune vente.",
"WHERE agit sur les lignes, avant le regroupement. HAVING agit sur les groupes, après. La jointure fait passer de quarante-huit à douze lignes. Le filtre sur le prix unitaire, au moins trente dinars, en conserve huit. GROUP BY forme trois groupes : Sana, sept cent quatre-vingt-quinze ; Karim, cinq cent vingt ; Lina, cinq cent quatre-vingt-dix. HAVING ne garde que les totaux supérieurs à sept cents. Le résultat contient une ligne : Sana, sept cent quatre-vingt-quinze dinars. Un total de groupe ne va pas dans WHERE : utilise HAVING.",
"Une sous-requête est une question dans une question. Avec IN, la requête intérieure regroupe les ventes et renvoie deux identifiants : un et deux. La requête extérieure renvoie deux lignes : Sana et Karim. Autre méthode, la sous-requête dans FROM construit une table temporaire. Elle contient trois lignes : un, mille quarante-cinq ; deux, sept cent soixante-six ; trois, six cent vingt. Puis la requête extérieure filtre sa colonne CA. Résultat : deux lignes. Sana, mille quarante-cinq ; Karim, sept cent soixante-six dinars.",
"Premier duel : le chiffre d'affaires de chaque vendeur. À gauche, la jointure avec GROUP BY donne trois lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six ; Lina, six cent vingt. À droite, la sous-requête dans SELECT donne quatre lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six ; Lina, six cent vingt ; et Walid, NULL, c'est-à-dire un chiffre d'affaires vide. Les résultats sont différents. La requête de droite part des vendeurs et les conserve tous.",
"Deuxième duel : les vendeurs dont le chiffre d'affaires dépasse sept cents dinars. À gauche, GROUP BY et HAVING donnent deux lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six. À droite, la sous-requête dans FROM et le filtre WHERE donnent les mêmes deux lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six. Les résultats sont identiques : deux lignes de chaque côté. À gauche, HAVING filtre le groupe ; à droite, WHERE filtre la colonne déjà calculée.",
"Troisième duel : qui n'a réalisé aucune vente ? À gauche, la jointure avec HAVING COUNT étoile égal zéro ne renvoie aucune ligne. Elle ne peut pas compter les ventes qui n'existent pas. À droite, NOT IN renvoie une ligne : Walid. Les résultats sont différents : zéro ligne contre une ligne. Ici, les identifiants de la table VENTE ne sont pas NULL. Attention : en général, un NULL dans la liste de NOT IN peut changer le résultat.",
"Pour comparer à une moyenne, combinons les deux outils. La sous-requête calcule deux mille quatre cent trente et un divisé par trois, soit environ huit cent dix virgule trente-trois dinars. Son résultat contient une ligne. HAVING garde les totaux qui dépassent cette moyenne. Résultat : une ligne, identifiant un, mille quarante-cinq dinars. C'est Sana. Retiens : la jointure avec GROUP BY sert à regrouper ; la sous-requête sert à utiliser un calcul préalable, à garder tous les vendeurs ou à chercher une absence.",
"Premier piège : SUM dans WHERE provoque une erreur. On déplace la condition dans HAVING. Résultat corrigé : deux lignes, Sana, mille quarante-cinq ; Karim, sept cent soixante-six. Deuxième piège : sélectionner la catégorie sans l'agréger ni l'inclure dans GROUP BY. En mode SQL strict, le système signale une erreur. On peut retirer la catégorie du SELECT. La correction donne trois lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six ; Lina, six cent vingt.",
"Troisième piège : oublier la condition de jointure. Le résultat faux contient quatre lignes : Sana, Karim, Lina et Walid affichent chacun deux mille quatre cent trente et un dinars, le total de la boutique. En ajoutant la jointure, on obtient trois lignes : Sana, mille quarante-cinq ; Karim, sept cent soixante-six ; Lina, six cent vingt. Enfin, retiens : la jointure recolle, WHERE filtre les lignes, GROUP BY forme des groupes, HAVING les filtre, et la sous-requête calcule d'abord. Reprends la fiche de la série sept. À bientôt !"]

def run(args):subprocess.run(args,check=True)
def stamp(t):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}.{n%1000:03}'
def cue_wrap(s):
 words=s.split(); ls=['']
 for w in words:
  if len(ls[-1])+len(w)+1>65:ls.append(w)
  else:ls[-1]+=(' ' if ls[-1] else '')+w
 return '\n'.join(ls)
def silences(path):
 p=subprocess.run([FF,'-hide_banner','-i',str(path),'-af','silencedetect=noise=-35dB:d=0.22','-f','null','-'],capture_output=True,text=True)
 starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',p.stderr)]
 ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',p.stderr)]
 return [(a+b)/2 for a,b in zip(starts,ends) if b-a>=.22]
with tempfile.TemporaryDirectory() as tmp:
 t=Path(tmp);dur=[];breaks=[]
 for i in range(10):
  p=HERE/f'voix-v2/{i+1:02}.mp3';w=t/f'{i}.wav';run([FF,'-y','-loglevel','error','-i',str(p),'-ar','44100','-ac','1',str(w)])
  with wave.open(str(w),'rb') as f:dur.append(f.getnframes()/f.getframerate())
  breaks.append(silences(w))
 gap=3; starts=[];elapsed=0
 with wave.open(str(t/'narration.wav'),'wb') as out:
  out.setparams((1,2,44100,0,'NONE','not compressed'))
  for i in range(10):
   starts.append(elapsed)
   with wave.open(str(t/f'{i}.wav'),'rb') as v:out.writeframes(v.readframes(v.getnframes()))
   out.writeframes(b'\0\0'*int(44100*gap));elapsed+=dur[i]+gap
 # Une musique originale de notes douces, sans ressource externe.
 import array
 with wave.open(str(t/'musique.wav'),'wb') as out:
  out.setparams((1,2,22050,0,'NONE','not compressed'))
  frequencies=[220.0,261.63,329.63,293.66,246.94,196.0,220.0,261.63]
  for basei in range(0,int(elapsed*22050),22050):
   block=array.array('h')
   for k in range(min(22050,int(elapsed*22050)-basei)):
    sec=(basei+k)/22050; n=int(sec/3)%len(frequencies);phase=sec%3;env=min(phase/.5,1,(3-phase)/1.2)
    v=(math.sin(2*math.pi*frequencies[n]*sec)+.25*math.sin(2*math.pi*frequencies[n]*2*sec))*max(0,env)
    block.append(int(v*240))
   out.writeframes(block.tobytes())
 parts=[];images=0
 for i,group in enumerate(slides):
  assert abs(sum(x[0] for x in group)-1)<.001,(i,sum(x[0] for x in group))
  for frac,im in group:
   path=t/f'slide-{images:03}.png';images+=1;im.save(path,optimize=False);parts.append((path,(dur[i]+gap)*frac))
 with open(t/'frames.txt','w') as f:
  for path,length in parts:f.write(f"file '{path}'\nduration {length:.6f}\n")
  f.write(f"file '{parts[-1][0]}'\n")
 vtt=['WEBVTT','']
 for i,texte in enumerate(texts):
  phrases=re.split(r'(?<=[.!?])\s+',texte); weights=[len(x) for x in phrases];total=sum(weights); positions=[0.0];acc=0
  for weight in weights[:-1]:
   acc+=weight;ideal=dur[i]*acc/total
   # Pauses proches des limites estimées, sans franchir la phrase précédente.
   options=[z for z in breaks[i] if positions[-1]+.7<z<dur[i]-.5 and abs(z-ideal)<1.1]
   positions.append(min(options,key=lambda z:abs(z-ideal)) if options else max(positions[-1]+.7,ideal))
  positions.append(dur[i])
  for j,phrase in enumerate(phrases):vtt.extend([f'{stamp(starts[i]+positions[j])} --> {stamp(starts[i]+positions[j+1])}',cue_wrap(phrase),''])
 VTT.write_text('\n'.join(vtt),encoding='utf-8')
 # Transitions discrètes entre scènes ; pas de fondu sur chaque mouvement de stylo.
 boundaries=[starts[i] for i in range(1,10)]
 vf='fps=12,'+','.join(x for b in boundaries for x in (f"fade=t=out:st={b-.25:.3f}:d=0.25:enable='between(t,{b-.25:.3f},{b:.3f})'",f"fade=t=in:st={b:.3f}:d=0.25:enable='between(t,{b:.3f},{b+.25:.3f})'"))
 raw=t/'video.mp4';run([FF,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(t/'frames.txt'),'-i',str(t/'narration.wav'),'-i',str(t/'musique.wav'),'-filter_complex','[1:a][2:a]amix=inputs=2:duration=first:normalize=0[a]','-map','0:v','-map','[a]','-t',str(elapsed),'-vf',vf,'-r','12','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(raw)])
 run([FF,'-y','-loglevel','error','-i',str(raw),'-i',str(VTT),'-map','0','-map','1:0','-c','copy','-c:s','mov_text','-metadata:s:s:0','language=fra','-movflags','+faststart',str(OUT)])
 print('Durée :',round(elapsed,2),'secondes ; planches :',images)
