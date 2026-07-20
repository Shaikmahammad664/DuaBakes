const path = require('path');
const products = require(path.join(__dirname, '..', 'src', 'data', 'products.js')).products;
console.log(JSON.stringify(products, null, 2));
