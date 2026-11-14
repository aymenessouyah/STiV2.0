#!/usr/bin/env python3
"""Modifier uniquement les lignes concernées dans les deux PDF fournis.

Dépendance : PyMuPDF ; utiliser --sources pour indiquer le dossier des deux PDF.
Les polices DejaVu du système reprennent les polices des documents d'origine.
"""
import argparse
import hashlib
import re
from pathlib import Path
import pymupdf as fitz

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'exercices/php/serie-6'
FONT_DIR = Path('/usr/share/fonts/truetype/dejavu')
MONO = str(FONT_DIR / 'DejaVuSansMono.ttf')
SANS = str(FONT_DIR / 'DejaVuSans.ttf')
fitz.TOOLS.set_small_glyph_heights(True)

# Chaque remplacement occupe la même ligne que l'original ; les cadres et les
# autres éléments de la page sont conservés. Les boucles conservent l'ordre.
LIGNES = {
'f) le 2e mot et le nombre de mots (utiliser explode)': 'f) le 2e mot et le nombre de mots',
'affichés séparés par - (utiliser implode).': 'affichés séparés par - à l’aide d’une boucle.',
'foreach ($s as $k => $v) {': 'for (reset($s); ($k = key($s)) !== null; next($s)) { $v = current($s);',
'echo "<br>" . implode(",", $notes) . " " . max($notes) . " " . $notes[1];': 'echo "<br>"; for ($i=0; $i<count($notes); $i++) echo ($i ? "," : "").$notes[$i]; echo " ".max($notes)." ".$notes[1];',
'une boucle foreach), la liste triée par ordre décroissant, puis « Admis » si la moyenne est supérieure': 'une boucle for), la liste triée par ordre décroissant, puis « Admis » si la moyenne est supérieure',
'Avec la chaîne "tunis,sfax,tunis,sousse,sfax,tunis", utiliser explode puis construire un tableau': 'Avec la chaîne "tunis,sfax,tunis,sousse,sfax,tunis", découper les villes puis construire un tableau',
"associatif $compte (clé = ville, valeur = nombre d'occurrences) avec foreach et isset. Afficher le": "associatif $compte (clé = ville, valeur = nombre d'occurrences) avec une boucle et isset. Afficher le",
'Sans formulaire. (a) Convertir $fr = "25/12/2026"; en format SQL 2026-12-25 de deux façons (avec': 'Sans formulaire. (a) Convertir $fr = "25/12/2026"; en format SQL 2026-12-25 de deux façons (avec',
'list + explode, puis avec array_reverse + implode). (b) Convertir $sql = "2026-03-05"; en 05/03/2026': 'substr, puis avec sscanf et sprintf). (b) Convertir $sql = "2026-03-05"; en 05/03/2026',
'foreach (value = clé du tableau), un champ qte (nombre, 1 par défaut), deux boutons radio mode (place': 'une boucle (value = clé du tableau), un champ qte (nombre, 1 par défaut), deux boutons radio mode (place',
'(découper la date avec explode), puis « (plus de 5 ans) » si N > 5, sinon « (5 ans ou moins) ».': '(extraire la date avec substr), puis « (plus de 5 ans) » si N > 5, sinon « (5 ans ou moins) ».',
'$mots = explode(" ", $t);': '$mots = preg_split("/ /", $t);',
'foreach ($plats as $nom => $ht) {': 'for (reset($plats); ($nom=key($plats)) !== null; next($plats)) { $ht=current($plats);',
'foreach ($menu as $num => $p) {': 'for (reset($menu); ($num=key($menu)) !== null; next($menu)) { $p=current($menu);',
'echo implode(" - ", $carres);': 'for ($i=0; $i<count($carres); $i++) echo ($i ? " - " : "") . $carres[$i];',
'foreach ($notes as $x) {': 'for ($i=0; $i<count($notes); $i++) { $x=$notes[$i];',
'echo "Tri décroissant : " . implode(", ", $notes) . "<br>";': 'echo "Tri décroissant : "; for ($i=0; $i<count($notes); $i++) echo ($i ? ", " : "").$notes[$i]; echo "<br>";',
'foreach ($eleves as $e) {': 'for ($i=0; $i<count($eleves); $i++) { $e=$eleves[$i];',
'$villes = explode(",", "tunis,sfax,tunis,sousse,sfax,tunis");': '$villes = preg_split("/,/", "tunis,sfax,tunis,sousse,sfax,tunis");',
'foreach ($villes as $v) {': 'for ($i=0; $i<count($villes); $i++) { $v=$villes[$i];',
'foreach ($compte as $ville => $nb) {': 'for (reset($compte); ($ville=key($compte)) !== null; next($compte)) { $nb=current($compte);',
'        list($an, $mois, $jour) = explode("-", $_POST["naissance"]);': '        $an=substr($_POST["naissance"],0,4); $mois=substr($_POST["naissance"],5,2); $jour=substr($_POST["naissance"],8,2);',
'list($j, $m, $a) = explode("/", $fr);': '$j=substr($fr,0,2); $m=substr($fr,3,2); $a=substr($fr,6,4);',
'echo "Autre écriture : " . implode("-", array_reverse(explode("/", $fr))) . "<br>";': 'list($j,$m,$a)=sscanf($fr,"%d/%d/%d"); echo "Autre écriture : ".sprintf("%04d-%02d-%02d",$a,$m,$j)."<br>";',
'list($j, $m, $a) = explode("/", $test);': 'list($j,$m,$a) = sscanf($test, "%d/%d/%d");',
'foreach (["+", "-", "*", "/", "%"] as $o) {': '$ops=["+", "-", "*", "/", "%"]; for ($i=0; $i<count($ops); $i++) { $o=$ops[$i];',
'    foreach ($questions as $i => $q) {': '    for ($i=0; $i<count($questions); $i++) { $q=$questions[$i];',
'foreach ($questions as $i => $q) {': 'for ($i=0; $i<count($questions); $i++) { $q=$questions[$i];',
'    foreach ($q[1] as $j => $choix) {': '    for ($j=0; $j<count($q[1]); $j++) { $choix=$q[1][$j];',
'foreach ($choix as $v => $texte) {': 'for (reset($choix); ($v=key($choix)) !== null; next($choix)) { $texte=current($choix);',
'    list($a, $m, $j) = explode("-", $l["date_embauche"]);': '    $a=substr($l["date_embauche"],0,4); $m=substr($l["date_embauche"],5,2); $j=substr($l["date_embauche"],8,2);',
}
# La première ligne de 6.7 ne change pas ; seule la ligne suivante est adaptée.
LIGNES.pop('Sans formulaire. (a) Convertir $fr = "25/12/2026"; en format SQL 2026-12-25 de deux façons (avec')

