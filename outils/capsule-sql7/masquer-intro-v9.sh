#!/bin/sh
# À lancer à la racine. FF peut désigner un binaire ffmpeg.
set -eu
FF=${FF:-ffmpeg}
in=assets/videos/sql-serie7-groupby-having-sous-requetes-v8.mp4
out=assets/videos/sql-serie7-groupby-having-sous-requetes-v9.mp4
test -f "$in" || { echo "Source manquante : $in" >&2; exit 1; }
# 13:30–13:32 est remplacé par du noir et du silence, sans décaler les repères.
# Le bandeau de la carte d'ouverture de l'extrait 1 est masqué jusqu'à sa sortie.
"$FF" -hide_banner -loglevel warning -i "$in" \
  -vf "drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:enable='gte(t,810)*lt(t,812)',drawbox=x=500:y=0:w=800:h=130:color=black:t=fill:enable='gte(t,812)*lt(t,820)'" \
  -af "volume=0:enable='gte(t,810)*lt(t,812)'" \
  -map 0:v:0 -map 0:a:0 -c:v libx264 -preset veryfast -crf 27 -threads 2 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -ar 44100 -movflags +faststart -y "$out"
