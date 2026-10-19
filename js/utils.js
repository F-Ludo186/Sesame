// outils
function createToDOM(objectName, className, Texte ="", type = ""){
  const object = document.createElement(objectName);
  if(type != "" ) object.type = type;
  object.className = className;
  if(Texte != "") object.textContent = Texte 
  return object;
}

function toProperCase(texte) {
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function normaliseUpperCase(texte) {
    return texte
        .trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")   // supprime les accents
        .replace(/\s+/g, "-");
}

// Fournie : transforme 220 en "2,20 €". Tu n'as pas à la modifier.
function formatPrice(cents) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function formatDateHeure(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleDateString("fr-FR") + " " +
           date.toLocaleTimeString("fr-FR");
}