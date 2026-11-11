"""Nouvelle séquence finale v4 ; conserve le cours original de la v3.
Dépendances : Python 3, Pillow, imageio-ffmpeg ; le commit de base doit exister.
La piste sous-titres créée ici couvre uniquement la nouvelle séquence et doit
être contrôlée à l'écoute. La voix et la devise du cours original ne sont pas modifiées.
"""
from pathlib import Path
import subprocess, tempfile, re
from PIL import Image
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[2]; HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe(); BASE='cfe853de7e0c83d7e0fd4be80919f1f22a20bce3'; OLD='assets/videos/sql-serie7-groupby-having-sous-requetes-v3.mp4'
# Les fonctions des planches v3 sont conservées ; ne pas exécuter son montage.
source=(HERE/'render-v3.py').read_text().split('with tempfile.TemporaryDirectory() as td:')[0]
ns={'__file__':str(HERE/'render-v3.py'),'__name__':'capsule_v3'}; exec(compile(source,'render-v3.py','exec'),ns)
slide=ns['slide']; base=ns['base']; text=ns['text']; table=ns['table']; box=ns['box']
WHITE=ns['WHITE']; GREEN=ns['GREEN']; YELLOW=ns['YELLOW']; ORANGE=ns['ORANGE']
def comparison():
 im,d=base('Comparaison : deux résultats, une même sélection')
 box(d,(65,145),870,385,'GROUP BY + HAVING',ns['q2'],27)
 box(d,(985,145),870,385,'SOUS-REQUÊTE AVEC IN',ns['q3'],27)
 text(d,(65,558),'RÉSULTAT : 2 LIGNES',31,YELLOW,True);text(d,(985,558),'RÉSULTAT : 2 LIGNES',31,YELLOW,True)
 table(d,65,610,870,['id_vendeur','CA'],[[1,1045],[2,766]],65,29)
 table(d,985,610,870,['nom'],[['Sana'],['Karim']],65,29)
 text(d,(100,870),'DIFFÉRENTS : les colonnes affichées ne sont pas les mêmes.',35,ORANGE,True)
 text(d,(100,930),'IDENTIQUES : les vendeurs retenus sont Sana et Karim.',35,GREEN,True)
 return im

def run(args):subprocess.run(args,check=True)
def duration(p):
 r=subprocess.run([FF,'-i',str(p)],capture_output=True,text=True)
 m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r.stderr)
 return sum(float(x)*v for x,v in zip(m.groups(),(3600,60,1)))
def marker(t):
 # Main de l'original, détachée de son fond noir ; l'écriture elle-même reste
 # celle de chaque planche, la main sert de repère visuel en mouvement.
 path=t/'frame.png';run([FF,'-loglevel','error','-ss','808','-i',str(t/'v3.mp4'),'-frames:v','1','-y',str(path)])
 im=Image.open(path).convert('RGB').resize((640,360)).crop((410,140,640,360)); pix=im.load(); out=Image.new('RGBA',im.size); p=out.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b=pix[x,y]; skin=(r>58 and r>g*1.10 and g>b*1.08 and r>b*1.22); white=(min(r,g,b)>110 and max(r,g,b)-min(r,g,b)<52)
   if skin or white:p[x,y]=(r,g,b,255)
 # La forme est un repère, pas une reconstitution de toutes les animations.
 out=out.resize((230,220));out.save(t/'main.png')

with tempfile.TemporaryDirectory() as td:
 t=Path(td); v3=t/'v3.mp4'
 with v3.open('wb') as f:subprocess.run(['git','show',f'{BASE}:{OLD}'],cwd=ROOT,stdout=f,check=True)
 marker(t)
 # Copie sans réencoder du générique et du cours déjà montés.
 # Le bord de transition est noir à 811 secondes.
 intro=t/'cours.mp4';run([FF,'-loglevel','error','-i',str(v3),'-t','811','-map','0:v:0','-map','0:a:0','-c','copy','-y',str(intro)])
 parts=[]
 # Séquence originale v3 plus une comparaison explicite après IN.
 order=[1,2,3,4,5,9,6,7,8,10]
 for idx in order:
  if idx==9: images=[comparison()]; total=duration(HERE/'voix-v3/09.mp3')+2; audio=HERE/'voix-v3/09.mp3'
  elif idx==10: images=[slide(9,0)];total=5;audio=None
  else:
   images=[slide(idx,0),slide(idx,1)] if 2<=idx<=8 else [slide(idx,0)]
   total=duration(HERE/f'voix-v3/{idx:02}.mp3')+2; audio=HERE/f'voix-v3/{idx:02}.mp3'
  stagefiles=[]
  for j,im in enumerate(images):
   png=t/f'{idx}-{j}.png';im.save(png);seg=t/f'{idx}-{j}.mp4';length=total if len(images)==1 else total*(0.56 if j==0 else 0.44)
   # La main apparaît et se déplace au début de chaque planche ; les requêtes
   # restent visibles bien plus de cinq secondes.
   vf="[0:v]fade=t=in:st=0:d=0.5[scene];[scene][1:v]overlay=x='120+500*min(t/1.6,1)':y=115:enable='lt(t,1.6)':format=auto,format=yuv420p[v]"
   run([FF,'-loglevel','error','-loop','1','-framerate','30','-i',str(png),'-loop','1','-framerate','30','-i',str(t/'main.png'),'-filter_complex',vf,'-map','[v]','-t',str(length),'-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(seg)]);stagefiles.append(seg)
  listing=t/f'l{idx}.txt';listing.write_text(''.join(f"file '{p}'\n" for p in stagefiles));part=t/f'part{idx}.mp4'
  aud=['-i',str(audio)] if audio else ['-f','lavfi','-i','anullsrc=r=44100:cl=stereo']
  run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(listing),*aud,'-t',str(total),'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af','apad','-y',str(part)]);parts.append(part)
 listing=t/'final.txt';listing.write_text(''.join(f"file '{p}'\n" for p in [intro,*parts]));out=HERE/'apercu-v4.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart','-y',str(out)]);print(out,flush=True)