def modifier(src, dest, statement):
    expected = ('4d432781ef04c333835bef3791ed65aae6a3516eccfa2084650b49dc25813a34' if statement
                else '961b0e7a5cf17f137b37d9d1259a8595f112298ed6f99139a495ff71515299cb')
    if hashlib.sha256(src.read_bytes()).hexdigest() != expected:
        raise ValueError(f'Document source inattendu : {src}')
    doc = fitz.open(src)
    counts = {s:0 for s in LIGNES}
    for page in doc:
        edits = []
        for block in page.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                spans = line['spans']
                text = ''.join(s['text'] for s in spans)
                if text not in LIGNES:
                    continue
                new = LIGNES[text]
                counts[text] += 1
                for span in spans:
                    page.add_redact_annot(fitz.Rect(span['bbox']), fill=False)
                mono = all('Mono' in s['font'] for s in spans)
                edits.append((spans[0]['origin'], new, MONO if mono else SANS, 8.1 if mono else 9.3))
        # Reformuler positivement les consignes restrictives de l'introduction.
        if statement and page.number == 0:
            for original, new in [("pas de classes ni d'objets.", 'utiliser des fonctions.'), ('(jamais new mysqli ni', ''), ('PDO).', '')]:
                found = page.search_for(original)
                if len(found) != 1: raise ValueError((original, found))
                rect = found[0]
                page.add_redact_annot(rect, fill=False)
                if new: edits.append(((rect.x0, rect.y0+7.07), new, SANS, 9.3))
        if edits or page.first_annot:
            page.apply_redactions(images=0, graphics=0, text=0)
            page.insert_font(fontname='replacementmono', fontfile=MONO)
            page.insert_font(fontname='replacementsans', fontfile=SANS)
            for (x,y), text, fontfile, size in edits:
                font=fitz.Font(fontfile=fontfile)
                maxwidth=page.rect.width - 57 - x
                width=font.text_length(text, fontsize=size)
                if width > maxwidth: size *= maxwidth / width
                if size < 6.4: raise ValueError(f'texte trop petit : {src} p{page.number+1} {size} {text}')
                page.insert_text((x,y), text, fontname='replacementmono' if fontfile==MONO else 'replacementsans', fontsize=size)
    if sum(counts.values()) != (10 if statement else 31):
        raise ValueError('Nombre inattendu de lignes adaptées')
    text='\n'.join(p.get_text() for p in doc)
    if re.search(r'\b(explode|implode|foreach)\b',text,re.I): raise ValueError('occurrence restante')
    doc.save(dest, garbage=4, deflate=True)
    print(dest, len(doc), 'pages ;', sum(counts.values()), 'lignes adaptées')

if __name__ == '__main__':
    p=argparse.ArgumentParser();p.add_argument('--sources',required=True,type=Path); args=p.parse_args()
    modifier(args.sources/'Serie_exercices_PHP_procedural.pdf',OUT/'enonce-serie6-php-v2.pdf',True)
    modifier(args.sources/'Serie_exercices_PHP_procedural_CORRIGE.pdf',OUT/'corrige-serie6-php-v2.pdf',False)
