"""Texte de la voix off du cours « Systèmes, technologies et Internet » (3ᵉ SI).

Ce n'est **pas une capsule** : c'est le cours de la partie 1 du manuel, pages 5
à 13, expliqué de bout en bout, dans l'ordre du livre.

* **chapitre 1** — les systèmes d'exploitation : définition, les six rôles,
  les types (PC, mobiles, embarqués), logiciel propriétaire et logiciel libre,
  le déploiement en trois temps, la machine virtuelle, la sécurité ;
* **chapitre 2** — les réseaux : définition, LAN / MAN / WAN, les équipements,
  les quatre paramètres (IP, masque, DNS, MAC), les architectures
  client/serveur et poste à poste, les protocoles, la sécurisation ;
* **chapitre 3** — l'Internet des objets : définition, les cinq composants,
  le trajet d'une mesure, l'échange HTTP et MQTT, le test et la correction,
  l'activité de la serre intelligente.

L'écran suit une seule règle : **pleine largeur** quand il n'y a qu'une chose
à montrer, **deux colonnes** seulement quand deux contenus se répondent. Les
schémas et les tableaux du manuel y apparaissent tels quels, découpés par
`extraits.py`, avec leur page en repère.

Deux conventions de nommage, une fois pour toutes :

* **dit()** — ce que la voix prononce. Les adresses, les sigles et les symboles
  y sont écrits en toutes lettres (« 192 point 168 point 1 point 20 »), alors
  que l'écran et les sous-titres gardent la forme du manuel ;
* **une section = un chapitre du menu**. `ORDRE` sert aux deux.
"""
from __future__ import annotations

import re

# L'ordre de lecture ; il sert aussi à numéroter les chapitres.
ORDRE = [
    "ouverture", "systeme", "systeme_types", "systeme_deployer",
    "reseau_definition", "reseau_parametres", "reseau_architectures",
    "iot_principe", "iot_echange", "synthese",
]

# Les exemples chiffrés du manuel, écrits une seule fois.
IP_POSTE = "192.168.1.20"
MASQUE = "255.255.255.0"
IP_RESEAU = "192.168.1.0"
MAC = "A4-B1-C1-2D-3E-4F"
DOMAINE = "www.example.com"
SUJET_MQTT = "maison/salon/temperature"
TEMP = 25

