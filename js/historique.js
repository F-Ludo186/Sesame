const ORDER_HISTORY_STORAGE_KEY = "historiqueTickets";

function InitHistory() {
  const history = readOrderHistory();
  const filters = document.querySelector("#history-filters");
  const controls = [
    document.querySelector("#history-search"),
    document.querySelector("#history-from"),
    document.querySelector("#history-to"),
    document.querySelector("#history-promo-filter"),
    document.querySelector("#history-sort")
  ];

  filters.addEventListener("submit", event => event.preventDefault());
  controls.slice(0, 3).forEach(control => {
    control.addEventListener("input", () => renderOrderHistory(filterOrderHistory(history)));
  });
  controls.slice(3).forEach(control => {
    control.addEventListener("change", () => renderOrderHistory(filterOrderHistory(history)));
  });

  renderOrderHistory(filterOrderHistory(history));
}

function readOrderHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(ORDER_HISTORY_STORAGE_KEY) || "[]");
    return Array.isArray(history) ? history.filter(order => order && typeof order === "object") : [];
  } catch (error) {
    console.error("Impossible de lire l'historique des commandes :", error);
    return [];
  }
}

function filterOrderHistory(history) {
  const query = normalizeOrderHistoryText(document.querySelector("#history-search").value);
  const from = document.querySelector("#history-from").value;
  const to = document.querySelector("#history-to").value;
  const promoFilter = document.querySelector("#history-promo-filter").value;
  const sortOrder = document.querySelector("#history-sort").value;

  return [...history]
    .filter(order => {
      const date = orderHistoryDateKey(order.date);
      const hasPromo = Boolean(order.promo && typeof order.promo === "object");
      const searchableText = [
        order.customerName,
        order.promo?.code,
        order.promo?.libelle,
        ...getOrderHistoryLines(order).map(line => line.name)
      ].join(" ");

      if (query && !normalizeOrderHistoryText(searchableText).includes(query)) return false;
      if (from && (!date || date < from)) return false;
      if (to && (!date || date > to)) return false;
      if (promoFilter === "with-promo" && !hasPromo) return false;
      if (promoFilter === "without-promo" && hasPromo) return false;
      return true;
    })
    .sort((a, b) => {
      const difference = getOrderHistoryTimestamp(a.date) - getOrderHistoryTimestamp(b.date);
      return sortOrder === "oldest" ? difference : -difference;
    });
}

function renderOrderHistory(orders) {
  const body = document.querySelector("#history-table-body");
  body.replaceChildren();

  orders.forEach((order, index) => {
    const row = document.createElement("tr");
    addOrderHistoryCell(row, formatOrderHistoryDate(order.date));
    addOrderHistoryCell(row, order.customerName || "—");

    const lines = getOrderHistoryLines(order);
    const articleCount = lines.reduce((total, line) => {
      return total + (Number.isInteger(line.quantity) && line.quantity > 0 ? line.quantity : 0);
    }, 0);
    addOrderHistoryCell(row, `${articleCount} article${articleCount === 1 ? "" : "s"}`);

    const promo = order.promo && typeof order.promo === "object" ? order.promo : null;
    addOrderHistoryCell(row, promo ? (promo.code || promo.libelle || "Appliquée") : "—");
    addOrderHistoryCell(row, formatPrice(Number.isFinite(order.totalorder) ? order.totalorder : 0));

    const detailCell = document.createElement("td");
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "order-history-detail-button";
    detailButton.textContent = "Voir";
    detailButton.setAttribute("aria-expanded", "false");
    detailButton.setAttribute("aria-controls", `order-history-detail-${index}`);
    detailCell.append(detailButton);
    row.append(detailCell);

    const detailRow = document.createElement("tr");
    detailRow.className = "order-history-detail-row";
    detailRow.hidden = true;
    detailRow.id = `order-history-detail-${index}`;
    const detailContentCell = document.createElement("td");
    detailContentCell.colSpan = 6;
    detailContentCell.append(createOrderHistoryDetails(order));
    detailRow.append(detailContentCell);

    detailButton.addEventListener("click", () => {
      const expanded = detailButton.getAttribute("aria-expanded") === "true";
      detailButton.setAttribute("aria-expanded", String(!expanded));
      detailButton.textContent = expanded ? "Voir" : "Masquer";
      detailRow.hidden = expanded;
    });

    body.append(row, detailRow);
  });

  document.querySelector("#history-count").textContent =
    `${orders.length} commande${orders.length === 1 ? "" : "s"}`;
  document.querySelector("#history-empty").hidden = orders.length !== 0;
}

function createOrderHistoryDetails(order) {
  const details = document.createElement("div");
  details.className = "order-history-detail";

  const title = document.createElement("h4");
  title.textContent = `Ticket de ${order.customerName || "client inconnu"}`;
  details.append(title);

  const list = document.createElement("ul");
  const lines = getOrderHistoryLines(order);
  if (lines.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "Aucun détail d'article enregistré.";
    list.append(empty);
  } else {
    lines.forEach(line => {
      const item = document.createElement("li");
      const quantity = Number.isInteger(line.quantity) ? line.quantity : 0;
      const unitPrice = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
      item.textContent = `${line.name || "Article"} × ${quantity} — ${formatPrice(unitPrice * quantity)}`;
      list.append(item);
    });
  }
  details.append(list);

  const promo = order.promo && typeof order.promo === "object" ? order.promo : null;
  if (promo) {
    const promoLine = document.createElement("p");
    const promoLabel = promo.libelle || promo.code || "Promotion";
    const discount = Number.isFinite(order.totalRemise) ? formatPrice(order.totalRemise) : "";
    promoLine.textContent = discount ? `${promoLabel} : ${discount}` : promoLabel;
    details.append(promoLine);
  }

  const total = document.createElement("p");
  total.className = "order-history-detail-total";
  total.textContent = `Total : ${formatPrice(Number.isFinite(order.totalorder) ? order.totalorder : 0)}`;
  details.append(total);

  return details;
}

function getOrderHistoryLines(order) {
  return Array.isArray(order?.lines)
    ? order.lines.filter(line => line && typeof line === "object")
    : [];
}

function addOrderHistoryCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

function formatOrderHistoryDate(value) {
  const timestamp = getOrderHistoryTimestamp(value);
  return timestamp === null ? "Date inconnue" : formatDateHeure(timestamp);
}

function getOrderHistoryTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function orderHistoryDateKey(value) {
  const timestamp = getOrderHistoryTimestamp(value);
  if (timestamp === null) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeOrderHistoryText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("fr-FR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
