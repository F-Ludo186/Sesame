const DATA_KEY = "CUSTOMER.json";
const filtre = $("#historique-filtres");



function InitHistory(){
    InitEvent();
    initFilter();
    createRow(historique);
}

function InitEvent(){
    $("#history-search-button").addEventListener("click", () => {
      const value = normaliseUpperCase($("#client-filter").value);
        createRow(getHistoryfiltered(value));
        $("#client-filter").value = "";
  });

}

function initFilter(){
   
    const clients = [...new Set(
    historique
        .map((commande) => commande.customerName)
    )]
    .sort((a, b) => a.localeCompare(b));

    clients.unshift("TOUS");
    
    const liste = $("#clients-list");

    for (const client of clients) {
        const option = document.createElement("option");
        option.value = client;
        liste.append(option);
    }
}

function getHistoryfiltered(value){
  if (value === "TOUS") return historique;
  return historique.filter((commande)=> commande.customerName === value).sort((a, b) => b.date - a.date);
}

function createRow(histoFiltered){
    const tableBody = $("#history-table-body")
    tableBody.innerHTML = "";

    for(let i=0 ; i < histoFiltered.length ; i++){
        const line = createHistoryRow(histoFiltered[i])
        tableBody.append(line);
    }
    

}


function createHistoryRow(commande) {
    const row = createToDOM("tr","");
    const dateCell = createToDOM("td","",formatDateHeure(commande.date));
    const customerCell = createToDOM("td","",commande.customerName);
    const totalCell = createToDOM("td","",formatPrice(commande.totalorder));
    const detailCell = createToDOM("td","");
    const button = createToDOM("button","","Voir","button");
    detailCell.append(button);

    row.append(dateCell, customerCell, totalCell, detailCell);

    return row;
}


// auto complet pour client
async function initAutocompletion() {
    noms = await lireData() ?? await createFile();
}

function lireData() {
    try {
        const brut = localStorage.getItem(DATA_KEY);
        return brut ? JSON.parse(brut) : null;
    } catch {
        return null;
    }
}

async function createFile() {
    try {
        const noms = clients =  [... new Set(historique.map((nom) => nom.customerName).sort((a, b) => a.localeCompare(b)))];
 
        localStorage.setItem(DATA_KEY, JSON.stringify(noms));
        return noms;
    } catch (err) {
        console.error("Impossible de créer data.json :", err);
        return [];
    }
}
