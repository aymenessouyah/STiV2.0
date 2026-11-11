"""Aperçu vidéo conforme au corrigé v6 (sous-requêtes non corrélées dans WHERE).
Prérequis : préparer-v6.py, rendu-comparaisons-v6.py, Pillow, pypdf, imageio-ffmpeg.
Le cours original et les fenêtres de silence v5 sont conservés ; vérifier à l'écoute.
"""
from pathlib import Path
from PIL import ImageDraw
import subprocess, tempfile, re, json
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent;FF=imageio_ffmpeg.get_ffmpeg_exe()
ns={'__file__':str(HERE/'render-v4.py'),'__name__':'capsule_v4'}
exec(compile((HERE/'render-v4.py').read_text().split('\nwith tempfile.TemporaryDirectory() as td:')[0],'render-v4.py','exec'),ns)
slide=ns['slide'];base=ns['base'];text=ns['text'];table=ns['table'];box=ns['box'];comparison=ns['comparison']
GREEN=ns['GREEN'];BLUE=ns['ns']['BLUE'];YELLOW=ns['YELLOW'];ORANGE=ns['ORANGE'];WHITE=ns['WHITE']
board={'__file__':str(HERE/'rendu-comparaisons-v6.py'),'__name__':'comparaisons_v6'}
exec(compile((HERE/'rendu-comparaisons-v6.py').read_text().split('\nwith tempfile.TemporaryDirectory() as td:')[0],'rendu-comparaisons-v6.py','exec'),board)
source_scene=board['source_scene'];data=json.loads((HERE/'storyboard-v6.json').read_text())
def concept(stage):
 im,d=base('2  •  Sous-requête non corrélée dans WHERE')
 text(d,(90,160),'Une requête SQL placée à l’intérieur d’une autre requête.',40)
 d.rectangle((100,300,1820,640),outline=BLUE,width=4);text(d,(135,325),'BOÎTE EXTÉRIEURE : exploite le résultat',43,BLUE,True)
 d.rectangle((340,415,1550,565),outline=YELLOW,width=4);text(d,(385,458),'BOÎTE INTÉRIEURE : calcule le résultat',40,YELLOW,True)
 if stage:
  text(d,(115,735),'Non corrélée : elle ne dépend pas de la requête extérieure.',39,GREEN,True)
  text(d,(115,820),'Dans ce corrigé : sous-requêtes placées dans WHERE.',39)
 return im

def compare_group(stage):
 im,d=base('5  •  GROUP BY et sous-requête dans WHERE')
 table(d,65,150,1790,['Critère','GROUP BY','Sous-requête WHERE'],[['Objectif','Regrouper des lignes','Requête dans une autre'],['Fonction','Totaux, nombres, moyennes','Fournir valeur ou liste'],['Filtrage','HAVING sur les groupes','Condition extérieure'],['Résultat','Groupes calculés','Valeur ou liste']],96,27)
 if stage:text(d,(85,815),'Une sous-requête peut contenir GROUP BY et HAVING.',37,YELLOW,True);text(d,(85,885),'Une liste avec IN ; une seule valeur avec =, < ou >.',34,GREEN,True)
 return im

def extra(k,stage):
 a=data['supplements'][k];im,d=base(a['titre']);sql=a['sql'];lines=sql.splitlines()
 box(d,(60,135),1120,620,'REQUÊTE SQL',sql,32)
 text(d,(1230,155),'1. REQUÊTE INTÉRIEURE',34,YELLOW,True)
 inn=a['interieur']['resultat']['lignes']
 if k==0: text(d,(1230,215),'AVG = 718 / 12\n≈ 59,83',38,GREEN,True)
 elif k==1: text(d,(1230,215),'Identifiants :\n1, 2 et 3',38,GREEN,True)
 else:text(d,(1230,215),'MAX = 150',38,GREEN,True)
 if stage:
  rr=a['resultat'];text(d,(1230,420),f'RÉSULTAT  •  {len(rr["lignes"])} ligne(s)',31,YELLOW,True)
  table(d,1230,480,600,rr['colonnes'],rr['lignes'],68,29)
  if k==1:text(d,(95,825),'Attention : une valeur NULL dans la liste peut changer le résultat de NOT IN.',30,ORANGE,True)
  if k==0:text(d,(95,825),'Une valeur : >    •    Une liste : IN / NOT IN',33,ORANGE,True)
 return im

