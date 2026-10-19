const $ = (selector) => document.querySelector(selector);

const MODEL_NAME = "sesam-order";
const OLLAMA_URL = "http://localhost:11434/api/chat";

const orderPrompt = menu.map((item) => `${item.id} : ${item.name} : ${item.price}`).join("\n");
const orderSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: {
            type: "integer"
          },
          quantity: {
            type: "integer"
          }
        },
        required: ["id", "quantity"]
      }
    }
  },
  required: ["items"]
};

const messages = [];


async function askModel(message) {
  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: message,
      think: false, // pas de brouillon « Thinking… » : la réponse directement
      stream: false, // la réponse en un seul bloc, quand elle est finie
      format: orderSchema // permet le formatage automatique de la réponse en JSON, et la validation du format
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
  
  messages.push({ role: "user", content: text });

  const thinking = $("#ai-order-message");
  thinking.textContent = "Analyse en cours… 0 s";
  const start = Date.now();
  const timer = setInterval(() => {
    const seconds = Math.round((Date.now() - start) / 1000);
    thinking.textContent = `Analyse en cours… ${seconds} s`;
  }, 1000);

  try {
    const answer = await askModel(messages);
    messages.push({ role: "assistant", content: answer });
    thinking.textContent = `Création du ticket`;
  } catch (error) {
    thinking.textContent = `Oups : ${error.message} (le détail est dans la console, F12)`;
    console.error(error);
  }

  clearInterval(timer);
  thinking.textContent = `Analyse terminée en ${Math.round((Date.now() - start) / 1000)} s`;
}