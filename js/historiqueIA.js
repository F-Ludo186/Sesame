const ORDER_AI_HISTORY_KEY = "historiqueIA";
const ADVICE_AI_HISTORY_KEY = "historiqueAdvice";

function InitHistoryIA() {
  const orderEntries = readAIHistory(ORDER_AI_HISTORY_KEY);
  const adviceEntries = readAIHistory(ADVICE_AI_HISTORY_KEY);

  bindAIHistoryFilters("order", orderEntries, renderOrderAIHistory);
  bindAIHistoryFilters("advice", adviceEntries, renderAdviceAIHistory);
}

function readAIHistory(key) {
  try {
    const entries = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(entries)
      ? entries.filter(entry => entry && typeof entry === "object")
      : [];
  } catch (error) {
    console.error(`Impossible de lire l'historique ${key} :`, error);
    return [];
  }
}

function bindAIHistoryFilters(prefix, entries, render) {
  const form = document.querySelector(`#${prefix}-history-filters`);
  const search = document.querySelector(`#${prefix}-history-search`);
  const from = document.querySelector(`#${prefix}-history-from`);
  const to = document.querySelector(`#${prefix}-history-to`);
  const status = document.querySelector(`#${prefix}-history-status`);

  form.addEventListener("submit", event => event.preventDefault());

  const update = () => render(filterAIHistory(entries, prefix));
  search.addEventListener("input", update);
  from.addEventListener("input", update);
  to.addEventListener("input", update);
  status.addEventListener("change", update);
  update();
}

function filterAIHistory(entries, prefix) {
  const search = normalizeAIHistoryText(
    document.querySelector(`#${prefix}-history-search`).value
  );
  const from = document.querySelector(`#${prefix}-history-from`).value;
  const to = document.querySelector(`#${prefix}-history-to`).value;
  const status = document.querySelector(`#${prefix}-history-status`).value;

  return [...entries]
    .filter(entry => {
      const response = getAIHistoryResponse(entry);
      const hasResult = getAIHistoryLines(response).length > 0;
      const date = getAIHistoryDateKey(entry.date);
      const searchable = getAIHistorySearchText(entry, response, prefix);

      if (search && !normalizeAIHistoryText(searchable).includes(search)) return false;
      if (from && (!date || date < from)) return false;
      if (to && (!date || date > to)) return false;
      if (status === "success" && !hasResult) return false;
      if (status === "error" && hasResult) return false;
      return true;
    })
    .sort((a, b) => getAIHistoryTimestamp(b.date) - getAIHistoryTimestamp(a.date));
}

function getAIHistoryResponse(entry) {
  if (entry?.reponse && typeof entry.reponse === "object") return entry.reponse;
  if (typeof entry?.reponse === "string") {
    try {
      return JSON.parse(entry.reponse);
    } catch {
      return null;
    }
  }
  return null;
}

function getAIHistoryLines(response) {
  return Array.isArray(response?.lines)
    ? response.lines.filter(line => line && typeof line === "object")
    : [];
}

function getAIHistorySearchText(entry, response, prefix) {
  const products = getAIHistoryLines(response)
    .map(line => menu.find(product => product.id === line.id)?.name || "")
    .join(" ");

  if (prefix === "advice") {
    return [entry.texteClient, response?.prenom, response?.phrase, products].join(" ");
  }
  return [entry.texteClient, response?.prenom, products].join(" ");
}

function renderOrderAIHistory(entries) {
  const body = document.querySelector("#order-history-body");
  body.replaceChildren();

  entries.forEach(entry => {
    const response = getAIHistoryResponse(entry);
    const row = document.createElement("tr");
    appendAIHistoryCell(row, formatAIHistoryDate(entry.date));
    appendAIHistoryCell(row, entry.texteClient || "—");

    const result = document.createElement("td");
    const lines = getAIHistoryLines(response);
    if (lines.length > 0) {
      const list = document.createElement("ul");
      lines.forEach(line => {
        const product = menu.find(item => item.id === line.id);
        const item = document.createElement("li");
        const quantity = Number.isInteger(line.quantity) ? ` × ${line.quantity}` : "";
        item.textContent = `${product?.name || `Produit #${line.id ?? "?"}`}${quantity}`;
        list.append(item);
      });
      result.append(list);
      if (response?.prenom) appendAIHistoryNote(result, `Prénom : ${response.prenom}`);
    } else {
      result.textContent = "Aucun produit reconnu";
      result.classList.add("is-empty-result");
    }
    appendAIHistoryNote(result, formatAIHistoryDuration(entry.tempsIA));
    row.append(result);
    body.append(row);
  });

  updateAIHistorySummary("order", entries.length);
}

function renderAdviceAIHistory(entries) {
  const body = document.querySelector("#advice-history-body");
  body.replaceChildren();

  entries.forEach(entry => {
    const response = getAIHistoryResponse(entry);
    const row = document.createElement("tr");
    appendAIHistoryCell(row, formatAIHistoryDate(entry.date));

    const suggestion = document.createElement("td");
    appendAIHistoryNote(suggestion, `Envie : ${entry.texteClient || "—"}`);
    const lines = getAIHistoryLines(response);
    if (lines.length > 0) {
      const list = document.createElement("ul");
      lines.forEach(line => {
        const product = menu.find(item => item.id === line.id);
        const item = document.createElement("li");
        item.textContent = product?.name || `Produit #${line.id ?? "?"}`;
        list.append(item);
      });
      suggestion.append(list);
      if (response?.phrase) appendAIHistoryNote(suggestion, response.phrase);
    } else {
      appendAIHistoryNote(suggestion, "Aucune suggestion enregistrée", true);
    }
    appendAIHistoryNote(suggestion, formatAIHistoryDuration(entry.tempsIA));
    row.append(suggestion);
    appendAIHistoryCell(row, response?.prenom || "—");
    body.append(row);
  });

  updateAIHistorySummary("advice", entries.length);
}

function appendAIHistoryCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function appendAIHistoryNote(parent, text, muted = false) {
  const note = document.createElement("p");
  note.className = muted ? "ai-history-note is-muted" : "ai-history-note";
  note.textContent = text;
  parent.append(note);
}

function updateAIHistorySummary(prefix, count) {
  document.querySelector(`#${prefix}-history-count`).textContent =
    `${count} résultat${count === 1 ? "" : "s"}`;
  document.querySelector(`#${prefix}-history-empty`).hidden = count !== 0;
}

function formatAIHistoryDate(value) {
  const timestamp = getAIHistoryTimestamp(value);
  return timestamp === null ? "Date inconnue" : formatDateHeure(timestamp);
}

function formatAIHistoryDuration(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} s` : "Durée inconnue";
}

function getAIHistoryTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getAIHistoryDateKey(value) {
  const timestamp = getAIHistoryTimestamp(value);
  if (timestamp === 0) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeAIHistoryText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
