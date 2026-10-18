# Déploiement v303 — contrôle des machines `elevelabo3`

La v303 ajoute un mini-tableau **dans le tableau administrateur existant**. Elle ne crée pas un second espace administrateur.

## Comportement retenu

- Chaque nouvelle machine connectée avec `elevelabo3@exemple.tn` est autorisée automatiquement et ajoutée à la liste.
- L’administrateur AAL2 peut la bloquer, la réautoriser, la renommer ou la supprimer.
- Un message peut viser une seule machine : fenêtre immédiate, historique et accusé de lecture.
- Ce compte ne fonctionne jamais hors ligne.
- Les anciens accès permanents locaux et les anciens codes universels `LABO03`, `LABO3` et `ELEVELABO3` sont neutralisés.
- Une machine supprimée réapparaît comme nouvelle machine à sa prochaine connexion, puisqu’une première connexion est automatiquement acceptée selon le choix retenu. Pour une interdiction durable, utiliser **Bloquer**.

## Ordre obligatoire

### 1. Base Supabase

Dans **Supabase → SQL Editor**, exécuter :

`supabase/migrations/20261018_labo_device_control.sql`

Le script crée :

- `labo_devices` ;
- `labo_device_sessions` ;
- `labo_device_messages` ;
- les RPC de machine et d’administration ;
- deux politiques RLS restrictives sur `profiles` et `acces`.

### 2. Test transactionnel

Exécuter ensuite :

`tests/rls-v303-device-control.sql`

Résultat attendu :

`OK — contrôle machines v303, RLS, blocage et AAL2 validés`

Le test finit par `rollback` et ne conserve aucune machine fictive.

### 3. Publication des fichiers web

Publier seulement les fichiers réellement modifiés ou nouveaux de la v303. Le service worker récupère ce petit delta ; aucun média lourd n’est inclus.

## Test fonctionnel

1. Se connecter avec `elevelabo3@exemple.tn` depuis un nouveau navigateur connecté à Internet.
2. Vérifier l’ouverture du compte et l’ajout automatique du poste.
3. Dans l’administration, ouvrir **« Postes Labo 3 »** en bas à gauche.
4. Renommer le poste et lui envoyer un message.
5. Vérifier que le message apparaît uniquement sur ce poste et que l’état passe à lu.
6. Cliquer sur **Bloquer** : le poste doit perdre l’accès lors du prochain contrôle, au plus tard sous 45 secondes, et toute requête `profiles`/`acces` est refusée immédiatement par RLS.
7. Cliquer sur **Autoriser**, puis reconnecter le poste.
8. Couper Internet : un écran de verrouillage doit remplacer immédiatement le contenu.

## Limite de sécurité assumée

L’autorisation automatique d’une nouvelle machine signifie qu’une personne connaissant le mot de passe obtient initialement l’accès et apparaît dans la liste. Le mode **validation manuelle avant ouverture** reste plus sûr et pourra être activé ultérieurement en remplaçant le statut initial `allowed` par `pending`.
