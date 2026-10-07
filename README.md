# Sésame, ouvre-toi ☕


Ta mission : coder un **logiciel d'encaissement** pour le Sésame. Objectif : le barista touche un produit, le produit part sur le ticket et le total se calcule tout seul.

La page est déjà préparée en HTML/CSS. Il ne lui manque que le JavaScript, et c'est tout l'enjeu de cet exercice :)

## Démarrer

Clone ce repository.


| Fichier      | Ce qu'il contient                                                                       |
| ------------ | --------------------------------------------------------------------------------------- |
| `index.html` | La page, et en commentaire le modèle exact d'une carte produit et d'une ligne de ticket |
| `style.css`  | Tout le style, y compris celui des éléments que tu vas créer                            |
| `menu.js`    | La carte du café : un tableau d'objets, avec les prix en centimes                       |
| `script.js`  | Ton code, une section par étape                                                         |

☝ Les prix sont en **centimes** : `280` veut dire 2,80 €. Pour les afficher, `script.js` te donne déjà `formatPrice(280)`, qui renvoie `"2,80 €"`

## Les règles

- **Avance étape par étape**, et recharge la page après chacune : chaque étape sert de fondation à la suivante.
- **Bloqué ?** Chaque étape a un indice replié. Ouvre-le après avoir vraiment cherché, pas avant.

---

## Le socle : étapes 1 à 5

### Étape 1 · La carte s'affiche

Pour l'instant, le barista regarde une page vide. Commence par lui afficher ses produits.

Attrape `<section id="menu">` avec `querySelector`, puis écris une fonction `renderMenu()` qui vide la section et crée une carte par produit de `menu`. Chaque carte suit le modèle en commentaire dans `index.html` : recopie sa structure à l'identique, et le CSS fera le reste.

⚠️ Tout le texte passe par `textContent`, jamais par `innerHTML`.

| Ce que tu vérifies  | Résultat attendu                                          |
| ------------------- | --------------------------------------------------------- |
| Le nombre de cartes | 16                                                        |
| La catégorie        | « Café », « Thé & autres » ou « Pâtisserie », en français |
| Ton fichier         | Aucun `innerHTML`                                         |

<details>
<summary>Un indice</summary>

Si besoin, commence par **une seule carte**, pour `menu[0]`, sans boucle. Quand elle s'affiche bien, entoure ton code d'une boucle `for` et remplace `menu[0]` par `menu[i]`. Pour la catégorie, une petite fonction `categoryLabel(category)` avec des `if` me semble pas mal.
</details>

### Étape 2 · Les produits épuisés

Quelqu'un a mangé le dernier cookie peanut (catastrophe !) et le filtre V60 est aussi en rupture de stock. Il ne faudrait pas que le barista les vende quand même.

Toujours dans la boucle de `renderMenu` : si le produit n'est pas disponible (`available: false`), sa carte prend la classe `is-sold-out`, et son bouton est désactivé avec `button.disabled = true`.

**Ce que tu dois voir :** le Filtre V60 et le Cookie peanut marqués « Épuisé », et un clic sur leur bouton qui ne fait rien.

### Étape 3 · L'objet `order`

C'est l'étape qui demande le plus de réflexion, et c'est normal. Le ticket en cours devient un objet, qui porte ses données **et** ses méthodes :

| Propriété ou méthode | Ce qu'elle fait                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `lines`              | Un tableau de lignes, vide au départ : `{ id, name, price, quantity }`                                                      |
| `add(product)`       | Si le produit est déjà sur le ticket, sa `quantity` augmente de 1. Sinon, une nouvelle ligne est ajoutée avec `quantity: 1` |
| `getSubtotal()`      | La somme de `price × quantity` sur toutes les lignes, en centimes                                                           |

Ensuite, chaque bouton « Ajouter » appelle `order.add(product)`.

💡 Avant de coder, prends une feuille et **dessine ce que contient `lines`** après trois clics : deux cappuccinos et un cookie sésame. Cinq minutes de papier t'en font gagner trente au clavier.

**Ce que tu dois voir :** après deux clics sur Cappuccino, tape `order.lines` dans la console. Il n'y a qu'**une** ligne, avec `quantity: 2`.

<details>
<summary>Un indice</summary>

Dans une méthode, `this` désigne l'objet lui-même : `this.lines` est le tableau du ticket. Pour `add`, une boucle compare chaque `id` à `product.id`. Si elle trouve, elle augmente la quantité et s'arrête avec `return`. Si la boucle se termine sans rien trouver, c'est qu'il faut ajouter une ligne.
</details>

### Étape 4 · Le ticket s'affiche

Ton objet `order` est maintenant fonctionnel (félicitations), mais le barista ne voit encore rien. Écris une fonction `renderTicket()` qui efface tout le ticket et le recréé à partir de `order`, puis appelle-la après chaque ajout.