SECTIONS = {
    "ouverture": {
        "titre": "Bienvenue — le cours qui précède le Web",
        "segments": [
            ("ouverture", [
                "Bienvenue dans STI Version 2.0.",
                "Ceci n'est pas une capsule : c'est un cours, celui de la troisième année SI,",
                " intitulé Systèmes, technologies et Internet.",
                "Il occupe les pages cinq à treize du manuel, juste avant le développement Web.",
                "Il répond à trois questions.",
                "Un : qui fait fonctionner un ordinateur ?",
                "Deux : comment deux équipements communiquent-ils ?",
                "Trois : comment un objet connecté fait-il remonter une mesure jusqu'à Internet ?",
                "Trois questions, trois chapitres : les systèmes d'exploitation, les réseaux informatiques, et l'Internet des objets.",
                "Chaque chapitre se termine par des activités corrigées ; le cours se referme sur une fiche de synthèse et une évaluation générale sur dix points.",
                "Prenez un cahier, gardez le livre ouvert : nous commençons par le logiciel qui pilote la machine.",
            ]),
        ],
    },
    "systeme": {
        "titre": "Chapitre 1 · Le système d'exploitation et ses rôles",
        "segments": [
            ("definition", [
                "Chapitre un : les systèmes d'exploitation.",
                "Un ordinateur, c'est d'abord du matériel : l'écran, le clavier, la souris, le processeur, la mémoire vive, le disque. C'est le hardware.",
                "C'est ensuite du logiciel : les programmes utilisés par l'utilisateur. C'est le software.",
            ]),
            ("pile", [
                "Entre les deux se trouve un logiciel de base sans lequel rien ne fonctionne : le système d'exploitation.",
                "Voici la pile, du haut vers le bas : l'utilisateur travaille avec des applications ; les applications reposent sur le système d'exploitation ; le système d'exploitation commande le matériel.",
            ]),
            ("roles", [
                "Définition à retenir : le système d'exploitation est un logiciel de base qui assure la gestion du matériel et permet l'exécution des applications.",
                "Il a six rôles.",
                "Gérer le processeur : organiser l'exécution des programmes, par exemple un navigateur et un lecteur vidéo ouverts en même temps.",
                "Gérer la mémoire : la répartir entre les applications.",
                "Gérer les fichiers : créer, supprimer, déplacer, organiser.",
                "Gérer les périphériques : communiquer avec l'imprimante, le clavier.",
                "Gérer les utilisateurs : contrôler les comptes et les autorisations.",
                "Assurer la sécurité : protéger le système et les données.",
                "Six rôles, un seul logiciel de base. Retenez surtout la définition : gestion du matériel, exécution des applications.",
            ]),
        ],
    },
    "systeme_types": {
        "titre": "Chapitre 1 · Types de systèmes et licences",
        "segments": [
            ("appareils", [
                "Deuxième point du chapitre : les types de systèmes d'exploitation.",
                "Pour les ordinateurs personnels : Windows, système propriétaire de Microsoft ; Linux, une famille de systèmes libres avec plusieurs distributions, comme Ubuntu ; macOS, sur les ordinateurs Mac d'Apple.",
                "Pour les mobiles : Android, sur de nombreux téléphones et tablettes ; iOS, le système des iPhone.",
                "Pour les appareils spécialisés, on parle de systèmes embarqués : watchOS pour les montres, tvOS pour l'Apple TV, QNX notamment dans l'automobile.",
                "Un système embarqué est intégré dans un appareil qui réalise des fonctions précises.",
            ]),
            ("licences", [
                "Deuxième distinction : la licence.",
                "Un logiciel propriétaire s'utilise selon une licence qui définit les droits accordés, et son code source n'est généralement pas accessible librement. C'est le cas de Windows.",
                "Un logiciel libre garantit les libertés d'utiliser, d'étudier, de modifier et de redistribuer le programme ; son code source est accessible selon les conditions de la licence. C'est le cas des distributions GNU-Linux.",
                "Attention à un piège classique : libre ne signifie pas nécessairement gratuit.",
                "À retenir : le type dépend de l'appareil, la licence dépend des droits accordés.",
            ]),
        ],
    },
    "systeme_deployer": {
        "titre": "Chapitre 1 · Déployer, virtualiser, sécuriser",
        "segments": [
            ("deployer", [
                "Déployer un système d'exploitation, c'est le mettre en place et le préparer pour son utilisation, en trois temps.",
                "Un : installer, c'est-à-dire le mettre sur l'ordinateur.",
                "Deux : configurer, adapter les paramètres selon les besoins.",
                "Trois : mettre à jour, installer les améliorations et les corrections disponibles.",
            ]),
            ("vm", [
                "Pour essayer un système sans toucher au système principal, on utilise une machine virtuelle.",
                "C'est un ordinateur simulé par un logiciel : un PC réel fait tourner un logiciel de virtualisation, et une machine virtuelle apparaît dans une fenêtre.",
                "Deux exemples au programme : VMware et VirtualBox.",
            ]),
            ("securite", [
                "Reste la sécurité de l'ordinateur : quatre moyens qui se complètent, jamais un seul.",
                "L'antivirus détecte et traite les logiciels malveillants.",
                "Le pare-feu contrôle les communications réseau.",
                "La mise à jour corrige les failles et les problèmes.",
                "Le mot de passe limite l'accès aux utilisateurs autorisés.",
                "Un antivirus ne remplace ni le pare-feu, ni les mises à jour, ni les bonnes pratiques : la sécurité, c'est l'ensemble.",
                "Fin du chapitre un. Nous passons à la communication entre équipements.",
            ]),
        ],
    },
    "reseau_definition": {
        "titre": "Chapitre 2 · Le réseau, son étendue, ses équipements",
        "segments": [
            ("definition", [
                "Chapitre deux : les réseaux informatiques.",
                "Définition : un réseau informatique est un ensemble d'équipements informatiques reliés entre eux afin d'échanger des données et de partager des ressources.",
                "Regardez le schéma : deux postes de travail, une imprimante partagée, un serveur qui offre des services, et au centre un switch ou un routeur qui relie le tout.",
            ]),
            ("etendue", [
                "On classe d'abord un réseau selon son étendue.",
                "Le LAN, local, comme le réseau d'une salle informatique ou d'un lycée.",
                "Le MAN, à l'échelle d'une ville : plusieurs établissements d'une même ville.",
                "Le WAN, très étendu : des sites dans plusieurs pays. Internet est le plus grand des WAN.",
            ]),
            ("equipements", [
                "On décrit ensuite les équipements, chacun avec sa fonction.",
                "La carte réseau permet à un appareil de se connecter à un réseau.",
                "Le switch, ou commutateur, relie plusieurs appareils dans un réseau local.",
                "Le routeur relie des réseaux différents et dirige les paquets.",
                "Le point d'accès Wi-Fi permet une connexion sans fil.",
                "Le serveur fournit des services ou des ressources aux clients.",
                "Retenez la différence essentielle : le switch reste dans le réseau local, le routeur fait le pont entre deux réseaux.",
                "Place maintenant aux paramètres, c'est-à-dire aux adresses.",
            ]),
        ],
    },
    "reseau_parametres": {
        "titre": "Chapitre 2 · IP, masque, DNS et adresse MAC",
        "segments": [
            ("ip", [
                "Quatre paramètres à ne jamais confondre.",
                "L'adresse IP identifie une interface réseau dans un réseau qui utilise le protocole IP.",
                "En IPv4, elle s'écrit avec quatre nombres compris entre zéro et 255, séparés par des points : par exemple " + IP_POSTE + ".",
            ]),
            ("masque", [
                "Le masque réseau indique quelle partie de l'adresse désigne le réseau et quelle partie désigne l'hôte.",
                "Avec l'adresse " + IP_POSTE + " et le masque " + MASQUE + ", les trois premiers nombres forment la partie réseau et le dernier identifie la machine.",
                "L'adresse réseau est donc " + IP_RESEAU + ", et l'hôte porte le numéro 20.",
            ]),
            ("dns", [
                "Le serveur DNS traduit un nom de domaine en adresse IP. DNS signifie Domain Name System.",
                "Quand vous tapez " + DOMAINE + ", votre navigateur demande au DNS l'adresse IP correspondante.",
                "L'être humain retient un nom, la machine a besoin d'un nombre.",
            ]),
            ("mac", [
                "L'adresse MAC est associée à une interface réseau.",
                "Elle s'écrit en six groupes de deux caractères hexadécimaux, par exemple " + MAC + ".",
                "Elle sert notamment à identifier une interface dans le réseau local.",
                "En résumé : l'IP identifie au niveau IP, le masque sépare réseau et hôte, le DNS traduit les noms, la MAC identifie localement.",
            ]),
        ],
    },
    "reseau_architectures": {
        "titre": "Chapitre 2 · Architectures, protocoles, sécurité",
        "segments": [
            ("client_serveur", [
                "Deux architectures, puis les protocoles.",
                "Dans l'architecture client-serveur, un ordinateur client demande un service à un ordinateur serveur : plusieurs clients, un serveur central.",
                "Les avantages : centralisation des données, gestion des utilisateurs et administration centralisées.",
                "L'inconvénient : si le serveur tombe en panne, les services qu'il fournit peuvent devenir indisponibles.",
            ]),
            ("poste_a_poste", [
                "Dans le poste à poste, en anglais peer-to-peer, les ordinateurs communiquent directement entre eux, sans serveur central obligatoire.",
                "C'est simple et direct pour un petit réseau ; en revanche la gestion est moins centralisée, et la sécurité comme les sauvegardes sont plus difficiles à administrer.",
            ]),
            ("protocoles", [
                "Un protocole est un ensemble de règles qui permet aux équipements de communiquer.",
                "Quatre noms sont au programme.",
                "TCP/IP : IP assure l'adressage et l'acheminement, TCP assure une transmission fiable et ordonnée.",
                "HTTP échange des ressources entre un client et un serveur Web.",
                "HTTPS est sa version sécurisée, avec chiffrement et authentification du serveur.",
                "MQTT est une messagerie légère, adaptée aux objets connectés : nous la retrouverons au chapitre trois.",
                "Sécuriser un réseau, enfin, c'est d'abord un pare-feu qui contrôle les communications selon des règles de sécurité, et une liste de contrôle d'accès, appelée ACL, qui autorise ou interdit certains accès.",
            ]),
        ],
    },
    "iot_principe": {
        "titre": "Chapitre 3 · L'Internet des objets et ses composants",
        "segments": [
            ("definition", [
                "Chapitre trois : l'Internet des objets, en anglais Internet of Things, ou IoT.",
                "Définition : l'Internet des objets désigne l'ensemble des objets physiques capables de collecter, transmettre et échanger des données grâce à une connexion réseau.",
                "On le rencontre partout : l'éclairage et le thermostat d'une maison, un capteur d'humidité du sol en agriculture, un appareil de suivi en santé, un capteur de température dans l'industrie, l'éclairage public en ville, le suivi de véhicules dans le transport.",
            ]),
            ("composants", [
                "Une solution IoT repose sur cinq composants.",
                "L'objet connecté, qui collecte ou utilise les données.",
                "Le capteur, qui mesure une grandeur.",
                "La connexion réseau, qui permet de transmettre.",
                "La plateforme IoT, qui reçoit et stocke les données.",
                "L'application, qui affiche les informations ou permet de commander l'objet.",
            ]),
            ("trajet", [
                "Suivons une mesure de température : " + str(TEMP) + " degrés.",
                "Le capteur mesure. L'objet connecté prépare la donnée. Le réseau la transporte, en HTTP ou en MQTT. La plateforme la reçoit et la stocke. L'utilisateur la consulte sur son téléphone.",
                "C'est toujours le même trajet : mesurer, transmettre, stocker, consulter.",
                "Un capteur ne parle pas directement à votre téléphone : il passe par la plateforme.",
            ]),
        ],
    },
    "iot_echange": {
        "titre": "Chapitre 3 · Échanger, tester, la serre intelligente",
        "segments": [
            ("preparer", [
                "Comment un objet échange-t-il vraiment avec une plateforme ?",
                "Il doit être configuré pour accéder au réseau, disposer des informations nécessaires à la communication, utiliser un protocole adapté, envoyer ou recevoir les données, puis tester son programme et corriger les erreurs.",
            ]),
            ("mqtt", [
                "Deux protocoles sont possibles.",
                "Avec HTTP, l'objet envoie une requête à un serveur.",
                "Avec MQTT, les messages passent par un broker, c'est-à-dire un intermédiaire.",
                "Trois rôles : le publisher publie un message, le broker le reçoit et le distribue, le subscriber reçoit les messages auxquels il s'est abonné.",
                "Un message est publié sur un sujet, par exemple " + SUJET_MQTT + " : les niveaux du sujet sont séparés par des barres obliques.",
            ]),
            ("tester", [
                "Testons, avec la table de vérification du manuel.",
                "Pas de connexion : vérifiez le Wi-Fi et la configuration réseau.",
                "Le serveur ne répond pas : vérifiez l'adresse du serveur et son accessibilité.",
                "Aucune donnée reçue : vérifiez la requête HTTP ou le message MQTT.",
                "Mauvaise valeur affichée : vérifiez la mesure et le format transmis.",
            ]),
            ("serre", [
                "L'activité de synthèse du manuel, c'est une serre intelligente.",
                "Un capteur d'humidité du sol envoie ses mesures à une plateforme IoT, et l'agriculteur consulte les valeurs depuis son téléphone.",
                "Quel est le rôle du capteur ? Mesurer l'humidité du sol.",
                "De l'objet connecté ? Récupérer et transmettre la mesure.",
                "De la plateforme ? Recevoir et exploiter les données.",
                "Et les deux protocoles possibles ? HTTP et MQTT.",
            ]),
        ],
    },
    "synthese": {
        "titre": "Fiche de synthèse — l'essentiel du cours",
        "segments": [
            ("systeme", [
                "Faisons le point avec la fiche de synthèse du manuel.",
                "Le système d'exploitation est le logiciel de base qui gère les ressources informatiques.",
                "Le déployer, c'est l'installer, le configurer et le mettre à jour.",
            ]),
            ("reseau", [
                "Un réseau se classe par son étendue : LAN local, MAN métropolitain, WAN étendu.",
                "Quatre paramètres : l'adresse IP identifie une interface au niveau IP ; le masque sépare la partie réseau de la partie hôte ; le DNS traduit un nom de domaine en adresse IP ; l'adresse MAC identifie une interface localement.",
                "Côté protocoles : TCP/IP pour communiquer sur les réseaux, HTTP pour le Web, HTTPS pour le Web sécurisé, MQTT pour la messagerie légère des objets connectés.",
            ]),
            ("iot", [
                "Et l'Internet des objets, ce sont des objets physiques connectés qui collectent et échangent des données.",
                "L'idée clé, en une phrase : le système d'exploitation gère l'équipement, le réseau permet la communication, et l'Internet des objets met cette communication au service d'objets physiques connectés.",
            ]),
            ("fin", [
                "Vous pouvez maintenant passer à l'évaluation générale du manuel, page treize : dix questions, dix points.",
                "Bon travail, et à bientôt dans le cours suivant, HTML5.",
            ]),
        ],
    },
}


