"""Texte de la voix off française et découpage des sous-titres.

Chaque section correspond à un extrait audio autonome ; sa durée réelle
sert à caler la durée visuelle de la section (voir render.py --durees).
"""
from __future__ import annotations

SECTIONS = {
    "intro": [
        "Bienvenue dans cette correction détaillée du TP Train, Série 6 de JavaScript.",
        "Sami réserve un billet : son identité, son voyage, le prix, puis un captcha anti-robot.",
        "Chaque partie se déroule en deux temps. D'abord le diagramme se construit sur toute la largeur "
        "de l'écran. Ensuite il se replie à gauche, et le code s'écrit à droite, pas à pas, "
        "en suivant exactement le diagramme.",
        "Cinq parties, et un train qui entre en gare à la fin. C'est parti.",
    ],
    "outils": [
        "Avant les cinq scènes, trois petites fonctions d'outillage, que tout le reste va réutiliser.",
        "lire récupère la valeur d'un champ : une ligne suffit, un getElementById suivi de point value.",
        "ecrire affiche plusieurs lignes de résultat : on assemble le texte avec des balises br, "
        "puis on l'injecte dans la zone de sortie avec innerHTML.",
        "colorer borde un champ en vert quand la saisie est correcte, en rouge sinon : "
        "c'est le troisième argument, un simple booléen, qui décide de la couleur.",
        "Ces trois fonctions ne font rien de visible pour l'utilisateur, mais elles évitent "
        "de répéter le même code dans les cinq scènes.",
    ],
    "identite": [
        "Partie une : l'identité.",
        "Le diagramme commence par un début, puis un appel à demanderNom : un prompt pose la question, "
        "et la réponse atterrit dans le champ nom.",
        "Attention au cas où l'utilisateur clique sur Annuler : le prompt renvoie alors null, "
        "et il ne faut surtout pas écrire ce null dans le champ. D'où le test : ni null, ni chaîne vide.",
        "Vient ensuite le contrôle du nom avec la fonction identite : si le champ est vide, "
        "on prévient avec une alerte, on colore en rouge et on sort de la fonction avec return.",
        "Pour l'e-mail, une petite boucle parcourt la chaîne caractère par caractère. "
        "Elle retient la position du premier arobase et celle du dernier point.",
        "La condition finale est courte mais précise : l'arobase ne doit pas être au tout début, "
        "il doit rester au moins un caractère entre l'arobase et le point, "
        "et le point ne doit pas être le dernier caractère.",
        "Si tout est bon, la fonction renvoie vrai, et le message de bienvenue s'affiche "
        "avec la première lettre du nom en majuscule.",
    ],
    "voyage": [
        "Partie deux : le voyage et les dates.",
        "Premier réflexe : savoir ce que l'utilisateur a coché. typeChoisi parcourt les boutons radio "
        "et renvoie la valeur du bouton sélectionné.",
        "Selon la réponse, typeVoyage active ou désactive le champ de la date de retour. "
        "Un aller simple n'a pas de retour : on désactive le champ, et on le vide, "
        "pour ne pas garder une ancienne date.",
        "La fonction voyage récupère ensuite la date de l'aller. Si elle est vide, une alerte "
        "et un return : on ne continue pas avec une date absente.",
        "Sinon, on transforme le texte du champ en vraie date. Attention, une date au format "
        "année, mois, jour se lit directement, alors qu'une date au format jour, mois, année "
        "demande de remettre les morceaux dans l'ordre : c'est exactement le travail de la fonction dateDe.",
        "On affiche alors le jour de la semaine et la date en français, puis le nombre de jours "
        "qui restent avant le départ, calculé par une simple différence de dates divisée par "
        "le nombre de millisecondes d'une journée.",
        "Et s'il s'agit d'un aller-retour, on recommence pour la date de retour, "
        "et on compte les nuits entre les deux dates.",
    ],
    "prix": [
        "Partie trois : le prix du billet. C'est le calcul le plus complet du TP.",
        "On commence par convertir les deux champs : le tarif en nombre décimal, "
        "le nombre de billets en nombre entier.",
        "Dès qu'une valeur n'est pas un nombre, ou que la quantité de billets est invalide, "
        "on prévient et on arrête tout : inutile de calculer sur des valeurs fausses.",
        "Première règle : la première classe coûte une fois et demie le tarif de base. "
        "On parcourt les boutons radio, et si celui de la première classe est coché, "
        "le tarif est multiplié par un virgule cinq.",
        "Deuxième règle : chaque option cochée s'ajoute au prix. Une boucle sur les cases à cocher, "
        "et on additionne la valeur de chacune, convertie en nombre.",
        "Troisième règle : la réduction selon la date de naissance. On calcule l'âge, "
        "en retirant une année si l'anniversaire n'est pas encore passé. "
        "La réduction est de moitié pour un enfant, et d'un quart pour un jeune.",
        "Le total se compose ainsi : le tarif réduit, plus les options, le tout multiplié "
        "par la quantité de billets. Et pour un aller-retour, on multiplie encore par deux.",
        "Reste à afficher proprement : trois chiffres après la virgule pour les dinars, "
        "et le total en millimes en multipliant par mille puis en arrondissant.",
    ],
    "captcha": [
        "Partie quatre : le captcha, la preuve qu'on est bien un humain.",
        "La fonction nouveauCode tire cinq caractères au hasard dans une chaîne de lettres et de chiffres, "
        "et leur donne à chacun une couleur tirée au hasard elle aussi.",
        "Deux choses sont fabriquées en même temps : le texte visible, coloré, écrit dans la page, "
        "et le vrai code, caché dans un champ invisible. C'est ce code caché qui servira à la comparaison.",
        "On pense aussi à vider la zone de saisie : un nouveau code, une nouvelle chance.",
        "Quand l'utilisateur valide, verifierCaptcha compare les deux chaînes caractère par caractère, "
        "et compte combien de caractères sont identiques et bien placés.",
        "Cinq bons caractères : c'est gagné. Sinon, on incrémente le compteur d'essais. "
        "Au troisième échec, on arrête et on affiche que les essais sont épuisés. "
        "Sinon, on redonne un nouveau code : la boucle est bouclée, au sens propre.",
        "Petit bonus : la fonction aide affiche ou cache le panneau d'aide. Ici, pas de if et pas de else, "
        "une seule ligne suffit : on inverse la valeur de l'attribut hidden avec un point d'exclamation.",
    ],
    "envoi": [
        "Partie cinq : la validation et l'envoi.",
        "La fonction verif est le contrôle final. Elle construit une liste d'erreurs, "
        "et y ajoute un message pour chaque champ manquant ou incorrect : le nom vide, "
        "l'e-mail mal formé, la date de départ absente.",
        "Si la liste n'est pas vide, on l'affiche et on renvoie faux : la réservation est refusée. "
        "Si la liste est vide, on renvoie vrai.",
        "reserver s'appuie sur ce résultat : un appel à verif, et si la réponse est fausse, "
        "un return immédiat. C'est ce qu'on appelle une garde : on ne continue que si tout va bien.",
        "Quand tout est bon, la réservation est confirmée, et le train entre en gare.",
        "positionnerTrain remet le train au départ, puis deplacerTrain lance un minuteur : "
        "toutes les vingt millisecondes, le décalage augmente de deux pixels, et l'image se déplace.",
        "Et quand le décalage atteint cinq cent vingt pixels, on arrête le minuteur avec clearInterval : "
        "le train est à quai.",
        "Voilà le TP terminé. Un diagramme, puis du code fidèle au diagramme, scène après scène.",
    ],
    "outro": [
        "Pour résumer : un diagramme avant le code, des fonctions courtes et réutilisables, "
        "des boucles pour vérifier, des conditions pour décider, et une animation en prime.",
        "Le réflexe à garder : quand un exercice paraît long, dessinez-le d'abord. "
        "Un organigramme clair, et le code se déduit presque tout seul.",
        "À toi de jouer maintenant : ouvre la page JavaScript, va dans la Série 6, "
        "et tape le TP Train. Bon courage !",
    ],
}

