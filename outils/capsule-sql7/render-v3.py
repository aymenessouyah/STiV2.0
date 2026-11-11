"""Maquette Série 7. Dépendances : Pillow et imageio-ffmpeg.
La source ancienne est extraite du commit historique, sans la modifier.
La bande-son d'origine est conservée : vérifier la devise à l'écoute avant publication.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, re, tempfile
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe(); W,H=1920,1080
fontpath='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'; mono='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
F=lambda n,b=False,m=False:ImageFont.truetype(mono if m else bold if b else fontpath,n)
WHITE='#f4f4f4'; GREEN='#7bbc68'; YELLOW='#f2db46'; BLUE='#6aa4e3'; ORANGE='#ef7950'; RED='#ef5b5b'
def text(d,xy,s,size=39,color=WHITE,b=False,m=False,spacing=16): d.multiline_text(xy,s,font=F(size,b,m),fill=color,spacing=spacing)
def box(d,xy,w,h,label,sql,size=31):
 x,y=xy; d.rectangle((x,y,x+w,y+h),outline=BLUE,width=3);text(d,(x+20,y+13),label,27,YELLOW,True);text(d,(x+20,y+57),sql,size,BLUE,m=True,spacing=8)
def table(d,x,y,width,heads,rows,heights=65,size=33):
 n=len(heads);cw=width/n
 for i,row in enumerate([heads]+rows):
  for j,val in enumerate(row):
   xx=x+j*cw; yy=y+i*heights;d.rectangle((xx,yy,xx+cw,yy+heights),outline='#888888',width=3);text(d,(xx+13,yy+12),str(val),size,RED if i==0 else WHITE,b=i==0)
def base(title):
 im=Image.new('RGB',(W,H),'#050505');d=ImageDraw.Draw(im);text(d,(70,35),title,51,GREEN,True);d.line((70,110,1850,110),fill=YELLOW,width=4);return im,d
q1='SELECT id_vendeur,\n       SUM(quantite * prix_unitaire) AS ca\nFROM VENTE\nGROUP BY id_vendeur;'
q2='SELECT id_vendeur,\n       SUM(quantite * prix_unitaire) AS ca\nFROM VENTE\nGROUP BY id_vendeur\nHAVING SUM(quantite * prix_unitaire) > 700;'
q3='SELECT nom\nFROM VENDEUR\nWHERE id_vendeur IN\n(\n    SELECT id_vendeur\n    FROM VENTE\n    GROUP BY id_vendeur\n    HAVING SUM(quantite * prix_unitaire) > 700\n);'
q4='SELECT ve.nom, t.ca\nFROM VENDEUR ve,\n     (\n         SELECT id_vendeur,\n                SUM(quantite * prix_unitaire) AS ca\n         FROM VENTE\n         GROUP BY id_vendeur\n     ) t\nWHERE ve.id_vendeur = t.id_vendeur\nAND t.ca > 700;'
def slide(i,stage):
 if i==0:
  im,d=base('Bienvenue dans STI Version 2.0');text(d,(270,380),'COMPRENDRE  ·  PRATIQUER  ·  MAÎTRISER',55,WHITE,True);text(d,(675,520),'GROUP BY  •  HAVING',57,YELLOW,True);return im
 if i==1:
  im,d=base('GROUP BY et SOUS-REQUÊTES : quelle différence ?');text(d,(100,220),'GROUP BY',66,GREEN,True);text(d,(100,330),'Regrouper plusieurs lignes ayant une même valeur\npour réaliser des calculs sur chaque groupe.',44);text(d,(100,580),'GROUP BY et sous-requête ne sont pas équivalents.',43,YELLOW,True);return im
 if i==2:
  im,d=base('1  •  Comprendre GROUP BY');box(d,(70,190),1050,390,'REQUÊTE SQL',q1,32);text(d,(1170,200),'Regrouper par vendeur',39,GREEN,True);text(d,(1170,270),'1. Prendre les lignes\n2. Regrouper les vendeurs\n3. Calculer chaque CA\n4. Un résultat par groupe',35,WHITE,spacing=22)
  if stage: text(d,(100,630),'RÉSULTAT  •  3 lignes',37,YELLOW,True);table(d,100,700,840,['id_vendeur','CA'],[[1,1045],[2,766],[3,620]]);text(d,(1080,770),'GROUP BY = REGROUPER\nET CALCULER',45,GREEN,True)
  return im
 if i==3:
  im,d=base('2  •  Comprendre une sous-requête');text(d,(90,165),'Une requête SQL placée à l’intérieur d’une autre requête.',43)
  d.rectangle((100,310,1820,630),outline=BLUE,width=4);text(d,(135,335),'BOÎTE EXTÉRIEURE : exploite le résultat',43,BLUE,True);d.rectangle((340,420,1550,560),outline=YELLOW,width=4);text(d,(385,458),'BOÎTE INTÉRIEURE : calcule le résultat',41,YELLOW,True)
  if stage: text(d,(120,740),'1. Résultat intérieur  →  2. Utilisation extérieure',43,GREEN,True);text(d,(120,840),'Une sous-requête peut apparaître dans SELECT, WHERE ou FROM.',38)
  return im
 if i==4:
  im,d=base('3  •  Les vendeurs dont le CA dépasse 700');table(d,75,155,650,['id_vendeur','nom'],[[1,'Sana'],[2,'Karim'],[3,'Lina'],[4,'Walid']],54,27);text(d,(790,170),'CA d’une vente = quantite × prix_unitaire',34,YELLOW,True);box(d,(75,490),1200,360,'SOLUTION 1  •  GROUP BY + HAVING',q2,29)
  if stage: text(d,(1340,500),'RÉSULTAT',34,YELLOW,True);table(d,1340,560,500,['id_vendeur','CA'],[[1,1045],[2,766]],65,27);text(d,(1330,820),'2 lignes',30,GREEN,True)
  return im
 if i==5:
  im,d=base('3  •  Deuxième solution : sous-requête avec IN');box(d,(70,150),1110,575,'REQUÊTE SQL',q3,29);text(d,(1250,190),'1. À l’intérieur :\n    identifiants 1 et 2',39,YELLOW,True);text(d,(1250,330),'2. À l’extérieur :\n    retrouver les noms',39,GREEN,True)
  if stage: text(d,(1250,490),'RÉSULTAT  •  2 lignes',35,YELLOW,True);table(d,1250,550,500,['nom'],[['Sana'],['Karim']]);text(d,(80,795),'GROUP BY + HAVING calcule et filtre les groupes.',34,WHITE);text(d,(80,860),'IN utilise le résultat d’une autre requête pour filtrer.',34,WHITE);text(d,(80,940),'Les colonnes retournées diffèrent : identifiant et CA / nom.',30,ORANGE,True)
  return im
 if i==6:
  im,d=base('4  •  Une sous-requête dans FROM');box(d,(70,150),1120,690,'SOLUTION 3  •  TABLE TEMPORAIRE t',q4,28);text(d,(1240,190),'1. Calculer le CA',36,YELLOW,True);text(d,(1240,260),'2. Former la table t',36,WHITE);text(d,(1240,330),'3. Relier au vendeur',36,WHITE);text(d,(1240,400),'4. Filtrer avec WHERE',36,GREEN,True)
  if stage: text(d,(1240,515),'RÉSULTAT  •  2 lignes',33,YELLOW,True);table(d,1240,575,580,['nom','CA'],[['Sana',1045],['Karim',766]],65,30);text(d,(85,910),'HAVING filtre les groupes ; WHERE filtre ici le CA déjà calculé dans t.',33,ORANGE,True)
  return im
 if i==7:
  im,d=base('5  •  Tableau comparatif');table(d,70,175,1780,['Critère','GROUP BY','Sous-requête'],[['Objectif','Regrouper des lignes','Requête dans une autre'],['Fonction','Totaux, nombres, moyennes','Valeur, liste ou table'],['Filtrage','HAVING sur les groupes','Requête extérieure'],['Utilisation','Dans une requête','SELECT, WHERE, FROM'],['Résultat','Groupes calculés','Valeur, liste ou table']],90,27)
  if stage:text(d,(75,890),'Attention : une sous-requête peut contenir GROUP BY et HAVING.',35,YELLOW,True)
  return im
 if i==8:
  im,d=base('6  •  À retenir');text(d,(90,170),'GROUP BY : je regroupe les lignes pour calculer.\nHAVING : je filtre les groupes obtenus.\nSous-requête : j’utilise le résultat d’une autre requête.\nUne sous-requête peut contenir GROUP BY et HAVING.',34,WHITE,spacing=24)
  if stage:text(d,(90,550),'CA supérieur à 700 : quelle solution choisir ?',42,YELLOW,True);text(d,(90,640),'1. GROUP BY + HAVING     2. Sous-requête avec IN',37,GREEN,True);text(d,(90,745),'Les deux sont possibles : le choix dépend du résultat\nsouhaité et de la structure de la requête.',36,WHITE)
  return im
 im,d=base('STI VERSION 2.0');text(d,(360,390),'Comprendre  ·  Pratiquer  ·  Maîtriser',54,WHITE,True);text(d,(820,600),"By A'E",57,YELLOW,True);return im

def run(cmd):subprocess.run(cmd,check=True)
def duration(path):
 r=subprocess.run([FF,'-i',str(path)],capture_output=True,text=True);m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r.stderr);return sum(float(x)*v for x,v in zip(m.groups(),(3600,60,1)))
with tempfile.TemporaryDirectory() as td:
 t=Path(td);parts=[]
 # Intro sans narration : la séquence d'ouverture d'origine est remplacée.
 for i in range(10):
  stages=2 if 2<=i<=8 else 1
  for s in range(stages): slide(i,s).save(t/f's{i}-{s}.png')
  total=(5 if i in (0,9) else duration(HERE/f'voix-v3/{i:02}.mp3')+2)
  # Le texte complet et sa réponse restent plusieurs secondes à l'écran.
  files=[]
  for s in range(stages):
   length=total if stages==1 else total*(0.56 if s==0 else 0.44)
   cmd=[FF,'-loglevel','error','-loop','1','-framerate','30','-i',str(t/f's{i}-{s}.png'),'-t',str(length),'-vf','fade=t=in:st=0:d=0.4','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(t/f's{i}-{s}.mp4')];run(cmd);files.append(t/f's{i}-{s}.mp4')
  listing=t/f'list{i}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in files))
  if i in (0,9): audio=['-f','lavfi','-i','anullsrc=r=44100:cl=stereo']
  else:audio=['-i',str(HERE/f'voix-v3/{i:02}.mp3')]
  p=t/f'part{i}.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(listing),*audio,'-t',str(total),'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af','apad','-y',str(p)]);parts.append(p)
 # Original issu du dépôt, sauf introduction et générique de fin. Les images sont agrandies.
 original=t/'original.mp4'
 with original.open('wb') as f: subprocess.run(['git','show','6d4bb1c:assets/videos/GroupBy-Having.mp4'],cwd=ROOT,stdout=f,check=True)
 p=t/'original-traite.mp4'
 # Masquage de l'intitulé uniquement pendant l'introduction du cours ; l'exemple
 # des 5000 euros a son libellé remplacé visuellement, sa narration reste à vérifier.
 vf="scale=1920:1080:flags=lanczos,unsharp=5:5:0.35:3:3:0.0,drawbox=x=420:y=25:w=720:h=65:color=black:t=fill:enable='between(t,0,27)',drawbox=x=1132:y=952:w=180:h=58:color=black:t=fill:enable='between(t,752.2,757.7)',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Dinars':x=1134:y=956:fontsize=40:fontcolor=0xef3333:enable='between(t,752.2,757.7)',drawbox=x=1100:y=0:w=220:h=1080:color=black:t=fill:enable='between(t,757.7,758.9)',drawbox=x=1110:y=100:w=180:h=60:color=black:t=fill:enable='between(t,758.9,805)',drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='Dinars':x=1115:y=101:fontsize=40:fontcolor=0xef3333:enable='between(t,758.9,805)'"
 run([FF,'-loglevel','error','-ss','10','-i',str(original),'-t','806','-vf',vf,'-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-ar','44100','-ac','2','-y',str(p)])
 sequence=[parts[0],p,*parts[1:]];lst=t/'all.txt';lst.write_text(''.join(f"file '{p}'\n" for p in sequence));out=ROOT/'assets/videos/sql-serie7-groupby-having-sous-requetes-v3.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart','-y',str(out)]);print(out,flush=True)
