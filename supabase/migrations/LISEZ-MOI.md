# Migrations Supabase — mode d'emploi et état réel

Ce dossier est le **journal de référence** du schéma. Le projet Supabase maintient de
son côté un registre (`supabase_migrations.schema_migrations`) qui note chaque
migration appliquée par l'outillage officiel.

**Les deux ne coïncident pas entièrement**, et c'est volontaire d'être documenté ici
plutôt que redécouvert à chaque intervention.

---

## 1. Les quatre migrations appliquées « à la main » (18 et 19 octobre 2026)

| Fichier | Contenu | Au registre ? |
|---|---|---|
| `20261018_mobile_security.sql` | politiques RLS mobile, `app_config_public`, `badges_labo`, `push_subscriptions` | ❌ non |
| `20261018_labo_device_control.sql` | contrôle des postes Labo 3 (tables + RPC + politiques) | ❌ non |
| `20261018_labo_device_admin_v306.sql` | suppression AAL2 d'un message ciblé | ❌ non |
| `20261019_labo_device_confirmation_v312.sql` | confirmation d'appareil, mêmes objets consolidés | ❌ non |

**Pourquoi.** Ces scripts ont été collés dans l'éditeur SQL de Supabase lors de la mise
en place du contrôle des postes, avant que le registre ne soit utilisé.

**Ce que ça implique.** Leurs objets (tables `labo_devices`, `labo_device_sessions`,
`labo_device_messages`, fonctions `labo_*`, politiques `*_labo_device_gate`) **existent
bien dans la base** — c'est vérifié. Mais un `supabase db push` les considérera comme
non appliquées et les **rejouera**.

**Risque réel : nul.** Ces quatre fichiers sont écrits en `create table if not exists`,
`create or replace function`, `drop policy if exists` + `create policy`. Les rejouer
redonne exactement l'état actuel.

**À ne pas faire.** Ne pas tenter d'« inscrire » ces quatre fichiers au registre à la
main : une ligne de registre sans exécution réelle donnerait une fausse assurance. S'il
faut un jour les officialiser, il suffit de les rejouer via l'outillage — ils sont
idempotents.

---

## 2. Les migrations récentes et leur version au registre

| Fichier du dépôt | Version au registre | Remarque |
|---|---|---|
| `20261029_xp_jamais_en_recul_v520.sql` | `20261029063758` | cohérent |
| `20261030_admin_taille_base_v557.sql` | `20261030163139` | appliquée via l'outillage ; la version du registre est l'horodatage d'exécution, pas la date du nom de fichier |
| `20261031_admin_taille_stockage_v558.sql` | `20261030164012` | idem |
| `20261101_photos_bucket_v559.sql` | `20261030165557` (`photos_bucket_v559`) **et** `20261030165603` (`photos_rpc_v559`) | un seul fichier, deux entrées : les deux moitiés ont été exécutées séparément |

**Ce qu'il faut retenir.** Pour les migrations v557 à v559, la correspondance entre le
nom de fichier et la version du registre n'est pas littérale. C'est sans conséquence :
ce qui compte est que l'objet existe en base, et il existe.

---

## 3. Vérifier l'état réel plutôt que de le supposer

```sql
-- Fonctions de mesure : doivent toutes répondre.
select public.admin_taille_base();       -- taille de la base (octets)
select public.admin_taille_stockage();   -- taille du Storage (octets)

-- Bucket photo : doit exister, privé, avec 4 politiques.
select id, public, file_size_limit from storage.buckets where id = 'photos-profils';
select policyname from pg_policies
 where schemaname = 'storage' and policyname like 'photos_profils%'
 order by policyname;
```

Le test automatisé `tests/photos-bucket-v559.test.mjs` vérifie, côté dépôt, que les
fichiers décrivent bien ces objets. Il ne peut pas interroger la base : la vérification
finale reste celle des requêtes ci-dessus.

---

## 4. Ordre d'application pour une base neuve

Appliquer les fichiers dans l'ordre de leur nom, **sans exception** :

1. `20261018_*` puis `20261019_*` (sécurité mobile et postes)
2. `20261025_*` à `20261029_*` (quiz, XP, médias)
3. `20261030_admin_taille_base_v557.sql`
4. `20261031_admin_taille_stockage_v558.sql`
5. `20261101_photos_bucket_v559.sql`

Les objets `auth.*`, `storage.*` et la fonction `public.est_admin()` sont fournis par
Supabase ou par les migrations antérieures à ce dossier : sur une base neuve, créer
`est_admin()` avant tout le reste.
