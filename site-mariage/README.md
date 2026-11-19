# Site mariage — 29 mai 2027

Site privé pour le mariage : infos du jour J, formulaire RSVP par foyer, et dashboard des mariés.
Stack : Next.js 15 (App Router) + Supabase (Postgres) + Tailwind v4, hébergé sur Vercel.

## Fonctionnement

- **Invités** : le site est ouvert, il suffit de partager l'adresse aux personnes invitées. Pas de code, pas de compte.
- **Formulaire** (`/rsvp`) : prénom, nom, email, téléphone, adresse postale, présence, allergies / régime, accompagnants (adultes ou enfants, chacun avec ses allergies) et un petit mot. Après la date limite, le formulaire se ferme.
- **Mariés** (`/admin`) : mot de passe. Compteurs (présents, absents, enfants, allergies), liste des allergies pour le traiteur, toutes les réponses avec recherche et filtre présence, détail de chaque réponse, suppression, export Excel.

Toute la lecture/écriture passe par le serveur avec la clé `service_role` ; RLS est activée sans policy, donc rien n'est accessible depuis le navigateur.

## Mise en place

1. **Supabase** : créer un projet, ouvrir *SQL Editor* et exécuter `supabase/schema.sql`.
2. **Variables d'environnement** : copier `.env.example` en `.env.local` et remplir :
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Project settings → API)
   - `ADMIN_PASSWORD` : mot de passe du dashboard (voir `.env.example`)
   - `SESSION_SECRET` : une chaîne aléatoire (`openssl rand -hex 32`)
   - `RSVP_DEADLINE` : date limite de réponse (ISO)
3. `npm install` puis `npm run dev` → http://localhost:3000
4. **Vercel** : importer le dépôt, ajouter les mêmes variables dans *Settings → Environment Variables*, déployer.

## Personnaliser

- Textes, programme, infos pratiques, liste de mariage : `content/site.ts`
- Couleurs / polices : `app/globals.css` (bloc `@theme`)
