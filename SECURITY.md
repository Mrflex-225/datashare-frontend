# SECURITY.md — Audit de sécurité DataShare

## 1. Objectif

Ce document présente les vérifications de sécurité réalisées sur DataShare, application de partage de fichiers développée avec Angular, Spring Boot, PostgreSQL et AWS S3.

L'audit a pour objectif d'identifier les vulnérabilités connues des dépendances, de vérifier les mécanismes d'authentification et d'autorisation et de documenter les risques identifiés ainsi que les actions correctives.

## 2. Environnement d'audit

| Élément | Information |
|---|---|
| Date de l'audit | [À compléter] |
| Version ou commit audité | [À compléter] |
| Frontend | Angular / TypeScript |
| Backend | Spring Boot / Java |
| Base de données | PostgreSQL |
| Stockage | AWS S3 |
| Outils | npm audit, OWASP Dependency-Check, Postman |

## 3. Analyse des dépendances

### Frontend — npm audit

Commande exécutée :

`npm audit`

| Gravité | Nombre |
|---|---|
| Critical | [À renseigner] |
| High | [À renseigner] |
| Moderate | [À renseigner] |
| Low | [À renseigner] |

Résultats et analyse :

[Décrire les vulnérabilités identifiées, les dépendances concernées et les versions corrigées.]

### Backend — OWASP Dependency-Check

Commande exécutée :

`mvn org.owasp:dependency-check-maven:check`

Rapport généré : `target/dependency-check-report.html`

Résultats :

[Indiquer les dépendances signalées, leurs identifiants CVE et les actions prises.]

## 4. Vérification de l'authentification et des autorisations

| Identifiant | Scénario | Résultat attendu | Résultat réel | Statut |
|---|---|---|---|---|
| SEC-01 | Upload avec JWT valide | Accès autorisé | À compléter | Non testé |
| SEC-02 | Upload sans JWT | Accès refusé | À compléter | Non testé |
| SEC-03 | JWT invalide ou modifié | Accès refusé | À compléter | Non testé |
| SEC-04 | JWT expiré | Accès refusé | À compléter | Non testé |
| SEC-05 | Suppression du fichier d'un autre utilisateur | Accès refusé | À compléter | Non testé |
| SEC-06 | Téléchargement avec lien expiré | Accès refusé | À compléter | Non testé |
| SEC-07 | Téléchargement protégé sans mot de passe valide | Accès refusé | À compléter | Non testé |

## 5. Mesures de sécurité vérifiées

- Authentification par JWT et Spring Security : [Statut]
- Hachage des mots de passe avec BCrypt : [Statut]
- Contrôle des propriétaires de fichiers : [Statut]
- Validation des uploads : [Statut]
- Expiration des liens de partage : [Statut]
- Stockage S3 privé : [Statut]
- Configuration HTTPS : [Statut]
- Protection des secrets et identifiants AWS : [Statut]

## 6. Vulnérabilités identifiées et corrections

| Vulnérabilité | Gravité | Correction ou justification | Statut |
|---|---|---|---|
| [À renseigner] | [À renseigner] | [À renseigner] | [À renseigner] |

Les vulnérabilités non corrigées doivent être justifiées selon leur impact réel, leur exploitabilité et les éventuelles mesures compensatoires.

## 7. Conclusion

[Résumer les résultats réels de l'audit, le nombre de vulnérabilités corrigées, les risques résiduels et les améliorations prévues.]

Un résultat sans vulnérabilité détectée par les outils ne constitue pas une garantie d'absence totale de faille de sécurité.