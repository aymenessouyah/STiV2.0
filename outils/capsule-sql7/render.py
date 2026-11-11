"""Montage de la capsule SQL 7 : Pillow et imageio-ffmpeg nécessaires."""
import math, os, re, subprocess, tempfile, wave, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe(); W,H=1280,720
OUT=ROOT/'assets/videos/sql-serie7-group-by-having.mp4'; VTT=ROOT/'assets/subtitles/sql-serie7-group-by-having-fr.vtt'
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; mono='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def F(n,b=False,m=False): return ImageFont.truetype(mono if m else bold if b else font,n)
def slide(title, subtitle='', lines=(), code=None, foot=''):
 im=Image.new('RGB',(W,H),'#f3f6fb');d=ImageDraw.Draw(im)
 d.rectangle((0,0,W,10),fill='#ea580c');d.text((60,32),'STI V2.0  •  CAPSULE SQL  •  4ème SI',font=F(19,True),fill='#b44713')
 d.text((60,78),title,font=F(35,True),fill='#152b48')
 if subtitle:d.text((60,129),subtitle,font=F(21),fill='#536377')
 if code is not None:
  d.rounded_rectangle((55,170,1225,540),radius=18,fill='#14273f');
  for i,line in enumerate(code.split('\n')): d.text((82,190+i*39),line,font=F(22,m=True),fill='#ffffff' if i%2 else '#ffcc80')
  y=562
 else:y=180
 for i,line in enumerate(lines):
  if isinstance(line,tuple):
   label,txt=line;d.rounded_rectangle((65,y,1215,y+47),radius=10,fill='#ffffff',outline='#d4ddeb',width=2);d.text((82,y+10),label,font=F(20,True),fill='#b44713');d.text((310,y+10),txt,font=F(20),fill='#1d3049');y+=52
  else:
   d.text((75,y),line,font=F(23),fill='#1d3049');y+=37
 if foot:d.text((65,660),foot,font=F(18,True),fill='#b44713')
 return im