| Ce que tu vérifies                 | Résultat attendu                                                       |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Deux cappuccinos                   | Une seule ligne, « × 2 », 7,60 €                                       |
| Deux cappuccinos et un carrot cake | Total 11,70 €                                                          |
| Le message « Le ticket est vide. » | Il disparaît au premier ajout (classe `is-hidden` sur `#ticket-empty`) |

<details>
<summary>Un indice</summary>

Ne cherche pas à modifier une ligne déjà affichée. **Efface tout et redessine tout**, à chaque fois : c'est plus simple, et c'est exactement ce que font les frameworks que tu verras plus tard.
</details>

### Étape 5 · Retirer une ligne

« Ah non, finalement pas de cookie. » Ça arrive dix fois par jour.

Ajoute à `order` une méthode `remove(id)` : la quantité baisse de 1, et la ligne disparaît du tableau quand elle tombe à 0. Le bouton « − » de chaque ligne l'appelle.

**Ce que tu dois voir :** sur une ligne à 2 cappuccinos, deux clics sur « − » font disparaître la ligne.

<details>
<summary>Un indice</summary>

`this.lines.splice(i, 1)` sort l'élément d'index `i` du tableau. L'écouteur du « − » se pose dans `renderTicket`, au moment où tu crées la ligne.
</details>

**Si tu es ici, le barista a une caisse qui marche !! 😇**

---

## La suite : étapes 6 à 8

### Étape 6 · Filtrer par catégorie

Seize produits, c'est long à parcourir quand un client veut juste une pâtisserie.

Pose **un seul** écouteur, sur `<nav id="categories">`. `event.target.value` te donne la catégorie du bouton cliqué. `renderMenu(category)` n'affiche alors que cette catégorie, ou tout pour `"all"`. Le bouton cliqué prend la classe `is-active`, les autres la perdent.

**Ce que tu dois voir :** 5 cartes pour « Pâtisseries », 16 pour « Tout ».

<details>
<summary>Si les cartes apparaissent en double</summary>

Regarde la première ligne de `renderMenu` : la section est-elle bien vidée avant de redessiner ?
</details>

### Étape 7 · Le prénom du client

Au Sésame, on appelle les clients par leur prénom quand la commande est prête.

Le formulaire `#customer-form` enregistre le prénom dans `order.customer`, sans recharger la page, et le titre devient « Ticket de Léa ». Un prénom vide affiche une erreur dans `#customer-error`.

**Ce que tu dois voir :** tape `<img src=x onerror=alert(1)>` comme prénom. Il s'affiche tel quel, et aucune alerte ne s'ouvre. Si une alerte s'ouvre, quelqu'un vient de prendre le contrôle de la caisse 😬

<details>
<summary>Un indice</summary>

`preventDefault()`, puis la `value` du champ. Un prénom fait uniquement d'espaces passe pour un vrai prénom : `name.trim()` retire les espaces au début et à la fin.
</details>

### Étape 8 · Le code promo

Le barista distribue un code aux habitués : `BARISTA` donne 10 % de remise, quelle que soit la façon de l'écrire (`barista` marche aussi). La remise s'affiche dans `#ticket-discount`, et le total en tient compte. Un code inconnu affiche « Code inconnu » et ne retire rien.

**Ce que tu dois voir :** deux cappuccinos et un carrot cake font 11,70 €, donc une remise de 1,17 € et un total de 10,53 €.

<details>
<summary>Un indice</summary>

`code.toUpperCase()` met tout en majuscules. Une remise se calcule avec `Math.round(subtotal * 0.1)`, pour rester sur un nombre entier de centimes.
</details>

---

## 🔥 Les bonus

Tu as fini en avance ? Le barista a encore des idées. Elles vont du plus simple au plus corsé, et pour chacune tu peux ajouter du HTML et du CSS.

### Bonus 1 · Encaisser

Le bouton « Encaisser » affiche le total, vide le ticket (prénom et code promo compris), et le ticket suivant porte le numéro 2. Un ticket vide ne s'encaisse pas.

### Bonus 2 · La formule

Une boisson et une pâtisserie achetées ensemble font une formule : **1 € de moins par formule**. Deux cafés et un cookie, c'est une formule. Trois cafés et deux cookies, deux formules.

Le code `BARISTA` s'applique **après** la formule. Avec deux cappuccinos et un carrot cake : 11,70 € − 1 € = 10,70 €, puis − 10 % = **9,63 €**.


### Bonus 3 · Ne rien perdre 🏆

Le barista recharge la page par erreur : le ticket en cours et les tickets du jour ont disparu. Fais en sorte que ça n'arrive plus jamais. Cette notion n'est pas dans le cours, c'est à toi d'aller la chercher : commence par `localStorage` sur [MDN](https://developer.mozilla.org/fr/docs/Web/API/Window/localStorage).

---

## Demain

Démonstration !!!

Bon courage, et bon café héhé 