# ── Ce que la voix prononce ────────────────────────────────────────────────
# L'écran garde la forme du manuel ; la voix, elle, dit tout en toutes lettres.
_SIGLES = {
    "MQTT": "M Q T T",
    "TCP/IP": "TCP IP",
    "ACL": "A C L",
    "QNX": "Q N X",
    "watchOS": "watch O S",
    "tvOS": "télé O S",
    "iOS": "i O S",
    "IPv4": "IP version 4",
    "GNU-Linux": "GNU Linux",
    "peer-to-peer": "pir tou pir",
}
# L'adresse MAC du manuel, groupe par groupe.
_MAC_DITE = "A quatre, B un, C un, deux D, trois E, quatre F"
_MOTIF_IP = re.compile(r"\b(\d{1,3}(?:\.\d{1,3}){1,3})\b")


def dit(texte: str) -> str:
    """La même phrase, écrite pour la bouche : adresses et sigles épelés."""
    for sigle, prononciation in _SIGLES.items():
        texte = re.sub(rf"(?<![\w-]){re.escape(sigle)}(?![\w-])", prononciation, texte)
    texte = texte.replace(MAC, _MAC_DITE)
    texte = _MOTIF_IP.sub(lambda m: m.group(1).replace(".", " point "), texte)
    return texte


