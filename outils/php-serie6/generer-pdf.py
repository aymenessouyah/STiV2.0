#!/usr/bin/env python3
"""Génère les PDF de la série 6 à partir des versions HTML adaptées.

Dépendance : reportlab. Polices : DejaVu Sans et DejaVu Sans Mono (Linux).
Lancer depuis la racine : python3 outils/php-serie6/generer-pdf.py
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import textwrap
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[2]
DOSSIER = ROOT / 'exercices/php/serie-6'
pdfmetrics.registerFont(TTFont('DejaVu', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

class PreParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.inside = False
        self.text = []
    def handle_starttag(self, tag, attrs):
        if tag == 'pre':
            self.inside = True
    def handle_endtag(self, tag):
        if tag == 'pre':
            self.inside = False
            self.text.append('\n')
    def handle_data(self, data):
        if self.inside:
            self.text.append(data)

class Pages(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []
    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()
    def save(self):
        total = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.setFont('DejaVu', 8)
            self.setFillColorRGB(.3, .34, .37)
            self.drawRightString(A4[0]-38, 22, f'Page {self._pageNumber} / {total}')
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

def generer(nom):
    parser = PreParser()
    parser.feed((DOSSIER / (nom + '.html')).read_text(encoding='utf8'))
    text = ''.join(parser.text)
    titre = 'Énoncé et fiche' if nom == 'enonce' else 'Corrigé et fiche'
    pdf = Pages(str(DOSSIER / (nom + '-serie6-php.pdf')), pagesize=A4, pageCompression=1)
    pdf.setTitle('Série 6 PHP procédural — ' + titre)
    pdf.setAuthor('Aymen Essouyah · Lycée Rafèha')
    width, height = A4
    y = 0
    def page():
        nonlocal y
        pdf.setFillColorRGB(.08, .25, .32)
        pdf.setFont('DejaVu-Bold', 10)
        pdf.drawString(38, height-36, 'Série 6 PHP procédural — ' + titre)
        pdf.setStrokeColorRGB(.7, .8, .84)
        pdf.line(38, height-43, width-38, height-43)
        pdf.setFillColorRGB(.08, .11, .13)
        y = height-60
    page()
    for raw in text.splitlines():
        # 99 caractères de police monospace tiennent dans la largeur utile.
        # Les retours conservent les retraits des exemples de code.
        indent = len(raw) - len(raw.lstrip(' '))
        wrapped = textwrap.wrap(raw, width=99, subsequent_indent=' ' * min(indent + 2, 20),
                                replace_whitespace=False, drop_whitespace=False,
                                break_long_words=True, break_on_hyphens=False) or ['']
        for line in wrapped:
            if y < 40:
                pdf.showPage(); page()
            is_heading = bool(re.match(r'^\s*(?:Partie \d|Exercice \d+\.\d+|FICHE DE RÉVISION|COMPLÉMENTS|CORRIGÉ DES COMPLÉMENTS)', line))
            pdf.setFont('DejaVuMono', 8.1)
            if is_heading:
                pdf.setFillColorRGB(.04, .27, .38)
            pdf.drawString(38, y, line.rstrip())
            if is_heading:
                pdf.setFillColorRGB(.08, .11, .13)
            y -= 11
    pdf.showPage()
    pdf.save()

for nom in ('enonce', 'corrige'):
    generer(nom)
