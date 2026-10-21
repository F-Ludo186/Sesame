# Sesame · le comptoir

Application web de caisse pour un comptoir de café, développée en HTML, CSS et JavaScript natif.

Le projet permet de gérer les commandes des clients, de consulter les produits disponibles, d'appliquer des codes promotionnels et de conserver un historique des commandes.

## Fonctionnalités

- **Gestion du menu** : affichage des produits par catégorie (cafés, thés et autres, pâtisseries).
- **Gestion du ticket** : ajout de produits, modification des quantités et calcul automatique du montant de la commande.
- **Gestion des promotions** : application de codes promotionnels et calcul des remises.
- **Gestion des clients** : saisie du nom du client et consultation des informations relatives à ses dernières commandes.
- **Encaissement** : affichage d'un récapitulatif de la commande avec la possibilité de l'imprimer.
- **Historique des commandes** : consultation des commandes enregistrées.
- **Administration** : accès aux pages de gestion de l'historique et des promotions.

## Technologies utilisées

- HTML5 : structure des pages.
- CSS3 : mise en forme et présentation de l'interface.
- JavaScript natif (Vanilla JavaScript) : gestion des interactions et de la logique métier.
- LocalStorage : stockage local des données, notamment l'historique des commandes, selon l'implémentation actuelle.
- Google Fonts : polices Fraunces, Instrument Sans et JetBrains Mono.

Aucun framework JavaScript n'est nécessaire pour exécuter l'application.

## Structure du projet

```text
.
├── index.html          # Page principale : caisse
├── historique.html     # Consultation de l'historique des commandes
├── promotions.html     # Page de gestion des promotions
├── css/
│   └── style.css       # Feuille de style principale
├── js/
│   ├── utils.js        # Fonctions utilitaires
│   ├── menu.js         # Gestion du menu et des produits
│   ├── promos.js       # Gestion des promotions
│   ├── order.js        # Gestion des commandes
│   ├── script.js       # Logique principale de la caisse
│   └── historique.js   # Gestion de l'historique
└── .gitignore          # Fichiers exclus du suivi Git
```

## Prérequis

Pour consulter et utiliser l'application, il faut :

- Un navigateur web récent (Chrome, Edge, Firefox ou équivalent).
- Un accès à Internet pour charger les polices Google Fonts.
- Les fichiers du dépôt présents sur la machine.

Aucune installation de dépendances n'est requise.

## Lancer l'application

### Méthode 1 — Ouvrir directement le fichier HTML

1. Récupérer ou cloner le dépôt.
2. Ouvrir le dossier du projet.
3. Double-cliquer sur `index.html`.
4. L'application s'ouvre dans le navigateur.

Cette méthode convient pour une première consultation. Toutefois, certaines fonctionnalités JavaScript utilisant des modules, des fichiers locaux ou des mécanismes de sécurité du navigateur peuvent nécessiter un serveur local.

### Méthode 2 — Utiliser Visual Studio Code

Pour un développement plus confortable, il est conseillé d'utiliser Visual Studio Code avec l'extension **Live Server**.

1. Ouvrir le dossier du projet dans Visual Studio Code.
2. Installer l'extension Live Server si nécessaire.
3. Faire un clic droit sur `index.html`.
4. Choisir **Open with Live Server**.

Le navigateur ouvre alors l'application sur une adresse locale, généralement de la forme :

```text
http://127.0.0.1:5500/
```

L'adresse exacte dépend de la configuration de Live Server.

Les modifications apportées aux fichiers peuvent ensuite être visualisées rapidement dans le navigateur.

## Navigation dans l'application

- `index.html` : accéder à la caisse, composer un ticket et encaisser une commande.
- `historique.html` : consulter les commandes enregistrées.
- `promotions.html` : accéder à la page des promotions.

Les données conservées dans le `localStorage` sont propres au navigateur et à l'origine utilisée pour accéder à l'application. Elles ne sont pas automatiquement partagées entre plusieurs ordinateurs ou navigateurs.

## État du projet

Projet en cours de développement, destiné à mettre en pratique les notions de HTML, CSS et JavaScript, notamment la manipulation du DOM, la gestion des événements, la modélisation des commandes et la persistance locale des données.

## Auteur

Projet personnel de développement web.
