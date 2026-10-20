const $ = (selector) => document.querySelector(selector);

const order = new Order();

const promoCodeInput = $("#promo-code");
const customerNameInput = $("#customer-name");

const historique = JSON.parse(
    localStorage.getItem("historiqueTickets") || "[]"
);

updatePromotionTooltip();
displayMenu(menu);
initEvents()

function initEvents() {
    initNavigationEvents();
    initMenuEvents();
    initPromotionEvents();
    initCustomerEvents();
    initCheckoutEvents();
    initPopupCloseEvents();
    initPrintTicketEvent();
}

/* EVENT */
function initNavigationEvents() {
  $("#btn-historique").addEventListener("click", showHistoryView);
  $("#btn-promotions").addEventListener("click", showPromotionsView);
}

function initMenuEvents(){
  // navigation menu admin
  $("#menu-button").addEventListener("click", () => {
      $("#admin-menu").classList.toggle("hidden");
      $("#menu-button").classList.toggle("is-open");
  });

  $('#categories').addEventListener('click', function (event) {
      const item = event.target.closest('button');
      if (!item) return;
      
      const buttons = document.querySelectorAll("#categories button");
      buttons.forEach((button) => {
          button.classList.remove("is-active");
      });

      item.classList.add("is-active");
      displayMenu(getFilteredMenu(item.value));
  });
}

function initPromotionEvents(){
  $("#promo-form").addEventListener('submit' , function (event) {
      event.preventDefault();
      const promo = validatePromotionCode();
      if(promo != null ) order.applyPromo(promo);
      displayPromotion();
      displayTicket();
  });
}

function initCustomerEvents(){
  $("#customer-form").addEventListener( 'submit' , function(event) {
    event.preventDefault();
    setCustomer();
    displayCustomerHistory();
  });
}

function initCheckoutEvents(){
  $("#checkout").addEventListener( 'click' , function () {
    const checkoutButton = $("#checkout");
    if (checkoutButton.disabled) return;
    if (!validateCheckout()) return;

    checkoutButton.disabled = true;
    saveOrderHistory();
    displayReceipt();
  });
}

function initPopupCloseEvents(){
  $("#popup-close").addEventListener("click" , function () {
    $("#popup-recap").classList.add("hidden");
    resetCommand();
  });
}

function initPrintTicketEvent(){
  $("#btn-print").addEventListener("click", () => {
      window.print();   
  });
}



function updatePromotionTooltip(){
  let text = promos
    .map((t) => t.code + " x " + t.nb)
    .join("\n");
  $("#labelPromo .info").setAttribute("data-tooltip" , text);
}

// Getion du menu
function getFilteredMenu(value){
  if (value === "all") return menu;
  return menu.filter((p)=> p.category === value).sort((a, b) => b.available - a.available);
}

function displayMenu(menufiltered){
  const menuSection = $("#menu");
  menuSection.innerHTML = "";
  const menuAviable = menufiltered.filter((menu) => menu.available).sort((a,b)=> a.name.localeCompare(b.name));
  const menuSoldeout = menufiltered.filter((menu) => !menu.available).sort((a,b)=> a.name.localeCompare(b.name));

  menuSection.appendChild(createSectionSeparator("Disponible"));

  for(let i= 0 ; i< menuAviable.length ; i++){
    const article = createMenuItem(menuAviable[i], "" );
    menuSection.append(article);
  }
  if(menuSoldeout.length >= 1) {
    menuSection.appendChild(createSectionSeparator("Epuisé"));

    for(let i= 0 ; i< menuSoldeout.length ; i++){
      const article = createMenuItem(menuSoldeout[i], "is-sold-out");
      menuSection.append(article);
    }
  }
}

