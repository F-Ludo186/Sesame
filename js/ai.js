//const $ = (selector) => document.querySelector(selector);

const MODEL_NAME = "sesam-order";
const OLLAMA_URL = "http://localhost:11434/api/chat";
const CLE_HISTORIQUE_IA = "historiqueIA";

// Prompt systeme et catalogue transmis a Ollama.
const orderPrompt = `Tu prends les commandes du cafe Sesame.
Associe chaque produit demande a son id exact dans la carte ci-dessous.
Pour chaque produit, indique son id et sa quantite.
La correspondance doit etre sans ambiguite. 
N'invente ni produit ni identifiant et ne retourne jamais une quantite de 0.
Retourne uniquement un JSON conforme au schema.

Carte :
${JSON.stringify(menu.map(({ id, name }) => ({ id, name })), null, 2)}`;

// Schema de validation de la reponse de Ollama.
const orderSchema = {
    type: "object",
    properties: {
        lines: {
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
    required: ["lines"],
    additionalProperties: false
};

// Instructions et catalogue transmis a Ollama a chaque requete.
const orderSystemMessage = {
    role: "system",
    content: orderPrompt
};


// ============================================================
// HISTORIQUE pour l'IA
// ============================================================

// Historique IA en localStorage
const historiqueIA = JSON.parse( localStorage.getItem(CLE_HISTORIQUE_IA) || "[]");
// Save l'historique dans le navigateur
function sauvegarderHistoriqueIA() { 
    localStorage.setItem(CLE_HISTORIQUE_IA, JSON.stringify(historiqueIA));
}
 
async function askModel(messages, format) {
    const body = {
        model: MODEL_NAME,
        messages,
        keep_alive: "10m",
        think: false,
        stream: false,
        options: {
            temperature: 0,
            num_predict: -1
        }
    };
    if (format) {
        body.format = format;
    }

    const response = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    // response.ok vaut false si Ollama a répondu par une erreur (modèle introuvable...)
    if (!response.ok) {
        throw new Error(data.error);
    }
    if (typeof data.message?.content !== "string") {
        throw new Error("Ollama a renvoye une reponse vide ou invalide.");
    }
    return data.message.content;
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
    message.textContent = "Qwen prend la commande… 0 s";

    timer = setInterval(() => {
        const secondes = Math.floor((Date.now() - debut) / 1000);
        message.textContent = `Qwen prend la commande… ${secondes} s`;
    }, 1000);

    try {
        const resultat = await askModel([
            orderSystemMessage,
            { role: "user", content: text }
        ], orderSchema);
        
        const reponse = JSON.parse(resultat);
        entreeHistorique.reponse = isValidOrderResponse(reponse)
            ? reponse
            : { lines: [] };
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
        && Array.isArray(response.lines)
        && response.lines.every((item) =>
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