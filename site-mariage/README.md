# Site mariage — 29 mai 2027

Site privé pour le mariage : infos du jour J, formulaire RSVP par foyer, et dashboard des mariés.
Stack : Next.js 15 (App Router) + Supabase (Postgres) + Tailwind v4, hébergé sur Vercel.

## Fonctionnement

- **Invités** : le site s'ouvre avec le code imprimé sur le faire-part (ex. `K7M2QX`) ou via le lien perso `/r/K7M2QX`. Pas de compte.
- **RSVP** (`/rsvp`) : une personne par carte (prénom, nom, adresse, présence, enfant, allergies), bouton « Ajouter une personne » jusqu'au nombre de places du foyer. Modifiable avec le même code jusqu'à la date limite, puis lecture seule. Récap affiché après envoi.
- **Mariés** (`/admin`) : mot de passe distinct. Compteurs, tableau filtrable (recherche, présence, enfant), liste traiteur (allergies), foyers à relancer avec lien perso à copier, gestion des foyers (ajout / suppression, code auto ou choisi), export Excel.

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
- Photo du couple : déposer `public/photo-couple.jpg` et mettre à jour `storyPhoto`
- Couleurs / polices : `app/globals.css` (bloc `@theme`)

## Créer les invitations

Dans `/admin` → onglet **Foyers** : nom du foyer + nombre de places. Le code est généré (lettres/chiffres sans ambiguïté) ; le lien perso `/r/CODE` est à copier dans le faire-part ou un message.
