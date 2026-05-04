# Système de Demande d'Absence RH

Une application web pour gérer les demandes d'absence des employés avec un panneau d'administration.

## Fonctionnalités

- Soumission de demandes d'absence par les employés
- Panneau d'administration pour gérer les demandes
- Notifications par email automatiques
- Historique des demandes pour les employés
- Numérotation séquentielle des demandes
- Téléchargement de pièces jointes

## Technologies utilisées

- **Frontend:** Next.js 14 avec React et TypeScript
- **Backend:** API Routes de Next.js
- **Base de données:** MongoDB avec Mongoose
- **Email:** Nodemailer
- **Styling:** Tailwind CSS

## Installation

1. Clonez le repository
2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Configurez les variables d'environnement dans `.env.local`:
   - `MONGODB_URI`: URI de connexion MongoDB
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Configuration email

4. Démarrez MongoDB localement ou utilisez MongoDB Atlas

5. Lancez l'application:
   ```bash
   npm run dev
   ```

## Utilisation

- **Page principale:** Formulaire de demande d'absence
- **/admin:** Panneau d'administration (pas de authentification implémentée)
- **/historique:** Historique des demandes par email

## Structure du projet

```
├── app/
│   ├── api/absences/          # API pour les demandes
│   ├── admin/                 # Page admin
│   ├── historique/            # Page historique
│   └── page.tsx               # Page principale
├── components/                # Composants React
├── lib/                       # Utilitaires (DB, email)
├── models/                    # Modèles Mongoose
├── public/                    # Assets statiques
└── ...
```

## Améliorations possibles

- Authentification pour l'admin
- Pagination pour les listes
- Recherche et filtres avancés
- Notifications push
- Export PDF des demandes
- Interface mobile responsive améliorée