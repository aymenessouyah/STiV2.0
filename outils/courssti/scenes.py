"""Les dix scènes du cours « Systèmes, technologies et Internet » (3ᵉ SI).

Une seule règle de mise en page, tenue d'un bout à l'autre :

  * **pleine largeur** quand il n'y a qu'une chose à montrer — un schéma, un
    tableau du manuel, une chaîne d'étapes, une photo ;
  * **deux colonnes** seulement quand deux contenus se répondent : comparer
    client/serveur et poste à poste, opposer « propriétaire » et « libre »,
    poser une illustration en face du texte qu'elle éclaire.

Les images du manuel sont montrées telles quelles (`image_manuel`), avec leur
repère imprimé — « manuel p. 6 · § 1.2 les six rôles ». Elles sont découpées
une fois pour toutes par `extraits.py`, depuis
`documents/livre/sti-smart-book-3si-2026.pdf`.

Le titre de chapitre est lu dans `narration.py` : le repère du menu et l'écran
ne peuvent pas diverger.
"""
from __future__ import annotations

from PIL import ImageDraw

from theme import (
    FOND, FOND_PANNEAU, FOND_PANNEAU_2, BORDURE, TEXTE, TEXTE_2, TEXTE_3,
    ORANGE, AMBRE, VIOLET, VERT, BLEU, ROSE, ROUGE_BORD,
    police, melange, boite_arrondie, fleche, couper_texte, largeur_texte,
)
from dessin import (
    LARGEUR, HAUTEUR, MARGE, PLEIN, GAUCHE, DROITE, BANDE,
    fond, panneau, carte, table, chaine, pile, etiquette, image_manuel,
)
import narration as N

TOTAL = len(N.ORDRE)

X, Y, BAS = PLEIN[0], PLEIN[1], PLEIN[3]        # 64 · 186 · 884
XG, YG = GAUCHE[0], GAUCHE[1]
XD, YD = DROITE[0], DROITE[1]
FIN = X + 1792                                  # 1856 : la largeur utile


# ══════════════════════════════════════════════════════════════════════════
#  L'en-tête et les aides
# ══════════════════════════════════════════════════════════════════════════
def _entete(d, cle):
    d.text((MARGE, 42), "COURS · 3ᵉ SI · SYSTÈMES, TECHNOLOGIES ET INTERNET",
           font=police(19, True), fill=ORANGE)
    d.text((MARGE, 70), "Systèmes, technologies et Internet",
           font=police(40, True), fill=TEXTE)
    d.text((MARGE, 128), f"{N.numero(cle)} · {N.SECTIONS[cle]['titre']}",
           font=police(24), fill=TEXTE_2)
    d.text((1856, 46), "3ᵉ SI · manuel pages 5 à 13", font=police(18, True),
           fill=TEXTE_3, anchor="ra")
    d.text((1856, 74), "partie 1 · avant le développement Web", font=police(17),
           fill=TEXTE_3, anchor="ra")


def _bandeau(d, gauche="", droite="", couleur=TEXTE_2):
    boite_arrondie(d, BANDE, rayon=14, fond=FOND_PANNEAU,
                   bord=melange(BORDURE, couleur, 0.35), largeur_bord=2)
    d.text((BANDE[0] + 24, BANDE[1] + 26), gauche, font=police(23, True),
           fill=couleur, anchor="la")
    if droite:
        d.text((BANDE[2] - 24, BANDE[1] + 30), droite, font=police(18),
               fill=TEXTE_3, anchor="ra")


def _apparait(p, seuil, duree=0.10):
    if p < seuil:
        return 0.0
    return max(0.0, min(1.0, (p - seuil) / duree))


def _note(d, x, y, texte, couleur=TEXTE_2, taille=20, p=1.0, seuil=0.0, largeur=760):
    k = _apparait(p, seuil)
    if k <= 0:
        return
    # la première ligne est en gras : on la replie avec la mesure du gras,
    # sinon elle déborde de la colonne
    lignes, courante = [], ""
    for mot in texte.split():
        essai = (courante + " " + mot).strip()
        if largeur_texte(essai, taille, not lignes) <= largeur or not courante:
            courante = essai
        else:
            lignes.append(courante)
            courante = mot
    if courante:
        lignes.append(courante)
    for i, ligne in enumerate(lignes):
        d.text((x, y + i * (taille + 8)), ligne, font=police(taille, i == 0),
               fill=melange(FOND, couleur, k), anchor="la")


def _puce(d, x, y, texte, couleur=TEXTE_2, taille=22, p=1.0, seuil=0.0, largeur=700,
          air=12):
    k = _apparait(p, seuil)
    if k <= 0:
        return y
    d.ellipse([x, y + 6, x + 10, y + 16], fill=melange(FOND, couleur, k))
    lignes = couper_texte(texte, taille, largeur)
    for i, ligne in enumerate(lignes):
        d.text((x + 24, y + i * (taille + 8)), ligne, font=police(taille),
               fill=melange(FOND, TEXTE, k), anchor="la")
    return y + len(lignes) * (taille + 8) + air


