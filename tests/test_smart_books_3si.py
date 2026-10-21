"""Vérifications autonomes : python tests/test_smart_books_3si.py (sans dépendances)."""
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]

class SmartBooks(unittest.TestCase):
    def test_indices_et_destinations(self):
        for name, pages, count in [('smart-book-3si-2026.json', 54, 50), ('smart-book-2026.json', 74, 69)]:
            data = json.loads((ROOT / 'assets/data' / name).read_text())
            self.assertEqual(data['pages'], pages)
            self.assertEqual(len(data['items']), count)
            self.assertEqual([i['page'] for i in data['items']], list(range(pages-count+1, pages+1)))
            self.assertEqual([i['fiche'] for i in data['items']], list(range(1, count+1)))
            for item in data['items']:
                self.assertTrue(item['url'].startswith('https://aymenessouyah.github.io/STiV2.0/'))
                if name == 'smart-book-3si-2026.json':
                    self.assertNotIn('/php', item['url'])
                    self.assertEqual(item['qr_url'], 'https://aymenessouyah.github.io/STiV2.0/livre-smart.html?livre=3si-2026&page=' + str(item['page']))

    def test_html_et_elements_du_scanner(self):
        html = (ROOT / 'livre-smart.html').read_text()
        js = (ROOT / 'assets/js/smart-book.js').read_text()
        ids = re.findall(r'id="([^"]+)"', html)
        self.assertEqual(len(ids), len(set(ids)))
        for identifier in re.findall(r"\$\('([^']+)'\)", js):
            self.assertIn(identifier, ids)
        self.assertIn('value="3si-2026"', html)
        self.assertIn('value="4si-2026"', html)

    def test_syntaxe_javascript(self):
        if not shutil.which('node'):
            self.skipTest('Node.js absent')
        for path in ['assets/js/smart-book.js', 'sw.js']:
            subprocess.run(['node', '--check', str(ROOT / path)], check=True, capture_output=True)

    def test_mise_a_jour_incrementale_sans_pdf(self):
        sw = (ROOT / 'sw.js').read_text()
        updates = sw.split('var UPDATE_FILES = [', 1)[1].split('];', 1)[0]
        self.assertIn('smart-book-3si-2026.json', updates)
        self.assertIn('v333-smart-books-par-niveau', sw)
        self.assertNotIn('.pdf', updates)
        self.assertIn('var CACHE = "sti-atelier-v316";', sw)

    def test_manifeste_et_empreintes(self):
        manifest = json.loads((ROOT / 'offline-complete-manifest.json').read_text())
        self.assertEqual(manifest['totalFiles'], len(manifest['files']))
        self.assertEqual(manifest['totalBytes'], sum(x['bytes'] for x in manifest['files']))
        for path in ['sw.js', 'livre-smart.html', 'assets/css/smart-book.css', 'assets/js/smart-book.js', 'assets/data/smart-book-3si-2026.json', 'documents/livre/sti-smart-book-3si-2026.pdf']:
            entry = next(x for x in manifest['files'] if x['path'] == path)
            content = (ROOT / path).read_bytes()
            self.assertEqual(entry['bytes'], len(content))
            self.assertEqual(entry['gitSha'], hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest())

    def test_preservation_livre_4si(self):
        pdf = ROOT / 'documents/livre/sti-smart-book-2026.pdf'
        content = pdf.read_bytes()
        self.assertEqual(hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest(), '0e0caa15c89f5e563961858a71bcccdd98f6dd5e', 'PDF 4SI différent du commit source : vérifier si cette modification est volontaire.')

if __name__ == '__main__':
    unittest.main(verbosity=2)
