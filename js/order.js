class Order {

    constructor(customerName = "") {
        this.customerName = customerName;
        this.lines = [];
        this.promo = null;
        this.date = Date.now();
    }

    addArticle(article) {
        let line = this.lines.find(
            (item) => item.id === article.id
        );

        if (!line) {
            line = {
                id: article.id,
                name: article.name,
                unitPrice: article.price,
                quantity: 1
            };

            this.lines.push(line);
        } else {
            line.quantity++;
        }
    }

    removeArticle(article) {
        const line = this.lines.find(
            (item) => item.id === article.id
        );

        if (!line) return;

        line.quantity--;

        if (line.quantity === 0) {
            const index = this.lines.findIndex(
                (item) => item.id === article.id
            );

            this.lines.splice(index, 1);
        }
    }

    applyPromo(promo) {
        this.promo = promo;
    }

    removePromo() {
        this.promo = null;
    }

    getSubtotal() {
        return this.lines.reduce((total, line) => {
            return total + line.quantity * line.unitPrice;
        }, 0);
    }

    getDiscount() {
        if (!this.promo) return 0;

        return -(this.getSubtotal() * this.promo.remise) / 100;
    }

    getTotal() {
        return this.getSubtotal() + this.getDiscount();
    }

    isEmpty() {
        return this.lines.length === 0;
    }
}