import { Product } from ".";

export class Price {
    product: Product;
    price: number;

    constructor(product:Product){
        this.product = product;
    }
}