# Ordre des sections dans la vidéo
ORDRE = ["intro", "outils", "identite", "voyage", "prix", "captcha", "envoi", "outro"]


def texte(section: str) -> str:
    return " ".join(SECTIONS[section])


def sous_titres(section_durees: dict, decalages: dict) -> list:
    """Construit les entrées VTT : (début, fin, texte) réparties sur la durée audio."""
    entrees = []
    for section in ORDRE:
        phrases = SECTIONS[section]
        duree = section_durees[section]
        total_car = sum(len(p) for p in phrases)
        t = decalages[section]
        for i, phrase in enumerate(phrases):
            part = duree * len(phrase) / total_car
            # découpe les phrases trop longues en deux lignes de sous-titre
            mots = phrase.split()
            if len(mots) > 16:
                moitie = len(mots) // 2
                morceaux = [" ".join(mots[:moitie]), " ".join(mots[moitie:])]
            else:
                morceaux = [" ".join(mots)]
            for j, ligne in enumerate(morceaux):
                d = t + part * j / len(morceaux)
                f = t + part * (j + 1) / len(morceaux)
                entrees.append((d, f, ligne))
            t += part
    return entrees


def vtt(entrees) -> str:
    def h(t):
        ms = int(round(t * 1000))
        s, ms = divmod(ms, 1000)
        m, s = divmod(s, 60)
        return f"{m:02d}:{s:02d}.{ms:03d}"

    lignes = ["WEBVTT", ""]
    for debut, fin, texte in entrees:
        lignes.append(f"{h(debut)} --> {h(fin)}")
        # découpe à 42 caractères pour rester lisible
        mots, courante, sortie = texte.split(), "", []
        for mot in mots:
            if len(courante) + len(mot) + 1 > 42 and courante:
                sortie.append(courante)
                courante = mot
            else:
                courante = (courante + " " + mot).strip()
        if courante:
            sortie.append(courante)
        lignes.extend(sortie)
        lignes.append("")
    return "\n".join(lignes)
