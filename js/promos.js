const PROMOS_STOCK_KEY = "promosStock";

const promos =[
    {code: 'SSM005', remise: 5, nb: 15, libelle: "remise de 05 %"},
    {code: 'SSM010', remise: 10, nb: 10, libelle: "remise de 10 %"},
    {code: 'SSM015', remise: 15, nb: 7 , libelle: "remise de 15 %"},
    {code: 'SSM020', remise: 20, nb: 4 , libelle: "remise de 20 %"},
    {code: 'SSM050', remise: 50, nb: 3 , libelle: "remise de 50 %"},
    {code: 'SSM100', remise: 100, nb: 2 , libelle: "remise de 100 %"}
]

function loadPromoStocks() {
    try {
        const saved = JSON.parse(localStorage.getItem(PROMOS_STOCK_KEY) || "{}");
        for (const promo of promos) {
            if (typeof saved[promo.code] === "number") {
                promo.nb = saved[promo.code];
            }
        }
    } catch {
        // localStorage illisible : on garde les stocks de promos.js
    }
}

function savePromoStocks() {
    const stocks = {};
    for (const promo of promos) {
        stocks[promo.code] = promo.nb;
    }
    localStorage.setItem(PROMOS_STOCK_KEY, JSON.stringify(stocks));
}

loadPromoStocks();