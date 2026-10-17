#!/usr/bin/env python3
"""Contrôle reproductible de la publication CSS3 v299, localement ou sur GitHub Pages."""
from __future__ import annotations
import argparse, json, os, re, shutil, subprocess, sys, time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parents[1]
FULL=ROOT/'assets/videos/css3-cours-v8.mp4'
MOBILE=ROOT/'assets/videos/css3-cours-v8-mobile-720p.mp4'
AUDIO=ROOT/'assets/audio/css3-cours.mp3'
POSTER=ROOT/'assets/images/css3-cours-v8-poster.jpg'
VTT=ROOT/'assets/subtitles/css3-cours-v8-fr.vtt'
EXPECTED_DURATION=683.98
BASE='https://aymenessouyah.github.io/STiV2.0/'

class CheckError(RuntimeError): pass

def require(ok: bool, message: str):
    if not ok: raise CheckError(message)
    print('OK  '+message)

def media_info(path: Path) -> dict:
    ffprobe=shutil.which('ffprobe')
    if ffprobe:
        cmd=[ffprobe,'-v','error','-show_entries','format=duration:stream=codec_type,codec_name,width,height,channels,sample_rate','-of','json',str(path)]
        return json.loads(subprocess.check_output(cmd,text=True))
    ffmpeg=os.environ.get('FFMPEG_BIN') or shutil.which('ffmpeg')
    require(bool(ffmpeg),'ffmpeg ou ffprobe disponible')
    proc=subprocess.run([ffmpeg,'-hide_banner','-i',str(path)],text=True,capture_output=True)
    text=proc.stderr
    dur=re.search(r'Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)',text)
    require(bool(dur),f'durée lisible pour {path.name}')
    duration=int(dur[1])*3600+int(dur[2])*60+float(dur[3])
    streams=[]
    for line in text.splitlines():
        if 'Video:' in line:
            wh=re.search(r'(\d{3,5})x(\d{3,5})',line);codec=re.search(r'Video:\s*([^ ,]+)',line)
            streams.append({'codec_type':'video','codec_name':codec.group(1) if codec else '', 'width':int(wh[1]) if wh else 0,'height':int(wh[2]) if wh else 0})
        elif 'Audio:' in line:
            codec=re.search(r'Audio:\s*([^ ,]+)',line);rate=re.search(r'(\d+) Hz',line)
            streams.append({'codec_type':'audio','codec_name':codec.group(1) if codec else '', 'sample_rate':rate.group(1) if rate else ''})
    return {'format':{'duration':str(duration)},'streams':streams}

def stream(info,kind):
    return next((x for x in info.get('streams',[]) if x.get('codec_type')==kind),{})

def verify_local():
    for f in [FULL,MOBILE,AUDIO,POSTER,VTT]: require(f.is_file() and f.stat().st_size>100,f'{f.relative_to(ROOT)} existe')
    full=media_info(FULL);mobile=media_info(MOBILE)
    for name,info,size in [('Full HD',full,(1920,1080)),('mobile',mobile,(1280,720))]:
        duration=float(info['format']['duration']);v=stream(info,'video');a=stream(info,'audio')
        require(abs(duration-EXPECTED_DURATION)<.20,f'{name} dure 683,98 s')
        require((int(v.get('width',0)),int(v.get('height',0)))==size,f'{name} a la définition {size[0]}×{size[1]}')
        require(v.get('codec_name') in {'h264','avc1'},f'{name} utilise H.264')
        require(a.get('codec_name') in {'aac','mp4a'},f'{name} contient une piste AAC')
    ffmpeg=os.environ.get('FFMPEG_BIN') or shutil.which('ffmpeg')
    if ffmpeg:
        for path in [FULL,MOBILE]:
            decoded=subprocess.run([ffmpeg,'-v','error','-i',str(path),'-f','null','-'],text=True,capture_output=True)
            require(decoded.returncode==0 and not decoded.stderr.strip(),f'{path.name} se décode intégralement sans erreur')
    require(MOBILE.stat().st_size < FULL.stat().st_size*.70,'la version mobile est au moins 30 % plus légère')

    vtt=VTT.read_text(encoding='utf-8');require(vtt.startswith('WEBVTT\n'),'le fichier de sous-titres est un WebVTT valide')
    cues=re.findall(r'(?m)^(\d+)\n(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})\n',vtt)
    require(len(cues)==135,'le WebVTT contient 135 répliques')
    def cue_seconds(value):
        h,m,s=value.split(':');return int(h)*3600+int(m)*60+float(s)
    previous_end=-1.0
    for expected,(number,start,end) in enumerate(cues,1):
        a,b=cue_seconds(start),cue_seconds(end)
        require(int(number)==expected and a>=previous_end-.001 and b>a,f'repère WebVTT {expected} monotone')
        previous_end=b
    require(abs(cue_seconds(cues[0][1]))<.001 and previous_end<=EXPECTED_DURATION+.05,'les sous-titres couvrent exactement la durée utile')
    require('NOTE Chapitre 9' in vtt and 'NOTE Chapitre 10' in vtt,'les sous-titres couvrent les dix chapitres')
    filter_part=vtt.split('NOTE Chapitre 9',1)[1].split('NOTE Chapitre 10',1)[0]
    for term in ['blur','grayscale','invert','hors programme']: require(term.lower() in filter_part.lower(),f'le chapitre filter sous-titré contient « {term} »')
    for term in ['sepia()','brightness()','contrast()','saturate()','hue-rotate()','drop-shadow()']:
        require(term not in filter_part.lower(),f'« {term} » n’est pas enseigné dans les sous-titres filter')

    html=(ROOT/'cours/css3.html').read_text(encoding='utf-8')
    js=(ROOT/'assets/js/protection.js').read_text(encoding='utf-8')
    sw=(ROOT/'sw.js').read_text(encoding='utf-8')
    news=json.loads((ROOT/'assets/data/nouveautes.json').read_text(encoding='utf-8'))
    require('atelier-pages.css?v=299' in html and 'protection.js?v=299' in html,'la page force le chargement des ressources v299')
    require(html.count('class="css-transcript-chapter"')==10,'la transcription HTML contient dix chapitres')
    require(html.count('data-css-video-time=')==13,'dix repères et trois raccourcis vidéo sont présents')
    require('id="css-publication-status"' in html and '__STI_CSS3_PUBLICATION_CHECK' in html,'le contrôle automatique de production v299 est actif')
    for ref in ['css3-cours-v8.mp4?v=298','css3-cours-v8-mobile-720p.mp4?v=299','css3-cours.mp3?v=291','css3-cours-v8-poster.jpg?v=298','css3-cours-v8-fr.vtt?v=299','../sw.js?v=299']:
        require(ref in html,f'le contrôle automatique couvre {ref}')
    for val in ['550.90','565.90','580.90']: require(f'data-css-video-time="{val}"' in html,f'le raccourci {val} s est présent')
    for ref in ['css3-cours-v8-mobile-720p.mp4?v=299','css3-cours-v8-fr.vtt?v=299','sti-video-modal-quality','sti-css3-quality','{ t: 613.95']:
        require(ref in js,f'protection.js contient {ref}')
    for ref in ['sti-atelier-v299','css3-cours-v8-mobile-720p.mp4','css3-cours-v8-fr.vtt']:
        require(ref in sw,f'sw.js contient {ref}')
    require(news[0].get('version')=='v299','l’actualité v299 est en tête')

