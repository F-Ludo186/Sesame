const $ = (selector) => document.querySelector(selector);

const order = new Order();

const customerNameInput = $("#customer-name");
const promoCodeInput = $("#promo-code");
const promoMessage = $("#promo-message");

const ticket = [];
let promoEnCours = null;

const historique = JSON.parse(
    localStorage.getItem("historiqueTickets") || "[]"
);

let totalticketAvRemise = 0;
let remisePromo = 0;
let totalRemise = 0;
let totalticket = 0;
let customerName = "";

GetListeDiscount();
displayMenu(menu);

// navigation management


// navigation menu admin
$("#menu-button").addEventListener("click", () => {
    $("#admin-menu").classList.toggle("hidden");
    $("#menu-button").classList.toggle("is-open");
});

$("#btn-historique").addEventListener("click", afficherHistorique);
$("#btn-promotions").addEventListener("click", afficherPrmotions);

$('#categories').addEventListener('click', function (event) {
    const item = event.target.closest('button');
    if (!item) return;
    
    const buttons = document.querySelectorAll("#categories button");
    buttons.forEach((button) => {
        button.classList.remove("is-active");
    });

    item.classList.add("is-active");
    displayMenu(getMenufiltered(item.value));
});

$("#promo-form").addEventListener('submit' , function (event) {
    event.preventDefault();
    /*promoEnCours = controlPromo();*/
    order.applyPromo(controlPromo());
    displayDiscount();
    displayTicket();
    /*CalculPrixTicket();*/
});

$("#customer-form").addEventListener( 'submit' , function(event) {
  event.preventDefault();
  getinfoCustemer();

});

$("#checkout").addEventListener( 'click' , function () {
  const histo = saveHistory();
  if(histo != null) aficheTicketCaisse(histo);
 });

$("#popup-close").addEventListener("click" , function (event) {
  $("#popup-recap").classList.add("hidden");
  resetCommand();
});

$("#btn-print").addEventListener("click", () => {
    window.print();   
});

function GetListeDiscount(){
  let text = promos
    .map((t) => t.code + " x " + t.nb)
    .join("\n");
  $("#labelPromo .info").setAttribute("data-tooltip" , text);
}

// Getion du menu
function getMenufiltered(value){
  if (value === "all") return menu;
  return menu.filter((p)=> p.category === value).sort((a, b) => b.available - a.available);
}

function displayMenu(menufiltered){
  const menuSection = $("#menu");
  menuSection.innerHTML = "";
  const menuAviable = menufiltered.filter((menu) => menu.available).sort((a,b)=> a.name.localeCompare(b.name));
  const menuSoldeout = menufiltered.filter((menu) => !menu.available).sort((a,b)=> a.name.localeCompare(b.name));

  menuSection.appendChild(separator("Disponible"));

  for(let i= 0 ; i< menuAviable.length ; i++){
    const article = CreateArticle(menuAviable[i]);
    menuSection.append(article);
  }
  if(menuSoldeout.length >= 1) {
    menuSection.appendChild(separator("Epuisé"));

    for(let i= 0 ; i< menuSoldeout.length ; i++){
      const article = CreateArticle(menuSoldeout[i]);
      menuSection.append(article);
    }
  }
}

function CreateArticle(menu){
  const article = createToDOM("article", "product");
  const category = createToDOM("span", "product-category" ,menu.category );
  const title = createToDOM("h3", "product-name",menu.name );
  const price = createToDOM("p", "product-price", formatPrice(menu.price));
  const boutton = createToDOM("button", "product-add", "Ajouter" , "button");
  boutton.disabled = !menu.available;

  boutton.addEventListener("click", () => {
    order.addArticle(menu);
    displayTicket();
  });

    
  article.append(category , title, price ,boutton)
  return article;
}

function separator(text){
  const separator = createToDOM("div", "separator");
  const hrleft = createToDOM("hr");
  const hrright = createToDOM("hr");
  const span = createToDOM("span", "" ,text );
  separator.append(hrleft, span , hrright)
  return separator;
}


/*function addToTicket(article){
  let ligne = ticket.find((item) => item.id === article.id);
  if ( ! ligne) {
    ligne = {
      id: article.id,
      name: article.name,
      unitPrice: article.price,
      quantity: 1
    };
    ticket.push(ligne);
  } else { 
    ligne.quantity++ ;
  }
}*/