# ── Assemblage ─────────────────────────────────────────────────────────────
def texte_segment(section: str, cle: str) -> str:
    for nom, phrases in SECTIONS[section]["segments"]:
        if nom == cle:
            # chaque phrase est complète : on les colle avec une espace, sinon la
            # voix off lirait « 2.0.Aujourd'hui » d'un seul trait
            return " ".join(phrases)
    raise KeyError(f"{section} / {cle}")


def texte_section(section: str) -> str:
    return " ".join(texte_segment(section, cle) for cle, _ in SECTIONS[section]["segments"])


def avance(section: str, cle: str) -> float:
    """Où commence un segment, en fraction de la section (0 → 1).

    Les scènes s'en servent pour faire apparaître chaque dessin au moment où la
    voix arrive sur le passage qui l'explique : la voix et l'image ne peuvent
    pas se désynchroniser.
    """
    total = len(texte_section(section))
    curseur = 0
    for nom, phrases in SECTIONS[section]["segments"]:
        if nom == cle:
            return round(curseur / max(1, total), 4)
        curseur += len(" ".join(phrases)) + 1
    raise KeyError(f"{section} / {cle}")


def texte_dit(section: str) -> str:
    """Le texte de la section tel qu'il doit être envoyé à la synthèse vocale."""
    return dit(texte_section(section))


