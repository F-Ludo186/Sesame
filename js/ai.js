//const $ = (selector) => document.querySelector(selector);

const MODEL_NAME = "sesam-order";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const CLE_HISTORIQUE_IA = "historiqueIA";

// Catalogue a trasmettre a Ollama.
const orderPrompt = menu
    .map((item) => `ID=${item.id} | PRODUIT=${item.name}`)
    .join("\n");

// Schema de validation de la reponse de Ollama.
const orderSchema = {
    type: "object",
    properties: {
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    quantity: { type: "integer", minimum: 1, maximum: 10 }
                },
                required: ["id", "quantity"],
                additionalProperties: false
            }
        }
    },
    required: ["items"],
    additionalProperties: false
};

// Instructions et catalogue transmis a Ollama a chaque requete.
const pormtsysteme = [{
    role: "system",
    content: `
Tu analyses une commande pour retrouver des produits du catalogue.
Voici le catalogue des produits disponibles.
Format : ID | PRODUIT
${orderPrompt}

Regles :
- Utilise uniquement un produit du catalogue et son identifiant exact.
- Le produit demande doit correspondre sans ambiguite a un seul produit.
- Si plusieurs produits peuvent correspondre (par exemple "un cookie"
  quand plusieurs cookies existent), ne choisis pas arbitrairement.
- Si une partie de la commande est ambigue, inconnue ou impossible a satisfaire,
  retourne items vide pour toute la commande.
- Les quantites doivent etre des nombres entiers compris entre 1 et 10.
- Une fraction ou une portion (par exemple "un demi cookie") n'est pas une
  quantite valide : retourne items vide. Ne retourne jamais une quantite de 0.
- Si la quantite n'est pas precisee, utilise 1. Additionne les demandes
  repetees du meme produit.

Retourne uniquement un JSON conforme au schema. Si aucun produit ne peut etre
determine avec certitude, retourne exactement {"items": []}.
`
 }];


// ============================================================
// HISTORIQUE pour l'IA
// ============================================================

// Historique IA en localStorage
const historiqueIA = JSON.parse( localStorage.getItem(CLE_HISTORIQUE_IA) || "[]");
// Save l'historique dans le navigateur
function sauvegarderHistoriqueIA() { 
    localStorage.setItem(CLE_HISTORIQUE_IA, JSON.stringify(historiqueIA));
}
 
async function askModel(text) {
    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                ...pormtsysteme, // permet de fournir le catalogue des produits au modèle
                {
                    role: "user",
                    content: text
                }
            ],
            keep_alive: "10m",
            think: false, // pas de brouillon « Thinking… » : la réponse directement
            stream: false, // la réponse en un seul bloc, quand elle est finie
            format: orderSchema, // permet le formatage automatique de la réponse en JSON, et la validation du format
            options: {
                temperature: 0,
                num_predict: -1 // limite le nombre de token en sortie pour éviter les réponses trop longues
            } 
        }),
    });

    const data = await response.json();
/*    console.table({
        total: (data.total_duration / 1e9).toFixed(2) + " s",
        chargement: (data.load_duration / 1e9).toFixed(2) + " s",
        analyse: (data.prompt_eval_duration / 1e9).toFixed(2) + " s",
        generation: (data.eval_duration / 1e9).toFixed(2) + " s",
        tokensEntree: data.prompt_eval_count,
        tokensSortie: data.eval_count
    });     // control temps reponse et tokens pour debug
    */ 

    // response.ok vaut false si Ollama a répondu par une erreur (modèle introuvable...)
    if (!response.ok) {
        throw new Error(data.error);
    }
    return data.message.content; // le texte de la réponse du modèle
}

async function sendMessage(text) {
    if (!text.trim()) {
        return;
    }
    
    const bouton = $("#ai-order-button");
    const message = $("#ai-order-message");
    
    // Historique IA pour chaque appel
    const entreeHistorique = {
        date: new Date().toISOString(),
        texteClient: text,
        reponse: "",
        tempsIA: 0
    };

    const debut = Date.now();
    let timer;
    let erreur = "";

    bouton.disabled = true;
    message.textContent = "Analyse en cours… 0 s";

    timer = setInterval(() => {
        const secondes = Math.floor((Date.now() - debut) / 1000);
        message.textContent = `Analyse en cours… ${secondes} s`;
    }, 1000);

    try {
        const resultat = await askModel(text);
        
        const reponse = JSON.parse(resultat);
        entreeHistorique.reponse = isValidOrderResponse(reponse)
            ? reponse
            : { items: [] };
        entreeHistorique.tempsIA = (Date.now() - debut) / 1000;

        message.textContent = "Création du ticket…";
        return  entreeHistorique.reponse ;
    } catch (error) {
        erreur = `Erreur : ${error.message}`;
        message.textContent = erreur;
        return null;
    
    } finally {

        clearInterval(timer);
        historiqueIA.push(entreeHistorique);
        try {
            sauvegarderHistoriqueIA();
        } catch (error) {
            console.error(
                "Impossible de sauvegarder l'historique IA :",
                error
            );
        }
        if (!erreur) {
            message.textContent = `Analyse terminée en ${Math.round((Date.now() - debut) / 1000)} s`;
        }
        bouton.disabled = false;
    }
}

function isValidOrderResponse(response) {
    return response !== null
        && typeof response === "object"
        && Array.isArray(response.items)
        && response.items.every((item) =>
            item !== null
            && typeof item === "object"
            && Number.isInteger(item.id)
            && menu.some((menuItem) => menuItem.id === item.id)
            && Number.isInteger(item.quantity)
            && item.quantity >= 1
            && item.quantity <= 10
        );
}







/*  prevoir affichage histo IA
console.table(
    historiqueIA.map((entree) => ({
        date: entree.date,
        requete: entree.requete,
        dureeSecondes: (
            entree.dureeTotaleMs / 1000
        ).toFixed(2),
        erreur: entree.erreur
    }))
);*/