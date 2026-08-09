# 🐾 PupTrack

**Une app mobile pour suivre l'éducation, la santé, la croissance et le quotidien de votre chiot.**

## 📖 À propos

PupTrack accompagne les nouveaux propriétaires de chiot dans les mois cruciaux qui suivent l'adoption. L'app centralise le suivi de l'éducation, de la santé, de la croissance et du quotidien de l'animal, avec des repères adaptés à son âge et à sa race — et un coach IA pour ne jamais rester bloqué.

## ✨ Fonctionnalités principales

### 🎓 Éducation & dressage
- **Arbre de progression des tours** : découpage par niveaux — Débutant (assis, couché), Intermédiaire (donne la patte, reste), Avancé (fais le mort, range ses jouets)
- **Suivi par niveaux de compétence** : chaque ordre progresse à travers des paliers — découverte, compréhension en contexte calme, généralisation avec distractions, fiabilité en extérieur
- **Journal de séances** : durée, méthode, taux de réussite, avec visualisation de la progression dans le temps
- **Analyse de récurrence** : graphique du taux de réussite d'un ordre selon le lieu (ex. 90 % à la maison, 30 % au parc) pour repérer où retravailler
- **Suggestions de commandes selon l'âge** : recommandations basées sur les étapes de développement du chiot
- **Tracker de socialisation** : checklist des stimuli à exposer pendant la période critique (3–16 semaines) — autres chiens, enfants, bruits, surfaces, véhicules...

### 🩺 Santé & croissance
- **Carnet de santé digital** : dates de vaccins et traitements antiparasitaires (puces/tiques/vers) avec notifications de rappel
- **Historique vétérinaire** : fiche d'urgence (numéro de puce, groupe sanguin, contacts véto/urgences 24/7) et stockage des ordonnances
- Courbe de poids avec fourchette attendue selon la race
- Suivi de la mue dentaire (dents de lait → dents adultes)
- Suivi de la taille au garrot, croisé avec les standards de race

### 🍽️ Alimentation
- **Calculateur de rations quotidiennes** (croquettes/BARF) selon le chien
- Historique des marques essayées et suivi des allergies ou intolérances

### 🏡 Quotidien & bien-être
- **Journal des promenades** : durée, distance et lieux fréquentés, avec tags (parc, forêt, ville)
- **Besoins & hygiène** : rappels pour le brossage, la coupe des griffes, le nettoyage des oreilles et le lavage des dents
- **Calculateur de dépense énergétique** : estimation des besoins d'exercice quotidiens selon l'âge, la race et le poids
- Journal alimentaire (quantité, type, transitions, réactions)
- Tracker de sommeil et d'énergie
- Suivi des accidents de propreté pour repérer des patterns

### 🌍 Communauté & sorties
- **Carte interactive intercommunautaire** :
    - Signalement de dangers en temps réel (chenilles processionnaires, puces/tiques signalées dans la zone, cyanobactéries, appâts empoisonnés)
    - Repérage des points d'eau, parcs canins fermés et poubelles à sacs à crottes
- **Mode "Rencontre" / Playdates** : indiquer si son chien est sociable et trouver des copains de balade à proximité

### 🎉 Fun & motivation
- **Système de badges & victoires** : succès débloqués ("10 km parcourus", "5 tours maîtrisés", "100 % à jour dans les vaccins"...)
- **Séries d'entraînement (streaks)** : compteur de jours d'entraînement consécutifs pour motiver les petites sessions quotidiennes
- **Défis mensuels** : défis thématiques proposés par l'app ("Mois du rappel", "Apprendre un tour complexe en 14 jours")
- Timeline photo automatique (une photo/semaine → time-lapse de croissance)

### 🤖 Coach IA
- **Assistant / coach canin IA (LLM)** : chat interactif entraîné sur l'éducation positive, pour répondre aux questions, proposer des méthodes alternatives quand le chien bloque sur un tour, ou donner des conseils personnalisés
- **Programme d'entraînement adaptatif** : l'IA génère un programme sur mesure qui s'ajuste automatiquement selon le rythme, l'âge, la race et le taux de réussite du chien
- **Ajustement automatique des rations** : l'IA recalcule la quantité de nourriture selon l'activité mesurée (balades), l'évolution de la courbe de poids et la météo

