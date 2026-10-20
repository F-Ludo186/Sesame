//const $ = (selector) => document.querySelector(selector);

const MODEL_NAME = "sesam-order";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const CLE_HISTORIQUE_IA = "historiqueIA";

// Catalogue a trasmettre a Ollama.
const orderPrompt = menu
    .map((item) => `ID=${item.id} | PRODUIT=${item.name}`)
    .join("\n");

// Shema de validation de la reponse de Ollama. 
const orderSchema = {
properties: {
    items: {
        type: "array",
        items: {
            type: "object",
            properties: {
                id: { type: "integer" },
                quantity: { type: "integer" }
            },
            required: ["id", "quantity"],
            additionalProperties: false
        }
    }
}};

//Instruction et tableau des produit pour Ollama a chaque requete. 
const pormtsysteme = [{
    role: "system",
    content: `
Voici le catalogue des produits disponibles.
Format : ID | PRODUIT
${orderPrompt}`
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
                num_predict: 60 // limite le nombre de token en sortie pour éviter les réponses trop longues
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

    bouton.disabled = true;
    message.textContent = "Analyse en cours… 0 s";

    timer = setInterval(() => {
        const secondes = Math.floor((Date.now() - debut) / 1000);
        message.textContent = `Analyse en cours… ${secondes} s`;
    }, 1000);

    try {
        const resultat = await askModel(text);
        
        entreeHistorique.reponse = JSON.parse(resultat) ;
        entreeHistorique.tempsIA = (Date.now() - debut) / 1000;

        message.textContent = "Création du ticket…";
        return  entreeHistorique.reponse ;
    } catch (error) {
        message.textContent = `Erreur : ${error.message}`;
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
        message.textContent = `Analyse terminée en ${Math.round((Date.now() - debut) / 1000)} s`;
        bouton.disabled = false;
    }
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