S=[]
def add(scene,fraction,*args,**kw):S.append((scene,fraction,slide(*args,**kw)))
add(0,1,'STI V2.0 By A’e','Série 7 • Capsule SQL', ['Pour mieux comprendre GROUP BY et HAVING','Sous-requêtes • 4ème SI','Enseignant : Aymen Essouyah · Lycée Rafèha'])
add(1,.48,'La boutique : quels vendeurs sont performants ?', 'VENDEUR (id_vendeur, nom)', [('1','Sana'),('2','Karim'),('3','Lina'),('4','Walid')],foot='CA d’une ligne = quantité × prix unitaire (dinars)')
add(1,.52,'Les 12 ventes', 'VENTE (id, article, catégorie, quantité, prix unitaire, id_vendeur)', [' 1 T-shirt     Vêtements      10 × 25 DT    vendeur 1',' 2 Jean        Vêtements       4 × 60 DT    vendeur 2',' 3 Robe        Vêtements       3 × 90 DT    vendeur 1',' 4 Sac         Accessoires     5 × 40 DT    vendeur 3',' 5 Ceinture    Accessoires     6 × 20 DT    vendeur 2',' 6 Écharpe     Accessoires     2 × 15 DT    vendeur 3',' 7 Baskets     Chaussures      3 × 100 DT   vendeur 1',' 8 Sandales    Chaussures      8 × 35 DT    vendeur 2',' 9 Bottines    Chaussures      2 × 120 DT   vendeur 3','10 Casquette   Accessoires     7 × 18 DT    vendeur 2','11 Chemise     Vêtements       5 × 45 DT    vendeur 1','12 Parfum      Parfumerie      1 × 150 DT   vendeur 3'])
add(2,.57,'GROUP BY : regrouper les ventes','La condition WHERE relie chaque vente à son vendeur.',code='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\nGROUP BY ve.id_vendeur, ve.nom;')
add(2,.43,'Un paquet par vendeur','SUM calcule le chiffre d’affaires de chaque groupe.', [('SANA','1 045 dinars'),('KARIM','766 dinars'),('LINA','620 dinars'),('TOTAL BOUTIQUE','2 431 dinars'),('WALID','Aucune vente : absent de la jointure')])
add(3,.48,'WHERE ou HAVING ?', 'D’abord les lignes, ensuite les groupes.', [('FROM','4 vendeurs × 12 ventes = 48 lignes'),('WHERE : jointure','12 lignes'),('WHERE : prix ≥ 30','8 lignes'),('GROUP BY','3 groupes'),('HAVING : CA > 700','1 groupe : Sana'),('SELECT','1 ligne')])
add(3,.52,'Filtrer lignes puis groupes','WHERE : lignes • HAVING : groupes',code='SELECT ve.nom, SUM(v.quantite * v.prix_unitaire) AS ca\nFROM VENDEUR ve, VENTE v\nWHERE ve.id_vendeur = v.id_vendeur\n  AND v.prix_unitaire >= 30\nGROUP BY ve.id_vendeur, ve.nom\nHAVING SUM(v.quantite * v.prix_unitaire) > 700;',lines=[('RÉSULTAT','Sana : 795 DT  ✓  |  Karim : 520 DT  ✗  |  Lina : 590 DT  ✗')])
add(4,.48,'Sous-requête avec IN','La question intérieure s’exécute d’abord.',code='SELECT nom FROM VENDEUR\nWHERE id_vendeur IN (SELECT id_vendeur FROM VENTE\n                     GROUP BY id_vendeur\n                     HAVING SUM(quantite * prix_unitaire) > 700);',lines=[('RÉSULTAT','Identifiants : 1, 2  →  Sana, Karim')])
add(4,.52,'Sous-requête dans FROM','Le total calculé devient une colonne utilisable par WHERE.',code='SELECT ve.nom, t.ca\nFROM VENDEUR ve,\n     (SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\n      FROM VENTE GROUP BY id_vendeur) t\nWHERE ve.id_vendeur = t.id_vendeur\n  AND t.ca > 700;',lines=[('RÉSULTAT','Sana : 1 045 DT  |  Karim : 766 DT')],foot='Ici toutes les ventes comptent : pas de filtre prix ≥ 30.')
add(5,.3,'Choisir la bonne méthode','Jointure + GROUP BY ou sous-requête ?', [('JOINTURE + GROUPE','Relier les tables puis regrouper'),('SOUS-REQUÊTE','Calculer d’abord, utiliser ensuite'),('COLONNES','Directement ; ou via SELECT / FROM'),('WALID','Absent de la jointure ; retrouvable avec NOT IN'),('MOYENNE','La sous-requête exprime un calcul préalable')])
add(5,.3,'Retrouver le vendeur sans vente','NOT IN recherche une absence.',code='SELECT nom FROM VENDEUR\nWHERE id_vendeur NOT IN\n  (SELECT id_vendeur FROM VENTE);',lines=[('RÉSULTAT','Walid')],foot='Dans cet exemple, les identifiants de VENTE ne sont pas NULL.')
add(5,.4,'Comparer à la moyenne','Moyenne des vendeurs ayant vendu : 2 431 / 3 ≈ 810,33 DT',code='SELECT id_vendeur, SUM(quantite * prix_unitaire) AS ca\nFROM VENTE GROUP BY id_vendeur\nHAVING SUM(quantite * prix_unitaire) >\n  (SELECT SUM(quantite * prix_unitaire) /\n          COUNT(DISTINCT id_vendeur) FROM VENTE);',lines=[('RÉSULTAT','Vendeur 1 : Sana, 1 045 DT')])
add(6,1,'Trois erreurs à éviter','La bonne règle est indiquée pour chaque piège.', [('ERREUR 1','SUM(...) dans WHERE'),('CORRECT','Filtrer un agrégat de groupe avec HAVING'),('ERREUR 2','Afficher categorie sans agrégat ni GROUP BY'),('CORRECT','Regrouper la colonne ou l’agréger'),('ERREUR 3','Deux tables sans condition de jointure'),('CORRECT','WHERE ve.id_vendeur = v.id_vendeur')],foot='Sans jointure : produit cartésien, chaque vendeur reçoit toutes les ventes.')
add(7,1,'À retenir','Reprenez la fiche d’exercices de la Série 7.', [('JOINTURE','Recoller les tables'),('WHERE','Filtrer les lignes'),('GROUP BY','Former des paquets'),('HAVING','Filtrer les groupes'),('SOUS-REQUÊTE','Calculer d’abord, utiliser ensuite')],foot='Capsule SQL • Aymen Essouyah • Lycée Rafèha')
# Texte français : traduction des passages de derija et sous-titres découpés par phrases.
subs=[
["STI V2.0, by A E.","Bienvenue dans cette nouvelle capsule SQL : pour mieux comprendre GROUP BY et HAVING.","Aujourd’hui, nous allons découvrir le regroupement, les filtres et les sous-requêtes.","Prenez votre temps, regardez les tableaux et suivez les résultats. On commence !"],
["Imagine que tu es le gérant d’une boutique.","Tu as quatre vendeurs : Sana, Karim, Lina et Walid.","Chaque vente est liée à un vendeur par son identifiant.","La table VENTE contient douze lignes : l’article, sa catégorie, la quantité, le prix unitaire en dinars et l’identifiant du vendeur.","Comment savoir quels vendeurs sont les plus performants ?","Pour chaque ligne, on multiplie la quantité par le prix unitaire.","Ensuite, on additionne les ventes de chaque vendeur. Walid n’a aucune vente."],
["GROUP BY signifie que l’on regroupe les lignes en paquets.","Ici, un paquet pour Sana, un pour Karim et un pour Lina.","Regardons la requête. FROM choisit les deux tables.","WHERE relie l’identifiant du vendeur à celui de la vente : c’est la jointure.","GROUP BY forme un groupe par vendeur.","SUM additionne la quantité multipliée par le prix unitaire dans chaque groupe.","Résultat : Sana, 1 045 dinars. Karim, 766 dinars. Lina, 620 dinars.","Le total de la boutique est 2 431 dinars.","Sans GROUP BY, un seul total ne permettrait pas de distinguer les vendeurs."],
["C’est important : WHERE filtre les lignes avant le regroupement. HAVING filtre les groupes après.","WHERE ne garde que les ventes dont le prix unitaire est au moins 30 dinars.","Au départ, le produit des deux tables contient 48 lignes. La jointure en garde 12.","Le filtre sur le prix en garde 8. GROUP BY forme 3 groupes.","Leurs chiffres d’affaires : Sana, 795 dinars ; Karim, 520 ; Lina, 590.","HAVING conserve les groupes dont le total dépasse 700.","Résultat : Sana, 795 dinars.","On ne met pas SUM dans WHERE : le total du groupe n’existe pas encore.","Une condition sur une ligne ? WHERE. Sur un total, un nombre ou une moyenne par groupe ? HAVING."],
["Maintenant, la sous-requête : une question à l’intérieur d’une autre.","La requête intérieure calcule les groupes dont le chiffre d’affaires dépasse 700 dinars.","Elle renvoie les identifiants 1 et 2. La requête extérieure utilise IN : Sana et Karim.","Autre possibilité : placer la sous-requête dans FROM.","Elle construit une table temporaire avec l’identifiant et le chiffre d’affaires.","La requête extérieure relie cette table aux vendeurs, puis filtre la colonne CA avec WHERE.","Résultat : Sana, 1 045 dinars ; Karim, 766 dinars.","Attention : ici, toutes les ventes sont prises en compte. Ce n’est pas le même filtre que précédemment."],
["Quelle méthode choisir ? La jointure avec GROUP BY permet de relier les tables puis de regrouper.","La sous-requête permet de calculer d’abord, puis d’utiliser ce résultat.","Avec la jointure classique, Walid disparaît, parce qu’il n’a aucune vente.","NOT IN cherche les identifiants absents de la table des ventes. Résultat : Walid.","Quels vendeurs dépassent la moyenne des vendeurs ayant vendu ?","La sous-requête calcule 2 431 divisé par 3, soit environ 810,33 dinars.","HAVING compare ensuite chaque total à cette moyenne.","Résultat : seul le vendeur 1, Sana, avec 1 045 dinars, la dépasse.","Une sous-requête est pratique pour comparer à un calcul préalable ou rechercher une absence."],
["Trois pièges à éviter. Premièrement, SUM dans WHERE : erreur.","Pour filtrer un total de groupe, utilise HAVING.","Deuxièmement, afficher une catégorie sans l’agréger ni l’inclure dans GROUP BY : erreur.","Il faut la regrouper ou l’agréger de manière appropriée.","Troisièmement, oublier la condition de jointure entre vendeur et vente : erreur.","On obtient un produit cartésien : chaque vendeur est associé à toutes les ventes.","Vérifie toujours la condition qui relie les deux identifiants. Ainsi, les résultats restent cohérents."],
["On récapitule. La jointure recolle les tables. WHERE filtre les lignes.","GROUP BY forme les paquets. HAVING filtre les paquets.","Une sous-requête calcule d’abord une réponse que l’autre requête peut utiliser.","Pour t’entraîner, reprends la fiche d’exercices de la série 7 et refais chaque mission.","Bravo ! À bientôt pour une nouvelle capsule SQL.","Enseignant : Aymen Essouyah. Lycée Rafèha."]]
def run(a): subprocess.run(a,check=True)
def stamp(x):
 n=round(x*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}.{n%1000:03}'
