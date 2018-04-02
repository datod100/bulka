import { Product } from ".";

export class Price {
    product: Product;
    price: number;
    product_id: number;
    package_enabled: number;

    constructor(product:Product, price?: number, product_id?:number,package_enabled?:number){
        this.product = product;
        this.price = price;
        this.product_id = product_id;
        this.package_enabled = package_enabled;
    }
}