// gestion du ticket
function displayTicket(){
  const ticketLigne = $("#ticket-lines");
  ticketLigne.innerHTML = "";

  for(let i=0 ; i< order.lines.length ; i++){
    const line = createToDOM("li", "ticket-line");
    const linename = createToDOM("span", "line-name",order.lines[i].name );
    const lineqty  = createToDOM("span", "line-qty","x" + order.lines[i].quantity );
    /*let totalLine = order.lines[i].quantity * order.lines[i].unitPrice;*/
    const linePrice  = createToDOM("span", "line-price",  formatPrice(order.getSubtotal()) );
    const boutton = createToDOM("button","line-remove", "-" , "button")
    
    boutton.addEventListener("click", () => {
      order.removeArticle(order.lines[i]);
      /*RemoveToTicket(ticket[i]);*/
      displayTicket();
    });
    
    line.append( linename, lineqty, linePrice, boutton);
    $("#ticket-empty").style.display = "none";
    ticketLigne.append(line)
  }
  if(ticket.length === 0 ) $("#ticket-empty").style.display = "block";
  
  /*CalculPrixTicket();*/
  $("#ticket-discount").textContent = formatPrice(order.getDiscount());
  $("#ticket-total").textContent = formatPrice(order.getTotal());
  
}

/*function CalculPrixTicket(){
  totalticket = 0;
  totalticketAvRemise = ticket.reduce( function(sum, objet ) {
    return sum + (objet.quantity * objet.unitPrice)
  }, 0);
  totalRemise = 0;

  remisePromo = promoEnCours?.remise === undefined ? 0 : promoEnCours.remise ;
  if(remisePromo != 0) totalRemise = -1 * ((totalticketAvRemise * remisePromo) / 100);

  totalticket = totalticketAvRemise + totalRemise ;
  $("#ticket-discount").textContent = formatPrice(totalRemise);    
  $("#ticket-total").textContent = formatPrice(totalticket);    

}*/

/*function RemoveToTicket(article){
  let ligne = ticket.find((item) => item.id === article.id);
  ligne.quantity --;
  if (ligne.quantity === 0) {
        const index = ticket.findIndex((item) => item.id === article.id);
        ticket.splice(index, 1);
    } 
}*/

// gestion promo
function controlPromo(){
  if(promoCodeInput.value === "") return null;

  const promoInput = normaliseUpperCase(promoCodeInput.value);
  const promo =promos.find((item) => item.code === promoInput);
  return promo ?? null;
}

function displayDiscount (){
   $("#pourcent-discount").innerHTML = "";

  if(promoEnCours === null ){
    $("#pourcent-discount").textContent = "";
    promoMessage.textContent = "";
  } else {
    if(promoEnCours.nb === 0) {
      promoMessage.textContent = 'Plus de ' + promoEnCours.libelle;
    } else {
      if(remisePromo != 0) { 
        promoMessage.textContent = 'Une promotion est déjà en cours ';
      } else {
        remisePromo = promoEnCours.remise;
        $("#pourcent-discount").textContent = "- " + remisePromo + " %";
       
        $("#pourcent-discount").setAttribute("data-tooltip", "Remises restantes : " + promoEnCours.nb);
          
        const boutton = createToDOM("button","line-remove", "-" , "button")
        boutton.addEventListener("click", () => {
          order.removePromo();  
          /*RemoveDiscount();*/
        });
        $("#pourcent-discount").append(boutton);
      }
    }
  }
}

function RemoveDiscount(){
  promoEnCours = null;
  remisePromo = 0;
  displayDiscount();
  CalculPrixTicket();
}

function RemoveCustomer(){
  $("#customer-info").textContent= "";
  $("#customer-derCommande").textContent= "";
  $("#customer-derinfo").textContent= "";
}

// customer
function getinfoCustemer(){
  RemoveCustomer()
   
  if(customerNameInput.value === "") return null;

  customerName = normaliseUpperCase(customerNameInput.value);
  
  $("#customer-info").textContent = customerName;

  const span = createToDOM("span", "" );
  const boutton = createToDOM("button","line-remove", "-" , "button")
    boutton.addEventListener("click", () => {
        RemoveCustomer();
    });
  span.append(boutton);
  $("#customer-info").append(span);


  const histo = historique.findLast((h) => h.nom === customerName);
  if(histo) {
    $("#customer-derCommande").textContent = "Derniere commande : " + formatDateHeure(histo.date);
      
    let nbArticle = histo.lignes.reduce( function(sum, objet ) {
      return sum + objet.quantity
    }, 0);

   $("#customer-derinfo").textContent = `${nbArticle} article(s) pour un total de ${formatPrice(histo.total)}\t` ; 
   
    let info = createToDOM("span", "info", "i");
    info.setAttribute("data-tooltip", GetHistoString(histo));
    $("#customer-derinfo").append(info);
  }
}