def nombre_caracteres() -> int:
    return sum(len(texte_section(s)) for s in ORDRE)


def numero(section: str) -> int:
    """Le numéro d'étape (1 → n) d'une section."""
    return ORDRE.index(section) + 1


# ── Sous-titres ────────────────────────────────────────────────────────────
_INSECABLE = "\u00a0"


def _typo(phrase: str) -> str:
    """Espace insécable avant les ponctuations doubles : elles ne passent
    jamais seules en début de ligne."""
    for signe in (":", ";", "?", "!", "»"):
        phrase = phrase.replace(f" {signe}", f"{_INSECABLE}{signe}")
    return phrase.replace("« ", f"«{_INSECABLE}")


def _replier(phrase, maxi=42):
    """Replie une phrase en lignes courtes, sans jamais couper un mot."""
    lignes, courant = [], ""
    for mot in _typo(phrase).split(" "):
        essai = (courant + " " + mot).strip()
        if len(essai) <= maxi or not courant:
            courant = essai
        else:
            lignes.append(courant)
            courant = mot
    if courant:
        lignes.append(courant)
    return lignes


def _decouper(phrases, lignes_max=2):
    """Une réplique = une phrase entière, repliée sur deux lignes au plus."""
    cues = []
    for phrase in phrases:
        lignes = _replier(phrase)
        for i in range(0, len(lignes), lignes_max):
            cues.append("\n".join(lignes[i:i + lignes_max]))
    return cues


