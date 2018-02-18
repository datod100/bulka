import { Product } from ".";

export class Price {
    product: Product;
    price: number;
    product_id: number;

    constructor(product:Product, price?: number){
        this.product = product;
        this.price = price;
    }
}