def get(url,head=False):
    req=Request(url,method='HEAD' if head else 'GET',headers={'Cache-Control':'no-cache','User-Agent':'sti-publication-check/299'})
    with urlopen(req,timeout=40) as r:return r.status,r.headers,r.read() if not head else b''

def verify_remote_once():
    stamp='?verify=v299'
    paths={
      'assets/videos/css3-cours-v8.mp4':1_000_000,
      'assets/videos/css3-cours-v8-mobile-720p.mp4':1_000_000,
      'assets/audio/css3-cours.mp3':1_000_000,
      'assets/images/css3-cours-v8-poster.jpg':50_000,
      'assets/subtitles/css3-cours-v8-fr.vtt':1_000,
    }
    for path,min_size in paths.items():
        status,h,_=get(BASE+path+stamp,True);size=int(h.get('Content-Length') or 0)
        require(status==200 and size>=min_size,f'production {path} répond 200 ({size} octets)')
    _,_,page=get(BASE+'cours/css3.html'+stamp);page=page.decode('utf-8')
    _,_,js=get(BASE+'assets/js/protection.js'+stamp);js=js.decode('utf-8')
    _,_,sw=get(BASE+'sw.js'+stamp);sw=sw.decode('utf-8')
    _,_,vtt=get(BASE+'assets/subtitles/css3-cours-v8-fr.vtt'+stamp);vtt=vtt.decode('utf-8')
    _,_,news=get(BASE+'assets/data/nouveautes.json'+stamp);news=json.loads(news)
    for ref in ['atelier-pages.css?v=299','protection.js?v=299','css-video-access','css-course-transcript','data-css-video-time="550.90"','css-publication-status','__STI_CSS3_PUBLICATION_CHECK']: require(ref in page,f'page publiée contient {ref}')
    for ref in ['css3-cours-v8-mobile-720p.mp4?v=299','css3-cours-v8-fr.vtt?v=299','Qualité : 720p éco']:
        require(ref in js,f'JavaScript publié contient {ref}')
    require('sti-atelier-v299' in sw,'service worker publié utilise le cache v299')
    require(vtt.startswith('WEBVTT') and 'NOTE Chapitre 10' in vtt,'WebVTT publié complet')
    require(news[0].get('version')=='v299','actualité publiée en v299')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--remote',action='store_true');ap.add_argument('--retries',type=int,default=1);ap.add_argument('--delay',type=int,default=10);args=ap.parse_args()
    try:
        if not args.remote: verify_local();return
        last=None
        for attempt in range(1,args.retries+1):
            try: verify_remote_once();return
            except (CheckError,HTTPError,URLError,TimeoutError) as exc:
                last=exc;print(f'Attente production {attempt}/{args.retries}: {exc}',file=sys.stderr)
                if attempt<args.retries:time.sleep(args.delay)
        raise CheckError(f'production non conforme après {args.retries} tentatives: {last}')
    except (CheckError,subprocess.CalledProcessError) as exc:
        print('ECHEC '+str(exc),file=sys.stderr);raise SystemExit(1)
if __name__=='__main__':main()
