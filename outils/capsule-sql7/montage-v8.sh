#!/bin/sh
# À lancer depuis la racine du dépôt. FF peut désigner un binaire ffmpeg.
set -eu
FF=${FF:-ffmpeg}
source=assets/videos/sql-serie7-groupby-having-sous-requetes-v7.mp4
output=assets/videos/sql-serie7-groupby-having-sous-requetes-v8.mp4
test -f "$source" || { echo "Source manquante : $source" >&2; exit 1; }
# La limite 1663.866667 s est le changement de plan entre le quatrième extrait
# et la suite de la capsule v7 ; les coupures sont les mêmes en audio et vidéo.
"$FF" -hide_banner -loglevel warning -i "$source" -filter_complex '
[0:v]trim=start=0:end=811,setpts=PTS-STARTPTS[v0];[0:a]atrim=start=0:end=811,asetpts=PTS-STARTPTS[a0];
[0:v]trim=start=813:end=814,setpts=PTS-STARTPTS[v1];[0:a]atrim=start=813:end=814,asetpts=PTS-STARTPTS[a1];
color=c=black:s=1920x1080:r=30:d=0.5,format=yuv420p[b1];anullsrc=r=44100:cl=stereo,atrim=duration=0.5,asetpts=PTS-STARTPTS[ba1];
[0:v]trim=start=814:end=1663.866667,setpts=PTS-STARTPTS[v2];[0:a]atrim=start=814:end=1663.866667,asetpts=PTS-STARTPTS[a2];
color=c=black:s=1920x1080:r=30:d=0.5,format=yuv420p[b2];anullsrc=r=44100:cl=stereo,atrim=duration=0.5,asetpts=PTS-STARTPTS[ba2];
color=c=black:s=1920x1080:r=30:d=3,format=yuv420p,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text=Group\ by\ vs\ Sous_requête:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2[title];anullsrc=r=44100:cl=stereo,atrim=duration=3,asetpts=PTS-STARTPTS[ta];
[0:v]trim=start=811:end=813,setpts=PTS-STARTPTS[v3];[0:a]atrim=start=811:end=813,asetpts=PTS-STARTPTS[a3];
[0:v]trim=start=1663.866667,setpts=PTS-STARTPTS[v4];[0:a]atrim=start=1663.866667,asetpts=PTS-STARTPTS[a4];
[v0][a0][v1][a1][b1][ba1][v2][a2][b2][ba2][title][ta][v3][a3][v4][a4]concat=n=8:v=1:a=1[v][a]' \
-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 27 -threads 2 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -ar 44100 -movflags +faststart -y "$output"
