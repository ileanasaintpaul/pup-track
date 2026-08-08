# 🐾 PupTrack

**Une app mobile pour suivre l'éducation, la croissance et le bien-être de votre chiot.**

## 📖 À propos

PupTrack accompagne les nouveaux propriétaires de chiot dans les mois cruciaux qui suivent l'adoption. L'app centralise le suivi de l'éducation, de la santé et de la croissance de l'animal, avec des repères adaptés à son âge et à sa race.

## ✨ Fonctionnalités principales

### 🎓 Éducation & dressage
- **Suivi par niveaux de compétence** : chaque ordre (assis, rappel, propreté...) progresse à travers des paliers — découverte, compréhension en contexte calme, généralisation avec distractions, fiabilité en extérieur
- **Journal de séances** : durée, méthode, taux de réussite, avec visualisation de la progression dans le temps
- **Suggestions de commandes selon l'âge** : recommandations basées sur les étapes de développement du chiot
- **Tracker de socialisation** : checklist des stimuli à exposer pendant la période critique (3–16 semaines) — autres chiens, enfants, bruits, surfaces, véhicules...

### 🩺 Santé & croissance
- Courbe de poids avec fourchette attendue selon la race
- Carnet de vaccination et de vermifuge avec rappels
- Suivi de la mue dentaire (dents de lait → dents adultes)
- Suivi de la taille au garrot, croisé avec les standards de race

### 🏡 Quotidien & bien-être
- Journal alimentaire (quantité, type, transitions, réactions)
- Tracker de sommeil et d'énergie
- Suivi des sorties et de l'exercice, avec recommandations selon l'âge
- Suivi des accidents de propreté pour repérer des patterns

### 🎉 Fun & motivation
- Timeline photo automatique (une photo/semaine → time-lapse de croissance)
- Badges et succès débloqués ("premier assis", "premier rappel en extérieur"...)
- Export/partage des progrès (PDF ou lien) pour la famille ou le vétérinaire

## 🐕 Fiche profil du chien

Chaque chien dispose d'une fiche complète : nom, race, date de naissance, poids et taille actuels, avec comparaison automatique aux standards de croissance de sa race (par gabarit ou base de données par race).

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
- **Déploiement** : build statique (`npm run build` → `dist/`), déployable sur Vercel, Netlify ou Cloudflare Pages

Le README initial proposait du SQLite offline-first. Le suivi à deux impose une
source de vérité côté serveur : c'est le rôle de Supabase.

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

Scripts : `dev`, `build`, `preview`, `lint`, `typecheck`, `db:push`, `db:types`.

## 🗺️ Roadmap

Les features arrivent une par une, chacune avec sa migration SQL.

- [x] Socle : projet, auth e-mail + mot de passe, foyer partagé + invitation, fiche chien (schéma)
- [x] Écrans foyer : créer / rejoindre avec un code, inviter l'autre maître
- [x] Fiche profil du chien (nom, race, sexe, naissance, adoption, âge)
- [x] Suivi du poids : pesées, courbe et historique
- [x] Fourchette de poids attendue selon la race ou le gabarit
- [ ] Taille au garrot
- [ ] Module éducation avec paliers de compétence
- [ ] Tracker de socialisation
- [ ] Journal quotidien (repas, sorties, sommeil)
- [ ] Badges et gamification
- [ ] Export/partage

---

*Projet personnel développé à l'occasion de l'adoption d'un corgi 🐶*
