//const $ = (selector) => document.querySelector(selector);

const MODEL_NAME = "sesam-order";
const OLLAMA_URL = "http://localhost:11434/api/chat";

/*const orderPrompt = menu.map((item) => `${item.id} : ${item.name}`).join("\n");*/
const orderPrompt = menu
  .map((item) => `ID=${item.id} | PRODUIT=${item.name}`)
  .join("\n");

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

const messages = [];
const pormtsysteme = [{
          role: "system",
          content: `
Voici le catalogue des produits disponibles.

Format : ID | PRODUIT

${orderPrompt}

Pour chaque produit demandé :
- Recherche la correspondance dans le catalogue.
- Retourne l'identifiant exact du produit.
- Indique la quantité demandée.
- N'invente aucun identifiant.
`
        }];

async function askModel(message) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        ...pormtsysteme,
        ...message
      ],
      keep_alive: "10m",
      think: false, // pas de brouillon « Thinking… » : la réponse directement
      stream: false, // la réponse en un seul bloc, quand elle est finie
      format: orderSchema, // permet le formatage automatique de la réponse en JSON, et la validation du format
      num_predict: 80, // nombre de réponses à générer
    }),
  });

  const data = await response.json();

  // response.ok vaut false si Ollama a répondu par une erreur (modèle introuvable...)
  if (!response.ok) {
    throw new Error(data.error);
  }
  return data.message.content;
}

async function sendMessage(text) {
    if (!text.trim()) {
        return;
    }
    let answer = {};
    
    messages.push({ role: "user", content: text });

    $("#ai-order-button").disabled = true;
    const thinking = $("#ai-order-message");
    thinking.textContent = "Analyse en cours… 0 s";
    const start = Date.now();
    const timer = setInterval(() => {
        const seconds = Math.round((Date.now() - start) / 1000);
        thinking.textContent = `Analyse en cours… ${seconds} s`;
    }, 1000);

    try {
        answer = await askModel(messages);
        messages.push({ role: "assistant", content: answer });
        thinking.textContent = `Création du ticket`;
    } catch (error) {
        thinking.textContent = `Oups : ${error.message} (le détail est dans la console, F12)`;
        console.error(error);
    }

    clearInterval(timer);
    thinking.textContent = `Analyse terminée en ${Math.round((Date.now() - start) / 1000)} s`;
    $("#ai-order-button").disabled = false;
    return JSON.parse(answer); 
}