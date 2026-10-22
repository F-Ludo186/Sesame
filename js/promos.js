const PROMOS_STOCK_KEY = "promosStock";
const PROMOS_CONFIG_KEY = "promosConfig";

const promos = [
  { code: "SSM005", remise: 5, nb: 15, libelle: "remise de 05 %" },
  { code: "SSM010", remise: 10, nb: 10, libelle: "remise de 10 %" },
  { code: "SSM015", remise: 15, nb: 7, libelle: "remise de 15 %" },
  { code: "SSM020", remise: 20, nb: 4, libelle: "remise de 20 %" },
  { code: "SSM050", remise: 50, nb: 3, libelle: "remise de 50 %" },
  { code: "SSM100", remise: 100, nb: 2, libelle: "remise de 100 %" }
];

function loadPromoConfiguration() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROMOS_CONFIG_KEY) || "null");
    if (!Array.isArray(saved)) return;

    const validPromos = saved.filter(promo =>
      promo && typeof promo.code === "string"
      && Number.isInteger(promo.remise) && promo.remise >= 1 && promo.remise <= 100
      && Number.isInteger(promo.nb) && promo.nb >= 0
      && typeof promo.libelle === "string"
    );
    if (validPromos.length > 0 || saved.length === 0) {
      promos.splice(0, promos.length, ...validPromos);
    }
  } catch {
    // Configuration illisible : les promotions par défaut restent disponibles.
  }
}

function loadPromoStocks() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROMOS_STOCK_KEY) || "{}");
    for (const promo of promos) {
      if (Number.isInteger(saved[promo.code]) && saved[promo.code] >= 0) {
        promo.nb = saved[promo.code];
      }
    }
  } catch {
    // Stock illisible : on conserve les valeurs de la configuration.
  }
}

function savePromoStocks() {
  const stocks = {};
  for (const promo of promos) stocks[promo.code] = promo.nb;
  localStorage.setItem(PROMOS_STOCK_KEY, JSON.stringify(stocks));
}

function savePromoConfiguration() {
  const previousConfiguration = localStorage.getItem(PROMOS_CONFIG_KEY);
  const previousStocks = localStorage.getItem(PROMOS_STOCK_KEY);
  try {
    localStorage.setItem(PROMOS_CONFIG_KEY, JSON.stringify(promos));
    savePromoStocks();
  } catch (error) {
    try {
      if (previousConfiguration === null) localStorage.removeItem(PROMOS_CONFIG_KEY);
      else localStorage.setItem(PROMOS_CONFIG_KEY, previousConfiguration);
      if (previousStocks === null) localStorage.removeItem(PROMOS_STOCK_KEY);
      else localStorage.setItem(PROMOS_STOCK_KEY, previousStocks);
    } catch (rollbackError) {
      console.error("Impossible de restaurer le stockage des promotions :", rollbackError);
    }
    throw error;
  }
}

