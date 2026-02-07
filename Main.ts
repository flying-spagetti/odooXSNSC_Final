interface AddData {
    productId: "Product1",
    variantId: "Variant1",
    quanitity:1,
    ProductPrice:100
    
}
interface AddData2 extends AddData {
    ProductName: "Product1 from Interface 2",
    ProductDescription: string |null

}
let testAddData2: AddData2 = {
    productId: "Product1",
    variantId: "Variant1",
    quanitity:1,
    ProductPrice:100,
    ProductName: "Product1 from Interface 2",
    ProductDescription: null
}

console.log(typeof testAddData2.ProductName);
