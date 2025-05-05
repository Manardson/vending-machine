const express = require('express');

const app = express();

const port = 3000;

/*app.get('/', (req, res) => {
    res.send('Hello This is THE Vending Machine!');});*/

const ACCEPTED_COINS = [0.05, 0.10, 0.20, 0.50, 1.00, 2.00];

let products = [
    { id: 'P1', name: 'Coke', price: 1.50, quantity: 8 },
    { id: 'P2', name: 'Pepsi', price: 1.45, quantity: 6 },
    { id: 'P3', name: 'Water', price: 0.90, quantity: 10 },
];

let currentBalance = 0.00;

app.use(express.json());

app.get('/products', (req, res) => {
    const availableProducts = products
        .filter(p => p.quantity > 0)
        .map(p => ({ id: p.id, name: p.name, price: p.price.toFixed(2) }));

    res.status(200).json(availableProducts);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
