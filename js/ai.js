//const $ = (selector) => document.querySelector(selector);

let MODEL_NAME = "sesam-order";

let OLLAMA_URL = "http://localhost:11434/api/chat";
let CLE_HISTORIQUE_IA = "historiqueIA";

// Prompt systeme et catalogue transmis a Ollama.
let orderPrompt = `Tu prends les commandes du cafe Sesame.
Associe chaque produit demande a son id exact dans la carte ci-dessous.
Pour chaque produit, indique son id et sa quantite.
si tu detectes un prenom, indique le dans le champ "prenom".
La correspondance doit etre sans ambiguite. 
N'invente ni produit ni identifiant et ne retourne jamais une quantite de 0.
Retourne uniquement un JSON conforme au schema.

Carte :
${JSON.stringify(menu.map(({ id, name }) => ({ id, name })), null, 2)}`;

// Schema de validation de la reponse de Ollama.
let orderSchema = {
    type: "object",
    properties: {
        prenom: { type: "string" },
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
    
    try {
        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        let data;

        try {
            data = await response.json();
        } catch {
           return {
                ok: false,
                status: response.status,
                error: "La réponse du serveur n'est pas un JSON valide."
            };
        }

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                error: data.error || "Erreur renvoyée par Ollama."
            };
        }

        return {
            ok: true,
            status: response.status,
            data
        };

    } catch (error) {
        // fetch a échoué avant de recevoir une réponse HTTP
        return {
            ok: false,
            status: 0,
            data: { error: error.message }
        };
    }
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
        
        const erreurIa = ctrlErreurIa(resultat);
        if (erreurIa) {
            $("#ai-order-message-error").textContent = erreurIa;
            return null;
        }
        let response;
        try {
            response = JSON.parse(resultat.data.message.content);
        } catch {
            $("#ai-order-message-error").textContent =
            "L'IA a renvoyé un contenu JSON invalide.";
            return null;
        }
        
        entreeHistorique.reponse = isValidOrderResponse(response)
            ? response
            : { lines: [] };

        entreeHistorique.tempsIA = (Date.now() - debut) / 1000;

        message.textContent = "Création du ticket…";
        return  entreeHistorique.reponse ;
    } catch (error) {
        erreur = `Erreur : ${error.message}`;
        $("#ai-order-message-error").textContent =
            "L'IA ne répond pas : prends la commande à la main";
        message.textContent = "";
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

function ctrlErreurIa(resultat) {
    if (!resultat.ok) {
        if (resultat.status === 404) {
            return "Modèle Ollama introuvable.";
        }

        return "L'IA ne répond pas : prends la commande à la main";
    }

    if (typeof resultat.data.message?.content !== "string") {
        return "Réponse invalide de l'IA.";
    }

    return null;
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
