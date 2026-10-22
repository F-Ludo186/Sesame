const ORDER_AI_HISTORY_KEY = "historiqueIA";
const ADVICE_AI_HISTORY_KEY = "historiqueAdvice";

function InitHistoryIA() {
  const orders = readAIHistory(ORDER_AI_HISTORY_KEY);
  const advice = readAIHistory(ADVICE_AI_HISTORY_KEY);

  bindAIHistoryFilters("order", orders, renderOrderAIHistory);
  bindAIHistoryFilters("advice", advice, renderAdviceAIHistory);
}

function readAIHistory(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error(`Historique illisible (${key}) :`, error);
    return [];
  }
}

function bindAIHistoryFilters(prefix, entries, render) {
  const form = document.querySelector(`#${prefix}-history-filters`);
  const controls = [
    document.querySelector(`#${prefix}-history-search`),
    document.querySelector(`#${prefix}-history-from`),
    document.querySelector(`#${prefix}-history-to`),
    document.querySelector(`#${prefix}-history-status`)
  ];

  form.addEventListener("submit", event => event.preventDefault());
  controls.forEach(control => control.addEventListener("input", () => {
    render(filterAIHistory(entries, prefix));
  }));
  controls[3].addEventListener("change", () => {
    render(filterAIHistory(entries, prefix));
  });

  render(filterAIHistory(entries, prefix));
}

function filterAIHistory(entries, prefix) {
  const query = normalizeHistoryText(
    document.querySelector(`#${prefix}-history-search`).value
  );
  const from = document.querySelector(`#${prefix}-history-from`).value;
  const to = document.querySelector(`#${prefix}-history-to`).value;
  const status = document.querySelector(`#${prefix}-history-status`).value;

  return [...entries]
    .filter(entry => {
      const response = getHistoryResponse(entry);
      const hasResult = getHistoryLines(response).length > 0;
      const date = getLocalDateKey(entry.date);
      const searchable = getHistorySearchText(entry, response, prefix);

      if (query && !normalizeHistoryText(searchable).includes(query)) return false;
      if (from && (!date || date < from)) return false;
      if (to && (!date || date > to)) return false;
      if (status === "success" && !hasResult) return false;
      if (status === "error" && hasResult) return false;
      return true;
    })
    .sort((a, b) => getTimestamp(b.date) - getTimestamp(a.date));
}

function getHistoryResponse(entry) {
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

function getHistorySearchText(entry, response, prefix) {
  const productNames = getHistoryLines(response)
    .map(line => menu.find(item => item.id === line?.id)?.name || "")
    .join(" ");

  if (prefix === "advice") {
    return [entry.texteClient, response?.prenom, response?.phrase, productNames].join(" ");
  }
  return [entry.texteClient, response?.prenom, productNames].join(" ");
}

function getHistoryLines(response) {
  return Array.isArray(response?.lines)
    ? response.lines.filter(line => line && typeof line === "object")
    : [];
}

function renderOrderAIHistory(entries) {
  const body = document.querySelector("#order-history-body");
  body.replaceChildren();

  entries.forEach(entry => {
    const response = getHistoryResponse(entry);
    const row = document.createElement("tr");
    appendHistoryCell(row, formatHistoryDate(entry.date));
    appendHistoryCell(row, entry.texteClient || "—");

    const resultCell = document.createElement("td");
    const lines = getHistoryLines(response);
    if (lines.length > 0) {
      const list = document.createElement("ul");
      lines.forEach(line => {
        const item = menu.find(product => product.id === line.id);
        const detail = document.createElement("li");
        detail.textContent = `${item?.name || `Produit #${line.id}`} × ${line.quantity}`;
        list.append(detail);
      });
      resultCell.append(list);
      if (response.prenom) appendHistoryNote(resultCell, `Prénom : ${response.prenom}`);
    } else {
      resultCell.textContent = "Aucun produit reconnu";
      resultCell.classList.add("is-empty-result");
    }
    appendHistoryNote(resultCell, formatHistoryDuration(entry.tempsIA));
    row.append(resultCell);
    body.append(row);
  });

  updateHistorySummary("order", entries.length);
}

function renderAdviceAIHistory(entries) {
  const body = document.querySelector("#advice-history-body");
  body.replaceChildren();

  entries.forEach(entry => {
    const response = getHistoryResponse(entry);
    const row = document.createElement("tr");
    appendHistoryCell(row, formatHistoryDate(entry.date));

    const suggestionCell = document.createElement("td");
    appendHistoryNote(suggestionCell, `Envie : ${entry.texteClient || "—"}`);
    const lines = getHistoryLines(response);
    if (lines.length > 0) {
      const list = document.createElement("ul");
      lines.forEach(line => {
        const product = menu.find(item => item.id === line.id);
        const item = document.createElement("li");
        item.textContent = product?.name || `Produit #${line.id}`;
        list.append(item);
      });
      suggestionCell.append(list);
      if (response.phrase) appendHistoryNote(suggestionCell, response.phrase);
    } else {
      appendHistoryNote(suggestionCell, "Aucune suggestion enregistrée", true);
    }
    appendHistoryNote(suggestionCell, formatHistoryDuration(entry.tempsIA));
    row.append(suggestionCell);

    const firstName = response?.prenom || "—";
    appendHistoryCell(row, firstName);
    body.append(row);
  });

  updateHistorySummary("advice", entries.length);
}

function appendHistoryCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function appendHistoryNote(parent, text, isMuted = false) {
  const note = document.createElement("p");
  note.className = isMuted ? "ai-history-note is-muted" : "ai-history-note";
  note.textContent = text;
  parent.append(note);
}

function updateHistorySummary(prefix, count) {
  document.querySelector(`#${prefix}-history-count`).textContent =
    `${count} résultat${count === 1 ? "" : "s"}`;
  document.querySelector(`#${prefix}-history-empty`).hidden = count !== 0;
}

function formatHistoryDate(value) {
  const timestamp = getTimestamp(value);
  return Number.isNaN(timestamp)
    ? "Date inconnue"
    : new Date(timestamp).toLocaleString("fr-FR");
}

function formatHistoryDuration(value) {
  return Number.isFinite(value) ? `${value.toFixed(1)} s` : "Durée inconnue";
}

function getTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLocalDateKey(value) {
  const timestamp = getTimestamp(value);
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeHistoryText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
