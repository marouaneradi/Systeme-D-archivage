# 📁 Système PV — Archivage Institutionnel

Plateforme de digitalisation et gestion des procès-verbaux académiques (PV-FF, PV-CC, PV-EFM).

---

## 🏗️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Laravel 12 + Sanctum |
| Base de données | MySQL |
| Auth | Token-based (Sanctum) |

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **PHP** >= 8.2
- **Composer** >= 2.x
- **Node.js** >= 18.x + **npm**
- **MySQL** >= 8.x
- **Git**

---

## 🚀 Installation — Backend (Laravel)

### 1. Cloner le projet

```bash
git clone https://github.com/marouaneradi/Systeme-D-archivage.git
cd Systeme-D-archivage/Backend
```

### 2. Installer les dépendances PHP

```bash
composer install
```

### 3. Configurer l'environnement

```bash
cp .env.example .env
php artisan key:generate
```

### 4. Configurer la base de données

Ouvrez `.env` et modifiez les lignes suivantes :

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=systeme_pv
DB_USERNAME=root
DB_PASSWORD=
```

> Créez la base de données `systeme_pv` dans MySQL avant de continuer.

### 5. Exécuter les migrations

```bash
php artisan migrate
```

### 6. (Optionnel) Insérer des données de test

```bash
php artisan db:seed
```

### 7. Créer le lien de stockage

```bash
php artisan storage:link
```

### 8. Démarrer le serveur Laravel

```bash
php artisan serve
```

> API disponible sur : `http://localhost:8000`

---

## 🎨 Installation — Frontend (React)

### 1. Aller dans le dossier Frontend

```bash
cd ../Frontend
```

### 2. Installer les dépendances Node

```bash
npm install
```

### 3. Configurer l'URL de l'API

Dans `src/services/api.js`, vérifiez que `baseURL` pointe vers votre backend :

```js
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});
```

### 4. Démarrer le serveur de développement

```bash
npm run dev
```

> Application disponible sur : `http://localhost:5173`

---

## 👤 Créer le premier compte admin

Après les migrations, créez un utilisateur admin via Tinker :

```bash
cd Backend
php artisan tinker
```

Puis dans Tinker :

```php
// Admin user
\App\Models\User::create([
    'name'      => 'Super Admin',
    'email'     => 'admin@ofppt.ma',
    'password'  => bcrypt('admin1234'),
    'role'      => 'admin',
    'is_active' => true,
]);

// Example users
\App\Models\User::create([
    'name'      => 'Archiviste OFPPT',
    'email'     => 'archiviste@ofppt.ma',
    'password'  => bcrypt('password123'),
    'role'      => 'archiviste',
    'is_active' => true,
]);

\App\Models\User::create([
    'name'      => 'Gestionnaire OFPPT',
    'email'     => 'gestionnaire@ofppt.ma',
    'password'  => bcrypt('password123'),
    'role'      => 'gestionnaire',
    'is_active' => true,
]);

\App\Models\User::create([
    'name'      => 'Consultant OFPPT',
    'email'     => 'consultant@ofppt.ma',
    'password'  => bcrypt('password123'),
    'role'      => 'consultant',
    'is_active' => true,
]);
```

---

## 👥 Rôles utilisateurs

| Rôle | Accès |
|---|---|
| `admin` | Accès complet — gestion utilisateurs, suppression, paramètres |
| `gestionnaire` | Créer, modifier, valider les PV + journal d'activité |
| `archiviste` | Créer PV + uploader des fichiers |
| `consultant` | Lecture seule — consulter et rechercher |

---

## 📄 Types de PV gérés

| Type | Description |
|---|---|
| `PV_FF` | PV Fin de Formation — document global d'une promotion |
| `PV_CC` | PV Contrôles Continus — lié à un PV-FF parent |
| `PV_EFM` | PV Examen Fin de Module — lié à un PV-FF parent |

---

## 🔄 Cycle de vie d'un document

```
BROUILLON → EN_ATTENTE → VALIDE_PAPIER → ARCHIVE_NUMERIQUE → ARCHIVE_COMPLET
```

---

## 🗂️ Structure du projet

```
Systeme-D-archivage/
├── Backend/                        # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── PvDocumentController.php
│   │   │   │   ├── PvFileController.php
│   │   │   │   ├── ActivityLogController.php
│   │   │   │   └── UserController.php
│   │   │   └── Middleware/
│   │   │       └── RoleMiddleware.php
│   │   └── Models/
│   │       ├── User.php
│   │       ├── PvDocument.php
│   │       ├── PvFile.php
│   │       └── ActivityLog.php
│   ├── routes/
│   │   └── api.php
│   └── bootstrap/
│       └── app.php
│
└── Frontend/                       # React SPA
    └── src/
        ├── App.jsx
        ├── services/
        │   └── api.js
        └── components/
            ├── Login.jsx
            ├── Navigation.jsx
            ├── Dashboard.jsx
            ├── DocumentsList.jsx
            ├── AddPV.jsx
            ├── PvDetail.jsx
            ├── AdvancedSearch.jsx
            ├── ActivityLog.jsx
            ├── UserManagement.jsx
            └── Settings.jsx
```