function GetHistoString(command) {

    if (!command) return "";

    let text = "";

    text += `${command.nom}\n`;
    text += `le ${formatDateHeure(command.date)}\n`;
    text += `──────────────────────────────────\n`;

    for (let i = 0; i < command.lignes.length; i++) {

        const ligne = command.lignes[i];

        const nom = ligne.name.padEnd(20);
        const quantite = `x${ligne.quantity}`.padStart(4);
        const prix = formatPrice(
            ligne.quantity * ligne.unitPrice
        ).padStart(10);

        text += `${nom}${quantite}${prix}\n`;
    }

    if (command.promo !== null) {

        const promo = toProperCase(command.promo.libelle);
        const remise = formatPrice(command.totalRemise).padStart(10);

        text += `\n${promo.padEnd(25)}${remise}\n`;
    }

    text += `──────────────────────────────────\n`;

    const total = formatPrice(command.total).padStart(10);

    text += `TOTAL${total.padStart(29)}`;

    return text;
}

// sauve hitory
function saveHistory(){
  if(customerName === "") return null ;
  if(ticket.length === 0 ) return null;
  
  if(promoEnCours != null) promoEnCours.nb--;

  const histo = {
    nom : customerName,
    date:  Date.now() ,
    lignes : [...ticket],
    promo: promoEnCours,
    totalRemise : totalRemise,
    total :  totalticket
   } ;

  historique.push(histo);

  localStorage.setItem(
    "historiqueTickets",
    JSON.stringify(historique)
  );
  return histo;
}

function aficheTicketCaisse(commande){
  // Nettoyage du popup
  $("#recap-lines").innerHTML = "";
  $("#recap-promo").innerHTML = "";
  $("#recap-total").innerHTML = "";

  $("#recap-client").textContent = commande.nom;
  $("#recap-date").textContent = formatDateHeure(commande.date);

  const recapLine = $("#recap-lines") ;
  for(let i = 0 ; i < commande.lignes.length ; i++){
    const line = createToDOM("li", "ticket-line");
    const linename = createToDOM("span", "line-name",commande.lignes[i].name );
    const lineqty  = createToDOM("span", "line-qty","x" + commande.lignes[i].quantity );
    let totalLine = commande.lignes[i].quantity * commande.lignes[i].unitPrice;
    const linePrice  = createToDOM("span", "line-price",  formatPrice(totalLine) );
    
    line.append( linename, lineqty, linePrice);
    recapLine.append(line);
  }
  
  const recappromo = $("#recap-promo");
  let textePromo = "Remise";
  let tremise = 0;
  if (commande.promo !== null) {
    textePromo = toProperCase(commande.promo.libelle) ;
    tremise = commande.totalRemise;
  }

  let containerTot = createToDOM("p", "sum-row");
  let linename = createToDOM("span", "line-name", textePromo);
  let linetot  = createToDOM("span", "line-qty", formatPrice(tremise));
  containerTot.append(linename, linetot);
  recappromo.append(containerTot)


  const total = $("#recap-total");
  containerTot = createToDOM("p", "sum-row sum-total");
  linename = createToDOM("span", "", "Total" );
  linetot  = createToDOM("span", "",formatPrice(commande.total));
  
  containerTot.append(linename, linetot);
  total.append(containerTot)

  $("#popup-recap").classList.remove("hidden");

}

function resetCommand(){
  ticket.length = 0;
  promoEnCours = null;
  totalticketAvRemise = 0;
  remisePromo = 0;
  totalRemise = 0;
  totalticket = 0;
  customerName = "";
  customerNameInput.value = "";
  promoCodeInput.value = "";
  
  RemoveCustomer();
   displayTicket();
  displayDiscount();
  CalculPrixTicket();

}


/// Gestion du menu admin
async function afficherHistorique() {
    await afficherVue("historique.html");
    InitHistory();
}

async function afficherPrmotions() {
    await afficherVue("promotions.html");
}

async function afficherVue(fichier) {

    const response = await fetch(fichier);

    const html = await response.text();
    
    $("#caisse").classList.add("hidden");
    
    $("#view-container").innerHTML = html;

     $("#btn-retour-caisse").addEventListener("click", afficherCaisse);
     
     $("#admin-menu").classList.toggle("hidden");
}

function afficherCaisse() {
    $("#view-container").innerHTML = "";
    $("#caisse").classList.remove("hidden");
}


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