def guide(im,kind):
 d=ImageDraw.Draw(im)
 if kind=='interieur':d.rectangle((85,310,1160,610),outline='#f2dc45',width=5)
 if kind=='exterieur':d.rectangle((85,198,1160,307),outline='#f2dc45',width=5);d.rectangle((85,613,1160,665),outline='#f2dc45',width=5)
 return im

def run(cmd):subprocess.run(cmd,check=True)
def duration(path):
 r=subprocess.run([FF,'-i',str(path)],capture_output=True,text=True);m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r.stderr);return sum(float(x)*v for x,v in zip(m.groups(),(3600,60,1)))

with tempfile.TemporaryDirectory() as td:
 t=Path(td);v5=HERE/'apercu-complet-v5.mp4';assert v5.exists();assert (HERE/'base-v6.mp4').exists() and (HERE/'missions-v6.mp4').exists()
 # La première partie conserve strictement le montage v5 (et ses deux silences à vérifier).
 first=t/'cours.mp4';run([FF,'-loglevel','error','-i',str(v5),'-t','811','-map','0:v:0','-map','0:a:0','-c','copy','-y',str(first)])
 parts=[first,HERE/'base-v6.mp4']; order=[1,2,3,4,5,9,6,7,16,17,8,10]
 amap={1:7,2:8,3:9,4:10,5:11,9:12,6:13,7:14,16:16,17:17,8:15}
 for idx in order:
  if idx==16:parts.append(HERE/'missions-v6.mp4')
  if idx==10:images=[slide(9,0)];lengths=[5];audio=None;delay=0
  else:
   a=amap[idx];audio=HERE/('voix-v6' if a in (9,13,14,16,17) else 'voix-v5')/f'{a:02}.mp3';v=duration(audio)+2;delay=6 if idx in (2,4,5,6,16,17) else 0
   if idx==9:images=[comparison()];lengths=[v]
   elif idx==5:images=[source_scene(),guide(slide(5,0),'interieur'),guide(slide(5,0),'exterieur'),slide(5,1)];lengths=[6,15,9,max(8,v-24)]
   elif idx in (6,16,17):
    k={6:0,16:1,17:2}[idx];images=[source_scene(),extra(k,0),extra(k,1)];lengths=[6,v*.55,v*.45]
   elif idx==3:images=[concept(0),concept(1)];lengths=[v*.56,v*.44]
   elif idx==7:images=[compare_group(0),compare_group(1)];lengths=[v*.56,v*.44]
   elif 2<=idx<=8:
    a,b=slide(idx,0),slide(idx,1);images=([source_scene(),a,b] if delay else [a,b]);lengths=([6] if delay else [])+[v*.56,v*.44]
   else:images=[slide(idx,0)];lengths=[v]
  clips=[]
  for j,(im,length) in enumerate(zip(images,lengths)):
   png=t/f'{idx}-{j}.png';im.save(png);p=t/f'{idx}-{j}.mp4';run([FF,'-loglevel','error','-loop','1','-framerate','30','-i',str(png),'-t',str(length),'-vf','fade=t=in:st=0:d=0.4','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(p)]);clips.append(p)
  lst=t/f'l{idx}.txt';lst.write_text(''.join(f"file '{p}'\n" for p in clips));p=t/f'part{idx}.mp4';aud=['-i',str(audio)] if audio else ['-f','lavfi','-i','anullsrc=r=44100:cl=stereo'];af=(f'adelay={delay*1000}|{delay*1000},apad' if delay else 'apad')
  run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),*aud,'-t',str(sum(lengths)),'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af',af,'-y',str(p)]);parts.append(p)
 lst=t/'all.txt';lst.write_text(''.join(f"file '{p}'\n" for p in parts));out=HERE/'apercu-complet-v6.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart','-y',str(out)]);print(out,flush=True)