---

## 🔌 Principales routes API

| Méthode | Route | Rôle requis |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authentifié |
| GET | `/api/auth/me` | Authentifié |
| GET | `/api/pv-documents` | Tous |
| POST | `/api/pv-documents` | admin, gestionnaire, archiviste |
| PATCH | `/api/pv-documents/{id}/status` | admin, gestionnaire, archiviste |
| DELETE | `/api/pv-documents/{id}` | admin |
| POST | `/api/pv-documents/{id}/files` | admin, gestionnaire, archiviste |
| GET | `/api/pv-files/{id}/download` | Tous |
| GET | `/api/activity-logs` | admin, gestionnaire |
| GET | `/api/activity-logs/stats` | Tous |
| GET | `/api/dashboard/stats` | Tous |
| GET/POST | `/api/users` | admin |
| PATCH | `/api/users/{id}/toggle-active` | admin |

---

## 📦 Fonctionnalités

- ✅ Authentification sécurisée (Sanctum + token) avec option "Se souvenir de moi"
- ✅ Gestion des rôles (4 rôles)
- ✅ CRUD complet des PV (FF, CC, EFM)
- ✅ Relations parent-enfant (PV-FF → CC/EFM)
- ✅ Upload de fichiers (PDF, JPG, PNG — max 10Mo)
- ✅ Téléchargement et suppression de fichiers
- ✅ Cycle de vie des documents (5 statuts)
- ✅ Recherche avancée avec filtres multiples
- ✅ Export PDF et Excel des résultats
- ✅ Journal d'activité complet
- ✅ Dashboard avec statistiques réelles
- ✅ Gestion des utilisateurs (admin)
- ✅ Envoi d'email automatique (SMTP) lors de la création de comptes
- ✅ Interface utilisateur repensée et dynamisée (Menu de navigation, Header)

---

## 🖥️ Options de l'Interface Web (Menu Principal)

L'application web propose les vues et options suivantes, accessibles via la barre de navigation selon le rôle de l'utilisateur :

- **📊 Tableau de Bord (Dashboard)** : Vue d'ensemble avec des statistiques clés en temps réel (nombre de PVs, répartition par statut, activité récente).
- **📁 Liste des Documents (Documents List)** : Affichage, filtrage et gestion de tous les PV (FF, CC, EFM). Permet de changer les statuts (Validation, Archivage, etc.).
- **➕ Ajouter un PV (Add PV)** : Formulaire de création d'un nouveau Procès-Verbal avec options pour renseigner les métadonnées et uploader les pièces jointes associées.
- **👁️ Détails du PV (PV Detail)** : Page détaillée d'un document, listant les fichiers joints, le statut actuel, et l'arborescence des PVs enfants (pour les PV-FF).
- **🔍 Recherche Avancée (Advanced Search)** : Interface multicritères puissante pour retrouver des documents précis, avec la possibilité d'exporter les résultats en PDF et Excel.
- **⏱️ Journal d'Activité (Activity Log)** : Historique traçable de toutes les actions effectuées sur la plateforme (qui a modifié quoi et quand).
- **👥 Gestion des Utilisateurs (User Management)** : Espace d'administration exclusif pour ajouter, désactiver ou modifier les rôles et informations des comptes utilisateurs.
- **⚙️ Paramètres (Settings)** : Configuration des préférences du système et gestion du profil.

---

## 📧 Configuration de l'envoi d'emails (SMTP)

L'application envoie automatiquement un email contenant les accès lorsqu'un administrateur crée un nouvel utilisateur. Pour que cela fonctionne en local ou en production, mettez à jour votre fichier `Backend/.env` :

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME="votre_adresse@gmail.com"
MAIL_PASSWORD="votre_mot_de_passe_application_google"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="votre_adresse@gmail.com"
MAIL_FROM_NAME="Système D'archivage"
```

> **Important (Gmail) :** Vous ne pouvez pas utiliser votre mot de passe Gmail normal. Vous devez activer la validation en deux étapes sur votre compte Google, puis créer un "Mot de passe d'application" (16 caractères) et le coller dans `MAIL_PASSWORD`.

---

## ⚙️ Commandes utiles

```bash
# Backend
php artisan serve              # Démarrer le serveur
php artisan migrate:fresh --seed  # Réinitialiser la DB
php artisan tinker             # Console interactive

# Frontend
npm run dev                    # Démarrer en développement
npm run build                  # Build production
```

---

## 📝 Notes

- Les fichiers uploadés sont stockés dans `Backend/storage/app/private/pv_files/`
- Le token d'authentification est stocké dans le `localStorage` du navigateur
- En cas de token expiré, l'application redirige automatiquement vers la page de connexion