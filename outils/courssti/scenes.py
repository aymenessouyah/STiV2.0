"""Les dix scènes du cours « Systèmes, technologies et Internet » (3ᵉ SI).

L'écran est coupé en deux, du début à la fin :

  * **à gauche** — les définitions, les schémas, la pile de la machine, les
    cartes des notions ;
  * **à droite** — les tableaux du manuel et les exemples chiffrés.

Les deux moitiés portent le même décor d'une scène à l'autre : c'est un cours,
on ne change pas les repères en route. La bande du bas garde, à chaque fois, la
phrase à recopier dans le cahier.

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
import dessin as G
from dessin import (
    LARGEUR, HAUTEUR, MARGE, GAUCHE, DROITE, BANDE,
    fond, panneau, carte, table, chaine, pile, etiquette,
)
import narration as N

TOTAL = len(N.ORDRE)

G_TITRE = "le cours, pas à pas"
D_TITRE = "les tableaux du manuel"
X = GAUCHE[0] + 24          # marge intérieure du panneau de gauche
Y0 = GAUCHE[1] + 70         # première ligne sous le titre du panneau
DX = DROITE[0] + 22
DY = DROITE[1] + 62


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


def _note(d, x, y, texte, couleur=AMBRE, taille=20, p=1.0, seuil=0.0, largeur=760):
    k = _apparait(p, seuil)
    if k <= 0:
        return
    # la première ligne est en gras : on la replie avec la mesure du gras,
    # sinon elle déborde du panneau
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


# ══════════════════════════════════════════════════════════════════════════
#  1 · Ouverture — les trois chapitres
# ══════════════════════════════════════════════════════════════════════════
def scene_ouverture(d, p, t):
    panneau(d, GAUCHE, "les trois chapitres du cours", AMBRE)
    cartes = [
        ("01 · Systèmes d'exploitation", ["Gérer l'environnement de travail", "manuel : pages 5 à 7"], BLEU, "CH. 1"),
        ("02 · Réseaux informatiques", ["Assurer la communication entre équipements", "manuel : pages 8 à 10"], VIOLET, "CH. 2"),
        ("03 · Internet des objets", ["Connecter des objets physiques à Internet", "manuel : pages 11 et 12"], VERT, "CH. 3"),
    ]
    for i, (titre, corps, couleur, sigle) in enumerate(cartes):
        carte(d, (X, Y0 + i * 196, GAUCHE[2] - 24, Y0 + i * 196 + 176),
              titre, corps, couleur, p=p, seuil=0.06 + i * 0.30,
              sigle=sigle)
    panneau(d, DROITE, "à la fin du cours, vous saurez", BLEU)
    puces = [
        "Expliquer le rôle d'un système d'exploitation.",
        "Déployer un système et le sécuriser.",
        "Décrire un réseau, ses équipements, ses paramètres.",
        "Comparer client / serveur et poste à poste.",
        "Définir l'IoT et suivre le trajet d'une mesure.",
        "Réviser avec la fiche de synthèse du manuel.",
    ]
    y = DY + 8
    for i, texte in enumerate(puces):
        y = _puce(d, DX, y, texte, BLEU if i % 2 == 0 else VIOLET, p=p,
                  seuil=0.30 + i * 0.08, largeur=760, air=34)
    carte(d, (DX, DY + 400, DROITE[2] - 26, DY + 560), "ce cours suit le manuel",
          ["pages 5 à 13 : la partie qui précède le développement Web",
           "trois chapitres, la fiche de synthèse, puis l'évaluation"],
          AMBRE, p=p, seuil=0.80, taille_titre=21, taille_corps=19)
    _bandeau(d, "Manuel · pages 5 à 13 · la partie qui précède le développement Web",
             "3ᵉ SI · édition 2026", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  2 · Le système d'exploitation : la pile et les six rôles
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme(d, p, t):
    panneau(d, GAUCHE, "la pile de la machine", VERT)
    couches = [
        ("Utilisateur", "travaille avec des applications", BLEU, False),
        ("Applications", "navigateur · traitement de texte · jeu", VIOLET, False),
        ("Système d'exploitation", "logiciel de base : gestion du matériel", AMBRE, True),
        ("Matériel", "processeur · mémoire · disque · périphériques", VERT, False),
    ]
    pile(d, (X, Y0 + 30, GAUCHE[2] - 26, GAUCHE[3] - 40), couches, p=p,
         seuil=N.avance("systeme", "pile") - 0.04)

    panneau(d, DROITE, "les six rôles", AMBRE)
    lignes = [
        ("Gérer le processeur", "exécuter plusieurs programmes"),
        ("Gérer la mémoire", "répartir la mémoire vive"),
        ("Gérer les fichiers", "créer, déplacer, supprimer"),
        ("Gérer les périphériques", "imprimante, clavier"),
        ("Gérer les utilisateurs", "comptes et autorisations"),
        ("Assurer la sécurité", "pare-feu et mises à jour"),
    ]
    table(d, (DX, DY + 16, DROITE[2] - 26, DROITE[3] - 30),
          ["rôle", "exemple"], lignes, AMBRE, p=p, seuil=N.avance("systeme", "roles") - 0.04,
          largeurs=[0.46, 0.54], taille=20, pas=76)
    _bandeau(d, "Le système d'exploitation est un logiciel de base : il gère le matériel "
                "et permet l'exécution des applications.", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  3 · Types de systèmes et licences
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme_types(d, p, t):
    panneau(d, GAUCHE, "trois familles d'appareils", BLEU)
    familles = [
        ("Ordinateurs", ["Windows", "Linux (Ubuntu, Debian…)", "macOS"], BLEU, "PC"),
        ("Mobiles", ["Android", "iOS"], VIOLET, "MOBILE"),
        ("Embarqués", ["watchOS · tvOS", "QNX (automobile)"], VERT, "EMBARQUÉ"),
    ]
    for i, (titre, corps, couleur, sigle) in enumerate(familles):
        carte(d, (X, Y0 + i * 190, GAUCHE[2] - 26, Y0 + i * 190 + 164),
              titre, corps, couleur, p=p, seuil=0.06 + i * 0.26, sigle=sigle)

    panneau(d, DROITE, "propriétaire ou libre ?", AMBRE)
    lignes = [
        ("Licence", "des droits définis par le contrat", "libertés d'usage et de modification"),
        ("Code source", "généralement non accessible", "accessible selon la licence"),
        ("Exemple", "Windows", "distributions GNU/Linux"),
    ]
    table(d, (DX, DY + 16, DROITE[2] - 26, DY + 400),
          ["", "propriétaire", "libre"], lignes, AMBRE, p=p,
          seuil=N.avance("systeme_types", "licences") + 0.04,
          largeurs=[0.24, 0.38, 0.38], taille=19, pas=96)
    carte(d, (DX, DY + 430, DROITE[2] - 26, DROITE[3] - 30),
          "le piège classique", ["Libre ne signifie pas nécessairement gratuit.",
                                 "Un logiciel libre peut être vendu ; un logiciel propriétaire peut être gratuit."],
          ROUGE_BORD, p=p, seuil=N.avance("systeme_types", "licences") + 0.34,
          taille_titre=22, taille_corps=19)
    _bandeau(d, "Le type dépend de l'appareil ; la licence dépend des droits accordés.",
             "libre ≠ gratuit", couleur=AMBRE)


# ══════════════════════════════════════════════════════════════════════════
#  4 · Déployer, virtualiser, sécuriser
# ══════════════════════════════════════════════════════════════════════════
def scene_systeme_deployer(d, p, t):
    panneau(d, GAUCHE, "déployer : trois temps", BLEU)
    etapes = [
        ("1 · Installer", "mettre le système sur l'ordinateur", BLEU),
        ("2 · Configurer", "adapter les paramètres aux besoins", AMBRE),
        ("3 · Mettre à jour", "installer les améliorations et les corrections", VERT),
    ]
    chaine(d, (X, Y0 + 6, GAUCHE[2] - 26, Y0 + 330), etapes, p=p, seuil=0.02,
           verticale=True, taille_titre=23, taille_corps=18)
    # la machine virtuelle, sous les trois temps
    vm = [
        ("PC réel", "Windows", BLEU),
        ("Virtualisation", "VMware · VirtualBox", VIOLET),
        ("Machine virtuelle", "un Linux dans une fenêtre", VERT),
    ]
    chaine(d, (X, Y0 + 420, GAUCHE[2] - 26, GAUCHE[3] - 20), vm, p=p,
           seuil=N.avance("systeme_deployer", "vm") - 0.04,
           verticale=False, taille_titre=19, taille_corps=15, remplir=0.95)

    panneau(d, DROITE, "sécuriser : quatre moyens", VERT)
    moyens = [
        ("Antivirus", ["détecter et traiter les logiciels malveillants"], BLEU),
        ("Pare-feu", ["contrôler les communications réseau"], AMBRE),
        ("Mise à jour", ["corriger les failles et les problèmes"], VERT),
        ("Mot de passe", ["limiter l'accès aux utilisateurs autorisés"], ROSE),
    ]
    for i, (titre, corps, couleur) in enumerate(moyens):
        x = DX + (i % 2) * 450
        y = DY + 12 + (i // 2) * 236
        carte(d, (x, y, x + 430, y + 206), titre, corps, couleur, p=p,
              seuil=N.avance("systeme_deployer", "securite") + 0.03 + i * 0.07,
              taille_titre=23, taille_corps=19)
    _note(d, DX, DROITE[3] - 90,
          "Un antivirus ne remplace ni le pare-feu, ni les mises à jour, ni les mots de passe.",
          ROUGE_BORD, taille=21, p=p, seuil=0.80, largeur=840)
    _bandeau(d, "Aucun moyen ne remplace les autres : la sécurité, c'est l'ensemble.",
             "manuel p. 7", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  5 · Le réseau : définition, étendue, équipements
# ══════════════════════════════════════════════════════════════════════════
def scene_reseau_definition(d, p, t):
    panneau(d, GAUCHE, "le réseau du lycée", VIOLET)
    # les quatre équipements, puis le switch qui les relie
    noms = [("PC 1", "poste"), ("PC 2", "poste"), ("Imprimante", "ressource"), ("Serveur", "services")]
    largeur = (GAUCHE[2] - 26 - X - 3 * 16) / 4
    centres = []
    for i, (nom, detail) in enumerate(noms):
        x0 = X + i * (largeur + 16)
        boite = (x0, Y0 + 10, x0 + largeur, Y0 + 120)
        carte(d, boite, nom, [detail], BLEU if i < 2 else VIOLET, p=p,
              seuil=0.05 + i * 0.10, taille_titre=19, taille_corps=16)
        centres.append((x0 + largeur / 2, Y0 + 120))
    switch = (X + 150, Y0 + 300, GAUCHE[2] - 176, Y0 + 410)
    for i, (cx, cy) in enumerate(centres):
        fleche(d, (cx, cy + 6), (switch[0] + 40 + i * 60, switch[1] - 6),
               couleur=melange(FOND_PANNEAU, TEXTE_3, _apparait(p, 0.45 + i * 0.08)),
               epaisseur=3, progression=_apparait(p, 0.36 + i * 0.06))
    carte(d, switch, "Switch / Routeur", ["relie les équipements du réseau local"],
          AMBRE, p=p, seuil=0.34, taille_titre=22, taille_corps=17)
    etiquette(d, X, Y0 + 440, "LAN · réseau local", ROSE, p=p, seuil=0.52)
    _note(d, X, Y0 + 490,
          "Un réseau, c'est un ensemble d'équipements reliés pour échanger des données et partager des ressources.",
          TEXTE_2, taille=20, p=p, seuil=0.58, largeur=790)

    panneau(d, DROITE, "selon l'étendue", AMBRE)
    table(d, (DX, DY + 8, DROITE[2] - 26, DY + 260),
          ["type", "étendue", "exemple"],
          [("LAN", "locale", "une salle informatique"),
           ("MAN", "une ville", "plusieurs établissements"),
           ("WAN", "très grande zone", "des sites dans plusieurs pays")],
          AMBRE, p=p, seuil=N.avance("reseau_definition", "etendue") - 0.03,
          largeurs=[0.16, 0.32, 0.52], taille=19, pas=58)
    d.text((DX, DY + 288), "qui fait quoi", font=police(19, True), fill=VERT, anchor="la")
    table(d, (DX, DY + 326, DROITE[2] - 26, DROITE[3] - 20),
          ["équipement", "fonction"],
          [("Carte réseau", "connecter l'appareil au réseau"),
           ("Switch", "relier les appareils du réseau local"),
           ("Routeur", "relier des réseaux, diriger les paquets"),
           ("Point d'accès Wi-Fi", "offrir une connexion sans fil"),
           ("Serveur", "fournir des services aux clients")],
          VERT, p=p, seuil=N.avance("reseau_definition", "equipements") - 0.03,
          largeurs=[0.36, 0.64], taille=19, pas=52)
    _bandeau(d, "LAN local · MAN à l'échelle d'une ville · WAN très étendu : Internet est le plus grand des WAN.",
             couleur=VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  6 · Les quatre paramètres : IP, masque, DNS, MAC
# ══════════════════════════════════════════════════════════════════════════
def scene_reseau_parametres(d, p, t):
    panneau(d, GAUCHE, "les quatre paramètres", BLEU)
    params = [
        ("Adresse IP", ["192.168.1.20", "identifie une interface"], BLEU, "IP", "ip"),
        ("Masque réseau", ["255.255.255.0", "sépare réseau et hôte"], AMBRE, "MASQUE", "masque"),
        ("Serveur DNS", ["www.example.com", "traduit un nom en adresse IP"], VIOLET, "DNS", "dns"),
        ("Adresse MAC", ["A4-B1-C1-2D-3E-4F", "identifie la carte réseau"], VERT, "MAC", "mac"),
    ]
    for i, (titre, corps, couleur, sigle, segment) in enumerate(params):
        x = X + (i % 2) * 424
        y = Y0 + 20 + (i // 2) * 280
        carte(d, (x, y, x + 400, y + 256), titre, corps, couleur, p=p,
              seuil=N.avance("reseau_parametres", segment) - 0.03,
              taille_titre=22, taille_corps=20, sigle=sigle)

    panneau(d, DROITE, "lire une adresse et son masque", AMBRE)
    # les quatre octets de l'adresse
    x0, largeur, hauteur, pas = DX + 10, 148, 76, 16
    octets = ["192", "168", "1", "20"]
    d.text((x0, DY - 4), "adresse IP", font=police(18, True), fill=BLEU, anchor="la")
    for i, octet in enumerate(octets):
        x = x0 + i * (largeur + pas)
        k = _apparait(p, 0.10 + i * 0.06)
        boite_arrondie(d, (x, DY + 26, x + largeur, DY + 26 + hauteur), rayon=12,
                       fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, BLEU, 0.18), k),
                       bord=melange(FOND_PANNEAU, BLEU, 0.6 * k), largeur_bord=2)
        d.text((x + largeur / 2, DY + 26 + hauteur / 2), octet,
               font=police(28, True, mono=True), fill=melange(FOND_PANNEAU, TEXTE, k), anchor="mm")
    # le masque, juste en dessous
    d.text((x0, DY + 116), "masque", font=police(18, True), fill=TEXTE_3, anchor="la")
    masque = ["255", "255", "255", "0"]
    for i, octet in enumerate(masque):
        x = x0 + i * (largeur + pas)
        k = _apparait(p, 0.36 + i * 0.05)
        boite_arrondie(d, (x, DY + 146, x + largeur, DY + 146 + hauteur), rayon=12,
                       fond=melange(FOND_PANNEAU, FOND_PANNEAU_2, k),
                       bord=melange(FOND_PANNEAU, TEXTE_3, 0.55 * k), largeur_bord=2)
        d.text((x + largeur / 2, DY + 146 + hauteur / 2), octet,
               font=police(26, False, mono=True), fill=melange(FOND_PANNEAU, TEXTE_2, k),
               anchor="mm")
    # les deux parties, soulignées
    k = _apparait(p, N.avance("reseau_parametres", "masque") + 0.10)
    d.line([(x0, DY + 240), (x0 + 3 * largeur + 2 * pas, DY + 240)],
           fill=melange(FOND_PANNEAU, BLEU, k), width=4)
    d.text((x0, DY + 252), "partie réseau : 192.168.1", font=police(20, True),
           fill=melange(FOND_PANNEAU, BLEU, k), anchor="la")
    x4 = x0 + 3 * (largeur + pas)
    d.line([(x4, DY + 240), (x4 + largeur, DY + 240)],
           fill=melange(FOND_PANNEAU, AMBRE, k), width=4)
    d.text((x4, DY + 252), "hôte : 20", font=police(20, True),
           fill=melange(FOND_PANNEAU, AMBRE, k), anchor="la")
    carte(d, (DX, DY + 300, DROITE[2] - 26, DY + 410), "adresse réseau",
          ["192.168.1.0  ·  trois octets pour le réseau, le dernier pour la machine"],
          AMBRE, p=p, seuil=N.avance("reseau_parametres", "masque") + 0.14,
          taille_titre=21, taille_corps=19)
    # le DNS
    carte(d, (DX, DY + 430, DROITE[2] - 26, DROITE[3] - 24), "le DNS traduit",
          ["www.example.com  →  192.168.1.20",
           "l'humain retient un nom, la machine a besoin d'un nombre"],
          VIOLET, p=p, seuil=N.avance("reseau_parametres", "dns") + 0.04,
          taille_titre=21, taille_corps=19)
    _bandeau(d, "IP : qui je suis · masque : où est le réseau · DNS : traduire les noms · MAC : la carte.",
             couleur=BLEU)


# ══════════════════════════════════════════════════════════════════════════
#  7 · Architectures et protocoles
# ══════════════════════════════════════════════════════════════════════════
def _clients_serveur(d, p, seuil):
    """Trois clients qui demandent, un serveur qui répond."""
    for i in range(3):
        k = _apparait(p, seuil + i * 0.06)
        y = Y0 + 16 + i * 88
        carte(d, (GAUCHE[0] + 40, y, GAUCHE[0] + 300, y + 72),
              f"Client {i + 1}", [], BLEU, p=1.0 if k > 0 else 0.0,
              taille_titre=19)
        fleche(d, (GAUCHE[0] + 310, y + 36), (GAUCHE[0] + 520, Y0 + 140),
               couleur=melange(FOND_PANNEAU, TEXTE_3, k), epaisseur=3, progression=k)
    k = _apparait(p, seuil + 0.20)
    carte(d, (GAUCHE[0] + 530, Y0 + 70, GAUCHE[2] - 40, Y0 + 250),
          "Serveur", ["fournit le service", "données centralisées"], AMBRE,
          p=1.0 if k > 0 else 0.0, seuil=0.0, taille_titre=21, taille_corps=17)


def scene_reseau_architectures(d, p, t):
    panneau(d, GAUCHE, "deux architectures", VIOLET)
    _clients_serveur(d, p, 0.05)
    _note(d, GAUCHE[0] + 40, Y0 + 284,
          "Client / serveur : centralisation des données et des comptes, mais une panne du serveur bloque les services.",
          TEXTE_2, taille=18, p=p, seuil=N.avance("reseau_architectures", "poste_a_poste") - 0.05,
          largeur=760)
    k = _apparait(p, N.avance("reseau_architectures", "poste_a_poste"))
    if k > 0:
        d.text((GAUCHE[0] + 40, Y0 + 386), "poste à poste (peer-to-peer)",
               font=police(20, True), fill=melange(FOND_PANNEAU, VERT, k), anchor="la")
    for i in range(3):
        k = _apparait(p, N.avance("reseau_architectures", "poste_a_poste") + 0.04 + i * 0.05)
        x = GAUCHE[0] + 40 + i * 268
        carte(d, (x, Y0 + 420, x + 240, Y0 + 500), f"PC {i + 1}", [], VERT,
              p=1.0 if k > 0 else 0.0)
        if i < 2:
            couleur_fleche = melange(FOND_PANNEAU, TEXTE_3, k)
            # deux flèches parallèles : la communication va dans les deux sens
            fleche(d, (x + 244, Y0 + 452), (x + 266, Y0 + 452),
                   couleur=couleur_fleche, epaisseur=2, progression=k, pointe=7)
            fleche(d, (x + 266, Y0 + 468), (x + 244, Y0 + 468),
                   couleur=couleur_fleche, epaisseur=2, progression=k, pointe=7)
    _note(d, GAUCHE[0] + 40, Y0 + 520,
          "Poste à poste : partage direct, sans serveur central ; gestion, sécurité et sauvegardes moins centralisées.",
          TEXTE_2, taille=18, p=p,
          seuil=N.avance("reseau_architectures", "protocoles") - 0.02, largeur=770)

    panneau(d, DROITE, "les protocoles du programme", AMBRE)
    table(d, (DX, DY + 8, DROITE[2] - 26, DY + 430),
          ["protocole", "rôle"],
          [("TCP/IP", "IP adresse et achemine, TCP transmet de façon fiable"),
           ("HTTP", "échanger des ressources entre client et serveur Web"),
           ("HTTPS", "HTTP sécurisé : chiffrement et authentification"),
           ("MQTT", "messagerie légère, adaptée aux objets connectés")],
          AMBRE, p=p, seuil=N.avance("reseau_architectures", "protocoles") - 0.02,
          largeurs=[0.20, 0.80], taille=19, pas=84)
    carte(d, (DX, DY + 460, DROITE[2] - 26, DY + 610), "sécuriser le réseau",
          ["Pare-feu : contrôler les communications selon des règles.",
           "ACL : autoriser ou refuser certains accès."],
          VERT, p=p, seuil=0.84, taille_titre=21, taille_corps=19)
    _bandeau(d, "Un protocole est un ensemble de règles qui permet aux équipements de communiquer.",
             "manuel p. 9", couleur=VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  8 · L'IoT : composants et trajet d'une mesure
# ══════════════════════════════════════════════════════════════════════════
def scene_iot_principe(d, p, t):
    panneau(d, GAUCHE, "l'Internet des objets", VERT)
    # la définition, mot pour mot celle du manuel
    carte(d, (X, Y0 + 4, GAUCHE[2] - 26, Y0 + 150), "la définition",
          ["des objets physiques capables de collecter, transmettre et échanger",
           "des données grâce à une connexion réseau"],
          AMBRE, p=p, seuil=0.02, taille_titre=22, taille_corps=19)
    # les cinq composants, un par un
    comp = [
        ("Objet connecté", "collecte ou utilise les données", BLEU),
        ("Capteur", "mesure une grandeur physique", VIOLET),
        ("Connexion réseau", "transmet les données", AMBRE),
        ("Plateforme IoT", "reçoit et stocke", VERT),
        ("Application", "affiche et permet de commander", ROSE),
    ]
    for i, (titre, corps, couleur) in enumerate(comp):
        carte(d, (X, Y0 + 172 + i * 88, GAUCHE[2] - 26, Y0 + 172 + i * 88 + 76),
              titre, [corps], couleur, p=p,
              seuil=N.avance("iot_principe", "composants") - 0.04 + i * 0.045,
              taille_titre=20, taille_corps=16)

    panneau(d, DROITE, "où le rencontre-t-on ?", BLEU)
    domaines = ["maison", "agriculture", "santé", "industrie", "ville", "transport"]
    largeur = (DROITE[2] - 26 - DX - 2 * 12) / 3
    for i, nom in enumerate(domaines):
        k = _apparait(p, 0.06 + i * 0.035)
        if k <= 0:
            continue
        x = DX + (i % 3) * (largeur + 12)
        y = DY + 6 + (i // 3) * 56
        boite_arrondie(d, (x, y, x + largeur, y + 44), rayon=10,
                       fond=melange(FOND_PANNEAU, melange(FOND_PANNEAU_2, BLEU, 0.14), k),
                       bord=melange(FOND_PANNEAU, BLEU, 0.45 * k), largeur_bord=2)
        d.text((x + largeur / 2, y + 22), nom, font=police(18, True),
               fill=melange(FOND_PANNEAU, TEXTE, k), anchor="mm")
    d.text((DX, DY + 128), "le trajet d'une mesure", font=police(19, True),
           fill=AMBRE, anchor="la")
    etapes = [
        ("Capteur", "mesure 25 °C", BLEU),
        ("Objet connecté", "prépare la donnée", VIOLET),
        ("Réseau", "HTTP ou MQTT", AMBRE),
        ("Plateforme", "reçoit et stocke", VERT),
        ("Téléphone", "l'utilisateur consulte", ROSE),
    ]
    chaine(d, (DX, DY + 162, DROITE[2] - 26, DROITE[3] - 20), etapes, p=p,
           seuil=N.avance("iot_principe", "trajet") - 0.03, verticale=True,
           taille_titre=20, taille_corps=15)
    _bandeau(d, "Mesurer, transmettre, stocker, consulter : le trajet ne change jamais.",
             "manuel p. 11", couleur=VERT)


# ══════════════════════════════════════════════════════════════════════════
#  9 · Échanger avec une plateforme, tester, la serre
# ══════════════════════════════════════════════════════════════════════════
def scene_iot_echange(d, p, t):
    panneau(d, GAUCHE, "MQTT : publier, distribuer, s'abonner", VIOLET)
    etapes = [
        ("Publisher", "publie un message", BLEU),
        ("Broker", "reçoit et distribue", AMBRE),
        ("Subscriber", "reçoit s'il est abonné", VERT),
    ]
    chaine(d, (X, Y0 + 6, GAUCHE[2] - 26, Y0 + 240), etapes, p=p,
           seuil=N.avance("iot_echange", "mqtt") - 0.04,
           verticale=False, taille_titre=20, taille_corps=15, remplir=0.95)
    # la chaîne MQTT n'apparaît qu'à la deuxième phrase du passage
    carte(d, (X, Y0 + 252, GAUCHE[2] - 26, Y0 + 348), "le sujet du message",
          ["maison/salon/temperature  ·  les niveaux sont séparés par des barres obliques"],
          ROSE, p=p, seuil=N.avance("iot_echange", "mqtt") + 0.26,
          taille_titre=19, taille_corps=17)
    carte(d, (X, Y0 + 364, GAUCHE[2] - 26, Y0 + 452), "et avec HTTP ?",
          ["l'objet envoie une requête à un serveur, qui lui répond"],
          BLEU, p=p, seuil=N.avance("iot_echange", "mqtt") + 0.06,
          taille_titre=19, taille_corps=17)

    panneau(d, DROITE, "échanger, puis vérifier", AMBRE)
    # les cinq conditions, dites avant les protocoles
    table(d, (DX, DY + 8, DROITE[2] - 26, DY + 300),
          ["avant d'envoyer", ""],
          [("1 · Réseau", "être configuré pour accéder au réseau"),
           ("2 · Informations", "connaître l'adresse de la plateforme"),
           ("3 · Protocole", "choisir HTTP ou MQTT"),
           ("4 · Données", "envoyer ou recevoir"),
           ("5 · Test", "tester le programme et corriger")],
          BLEU, p=p, seuil=0.02, largeurs=[0.30, 0.70], taille=18, pas=52)
    d.text((DX, DY + 336), "du symptôme à la vérification", font=police(19, True),
           fill=AMBRE, anchor="la")
    table(d, (DX, DY + 370, DROITE[2] - 26, DROITE[3] - 20),
          ["symptôme", "à vérifier"],
          [("Pas de connexion", "le Wi-Fi et la configuration réseau"),
           ("Le serveur ne répond pas", "l'adresse du serveur, son accessibilité"),
           ("Aucune donnée reçue", "la requête HTTP ou le message MQTT"),
           ("Mauvaise valeur affichée", "la mesure et le format transmis")],
          AMBRE, p=p, seuil=N.avance("iot_echange", "tester") - 0.03,
          largeurs=[0.40, 0.60], taille=18, pas=54)
    # la serre de l'activité de synthèse, sous la note
    carte(d, (X, Y0 + 470, GAUCHE[2] - 26, GAUCHE[3] - 18),
          "l'activité de la serre intelligente",
          ["un capteur d'humidité du sol envoie ses mesures à une plateforme IoT,",
           "l'agriculteur consulte les valeurs depuis son téléphone."],
          VERT, p=p, seuil=N.avance("iot_echange", "serre") - 0.02,
          taille_titre=21, taille_corps=19)
    _bandeau(d, "Le capteur mesure · l'objet transmet en HTTP ou MQTT · la plateforme stocke · on consulte.",
             "manuel p. 12", couleur=VIOLET)


# ══════════════════════════════════════════════════════════════════════════
#  10 · La fiche de synthèse
# ══════════════════════════════════════════════════════════════════════════
def scene_synthese(d, p, t):
    panneau(d, GAUCHE, "la fiche de synthèse", AMBRE)
    lignes = [
        ("Système d'exploitation", "logiciel de base qui gère les ressources"),
        ("Déploiement", "installer, configurer, mettre à jour"),
        ("LAN · MAN · WAN", "local, ville, très étendu"),
        ("Adresse IP", "identifier une interface"),
        ("Masque réseau", "séparer la partie réseau et l'hôte"),
        ("DNS", "traduire un nom en adresse IP"),
        ("Adresse MAC", "identifier l'interface localement"),
        ("TCP/IP", "communiquer sur les réseaux"),
        ("HTTP · HTTPS", "échanger sur le Web, puis en sécurité"),
        ("MQTT", "messagerie légère des objets connectés"),
        ("IoT", "objets physiques connectés"),
    ]
    table(d, (X, Y0 + 4, GAUCHE[2] - 26, GAUCHE[3] - 20),
          ["notion", "rôle essentiel"], lignes, AMBRE, p=p, seuil=0.02,
          largeurs=[0.36, 0.64], taille=18, pas=50)

    panneau(d, DROITE, "l'idée clé", VERT)
    idees = [
        ("Le système gère l'équipement", "logiciel de base, du matériel aux applications", BLEU),
        ("Le réseau fait communiquer", "IP, masque, DNS, MAC, protocoles, ACL", AMBRE),
        ("L'IoT connecte le physique", "mesurer, transmettre, stocker, consulter", VERT),
    ]
    for i, (titre, corps, couleur) in enumerate(idees):
        carte(d, (DX, DY + 10 + i * 158, DROITE[2] - 26, DY + 10 + i * 158 + 138),
              titre, [corps], couleur, p=p,
              seuil=N.avance("synthese", "reseau") - 0.03 + i * 0.10,
              taille_titre=22, taille_corps=19)
    carte(d, (DX, DY + 486, DROITE[2] - 26, DROITE[3] - 20), "et maintenant ?",
          ["l'évaluation générale, page 13 du manuel : dix points.",
           "puis le cours suivant : HTML5."],
          ROSE, p=p, seuil=N.avance("synthese", "fin") - 0.02,
          taille_titre=21, taille_corps=19)
    _bandeau(d, "Le système gère l'équipement, le réseau fait communiquer, l'IoT met la "
                "communication au service des objets physiques.", couleur=VERT)


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