def _repere(d, x, y, texte, couleur=BLEU, p=1.0, seuil=0.0, taille=21, ancre="la"):
    k = _apparait(p, seuil)
    if k <= 0:
        return
    d.text((x, y), texte, font=police(taille, True),
           fill=melange(FOND, couleur, k), anchor=ancre)


def _rangee(d, boites, hauteur):
    """Des boîtes côte à côte, à hauteurs égales : la rangée d'une scène."""
    return [(x, boites[0][1], x + largeur, boites[0][1] + hauteur)
            for x, largeur in boites]


# ══════════════════════════════════════════════════════════════════════════
#  1 · Ouverture — les trois chapitres
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    if p < 0.50:
        # une seule chose à montrer : les équipements du cours, en pleine largeur
        image_manuel(d, "systemes-appareils.png", (300, 200, 1620, 760),
                     "un ordinateur, un téléphone, une montre connectée : "
                     "les équipements de ce cours",
                     p=p, seuil=0.03, couleur=BLEU, taille_legende=20)
        _note(d, 380, 790, "Trois chapitres : les systèmes d'exploitation, les réseaux, "
                           "l'Internet des objets.",
              TEXTE_2, taille=23, p=p, seuil=0.12, largeur=1160)
        _bandeau(d, "Manuel · pages 5 à 13 · la partie qui précède le développement Web",
                 "3ᵉ SI · édition 2026", couleur=AMBRE)
        return

    cartes = [
        ("01 · Systèmes d'exploitation", ["Gérer l'environnement de travail",
                                          "manuel : pages 5 à 7"], BLEU, "CH. 1"),
        ("02 · Réseaux informatiques", ["Assurer la communication entre équipements",
                                        "manuel : pages 8 à 10"], VIOLET, "CH. 2"),
        ("03 · Internet des objets", ["Connecter des objets physiques à Internet",
                                      "manuel : pages 11 et 12"], VERT, "CH. 3"),
    ]
    for i, (titre, corps, couleur, sigle) in enumerate(cartes):
        x = X + i * 605
        carte(d, (x, 200, x + 581, 350), titre, corps, couleur, p=p,
              seuil=0.52 + i * 0.03, sigle=sigle, taille_titre=23, taille_corps=19)

    _repere(d, X, 386, "à la fin du cours, vous saurez", BLEU, p=p, seuil=0.64,
            taille=23)
    puces = [
        "Expliquer le rôle d'un système d'exploitation.",
        "Déployer un système et le sécuriser.",
        "Décrire un réseau, ses équipements, ses paramètres.",
        "Comparer client / serveur et poste à poste.",
        "Définir l'IoT et suivre le trajet d'une mesure.",
        "Réviser avec la fiche de synthèse du manuel.",
    ]
    for i, texte in enumerate(puces):
        colonne, rang = divmod(i, 3)
        _puce(d, X + colonne * 900, 440 + rang * 62, texte,
              BLEU if i % 2 == 0 else VIOLET, p=p, seuil=0.66 + i * 0.03,
              largeur=860, taille=22, air=10)
    carte(d, (X, 660, X + 1792, 840), "ce cours suit le manuel",
          ["pages 5 à 13 : trois chapitres, les activités corrigées, la fiche de "
           "synthèse, puis l'évaluation générale."],
          AMBRE, p=p, seuil=0.84, taille_titre=22, taille_corps=20)
    _bandeau(d, "Manuel · pages 5 à 13 · la partie qui précède le développement Web",
             "3ᵉ SI · édition 2026", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Le système d'exploitation : la pile et les six rôles
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme(d, p, t):
    a_pile = N.avance("systeme", "pile")
    a_roles = N.avance("systeme", "roles")

    if p < a_pile:
        # deux contenus qui se répondent : le matériel et le logiciel
        carte(d, (XG, 200, XG + 820, 360), "le matériel · hardware",
              ["écran · clavier · souris · processeur", "mémoire vive · disque : ce qui se touche"],
              BLEU, p=p, seuil=0.03, taille_titre=26, taille_corps=21)
        carte(d, (XD, 200, XD + 900, 360), "le logiciel · software",
              ["les programmes utilisés par l'utilisateur", "ce qui se lance"],
              VIOLET, p=p, seuil=0.03, taille_titre=26, taille_corps=21)
        image_manuel(d, "livre-photo-poste.jpg", (XG, 400, XG + 640, 800),
                     "manuel p. 3 · des systèmes différents", p=p, seuil=0.12,
                     couleur=BLEU, taille_legende=17)
        _note(d, XG + 700, 430,
              "Entre les deux, un logiciel de base sans lequel rien ne fonctionne : "
              "le système d'exploitation.",
              TEXTE_2, taille=24, p=p, seuil=0.18, largeur=1050)
        _bandeau(d, "Matériel + logiciel : le système d'exploitation fait le lien.",
                 "manuel p. 3", couleur=BLEU)
        return

    if p < a_roles:
        _repere(d, X, 200, "la pile de la machine, du haut vers le bas", VERT,
                p=p, seuil=a_pile, taille=23)
        # le schéma du manuel, tel quel : utilisateur, système, matériel
        image_manuel(d, "livre-p5-pile.png", (X + 660, 240, X + 1130, 620),
                     "manuel p. 5 · § 1.1 la pile de la machine", p=p,
                     seuil=a_pile + 0.02, couleur=VERT, taille_legende=18)
        for i, (titre, detail, couleur) in enumerate([
                ("Utilisateur", "travaille avec des applications", BLEU),
                ("Applications", "navigateur · traitement de texte · jeu", VIOLET),
                ("Système d'exploitation", "gestion du matériel", AMBRE)]):
            carte(d, (X + i * 605, 640, X + i * 605 + 581, 790), titre, [detail],
                  couleur, p=p, seuil=a_pile + 0.06 + i * 0.05,
                  taille_titre=22, taille_corps=19)
        _bandeau(d, "Le système d'exploitation est un logiciel de base : il gère le matériel "
                    "et permet l'exécution des applications.", couleur=AMBRE)
        return

    image_manuel(d, "livre-p6-roles.png", (X, 196, FIN, BAS),
                 "manuel p. 6 · § 1.2 les six rôles du système d'exploitation",
                 p=p, seuil=a_roles, couleur=AMBRE)
    _bandeau(d, "Le système d'exploitation est un logiciel de base : il gère le matériel "
                "et permet l'exécution des applications.", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Types de systèmes et licences
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme_types(d, p, t):
    a_lic = N.avance("systeme_types", "licences")

    if p < a_lic:
        familles = [
            ("Ordinateurs", ["Windows · macOS", "Linux (Ubuntu, Debian…)"], BLEU, "PC"),
            ("Mobiles", ["Android", "iOS"], VIOLET, "MOBILE"),
            ("Embarqués", ["watchOS · tvOS", "QNX (automobile)"], VERT, "EMBARQUÉ"),
        ]
        for i, (titre, corps, couleur, sigle) in enumerate(familles):
            x = X + i * 605
            carte(d, (x, 200, x + 581, 350), titre, corps, couleur, p=p,
                  seuil=0.05 + i * 0.06, sigle=sigle, taille_titre=25, taille_corps=20)
        image_manuel(d, "livre-p6-types.png", (X, 380, FIN, 870),
                     "manuel p. 6 · § 1.3 les types de systèmes d'exploitation",
                     p=p, seuil=0.28, couleur=BLEU, taille_legende=18)
        _bandeau(d, "Le type dépend de l'appareil : PC, mobile, embarqué.",
                 "manuel p. 6", couleur=BLEU)
        return

    carte(d, (XG, 200, XG + 820, 400), "logiciel propriétaire",
          ["une licence qui définit les droits accordés",
           "code source généralement non accessible",
           "exemple : Windows"],
          AMBRE, p=p, seuil=a_lic, taille_titre=25, taille_corps=20)
    carte(d, (XD, 200, XD + 900, 400), "logiciel libre",
          ["libertés d'utiliser, d'étudier, de modifier, redistribuer",
           "code source accessible selon la licence",
           "exemple : distributions GNU-Linux"],
          VERT, p=p, seuil=a_lic + 0.10, taille_titre=25, taille_corps=20)
    image_manuel(d, "livre-p6-licences.png", (X, 440, FIN, 790),
                 "manuel p. 6 · § 1.4 logiciel propriétaire et logiciel libre",
                 p=p, seuil=a_lic + 0.16, couleur=AMBRE, taille_legende=18)
    _note(d, X, 820, "libre ne signifie pas nécessairement gratuit.", ROSE,
          taille=23, p=p, seuil=a_lic + 0.30, largeur=1700)
    _bandeau(d, "Le type dépend de l'appareil ; la licence dépend des droits accordés.",
             "libre ≠ gratuit", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  4 · Déployer, virtualiser, sécuriser
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme_deployer(d, p, t):
    a_vm = N.avance("systeme_deployer", "vm")
    a_sec = N.avance("systeme_deployer", "securite")

    if p < a_vm:
        etapes = [
            ("1 · Installer", "mettre le système sur l'ordinateur", BLEU),
            ("2 · Configurer", "adapter les paramètres aux besoins", AMBRE),
            ("3 · Mettre à jour", "installer les améliorations et les corrections", VERT),
        ]
        chaine(d, (X, 280, FIN, 520), etapes, p=p, seuil=0.02,
               verticale=False, taille_titre=28, taille_corps=21, remplir=1.0)
        _note(d, X, 600, "Déployer, c'est mettre en place puis préparer : les trois "
                         "temps vont ensemble, dans cet ordre.",
              TEXTE_2, taille=24, p=p, seuil=0.10, largeur=1700)
        _bandeau(d, "Déployer un système : installer, configurer, mettre à jour.",
                 "manuel p. 6 · § 1.5", couleur=BLEU)
        return

    if p < a_sec:
        image_manuel(d, "livre-p7-vm.png", (X, 196, X + 1160, 800),
                     "manuel p. 7 · la machine virtuelle", p=p, seuil=a_vm,
                     couleur=VIOLET, taille_legende=18)
        carte(d, (X + 1220, 200, FIN, 440), "pourquoi une machine virtuelle ?",
              ["essayer un système sans toucher au système principal",
               "VMware · VirtualBox"],
              VIOLET, p=p, seuil=a_vm + 0.06, taille_titre=23, taille_corps=20)
        _note(d, X + 1220, 500, "Un ordinateur simulé par un logiciel : la machine "
                                "virtuelle s'ouvre dans une fenêtre.",
              TEXTE_2, taille=21, p=p, seuil=a_vm + 0.14, largeur=560)
        _bandeau(d, "La machine virtuelle : un ordinateur simulé, dans une fenêtre.",
                 "manuel p. 7", couleur=VIOLET)
        return

    image_manuel(d, "livre-p7-securite.png", (X, 200, FIN, 620),
                 "manuel p. 7 · § 1.6 sécuriser un ordinateur", p=p, seuil=a_sec,
                 couleur=VERT, taille_legende=18)
    _note(d, X, 680, "Un antivirus ne remplace ni le pare-feu, ni les mises à jour, "
                     "ni les mots de passe : aucun moyen ne remplace les autres.",
          ROSE, taille=25, p=p, seuil=a_sec + 0.16, largeur=1700)
    _bandeau(d, "Aucun moyen ne remplace les autres : la sécurité, c'est l'ensemble.",
             "manuel p. 7", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  5 · Le réseau : définition, étendue, équipements
# ══════════════════════════════════════════════════════════════════════════
def scene_reseau_definition(d, p, t):
    a_et = N.avance("reseau_definition", "etendue")
    a_eq = N.avance("reseau_definition", "equipements")

    if p < a_et:
        image_manuel(d, "livre-p8-reseau.png", (X, 196, FIN, 700),
                     "manuel p. 8 · § 2.1 deux postes, une imprimante, un serveur, "
                     "un switch", p=p, seuil=0.02, couleur=VIOLET, taille_legende=18)
        _note(d, X, 760, "Un réseau informatique : des équipements reliés entre eux "
                         "pour échanger des données et partager des ressources.",
              TEXTE_2, taille=24, p=p, seuil=0.10, largeur=1700)
        _bandeau(d, "Un réseau, c'est un ensemble d'équipements reliés pour échanger "
                    "des données et partager des ressources.", couleur=VIOLET)
        return

    if p < a_eq:
        image_manuel(d, "livre-p8-etendue.png", (X, 196, FIN, 560),
                     "manuel p. 8 · § 2.2 classification selon l'étendue", p=p,
                     seuil=a_et, couleur=AMBRE, taille_legende=18)
        for i, (sigle, texte, couleur) in enumerate([
                ("LAN", "locale : une salle informatique, un lycée", BLEU),
                ("MAN", "une ville : plusieurs établissements", VIOLET),
                ("WAN", "très étendue : des sites dans plusieurs pays", AMBRE)]):
            x = X + i * 605
            carte(d, (x, 620, x + 581, 800), sigle, [texte], couleur, p=p,
                  seuil=a_et + 0.03 + i * 0.05, taille_titre=26, taille_corps=19)
        _bandeau(d, "LAN local · MAN à l'échelle d'une ville · WAN très étendu : "
                    "Internet est le plus grand des WAN.", couleur=VIOLET)
        return

    image_manuel(d, "livre-p8-equipements.png", (X, 196, X + 1160, 700),
                 "manuel p. 8 · § 2.3 les équipements d'un réseau", p=p, seuil=a_eq,
                 couleur=VERT, taille_legende=18)
    image_manuel(d, "livre-photo-baie.jpg", (X + 1220, 196, FIN, 700),
                 "manuel p. 3 · une baie de brassage", p=p, seuil=a_eq + 0.10,
                 couleur=VERT, taille_legende=17)
    _note(d, X, 760, "Le switch reste dans le réseau local ; le routeur fait le pont "
                     "entre deux réseaux et dirige les paquets.",
          TEXTE_2, taille=24, p=p, seuil=a_eq + 0.20, largeur=1700)
    _bandeau(d, "Carte réseau · switch · routeur · point d'accès Wi-Fi · serveur : "
                "chacun sa fonction.", "manuel p. 8", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Les quatre paramètres : IP, masque, DNS, MAC
# ══════════════════════════════════════════════════════════════════════════
def _octets(d, p, a_masque):
    """L'adresse en quatre octets, le masque en dessous, les deux parties."""
    largeur, hauteur, pas = 300, 110, 40
    x0 = (LARGEUR - (4 * largeur + 3 * pas)) / 2
    d.text((x0, 250), "adresse IP", font=police(22, True), fill=BLEU, anchor="la")
    for i, octet in enumerate(["192", "168", "1", "20"]):
        x = x0 + i * (largeur + pas)
        k = _apparait(p, 0.04 + i * 0.05)
        boite_arrondie(d, (x, 288, x + largeur, 288 + hauteur), rayon=14,
                       fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, BLEU, 0.20), k),
                       bord=melange(FOND_PANNEAU, BLEU, 0.6 * k), largeur_bord=2)
        d.text((x + largeur / 2, 288 + hauteur / 2), octet,
               font=police(40, True, mono=True), fill=melange(FOND_PANNEAU, TEXTE, k),
               anchor="mm")
    d.text((x0, 430), "masque réseau", font=police(22, True), fill=TEXTE_3, anchor="la")
    for i, octet in enumerate(["255", "255", "255", "0"]):
        x = x0 + i * (largeur + pas)
        k = _apparait(p, 0.16 + i * 0.04)
        boite_arrondie(d, (x, 468, x + largeur, 468 + hauteur), rayon=14,
                       fond=melange(FOND_PANNEAU, FOND_PANNEAU_2, k),
                       bord=melange(FOND_PANNEAU, TEXTE_3, 0.55 * k), largeur_bord=2)
        d.text((x + largeur / 2, 468 + hauteur / 2), octet,
               font=police(36, False, mono=True), fill=melange(FOND_PANNEAU, TEXTE_2, k),
               anchor="mm")
    k = _apparait(p, a_masque + 0.04)
    if k <= 0:
        return
    x4 = x0 + 3 * (largeur + pas)
    d.line([(x0, 614), (x0 + 3 * largeur + 2 * pas, 614)],
           fill=melange(FOND_PANNEAU, BLEU, k), width=5)
    d.text((x0, 634), "partie réseau : 192.168.1", font=police(24, True),
           fill=melange(FOND_PANNEAU, BLEU, k), anchor="la")
    d.line([(x4, 614), (x4 + largeur, 614)],
           fill=melange(FOND_PANNEAU, AMBRE, k), width=5)
    d.text((x4, 634), "hôte : 20", font=police(24, True),
           fill=melange(FOND_PANNEAU, AMBRE, k), anchor="la")
    d.text((x0, 700), "adresse réseau : 192.168.1.0", font=police(26, True),
           fill=melange(FOND_PANNEAU, AMBRE, k), anchor="la")


def scene_reseau_parametres(d, p, t):
    a_masque = N.avance("reseau_parametres", "masque")
    a_dns = N.avance("reseau_parametres", "dns")
    a_mac = N.avance("reseau_parametres", "mac")

    if p < a_masque:
        image_manuel(d, "livre-p8-parametres.png", (X, 196, FIN, 860),
                     "manuel p. 8 · § 2.4 les paramètres d'un composant réseau",
                     p=p, seuil=0.02, couleur=BLEU, taille_legende=19)
        _bandeau(d, "IP : qui je suis · masque : où est le réseau · DNS : traduire les noms "
                    "· MAC : la carte.", couleur=BLEU)
        return

    if p < a_dns:
        _octets(d, p, a_masque)
        _note(d, X, 790, "Trois octets à 255 : le réseau. Le dernier à zéro : l'hôte.",
              TEXTE_2, taille=22, p=p, seuil=a_masque + 0.16, largeur=1700)
        _bandeau(d, "Le masque sépare la partie réseau de la partie hôte : ici, "
                    "192.168.1.0 pour le réseau.", couleur=AMBRE)
        return

    if p < a_mac:
        carte(d, (X, 240, FIN, 470), "le DNS traduit un nom en adresse IP",
              ["www.example.com   →   192.168.1.20",
               "l'humain retient un nom, la machine a besoin d'un nombre"],
              VIOLET, p=p, seuil=a_dns, taille_titre=30, taille_corps=24)
        _note(d, X, 540, "Domain Name System : le navigateur demande au DNS l'adresse "
                         "IP qui correspond au nom tapé.",
              TEXTE_2, taille=24, p=p, seuil=a_dns + 0.08, largeur=1700)
        _bandeau(d, "Le DNS résout un nom de domaine en adresse IP.", "manuel p. 8",
                 couleur=VIOLET)
        return

    carte(d, (X, 240, FIN, 510), "l'adresse MAC identifie une interface",
          ["A4-B1-C1-2D-3E-4F", "six groupes de deux caractères hexadécimaux",
           "elle identifie une interface dans le réseau local"],
          VERT, p=p, seuil=a_mac, taille_titre=30, taille_corps=24)
    _note(d, X, 580, "En résumé : l'IP identifie au niveau IP, le masque sépare réseau "
                     "et hôte, le DNS traduit les noms, la MAC identifie localement.",
          TEXTE_2, taille=24, p=p, seuil=a_mac + 0.18, largeur=1700)
    _bandeau(d, "IP : qui je suis · masque : où est le réseau · DNS : traduire les noms "
                "· MAC : la carte.", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Architectures et protocoles
# ══════════════════════════════════════════════════════════════════════════
def scene_reseau_architectures(d, p, t):
    a_p2p = N.avance("reseau_architectures", "poste_a_poste")
    a_proto = N.avance("reseau_architectures", "protocoles")

    if p < a_p2p:
        image_manuel(d, "livre-p9-architectures.png", (X, 196, FIN, 860),
                     "manuel p. 9 · § 2.5 les architectures des réseaux", p=p,
                     seuil=0.02, couleur=VIOLET, taille_legende=19)
        _bandeau(d, "Deux architectures : client / serveur, et poste à poste.",
                 "manuel p. 9", couleur=VIOLET)
        return

    if p < a_proto:
        # deux contenus qui se répondent : la comparaison, en deux colonnes
        carte(d, (XG, 200, XG + 820, 470), "client / serveur",
              ["plusieurs clients, un serveur central",
               "avantages : données, comptes et administration centralisés",
               "inconvénient : une panne du serveur bloque les services"],
              BLEU, p=p, seuil=a_p2p - 0.12, taille_titre=26, taille_corps=20)
        carte(d, (XD, 200, XD + 900, 470), "poste à poste · peer-to-peer",
              ["les ordinateurs communiquent directement entre eux",
               "avantage : partage direct, simple pour un petit réseau",
               "inconvénients : sécurité et sauvegardes plus difficiles"],
              VERT, p=p, seuil=a_p2p, taille_titre=26, taille_corps=20)
        _note(d, X, 540, "Poste à poste : pas de serveur central obligatoire, chaque "
                         "poste peut offrir ses ressources aux autres.",
              TEXTE_2, taille=24, p=p, seuil=a_p2p + 0.10, largeur=1700)
        _bandeau(d, "Client / serveur : centralisé · poste à poste : direct.",
                 "manuel p. 9", couleur=VIOLET)
        return

    image_manuel(d, "livre-p9-protocoles.png", (X, 196, X + 1080, 860),
                 "manuel p. 9 · § 2.6 les protocoles et l'exemple MQTT", p=p,
                 seuil=a_proto, couleur=AMBRE, taille_legende=18)
    carte(d, (X + 1160, 220, FIN, 520), "sécuriser un réseau",
          ["Pare-feu : contrôler les communications selon des règles de sécurité.",
           "ACL : autoriser ou interdire certains accès."],
          VERT, p=p, seuil=a_proto + 0.16, taille_titre=25, taille_corps=21)
    _bandeau(d, "Un protocole est un ensemble de règles qui permet aux équipements "
                "de communiquer.", "manuel p. 9", couleur=VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  8 · L'IoT : définition, composants, trajet d'une mesure
# ══════════════════════════════════════════════════════════════════════════
def scene_iot_principe(d, p, t):
    a_comp = N.avance("iot_principe", "composants")
    a_trajet = N.avance("iot_principe", "trajet")

    if p < a_comp:
        carte(d, (X, 196, FIN, 330), "la définition",
              ["des objets physiques capables de collecter, transmettre et échanger "
               "des données grâce à une connexion réseau"],
              AMBRE, p=p, seuil=0.02, taille_titre=25, taille_corps=22)
        # deux contenus qui se répondent : les domaines du manuel et l'illustration
        image_manuel(d, "livre-p6-domaines.png", (X, 370, X + 1000, 870),
                     "manuel p. 6 · § 3.1 où le rencontre-t-on ?", p=p, seuil=0.14,
                     couleur=VERT, taille_legende=18)
        image_manuel(d, "iot-maison.png", (X + 1060, 370, FIN, 870),
                     "une maison connectée", p=p, seuil=0.22, couleur=BLEU,
                     taille_legende=18)
        _bandeau(d, "L'IoT : des objets physiques qui collectent, transmettent et "
                    "échangent des données.", "manuel p. 6", couleur=VERT)
        return

    if p < a_trajet:
        _repere(d, X, 210, "cinq composants, une solution IoT", VERT, p=p,
                seuil=a_comp, taille=23)
        comp = [
            ("Objet connecté", "collecte ou utilise les données", BLEU),
            ("Capteur", "mesure une grandeur", VIOLET),
            ("Connexion réseau", "transmet les données", AMBRE),
            ("Plateforme IoT", "reçoit et stocke", VERT),
            ("Application", "affiche et permet de commander", ROSE),
        ]
        chaine(d, (X, 300, FIN, 520), comp, p=p, seuil=a_comp,
               verticale=False, taille_titre=24, taille_corps=19, remplir=1.0)
        _note(d, X, 600, "Il manque un seul de ces cinq composants et la chaîne "
                         "s'arrête : l'objet ne parle plus à personne.",
              TEXTE_2, taille=24, p=p, seuil=a_comp + 0.12, largeur=1700)
        _bandeau(d, "Objet · capteur · réseau · plateforme · application : cinq "
                    "composants.", "manuel p. 6 · § 3.2", couleur=VERT)
        return

    _repere(d, X, 210, "le trajet d'une mesure : 25 °C", AMBRE, p=p,
            seuil=a_trajet, taille=23)
    etapes = [
        ("Capteur", "mesure 25 °C", BLEU),
        ("Objet connecté", "prépare la donnée", VIOLET),
        ("Réseau", "HTTP ou MQTT", AMBRE),
        ("Plateforme", "reçoit et stocke", VERT),
        ("Téléphone", "l'utilisateur consulte", ROSE),
    ]
    chaine(d, (X, 300, FIN, 520), etapes, p=p, seuil=a_trajet,
           verticale=False, taille_titre=24, taille_corps=19, remplir=1.0)
    _note(d, X, 600, "Mesurer, transmettre, stocker, consulter : le trajet ne change "
                     "jamais. Un capteur ne parle pas directement à votre téléphone : "
                     "il passe par la plateforme.",
          TEXTE_2, taille=24, p=p, seuil=a_trajet + 0.14, largeur=1700)
    _bandeau(d, "Mesurer, transmettre, stocker, consulter : le trajet ne change jamais.",
             "manuel p. 11", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Échanger avec une plateforme, tester, la serre
# ══════════════════════════════════════════════════════════════════════════
def scene_iot_echange(d, p, t):
    a_mqtt = N.avance("iot_echange", "mqtt")
    a_tester = N.avance("iot_echange", "tester")
    a_serre = N.avance("iot_echange", "serre")

    if p < a_mqtt:
        _repere(d, X, 200, "avant d'envoyer une donnée, cinq conditions", BLEU,
                p=p, seuil=0.02, taille=23)
        conditions = [
            ("1 · Réseau", "être configuré pour accéder au réseau", BLEU),
            ("2 · Informations", "connaître l'adresse de la plateforme", VIOLET),
            ("3 · Protocole", "choisir HTTP ou MQTT", AMBRE),
            ("4 · Données", "envoyer ou recevoir", VERT),
            ("5 · Test", "tester le programme et corriger", ROSE),
        ]
        chaine(d, (X, 260, FIN, 520), conditions, p=p, seuil=0.02,
               verticale=False, taille_titre=20, taille_corps=17, remplir=1.0,
               pas=0.035)
        image_manuel(d, "iot-serre.png", (X + 420, 570, FIN - 420, 830),
                     "l'objet connecté en situation : une serre instrumentée",
                     p=p, seuil=0.10, couleur=VERT, taille_legende=17)
        _bandeau(d, "Un objet configuré, informé, muni du bon protocole, qui envoie — "
                    "puis qui teste.", couleur=BLEU)
        return

    if p < a_tester:
        image_manuel(d, "livre-p11-echange.png", (X, 196, FIN, 860),
                     "manuel p. 11 · § 3.4 échanger des données avec une plateforme IoT",
                     p=p, seuil=a_mqtt, couleur=VIOLET, taille_legende=19)
        _bandeau(d, "HTTP : une requête à un serveur · MQTT : publier, distribuer, "
                    "s'abonner.", "manuel p. 11", couleur=VIOLET)
        return

    if p < a_serre:
        image_manuel(d, "livre-p11-tester.png", (X, 240, FIN, 700),
                     "manuel p. 11 · § 3.5 tester et corriger un programme IoT", p=p,
                     seuil=a_tester, couleur=AMBRE, taille_legende=19)
        _note(d, X, 760, "Chaque symptôme a sa vérification : connexion, serveur, "
                         "données, valeur affichée.",
              TEXTE_2, taille=24, p=p, seuil=a_tester + 0.14, largeur=1700)
        _bandeau(d, "Tester, c'est remonter du symptôme à la cause.", "manuel p. 11",
                 couleur=AMBRE)
        return

    # la serre : l'illustration et les réponses de l'activité, côte à côte
    image_manuel(d, "iot-serre.png", (X, 200, X + 940, 760),
                 "la serre de l'activité de synthèse", p=p, seuil=a_serre,
                 couleur=VERT, taille_legende=18)
    reponses = [
        ("le capteur", "mesure l'humidité du sol", BLEU),
        ("l'objet connecté", "récupère et transmet la mesure", VIOLET),
        ("la plateforme", "reçoit et exploite les données", VERT),
        ("les protocoles", "HTTP et MQTT", AMBRE),
    ]
    for i, (titre, detail, couleur) in enumerate(reponses):
        carte(d, (X + 1000, 200 + i * 150, FIN, 200 + i * 150 + 134),
              titre, [detail], couleur, p=p, seuil=a_serre + 0.06 + i * 0.07,
              taille_titre=23, taille_corps=19)
    _bandeau(d, "Le capteur mesure · l'objet transmet · la plateforme stocke · "
                "l'agriculteur consulte.", "manuel p. 12", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  10 · La fiche de synthèse
# ══════════════════════════════════════════════════════════════════════════
def scene_synthese(d, p, t):
    a_reseau = N.avance("synthese", "reseau")
    a_iot = N.avance("synthese", "iot")
    a_fin = N.avance("synthese", "fin")

    if p < a_iot:
        image_manuel(d, "livre-p12-fiche.png", (X, 196, X + 1080, 870),
                     "manuel p. 12 · la fiche de synthèse générale", p=p, seuil=0.02,
                     couleur=AMBRE, taille_legende=18)
        idees = [
            ("Le système gère l'équipement", "logiciel de base, du matériel aux applications",
             BLEU),
            ("Le réseau fait communiquer", "IP, masque, DNS, MAC, protocoles, ACL", AMBRE),
            ("L'IoT connecte le physique", "mesurer, transmettre, stocker, consulter", VERT),
        ]
        for i, (titre, corps, couleur) in enumerate(idees):
            carte(d, (X + 1160, 200 + i * 190, FIN, 200 + i * 190 + 174),
                  titre, [corps], couleur, p=p,
                  seuil=max(0.04, a_reseau - 0.05) + i * 0.10,
                  taille_titre=22, taille_corps=19)
        _bandeau(d, "Onze notions, une seule page : la fiche de synthèse du manuel.",
                 "manuel p. 12", couleur=AMBRE)
        return

    if p < a_fin:
        image_manuel(d, "livre-p12-idee.png", (X, 280, FIN, 520),
                     "manuel p. 12 · l'idée clé", p=p, seuil=a_iot, couleur=VERT,
                     taille_legende=18)
        _note(d, X, 580, "Le système d'exploitation gère l'équipement, le réseau "
                         "permet la communication, et l'Internet des objets met "
                         "cette communication au service d'objets physiques connectés.",
              TEXTE_2, taille=26, p=p, seuil=a_iot + 0.10, largeur=1700)
        _bandeau(d, "Le système gère l'équipement, le réseau fait communiquer, l'IoT "
                    "met la communication au service des objets physiques.", couleur=VERT)
        return

    carte(d, (X, 230, FIN, 420), "et maintenant ?",
          ["l'évaluation générale, page 13 du manuel : dix questions, dix points.",
           "puis le cours suivant : HTML5."],
          ROSE, p=p, seuil=a_fin, taille_titre=32, taille_corps=26)
    image_manuel(d, "systemes-appareils.png", (X + 380, 450, FIN - 380, 760),
                 "l'ordinateur, le téléphone et la montre : tout ce que nous avons expliqué",
                 p=p, seuil=a_fin + 0.10, couleur=BLEU, taille_legende=17)
    _note(d, X, 850, "Relisez la fiche de synthèse avant l'évaluation : elle tient "
                     "en une page, et tout le cours est dedans.",
          TEXTE_2, taille=24, p=p, seuil=a_fin + 0.20, largeur=1700)
    _bandeau(d, "Le cours s'arrête ici ; l'évaluation commence page 13.", "3ᵉ SI",
             couleur=ROSE)


SCENES = {
    "ouverture": scene_ouverture,
    "systeme": scene_systeme,
    "systeme_types": scene_systeme_types,
    "systeme_deployer": scene_systeme_deployer,
    "reseau_definition": scene_reseau_definition,
    "reseau_parametres": scene_reseau_parametres,
    "reseau_architectures": scene_reseau_architectures,
    "iot_principe": scene_iot_principe,
    "iot_echange": scene_iot_echange,
    "synthese": scene_synthese,
}


def dessiner(d: ImageDraw.ImageDraw, cle: str, p: float, t: float):
    """Le fond, l'en-tête, puis la scène de la section."""
    fond(d, t)
    _entete(d, cle)
    SCENES[cle](d, p, t)
