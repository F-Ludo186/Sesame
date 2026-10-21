const MODEL_NAME_ADVICE = "sesam-advice";
const CLE_HISTORIQUE_IA_ADVICE = "historiqueAdvice";

const orderPromptAdvice = `Les client te donne leur envie sur ce qu'il veulent a toi de les conseiller.
trouve au maximun 2 produits qui correspondent le mieux a leur demande.
si tu detectes un prenom, indique le dans le champ "prenom".
Explique ton choix en une phrase courte dans le champ "phrase".
N'invente ni produit ni identifiant et ne retourne jamais une quantite de 0.
Retourne uniquement un JSON conforme au schema.

Carte :
${JSON.stringify(
    menu
        .filter(({ available }) => available === true)
        .map(({ id, name }) => ({ id, name }))
    , null, 2
)}`;

// Schema de validation de la reponse de Ollama.
const orderSchemaAdvice = {
    type: "object",
    properties: {
        prenom: { type: "string" },
        phrase: { type: "string" },
        lines: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                },
                required: ["id"],
                additionalProperties: false
            }
        }
    },
    required: ["lines"],
    additionalProperties: false
};

// Instructions et catalogue transmis a Ollama a chaque requete.
const orderSystemMessageAdvice = {
    role: "system",
    content: orderPromptAdvice
};

// ============================================================
// HISTORIQUE pour l'IA
// ============================================================

// Historique IA en localStorage
const historiqueAdvice = JSON.parse( localStorage.getItem(CLE_HISTORIQUE_IA_ADVICE) || "[]");
// Save l'historique dans le navigateur
function sauvegarderHistoriqueIA() { 
    localStorage.setItem(CLE_HISTORIQUE_IA_ADVICE, JSON.stringify(historiqueAdvice));
}
 
async function askAdvice(messages, format) {
    const body = {
        model: MODEL_NAME_ADVICE,
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

async function sendAdvice(text) {
    if (!text.trim()) {
        return;
    }
    
    const bouton = $("#ai-advice-button");
    const message = $("#ai-advice-message");
    
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
    message.textContent = "Qwen analyse la demande… 0 s";

    timer = setInterval(() => {
        const secondes = Math.floor((Date.now() - debut) / 1000);
        message.textContent = `Qwen analyse la demande… ${secondes} s`;
    }, 1000);

    try {
        const resultat = await askAdvice([
            orderSystemMessageAdvice,
            { role: "user", content: text }
        ], orderSchemaAdvice);
        
        const erreurIa = ctrlErreurIa(resultat);
        if (erreurIa) {
            $("#ai-advice-message-error").textContent = erreurIa;
            return null;
        }
        let response;
        try {
            response = JSON.parse(resultat.data.message.content);
        } catch {
            $("#ai-advice-message-error").textContent =
            "L'IA a renvoyé un contenu JSON invalide.";
            return null;
        }
        
        entreeHistorique.reponse = isValidOrderResponse(response)
            ? response
            : { lines: [] };

        entreeHistorique.tempsIA = (Date.now() - debut) / 1000;

        message.textContent = "Affichage des conseils…";
        return  entreeHistorique.reponse ;
    } catch (error) {
        erreur = `Erreur : ${error.message}`;
        $("#ai-advice-message-error").textContent =
            "L'IA ne répond pas : prends la commande à la main";
        message.textContent = "";
        return null;
    
    } finally {

        clearInterval(timer);
        historiqueAdvice.push(entreeHistorique);
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
