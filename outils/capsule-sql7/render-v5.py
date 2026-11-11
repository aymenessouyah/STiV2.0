"""Montage de travail v5 : voix originale au début, une voix pour les ajouts.
Nécessite les sorties base-v5 et missions-v5 de rendu-comparaisons-v5.py.
Les masquages et les coupures audio sont approximatifs et doivent être vérifiés.
"""
from pathlib import Path
from PIL import ImageDraw
import subprocess, tempfile, re
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[2];HERE=Path(__file__).resolve().parent
FF=imageio_ffmpeg.get_ffmpeg_exe()
ns={'__file__':str(HERE/'render-v4.py'),'__name__':'capsule_v4'}
exec(compile((HERE/'render-v4.py').read_text().split('\nwith tempfile.TemporaryDirectory() as td:')[0],'render-v4.py','exec'),ns)
slide=ns['slide'];comparison=ns['comparison']
board={'__file__':str(HERE/'rendu-comparaisons-v5.py'),'__name__':'comparaisons_v5'}
exec(compile((HERE/'rendu-comparaisons-v5.py').read_text().split('\nwith tempfile.TemporaryDirectory() as td:')[0],'rendu-comparaisons-v5.py','exec'),board)
source_scene=board['source_scene']
def run(args):subprocess.run(args,check=True)
def duration(path):
 r=subprocess.run([FF,'-i',str(path)],capture_output=True,text=True);m=re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)',r.stderr);return sum(float(x)*v for x,v in zip(m.groups(),(3600,60,1)))
def guide(im,kind):
 d=ImageDraw.Draw(im)
 if kind=='interieur':d.rectangle((85,310,1160,610),outline='#f2dc45',width=5)
 if kind=='exterieur':
  d.rectangle((85,198,1160,307),outline='#f2dc45',width=5)
  d.rectangle((85,613,1160,665),outline='#f2dc45',width=5)
 return im

with tempfile.TemporaryDirectory() as td:
 t=Path(td);v4=HERE/'apercu-v4.mp4';assert v4.exists();assert (HERE/'base-v5.mp4').exists() and (HERE/'missions-v5.mp4').exists()
 # Première partie du montage existant : la mention vidéo 8 est masquée plus
 # largement ; la phrase sous HAVING est corrigée dans les deux dispositions.
 line=t/'phrase.txt';line.write_text(">> HAVING s'applique aux groupes créés",encoding='utf8')
 font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
 vf=("drawbox=x=300:y=0:w=1100:h=150:color=black:t=fill:enable='between(t,5,33)',"
     "drawbox=x=980:y=326:w=860:h=58:color=black:t=fill:enable='between(t,689,713.3)',"
     f"drawtext=fontfile={font}:textfile={line}:x=980:y=326:fontsize=38:fontcolor=white:enable='between(t,689,713.3)',"
     "drawbox=x=970:y=205:w=870:h=185:color=black:t=fill:enable='between(t,713.3,714.4)',"
     "drawbox=x=980:y=219:w=860:h=58:color=black:t=fill:enable='between(t,714.4,740.5)',"
     f"drawtext=fontfile={font}:textfile={line}:x=980:y=219:fontsize=34:fontcolor=white:enable='between(t,713.3,740.5)'")
 # Les fenêtres ciblées sont à valider à l'écoute : sans cette vérification,
 # on ne peut pas garantir qu'elles couvrent uniquement le mot « euros ».
 af="volume=volume=0:enable='between(t,759.3,761.1)+between(t,800.3,802.1)'"
 first=t/'cours.mp4';run([FF,'-loglevel','error','-i',str(v4),'-t','811','-vf',vf,'-af',af,'-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-c:a','aac','-ar','44100','-ac','2','-y',str(first)])
 parts=[first,HERE/'base-v5.mp4']; order=[1,2,3,4,5,9,6,7,8,10];audio_map={1:7,2:8,3:9,4:10,5:11,9:12,6:13,7:14,8:15}
 for idx in order:
  if idx==8:parts.append(HERE/'missions-v5.mp4')
  if idx==10: images=[slide(9,0)];lengths=[5];audio=None;delay=0
  else:
   audio=HERE/'voix-v5'/f'{audio_map[idx]:02}.mp3';v=duration(audio)+2;delay=6 if idx in (2,4,5,6) else 0
   if idx==9:images=[comparison()];lengths=[v]
   elif idx==5:
    images=[source_scene(),guide(slide(5,0),'interieur'),guide(slide(5,0),'exterieur'),slide(5,1)];lengths=[6,15,9,max(8,v-24)]
   elif 2<=idx<=8:
    a,b=slide(idx,0),slide(idx,1);images=([source_scene(),a,b] if delay else [a,b]);lengths=([6] if delay else [])+[v*.56,v*.44]
   else:images=[slide(idx,0)];lengths=[v]
  clips=[]
  for j,(im,length) in enumerate(zip(images,lengths)):
   png=t/f'{idx}-{j}.png';im.save(png);out=t/f'{idx}-{j}.mp4'
   run([FF,'-loglevel','error','-loop','1','-framerate','30','-i',str(png),'-t',str(length),'-vf','fade=t=in:st=0:d=0.4','-c:v','libx264','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-an','-y',str(out)]);clips.append(out)
  lst=t/f'l{idx}.txt';lst.write_text(''.join(f"file '{p}'\n" for p in clips));part=t/f'part{idx}.mp4'
  aud=['-i',str(audio)] if audio else ['-f','lavfi','-i','anullsrc=r=44100:cl=stereo']
  afilt=(f'adelay={delay*1000}|{delay*1000},apad' if delay else 'apad')
  run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),*aud,'-t',str(sum(lengths)),'-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af',afilt,'-y',str(part)]);parts.append(part)
 lst=t/'all.txt';lst.write_text(''.join(f"file '{p}'\n" for p in parts));out=HERE/'apercu-complet-v5.mp4';run([FF,'-loglevel','error','-f','concat','-safe','0','-i',str(lst),'-c','copy','-movflags','+faststart','-y',str(out)]);print(out,flush=True)