### 📄 Documents & partage
- **Export PDF "Fiche garde"** : document récapitulatif généré automatiquement à envoyer au dog-sitter avant un départ (habitudes, doses de nourriture, consignes, contacts d'urgence)
- Export/partage des progrès pour la famille ou le vétérinaire

## 🐕 Fiche profil du chien

Chaque chien dispose d'une fiche complète : nom, race, date de naissance, poids et taille actuels, avec comparaison automatique aux standards de croissance de sa race (par gabarit ou base de données par race).

**Profil détaillé** : numéro d'identification I-CAD, fiche de caractère, contacts utiles et documents (assurance, ordonnances...).

## 👫 Suivi à deux

Les données appartiennent à un **foyer**, pas à un utilisateur. Chaque maître a son
compte, rejoint le foyer avec un code d'invitation, et voit exactement les mêmes
données que l'autre — en temps réel.

## 🛠️ Stack technique

Application **web**, utilisable depuis le navigateur du téléphone comme de l'ordinateur.

- **Front** : [Vite](https://vite.dev/) + React + TypeScript, routage par `react-router`
- **Backend** : [Supabase](https://supabase.com/) — Postgres, Auth (e-mail + mot de passe), Realtime, Storage
- **Isolation des données** : Row Level Security par foyer (`household`) — personne d'autre ne voit le chien
- **Données serveur** : TanStack Query
- **Coach IA** : appel à un LLM (API Claude/OpenAI) pour le chat conseil et la génération de programmes adaptatifs
- **Cartographie communautaire** : couche carte (type Leaflet/Mapbox) + stockage des signalements géolocalisés côté Supabase
- **Déploiement** : build statique (`npm run build` → `dist/`), déployable sur Vercel, Netlify ou Cloudflare Pages

Le README initial proposait du SQLite offline-first. Le suivi à deux impose une
source de vérité côté serveur : c'est le rôle de Supabase.

### Navigation et traductions

L'interface est organisée en cinq onglets — Accueil, Santé, Éducation, Carte, IA Chat —
sous `DogLayout`, qui fournit l'en-tête et la barre d'onglets : les pages ne rendent plus
leur propre chrome. Les routes sont en anglais (`/dog/:dogId/health/growth`,
`/dog/:dogId/training`, `/dog/:dogId/profile`), les anciennes URLs françaises redirigent.
Santé est une grille de cartes vers des sous-pages, pour absorber les fonctionnalités à
venir sans devenir un scroll infini. Croissance — poids et taille au garrot réunis derrière
une bascule — et Carnet de santé — vaccins, vermifuges, antiparasitaires et visites, avec
leurs rappels — sont développées ; les autres cartes sont désactivées. `DogLayout` affiche
un bouton retour dès qu'on quitte la racine d'un onglet, en remontant d'un niveau de route
plutôt qu'en rejouant l'historique.

Tous les textes visibles passent par des clés de traduction : les valeurs françaises sont
dans `src/locales/fr.json`, servies par react-i18next et typées depuis le JSON, donc une
clé inexistante casse le `typecheck`. Ajouter une langue revient à déposer un fichier à
côté et à l'enregistrer dans `src/lib/i18n.ts`.

## 🚀 Démarrage

```bash
npm install
cp .env.example .env      # puis renseigne l'URL et la clé anon Supabase
npm run dev
```

Base de données (nécessite le [CLI Supabase](https://supabase.com/docs/guides/cli)) :

```bash
npx supabase link --project-ref <ref-du-projet>
npm run db:push           # applique supabase/migrations/
npm run db:types          # génère src/types/database.ts
```

Sur le projet distant, Authentication → URL Configuration : `Site URL` sur l'URL du
site et `Redirect URLs` avec le motif `<url-du-site>/**`, sinon le lien de
réinitialisation du mot de passe ne revient pas sur la bonne page.

Authentication → Sign In / Providers → Email :
désactive `Confirm email` pour que l'inscription ouvre la session tout de suite,
et impose un mot de passe d'au moins 8 caractères avec lettres et chiffres.
Les mots de passe sont hachés en bcrypt par Supabase dans `auth.users`.

### En local, sans projet distant

`npx supabase start` lance Postgres, l'API et une boîte mail de test dans Docker,
puis affiche l'`API URL` et l'`anon key` à mettre dans `.env`.

```bash
npx supabase start        # applique les migrations
npx supabase db reset     # rejoue tout à zéro
npx supabase stop         # arrête les conteneurs
```

Les e-mails éventuels ne partent pas : ils s'ouvrent sur http://127.0.0.1:54324.

### Données de croissance

Les courbes de référence viennent des [Puppy Growth Charts du WALTHAM Petcare Science
Institute](https://www.waltham.com/resources/puppy-growth-charts), construites sur les
dossiers de plus de six millions de jeunes chiens
([Salt et al., PLOS One 2017](https://doi.org/10.1371/journal.pone.0182064)).
Elles sont indexées par catégorie de poids adulte et par sexe, de 12 semaines à 1–2 ans
selon le gabarit.

Ce jeu de données appartient à WALTHAM : il n'est pas versionné ici. Le schéma est créé
par les migrations, les valeurs sont chargées séparément :

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node scripts/import-growth-data.mjs breeds.json waltham_curves.json
```

### Catalogue de tours

Les 121 tours du catalogue viennent des checklists officielles du programme
[AKC Trick Dog](https://www.akc.org/sports/trick-dog/), réparties en quatre niveaux
(Débutant, Intermédiaire, Avancé, Expert). Le nom anglais d'origine est conservé dans
`skills.source_name`. Les traductions françaises et les descriptions sont de PupTrack.

L'AKC ne publie pas d'âge minimum par tour : seules les 14 compétences de fondation,
rédigées par PupTrack, portent un repère d'âge.

Scripts : `dev`, `build`, `preview`, `lint`, `typecheck`, `db:push`, `db:types`.

## 🗺️ Roadmap

Les features arrivent une par une, chacune avec sa migration SQL.

- [x] Socle : projet, auth e-mail + mot de passe, foyer partagé + invitation, fiche chien (schéma)
- [x] Écrans foyer : créer / rejoindre avec un code, inviter l'autre maître
- [x] Fiche profil du chien (nom, race, sexe, naissance, adoption, âge)
- [x] Suivi du poids : pesées, courbe et historique
- [x] Courbes de référence WALTHAM par catégorie de poids adulte et sexe
- [x] Taille au garrot : mesures, courbe et historique
- [x] Module éducation : paliers, séances, favoris, listes ordonnées, listes toutes faites et courbe de progression par tour
- [ ] Arbre de progression des tours par niveaux (débutant/intermédiaire/avancé)
- [ ] Analyse de récurrence (taux de réussite par lieu)
- [ ] Tracker de socialisation
- [ ] Carnet de santé digital (vaccins, antiparasitaires, rappels)
- [ ] Historique vétérinaire & fiche d'urgence
- [ ] Calculateur de rations & suivi des allergies
- [ ] Journal des promenades (durée, distance, tags de lieu)
- [ ] Rappels d'hygiène (brossage, griffes, oreilles, dents)
- [ ] Carte communautaire (dangers, points d'eau, parcs)
- [ ] Mode Rencontre / Playdates
- [ ] Calculateur de dépense énergétique
- [ ] Export PDF "fiche garde"
- [ ] Badges, streaks et défis mensuels
- [ ] Assistant/coach canin IA (chat)
- [ ] Programme d'entraînement adaptatif (IA)
- [ ] Ajustement automatique des rations (IA)
- [ ] Journal quotidien (repas, sorties, sommeil)

---

*Projet personnel développé à l'occasion de l'adoption d'un chiot 🐶*