def sous_titres(durees: dict, debuts: dict):
    """Renvoie [(début, fin, texte)] calés proportionnellement aux caractères."""
    entrees = []
    for section in ORDRE:
        debut = debuts.get(section, 0.0)
        duree = durees.get(section, 0.0)
        if duree <= 0:
            continue
        cues = []
        for cle, phrases in SECTIONS[section]["segments"]:
            cues.extend(_decouper(phrases))
        poids = [max(1, len(c.replace("\n", " "))) for c in cues]
        total = sum(poids)
        curseur = debut
        for cue, p in zip(cues, poids):
            d = duree * p / total
            entrees.append((curseur, curseur + d, cue))
            curseur += d
    return entrees


def _hms(secondes: float) -> str:
    ms = int(round(secondes * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


def vtt(entrees) -> str:
    lignes = ["WEBVTT", ""]
    for debut, fin, texte in entrees:
        lignes += [_hms(debut) + " --> " + _hms(fin), texte, ""]
    return "\n".join(lignes)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--dit":
        cle = sys.argv[2] if len(sys.argv) > 2 else None
        sections = [cle] if cle else ORDRE
        for s in sections:
            print(f"=== {s} ({len(texte_dit(s))} car.) ===")
            print(texte_dit(s))
            print()
    else:
        for s in ORDRE:
            print(f"{numero(s):2d}. {s:20s} {len(texte_section(s)):5d} car.  {SECTIONS[s]['titre']}")
        print(f"total : {nombre_caracteres()} caractères")
