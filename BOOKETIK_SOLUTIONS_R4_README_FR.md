# BOOKETIK Solutions R4 — GitHub Actions (frontend build hors Hostinger)

## Objectif
Publier la landing « Solutions » en FR/NL/EN, remplacer l'entrée « Plus » du **menu principal Civic** par « Solutions », sans supprimer la route `/plus`, les abonnements, les prix natifs ni le checkout.

## Choix de sécurité
- `booketik_solutions.public_enabled` reste **false** (ancienne intégration commerciale et prévisualisations privées préservées).
- `presentation_public_enabled` est un verrou indépendant **true**, exploité uniquement par la projection éditoriale publiée.
- `pricing_public_enabled`, `commercial_checkout_enabled`, `quote_intake_enabled`, `miguil_pay_enabled` restent **false**.
- `offers` reste `[]`; les CTA de la landing publique restent affichés mais inactifs, sans paiement ni collecte de demande.
- Aucune migration SQL. Aucun accès à l'API de paiement. Aucun changement de la route `/plus`.
- Les liens Plus à d'autres endroits (compte/upgrade) ne sont pas supprimés ; seul le menu principal est modifié.

## Quel ZIP copier dans GitHub ?
- **PATCH_ONLY** : recommandé quand le dépôt privé GitHub contient déjà le frontend complet à jour. Superposer les fichiers dans une branche créée depuis `main`. Ne pas écraser aveuglément du code divergent.
- **FULL_SOURCE** : pour reconstruire un dépôt de *build* depuis l'export Hostinger actuel ; contient les fichiers non binaires nécessaires et un workflow, pas le projet Laravel complet. Les polices TTF et le manifeste généré en production sont exclus. Ne pas déployer ce ZIP directement en production.

## GitHub Desktop
1. Sélectionner `Miguilit/Booketik-webUI` et créer `feature/solutions-r4-public` depuis la branche qui reflète l'application actuelle.
2. Décompresser le ZIP choisi dans le dossier local du dépôt (fichiers à la racine).
3. Examiner les modifications : `routes/web.php`, `config/booketik_solutions.php`, `app/Services/Solutions/BooketikSolutionsCms.php`, `resources/js/Themes/civic/Layout.jsx`, composant Solutions, dictionnaires FR/NL/EN, nouveau contrôleur et nouvelle page React, `.github/workflows/` et `scripts/booketik_solutions_r4/`.
4. Commit, puis Publish branch. **Ne pas fusionner automatiquement dans `main`** avant revue.
5. GitHub > Actions > **BOOKETIK Solutions R4 - Build release ZIP** > Run workflow > choisir la branche `feature/solutions-r4-public`.
6. Télécharger l'artefact `BOOKETIK_SOLUTIONS_R4_HOSTINGER_RELEASE`. À l'intérieur se trouve le ZIP de déploiement `BOOKETIK_SOLUTIONS_R4_HOSTINGER_RELEASE.zip`.

Le workflow exécute les contrôles de source, un lint PHP 8.4, `npm ci`, `npm run build` (Vite client + SSR) et fabrique le ZIP de release avec ses SHA256. **Il ne déploie rien automatiquement**.

## Déploiement Hostinger — APRÈS le PASS GitHub Actions
Téléverser uniquement `BOOKETIK_SOLUTIONS_R4_HOSTINGER_RELEASE.zip` sous `~/domains/booketik.com/` (hors webroot), puis lancer :

```bash
cd ~/domains/booketik.com/eventgoo || exit 1
ZIP="$(find "$HOME/domains/booketik.com" -maxdepth 3 -type f -name 'BOOKETIK_SOLUTIONS_R4_HOSTINGER_RELEASE.zip' -print -quit)"
[ -n "$ZIP" ] || { echo 'ZIP_ABSENT'; exit 1; }
mkdir -p "$HOME/domains/booketik.com/_private"
STAGE="$(mktemp -d "$HOME/domains/booketik.com/_private/solutions_r4_XXXXXX")" || exit 1
unzip -q "$ZIP" -d "$STAGE" || exit 1
python3 "$STAGE/deploy.py" "$PWD"
```

Le script refuse toute dérive des SHA sources par rapport à l'export Hostinger, sauvegarde dans `_private`, valide les routes et la projection publiée, puis réalise les tests HTTP `fr`, `nl`, `en`. En cas d'échec, il restaure les sources, la configuration, le manifest et les fichiers SSR. Les nouveaux fichiers d'assets hashés ne sont pas effacés (inertes si le manifest précédent est restauré).

## Conditions de succès
`RELEASE_SHA_GUARDS=PASS`, `SOURCE_BASELINE_GUARDS=PASS`, `PHP_LINT=PASS`, `PUBLIC_ROUTE_AND_PLUS=PASS`, `PUBLISHED_PROJECTION=PASS`, `PUBLIC_HTTP_fr/nl/en=200+INERTIA_OK`, `RELEASE=PASS`.

## Note SSR
Le nouveau bundle SSR est fourni par GitHub Actions. Le script ne redémarre pas un éventuel worker SSR persistant. Si un worker SSR est actif, redémarrer ce worker **après** la réussite et via le mécanisme habituel de supervision, sans improviser de commande de kill.

## Portée
Ce lot publie **une vitrine de développement** ; ni formules payantes ni barèmes réels ne sont activés. Le catalogue de prix et le système de prestation restent un chantier ultérieur distinct.
