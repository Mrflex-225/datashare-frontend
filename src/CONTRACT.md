# Contrat d’interface — DataShare API

## 1. Authentification & Sécurité

### POST `/api/auth/login`

Permet à un utilisateur de s'authentifier afin d'obtenir un jeton JWT.

**Sécurité :** Publique — aucun token requis.

### Requête

**Content-Type :** `application/json`

```json
{
  "email": "string (obligatoire, format email)",
  "password": "string (obligatoire, min 8 caractères)"
}
```

### Réponses

#### `200 OK`

Authentification réussie.

```json
{
  "token": "string (JWT)",
  "type": "Bearer",
  "expiresIn": 86400
}
```

#### `400 Bad Request`

Paramètres manquants ou invalides.

#### `401 Unauthorized`

Identifiants incorrects.

---

### POST `/api/auth/register`

Permet à un utilisateur de créer un compte.

**Sécurité :** Publique.

### Requête

**Content-Type :** `application/json`

```json
{
  "email": "string (obligatoire, format email)",
  "password": "string (obligatoire, min 8 caractères)"
}
```

### Réponses

#### `201 Created`

Compte créé avec succès.

```json
{
  "id": 1,
  "email": "user@example.com",
  "createdAt": "2026-10-07T21:32:00Z"
}
```

#### `400 Bad Request`

Données invalides.

#### `409 Conflict`

Cet email est déjà utilisé.

---

## 2. Gestion des fichiers — Espace protégé

### POST `/api/files`

Permet à un utilisateur authentifié de téléverser un fichier vers le serveur.

Le serveur relaie ensuite le fichier vers AWS S3.

**Sécurité :** Privée.

**Header requis :**

```http
Authorization: Bearer <token>
```

### Requête

**Content-Type :** `multipart/form-data`

| Champ | Type | Obligatoire | Description |
|---|---|---:|---|
| `file` | fichier binaire | Oui | Fichier à téléverser |

### Réponses

#### `201 Created`

Fichier téléversé avec succès.

```json
{
  "id": 1,
  "originalName": "rapport.pdf",
  "fileSize": 1048576,
  "downloadToken": "a1b2c3d4-e5f6...",
  "expiresAt": "2026-10-14T23:59:59Z"
}
```

#### `400 Bad Request`

Fichier manquant ou format non autorisé.

#### `401 Unauthorized`

Token JWT manquant, invalide ou expiré.

---

### GET `/api/files`

Récupère la liste des fichiers téléversés par l'utilisateur connecté.

**Sécurité :** Privée.

**Header requis :**

```http
Authorization: Bearer <token>
```

### Requête

Aucun corps de requête.

Des paramètres de pagination peuvent être ajoutés ultérieurement.

### Réponses

#### `200 OK`

Retourne la liste des métadonnées des fichiers.

```json
[
  {
    "id": 1,
    "originalName": "rapport.pdf",
    "fileSize": 1048576,
    "downloadToken": "a1b2c3d4-e5f6...",
    "expiresAt": "2026-10-14T23:59:59Z"
  }
]
```

#### `401 Unauthorized`

Utilisateur non authentifié.

---

### DELETE `/api/files/{id}`

Supprime un fichier appartenant à l'utilisateur connecté.

La suppression concerne :

- les métadonnées en base de données ;
- le fichier stocké sur AWS S3.

**Sécurité :** Privée.

**Header requis :**

```http
Authorization: Bearer <token>
```

### Paramètre de chemin

| Paramètre | Type | Obligatoire | Description |
|---|---|---:|---|
| `id` | `Long` | Oui | Identifiant du fichier |

### Réponses

#### `204 No Content`

Suppression réussie.

Aucun corps de réponse.

#### `401 Unauthorized`

Utilisateur non authentifié.

#### `404 Not Found`

Fichier introuvable ou n'appartenant pas à l'utilisateur.

---

## 3. Téléchargement public

### GET `/api/download/{token}/info`

Permet de récupérer les informations d'un fichier avant de lancer son téléchargement.

**Sécurité :** Publique.

L'accès repose uniquement sur le token unique associé au fichier.

### Paramètre de chemin

| Paramètre | Type | Obligatoire | Description |
|---|---|---:|---|
| `token` | `String / UUID` | Oui | Token unique de téléchargement |

### Réponses

#### `200 OK`

Informations du fichier.

```json
{
  "originalName": "rapport.pdf",
  "fileSize": 1048576,
  "expiresAt": "2026-10-14T23:59:59Z"
}
```

#### `404 Not Found`

Lien invalide ou expiré.

---

### POST `/api/download/{token}`

Génère une URL présignée AWS S3 permettant de télécharger directement le fichier.

**Sécurité :** Publique.

### Paramètre de chemin

| Paramètre | Type | Obligatoire | Description |
|---|---|---:|---|
| `token` | `String / UUID` | Oui | Token unique de téléchargement |

### Réponses

#### `200 OK`

Retourne l'URL permettant le téléchargement direct du fichier.

```json
{
  "downloadUrl": "https://datashare-bucket.s3.amazonaws.com/..."
}
```

#### `404 Not Found`

Lien invalide ou expiré.

---

## 4. Format standard des erreurs

En cas d'erreur, l'API retourne systématiquement une structure JSON normalisée.

Exemples de codes concernés :

- `400 Bad Request`
- `401 Unauthorized`
- `404 Not Found`
- `409 Conflict`
- `500 Internal Server Error`

### Format

```json
{
  "timestamp": "2026-10-07T21:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Description détaillée de l'erreur",
  "path": "/api/files"
}
```