with tempfile.TemporaryDirectory() as td:
 t=Path(td);dur=[]
 for i in range(8):
  w=t/f'{i}.wav';run([FF,'-y','-loglevel','error','-i',str(HERE/f'voix/sql7-{i+1}.mp3'),'-ar','44100','-ac','1',str(w)])
  with wave.open(str(w),'rb') as f:dur.append(f.getnframes()/f.getframerate())
 # Small breathing pauses between scenes; visual times include those pauses.
 gap=1.0; duration=sum(dur)+gap*7+2
 with wave.open(str(t/'voice.wav'),'wb') as o:
  o.setparams((1,2,44100,0,'NONE','not compressed'))
  for i in range(8):
   with wave.open(str(t/f'{i}.wav'),'rb') as f:o.writeframes(f.readframes(f.getnframes()))
   o.writeframes(b'\0\0'*int(44100*(gap if i<7 else 2)))
 starts=[];x=0
 for i in range(8):starts.append(x);x+=dur[i]+(gap if i<7 else 2)
 parts=[]
 for i,(scene,frac,im) in enumerate(S):
  path=t/f'{i}.png'; im.save(path); length=(dur[scene]+(gap if scene<7 else 2))*frac; parts.append((path,length))
 with open(t/'list.txt','w') as f:
  for p,d in parts:f.write(f"file '{p}'\nduration {d:.6f}\n")
  f.write(f"file '{parts[-1][0]}'\n")
 v=['WEBVTT','']
 for i,phrases in enumerate(subs):
  weights=[len(p) for p in phrases];total=sum(weights);pos=starts[i]
  for p,w in zip(phrases,weights):
   end=pos+dur[i]*w/total;v += [f'{stamp(pos)} --> {stamp(end)}',p,''];pos=end
 VTT.write_text('\n'.join(v),encoding='utf-8')
 # Fondus courts entre les planches, sans clignotement.
 boundaries=[]; elapsed=0
 for _, d in parts[:-1]:
  elapsed+=d; boundaries.append(elapsed)
 vf='fps=12,'+','.join(x for b in boundaries for x in (f"fade=t=out:st={b-0.3:.3f}:d=0.3:enable='between(t,{b-0.3:.3f},{b:.3f})'", f"fade=t=in:st={b:.3f}:d=0.3:enable='between(t,{b:.3f},{b+0.3:.3f})'"))
 # Calme instrumental original, très discret derrière la voix.
 run([FF,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(t/'list.txt'),'-i',str(t/'voice.wav'),'-f','lavfi','-i',f'sine=frequency=220:sample_rate=44100:duration={duration}', '-filter_complex','[2:a]volume=0.006,lowpass=f=450[m];[1:a][m]amix=inputs=2:duration=first:normalize=0[a]', '-map','0:v','-map','[a]','-t',str(duration),'-vf',vf,'-r','12','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-movflags','+faststart',str(OUT)])
 # Sous-titres intégrés au MP4 en plus de la piste WebVTT du site.
 mux=t/'capsule-sous-titres.mp4'
 run([FF,'-y','-loglevel','error','-i',str(OUT),'-i',str(VTT),'-map','0','-map','1:0','-c','copy','-c:s','mov_text','-metadata:s:s:0','language=fra','-movflags','+faststart',str(mux)])
 os.replace(mux,OUT)
 print('Durée:',duration,'secondes')
