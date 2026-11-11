"""Aperçu indépendant des cinq missions D/E. Ne modifie pas la vidéo du site."""
from pathlib import Path
import json, subprocess, re, tempfile, textwrap
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe();D=json.loads((HERE/'storyboard-v6.json').read_text(encoding='utf8'));W,H=1920,1080
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';MONO='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
def font(n,b=False,m=False):return ImageFont.truetype(MONO if m else BOLD if b else REG,n)
def txt(d,xy,s,n=29,c='#f6f6f6',b=False,m=False):d.text(xy,str(s),font=font(n,b,m),fill=c)
def wrap(s,n):
 out=[]
 for line in s.split('\n'):
  indent=line[:len(line)-len(line.lstrip())]
  out.extend(textwrap.wrap(line.lstrip(),width=n,initial_indent=indent,subsequent_indent=indent,break_long_words=False,break_on_hyphens=False) or [''])
 return '\n'.join(out)
def lines(d,x,y,s,n=28,c='#fff',m=False,step=None):
 for line in s.split('\n'):txt(d,(x,y),line,n,c,m=m);y+=step or int(n*1.32)
 return y
def canvas(title):
 im=Image.new('RGB',(W,H),'#050505');d=ImageDraw.Draw(im);txt(d,(45,24),title,40,'#84c77a',True);d.line((45,85,1875,85),fill='#eddf49',width=3);return im,d
def source_scene(mission=None):
 im,d=canvas('La base BOUTIQUE : représentation textuelle et données');
 lines(d,50,115,'VENDEUR(id_vendeur, nom)\nVENTE(id, article, categorie, quantite, prix_unitaire, id_vendeur)\nVENTE.id_vendeur → VENDEUR.id_vendeur',27,'#ffdd63',step=38)
 t=D['tables']['VENDEUR'];txt(d,(50,255),'VENDEUR  •  4 lignes',29,'#85c77c',True)
 lines(d,50,300,'id_vendeur  nom\n1           Sana\n2           Karim\n3           Lina\n4           Walid',25,step=36,m=True)
 t=D['tables']['VENTE'];txt(d,(610,255),'VENTE  •  12 lignes',29,'#85c77c',True)
 heads=t['colonnes'];widths=[4,11,12,5,5,4]; fmt=lambda r:' '.join(str(v if v is not None else 'NULL')[:w].ljust(w) for v,w in zip(r,widths))
 lines(d,610,298,fmt(['id','article','catégorie','qté','prix','vend.']),25,'#ec7777',True,step=34)
 lines(d,610,331,'\n'.join(fmt(row) for row in t['lignes']),25,step=34,m=True)
 txt(d,(50,870),'CA d’une vente = quantite × prix_unitaire',30,'#eadd54',True)
 if mission: lines(d,50,930,wrap(mission['enonce'],110),26,'#ffffff')
 return im

def mission_scene(m,stage):
 im,d=canvas(m['titre']+'  •  trois colonnes'); xs=[45,650,1260];ws=[565,570,610]
 for x,w in zip(xs,ws):d.rectangle((x,113,x+w,1025),outline='#696969',width=2)
 txt(d,(65,135),'1. QUESTION',29,'#eadd54',True);lines(d,65,185,wrap(m['enonce'],34),27,step=39)
 lines(d,65,390,'Point de départ :\nVENDEUR : 4 lignes\nVENTE : 12 lignes\n\nCA = quantité × prix',25,'#ddd',step=36)
 txt(d,(670,135),'2. JOINTURE',29,'#eadd54',True);txt(d,(1280,135),'3. SOUS-REQUÊTE',29,'#eadd54',True)
 for index,key in enumerate(['jointure','sous_requete']):
  x=xs[index+1];width=ws[index+1];col=m[key]
  if col is None:
   lines(d,x+20,190,wrap('Aucune solution proposée dans la partie E du corrigé.',36),25,'#eeeeee',step=35);continue
  sql=wrap(col['sql'],34)
  # Repères par ligne : la jointure est guidée de haut en bas ; la
  # sous-requête montre d'abord l'intérieur, puis la requête extérieure.
  lignes=sql.split('\n')
  if stage==1 and index==0:
   for pos in range(len(lignes)): d.rectangle((x+10,190+pos*32,x+width-10,221+pos*32),outline='#f2db46',width=2)
  if stage in (2,3) and index==1:
   inner=[pos for pos,line in enumerate(lignes) if line.startswith('    ') or line.lstrip().startswith('(SELECT')]
   chosen=inner if stage==2 else [pos for pos in range(len(lignes)) if pos not in inner]
   for pos in chosen: d.rectangle((x+10,190+pos*32,x+width-10,221+pos*32),outline='#f2db46',width=2)
  lines(d,x+20,195,sql,25,'#86b8ed',m=True,step=32)
  r=col['resultat']; n=len(r['lignes']);txt(d,(x+20,570),f'RÉSULTAT • {n} ligne'+('s' if n!=1 else ''),24,'#a7d69a',True)
  widths=[14,12,10] if len(r['colonnes'])==3 else ([18,14] if len(r['colonnes'])==2 else [30])
  def row(v):return ' '.join(str('NULL' if a is None else a)[:w].ljust(w) for a,w in zip(v,widths))
  lines(d,x+20,610,row(r['colonnes']),21,'#ef7777',m=True,step=25)
  lines(d,x+20,638,'\n'.join(row(v) for v in r['lignes']),21,'#ffffff',m=True,step=25)
 lines(d,65,700,wrap(m['remarque'],35),23,'#f3b56c',step=34)
 return im

def run(cmd):subprocess.run(cmd,check=True)
def duration(p):
 r=subprocess.run([FF,'-i',str(p)],capture_output=True,text=True);m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r.stderr);return sum(float(v)*k for v,k in zip(m.groups(),[3600,60,1]))
with tempfile.TemporaryDirectory() as td:
 t=Path(td);parts=[]
 for i in range(6):
  audio=HERE/('voix-v6' if i+1 in (3,6) else 'voix-v5')/f'{i+1:02}.mp3';dur=duration(audio)+2
  if not i:images=[source_scene()];lengths=[dur]
  else:
   m=D['missions'][i-1]; images=[source_scene(m),mission_scene(m,1),mission_scene(m,2),mission_scene(m,3)]; lengths=[7,max(7,(dur-7)*0.40),max(7,(dur-7)*0.32),max(7,(dur-7)*0.28)]
  videos=[]
  for j,(im,length) in enumerate(zip(images,lengths)):
   png=t/f'{i}-{j}.png';im.save(png);out=t/f'{i}-{j}.mp4';run([FF,'-loglevel','error','-loop','1','-framerate','30','-i',str(png),'-t',str(length),'-vf','fade=t=in:st=0:d=0.4','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(out)]);videos.append(out)
  lst=t/f'{i}.txt';lst.write_text(''.join(f"file '{p}'\n" for p in videos));out=t/f'part{i}.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),'-i',str(audio),'-t',str(sum(lengths)),'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af','apad','-y',str(out)]);parts.append(out)
 for name, sequence in [('apercu-comparaisons-v6.mp4',parts),('base-v6.mp4',parts[:1]),('missions-v6.mp4',parts[1:])]:
  lst=t/(name+'.txt');lst.write_text(''.join(f"file '{p}'\n" for p in sequence));out=HERE/name;run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart','-y',str(out)]);print(out,flush=True)