function createMenuItem(menu, className){
  const article = createToDOM("article", "product " + className);
  const category = createToDOM("span", "product-category" , getCategoryLabel(menu.category) );
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

function createSectionSeparator(text){
  const separator = createToDOM("div", "separator");
  const hrleft = createToDOM("hr");
  const hrright = createToDOM("hr");
  const span = createToDOM("span", "" ,text );
  separator.append(hrleft, span , hrright)
  return separator;
}

// gestion du ticket
function displayTicket(){
  const ticketLigne = $("#ticket-lines");
  ticketLigne.innerHTML = "";

  for(let i=0 ; i< order.lines.length ; i++){
    const line = createToDOM("li", "ticket-line");
    const linename = createToDOM("span", "line-name",order.lines[i].name );
    const lineqty  = createToDOM("span", "line-qty","x" + order.lines[i].quantity );
    const linePrice  = createToDOM("span", "line-price",  formatPrice(order.lines[i].unitPrice * order.lines[i].quantity) );
    const boutton = createToDOM("button","line-remove", "-" , "button")
    
    boutton.addEventListener("click", () => {
      order.removeArticle(order.lines[i]);
      displayTicket();
    });
    
    line.append( linename, lineqty, linePrice, boutton);
    $("#ticket-empty").style.display = "none";
    ticketLigne.append(line)
  }
  if(order.lines.length === 0 ) $("#ticket-empty").style.display = "block";
  
  $("#ticket-discount").textContent = formatPrice(order.getDiscount());
  $("#ticket-total").textContent = formatPrice(order.getTotal());
  
}

// gestion promo
function validatePromotionCode(){
  if(promoCodeInput.value === "") return null;

  const promoInput = normaliseUpperCase(promoCodeInput.value);
  const promo =promos.find((item) => item.code === promoInput);
  const promoMessage = $("#promo-message");
  if(promo == null) {
    promoMessage.textContent = 'Promotion non trouvée';
    return null;
  }

  if(promo.nb === 0) {
      promoMessage.textContent = 'Plus de ' + promo.libelle;
      return null;
  } else if(order.promo != null) {
    promoMessage.textContent = 'Une promotion est déjà en cours ';
    return null;
  }
  promoCodeInput.value = "";
  return promo;
}

function displayPromotion (){
  $("#pourcent-discount").textContent = "";
  
  if(order.promo != null) {
    $("#pourcent-discount").textContent = "- " + order.promo.remise + " %";
    $("#pourcent-discount").setAttribute("data-tooltip", "Remises restantes : " + order.promo.nb);
    
    const boutton = createToDOM("button","line-remove", "-" , "button")
    boutton.addEventListener("click", () => {
      order.removePromo();  
      displayPromotion();
      displayTicket();
    });

    $("#pourcent-discount").append(boutton);
  } else {
     $("#pourcent-discount").innerHTML ="";
  }
}

function clearCustomer(){
  $("#customer-info").textContent= "";
  $("#customer-derCommande").textContent= "";
  $("#customer-derinfo").textContent= "";
  order.customerName = "";
}

// customer
function setCustomer(){
  clearCustomer()
  
  if(customerNameInput.value === "") return null;

  order.customerName = normaliseUpperCase(customerNameInput.value);
  
  $("#customer-info").textContent = order.customerName;

  const span = createToDOM("span", "" );
  const boutton = createToDOM("button","line-remove", "-" , "button")
  boutton.addEventListener("click", () => {
        clearCustomer();
  });
    
  span.append(boutton);
  $("#customer-info").append(span);
  customerNameInput.value = "";
}
  
function displayCustomerHistory(){
  const histo = historique.findLast((h) => h.customerName === order.customerName);
  if(histo) {
    $("#customer-derCommande").textContent = "Derniere commande : " + formatDateHeure(histo.date);
      
    let nbArticle = histo.lines.reduce( function(sum, objet ) {
      return sum + objet.quantity
    }, 0);

   $("#customer-derinfo").textContent = `${nbArticle} article(s) pour un total de ${formatPrice(histo.totalorder)}\t` ; 
   
    let info = createToDOM("span", "info", "i");
    info.setAttribute("data-tooltip", formatOrderHistory(histo));
    $("#customer-derinfo").append(info);
  }
}

function formatOrderHistory(command) {

    if (!command) return "";

    let text = "";

    text += `${command.customerName}\n`;
    text += `le ${formatDateHeure(command.date)}\n`;
    text += `──────────────────────────────────\n`;

    for (let i = 0; i < command.lines.length; i++) {

        const ligne = command.lines[i];

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

    const total = formatPrice(command.totalorder).padStart(10);

    text += `TOTAL${total.padStart(29)}`;

    return text;
}

function validateCheckout(){
  if(order.customerName === "") {
    customerNameInput.focus();
    $("#customer-error").textContent = "Veuillez entrer un nom de client";
    return false
  } ;

  if(order.lines.length === 0){
    $("#ticket-error").textContent = "Encaissement impossible : le ticket est vide !";
    return false
  } ;

  return true;
}

// sauve hitory
function saveOrderHistory(){
  if(order.promo != null) order.promo.nb--;

  const histo = {...order, totalRemise: order.getDiscount() ,totalorder : order.getTotal() };
 
  historique.push(histo);

  localStorage.setItem(
    "historiqueTickets",
    JSON.stringify(historique)
  );
}

function displayReceipt(){
  // Nettoyage du popup
  $("#recap-lines").innerHTML = "";
  $("#recap-promo").innerHTML = "";
  $("#recap-total").innerHTML = "";

  $("#recap-client").textContent = "Ticket de " + order.customerName;
  $("#recap-date").textContent = formatDateHeure(order.date);

  const recapLine = $("#recap-lines") ;
  for(let i = 0 ; i < order.lines.length ; i++){
    const line = createToDOM("li", "ticket-line");
    const linename = createToDOM("span", "line-name", order.lines[i].name );
    const lineqty  = createToDOM("span", "line-qty","x" + order.lines[i].quantity );
    const linePrice  = createToDOM("span", "line-price",  formatPrice(order.lines[i].unitPrice * order.lines[i].quantity)  );
    
    line.append( linename, lineqty, linePrice);
    recapLine.append(line);
  }
  
  const recappromo = $("#recap-promo");
  let textePromo = "Remise";
  let tremise = 0;
  if (order.promo !== null) {
    textePromo = toProperCase(order.promo.libelle) ;
    tremise = order.getDiscount();
  }

  let containerTot = createToDOM("p", "sum-row");
  let linename = createToDOM("span", "line-name", textePromo);
  let linetot  = createToDOM("span", "line-qty", formatPrice(tremise));
  containerTot.append(linename, linetot);
  recappromo.append(containerTot)

  const total = $("#recap-total");
  containerTot = createToDOM("p", "sum-row sum-total");
  linename = createToDOM("span", "", "Total" );
  linetot  = createToDOM("span", "",formatPrice(order.getTotal()));
  
  containerTot.append(linename, linetot);
  total.append(containerTot)

  $("#popup-recap").classList.remove("hidden");
}

function resetCommand(){
  order.clear();

  $("#customer-info").textContent = "";
  $("#customer-derCommande").textContent = ""; 
  $("#customer-derinfo").textContent = "";
  customerNameInput.value = "";
  promoCodeInput.value = "";
  $("#checkout").disabled = false;

  displayTicket();
  displayPromotion();
}

/// Gestion du menu admin
async function showHistoryView() {
    await loadView("historique.html");
    InitHistory();
}

async function showPromotionsView() {
    await loadView("promotions.html");
}

async function loadView(fichier) {

    const response = await fetch(fichier);

    const html = await response.text();
    
    $("#caisse").classList.add("hidden");
    
    $("#view-container").innerHTML = html;

     $("#btn-retour-caisse").addEventListener("click", showCheckoutView);
     
     $("#admin-menu").classList.toggle("hidden");
}

function showCheckoutView() {
    $("#view-container").innerHTML = "";
    $("#caisse").classList.remove("hidden");
}


// ============================================================
// Gestion pour l'IA
// ============================================================

// ============================================================
// Premiere partie : le client pose use commande et IA replit le ticket
// ============================================================

$("#ai-order-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  $("#ai-order-message").textContent = "";
  $("#ai-order-message-error").textContent = "";

  const input = $("#ai-order-input");
  const message = input.value.trim();
  if (!message) return;

  const response = await sendMessage(message);
  if (!response) return;

  if(response.items.length === 0) {
    $("#ai-order-message").textContent = "Aucun produit trouvé pour cette commande.";
    return;
  } else {
    addToOrder(response);
    displayTicket();
  }
  input.value = "";
  input.focus();
});
  

function addToOrder(response) {
  for (const item of response.items) {
    const menuItem = menu.find((menuItem) => menuItem.id === item.id);

    if (!menuItem) {
      $("#ai-order-message-error").textContent = "Produit non trouvé dans le menu.";
      return;
    }

    const errorMessage = ctrlResponseItem(menuItem, item);
    if (errorMessage !== "") {
      $("#ai-order-message-error").textContent = errorMessage;
      return;
    }
  }

  for (const item of response.items) {
    const menuItem = menu.find((menuItem) => menuItem.id === item.id);
    for (let i = 0; i < item.quantity; i++) {
      order.addArticle(menuItem);
    }
  }
}


function ctrlResponseItem(Menuitem, item) {
  if (!Menuitem.available) {
    return "Le produit " + Menuitem.name + " est épuisé.";
  }
  if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
    return "La quantité demandée pour le produit " + Menuitem.name + " doit être un nombre entier compris entre 1 et 10.";
  }

  return "";
}