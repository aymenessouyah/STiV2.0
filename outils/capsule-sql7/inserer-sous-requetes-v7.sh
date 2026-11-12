#!/bin/sh
# Reproduire la v7 à partir de la v6 et des quatre sources disponibles sur main.
# FF peut désigner un binaire ffmpeg ; exécuter depuis la racine du dépôt.
set -eu
FF=${FF:-ffmpeg}
base=assets/videos
for f in "$base/sql-serie7-groupby-having-sous-requetes-v6.mp4" "$base/sous_req1.mp4" "$base/sous_req2.mp4" "$base/sous_req3.mp4" "$base/sous_req4.mp4"; do
  test -f "$f" || { echo "Source absente : $f" >&2; exit 1; }
done
"$FF" -i "$base/sql-serie7-groupby-having-sous-requetes-v6.mp4" -i "$base/sous_req1.mp4" -i "$base/sous_req2.mp4" -i "$base/sous_req3.mp4" -i "$base/sous_req4.mp4" \
-filter_complex '[0:v]trim=end=814,setpts=PTS-STARTPTS,setsar=1[v0];[0:a]atrim=end=814,asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS,setsar=1[v1];[1:a]asetpts=PTS-STARTPTS[a1];[2:v]setpts=PTS-STARTPTS,setsar=1[v2];[2:a]asetpts=PTS-STARTPTS[a2];[3:v]setpts=PTS-STARTPTS,setsar=1[v3];[3:a]asetpts=PTS-STARTPTS[a3];[4:v]setpts=PTS-STARTPTS,setsar=1[v4];[4:a]asetpts=PTS-STARTPTS[a4];[0:v]trim=start=814,setpts=PTS-STARTPTS,setsar=1[v5];[0:a]atrim=start=814,asetpts=PTS-STARTPTS[a5];[v0][a0][v1][a1][v2][a2][v3][a3][v4][a4][v5][a5]concat=n=6:v=1:a=1[v][a]' \
-map '[v]' -map '[a]' -c:v libx264 -preset veryfast -crf 26 -threads 2 -pix_fmt yuv420p -r 30 -c:a aac -b:a 128k -ar 44100 -movflags +faststart -y "$base/sql-serie7-groupby-having-sous-requetes-v7.mp4"