function initPromotionsAdmin() {
  const root = document.querySelector("#promotions-admin");
  if (!root) return;

  const form = root.querySelector("#promo-admin-form");
  const message = root.querySelector("#promo-admin-message");
  let editingCode = null;

  function resetForm() {
    form.reset();
    editingCode = null;
    root.querySelector("#promo-admin-submit").textContent = "Créer la promotion";
    root.querySelector("#promo-admin-cancel").hidden = true;
  }

  function renderPromotions() {
    const body = root.querySelector("#promo-admin-body");
    body.replaceChildren();

    [...promos]
      .sort((a, b) => a.code.localeCompare(b.code))
      .forEach(promo => {
        const row = document.createElement("tr");
        appendPromoCell(row, promo.code);
        appendPromoCell(row, promo.libelle);
        appendPromoCell(row, `${promo.remise} %`);
        appendPromoCell(row, String(promo.nb));

        const actions = document.createElement("td");
        actions.className = "promo-admin-actions";
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "promo-action-button";
        editButton.textContent = "Modifier";
        editButton.addEventListener("click", () => {
          editingCode = promo.code;
          form.elements.code.value = promo.code;
          form.elements.libelle.value = promo.libelle;
          form.elements.remise.value = promo.remise;
          form.elements.nb.value = promo.nb;
          root.querySelector("#promo-admin-submit").textContent = "Enregistrer";
          root.querySelector("#promo-admin-cancel").hidden = false;
          message.textContent = `Modification de ${promo.code}.`;
          form.elements.code.focus();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "promo-action-button is-danger";
        deleteButton.textContent = "Supprimer";
        deleteButton.addEventListener("click", () => {
          const index = promos.findIndex(item => item.code === promo.code);
          if (index === -1) return;

          promos.splice(index, 1);
          if (!persistPromoAdminChanges()) {
            promos.splice(index, 0, promo);
            message.textContent = "Impossible d'enregistrer la suppression dans le stockage local.";
            return;
          }

          if (typeof order !== "undefined" && order.promo?.code === promo.code) {
            order.removePromo();
            if (typeof displayPromotion === "function") displayPromotion();
            if (typeof displayTicket === "function") displayTicket();
            message.textContent = `${promo.code} supprimée. La remise active a été retirée du ticket.`;
          } else {
            message.textContent = `${promo.code} supprimée.`;
          }
          if (editingCode === promo.code) resetForm();
          refreshPromoAdmin();
        });

        actions.append(editButton, deleteButton);
        row.append(actions);
        body.append(row);
      });

    root.querySelector("#promo-admin-empty").hidden = promos.length > 0;
  }

  function refreshPromoAdmin() {
    renderPromotions();
    if (typeof updatePromotionTooltip === "function") updatePromotionTooltip();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    message.textContent = "";

    const code = form.elements.code.value.trim().toUpperCase().replace(/\s+/g, "-");
    const libelle = form.elements.libelle.value.trim();
    const remise = Number(form.elements.remise.value);
    const nb = Number(form.elements.nb.value);

    if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
      message.textContent = "Le code doit contenir de 3 à 20 caractères : lettres, chiffres ou tirets.";
      form.elements.code.focus();
      return;
    }
    if (!libelle) {
      message.textContent = "Saisis un libellé pour cette promotion.";
      form.elements.libelle.focus();
      return;
    }
    if (!Number.isInteger(remise) || remise < 1 || remise > 100) {
      message.textContent = "La remise doit être un nombre entier entre 1 et 100 %.";
      form.elements.remise.focus();
      return;
    }
    if (!Number.isInteger(nb) || nb < 0) {
      message.textContent = "Le stock doit être un entier positif ou égal à zéro.";
      form.elements.nb.focus();
      return;
    }
    if (promos.some(promo => promo.code === code && promo.code !== editingCode)) {
      message.textContent = "Ce code promo existe déjà.";
      form.elements.code.focus();
      return;
    }

    const previous = promos.map(promo => ({ reference: promo, values: { ...promo } }));
    const updated = { code, libelle, remise, nb };
    if (editingCode) {
      const index = promos.findIndex(promo => promo.code === editingCode);
      if (index === -1) {
        message.textContent = "Cette promotion n'existe plus.";
        resetForm();
        refreshPromoAdmin();
        return;
      }
      Object.assign(promos[index], updated);
    } else {
      promos.push(updated);
    }

    if (!persistPromoAdminChanges()) {
      previous.forEach(({ reference, values }) => Object.assign(reference, values));
      promos.splice(0, promos.length, ...previous.map(({ reference }) => reference));
      message.textContent = "Impossible d'enregistrer la promotion dans le stockage local.";
      refreshPromoAdmin();
      return;
    }

    message.textContent = editingCode
      ? `Promotion ${code} mise à jour.`
      : `Promotion ${code} créée.`;
    resetForm();
    refreshPromoAdmin();
  });

  root.querySelector("#promo-admin-cancel").addEventListener("click", () => {
    resetForm();
    message.textContent = "Modification annulée.";
  });

  refreshPromoAdmin();
}

function persistPromoAdminChanges() {
  try {
    savePromoConfiguration();
    return true;
  } catch (error) {
    console.error("Impossible d'enregistrer les promotions :", error);
    return false;
  }
}

function appendPromoCell(row, text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  row.append(cell);
}

loadPromoConfiguration();
loadPromoStocks();
