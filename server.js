const express = require('express');

const app = express();

const port = 3000;

/*app.get('/', (req, res) => {
    res.send('Hello This is THE Vending Machine!');});*/

const ACCEPTED_COINS = [0.05, 0.10, 0.20, 0.50, 1.00, 2.00];

const initialProducts = [
    { id: 'P1', name: 'Coke', price: 1.50, quantity: 8 },
    { id: 'P2', name: 'Pepsi', price: 1.45, quantity: 6 },
    { id: 'P3', name: 'Water', price: 0.90, quantity: 10 },
];

let products = JSON.parse(JSON.stringify(initialProducts));
let currentBalance = 0.00;

function resetVendingMachine() {
    console.log('Resetting vending machine state...');
    currentBalance = 0.00;
    products = JSON.parse(JSON.stringify(initialProducts));
    console.log('Vending machine reset complete.');
    console.log('Current Products:', products);
    console.log(`Current Balance: ${currentBalance.toFixed(2)}`);
}

app.use(express.json());

app.get('/products', (req, res) => {
    const availableProducts = products
        .filter(p => p.quantity > 0)
        .map(p => ({ id: p.id, name: p.name, price: p.price.toFixed(2) }));

    res.status(200).json(availableProducts);
});

app.get('/balance', (req, res) => {
    res.status(200).json({
        currentBalance: currentBalance.toFixed(2)
    });
});

app.post('/insert-coin', (req, res) => {
    const { coin } = req.body;

    // --- Input Validation ---
    if (coin === undefined || coin === null) {
        return res.status(400).json({ error: 'Coin value missing in request body.' });
    }
    const coinValue = parseFloat(coin);
    if (isNaN(coinValue)) {
        return res.status(400).json({ error: 'Invalid coin value provided. Must be a number.' });
    }
    if (!ACCEPTED_COINS.includes(coinValue)) {
        return res.status(400).json({
            error: `Invalid coin denomination. Accepted coins are: ${ACCEPTED_COINS.join(', ')}`,
            returnedCoin: coinValue
        });
    }

    currentBalance = parseFloat((currentBalance + coinValue).toFixed(2));

    res.status(200).json({
        message: `Coin ${coinValue.toFixed(2)} accepted.`,
        currentBalance: currentBalance.toFixed(2)
    });
});

// Cancel request and get refund
app.post('/return-coins/:amount', (req, res) => {
    const amountToReturn = parseFloat(req.params.amount);

    if (amountToReturn <= currentBalance) {
        if (currentBalance > 0) {
            currentBalance = currentBalance - amountToReturn;
        } else {
            currentBalance = 0;
        }

        res.status(200).json({
            message: 'Request cancelled. Coins returned.',
            returnedAmount: amountToReturn.toFixed(2)
        });
    } else {
        res.status(400).json({
            message: 'Cannot refund. Refund requested is too high',
            returnedAmount: amountToReturn.toFixed(2)
        });
    }
});

app.post('/purchase/:productId', (req, res) => {
    const { productId } = req.params;

    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({ error: `Product with ID '${productId}' not found.` });
    }

    const product = products[productIndex];

    if (product.quantity <= 0) {
        return res.status(404).json({ error: `Product '${product.name}' is out of stock.` });
    }

    if (currentBalance < product.price) {
        const needed = (product.price - currentBalance).toFixed(2);
        return res.status(400).json({
            error: `Insufficient balance to buy '${product.name}'.`,
            currentBalance: currentBalance.toFixed(2),
            productPrice: product.price.toFixed(2),
            amountNeeded: needed
        });
    }

    const change = parseFloat((currentBalance - product.price).toFixed(2));

    products[productIndex].quantity--;
    currentBalance = 0.00;

    res.status(200).json({
        message: `Purchase successful. Dispensing ${product.name}.`,
        product: {
            id: product.id,
            name: product.name,
            price: product.price.toFixed(2)
        },
        changeReturned: change.toFixed(2)
    });

    console.log(`Product purchased: ${product.name}. Stock remaining: ${products[productIndex].quantity}`);
    console.log(`Change given: ${change.toFixed(2)}`);
});

app.listen(port, () => {
    console.log(`Vending Machine API listening at http://localhost:${port}`);
    console.log(`Accepted coins: ${ACCEPTED_COINS.join(', ')}`);
    // New products list on start
    console.log('Available Products:', products.map(p => ({id: p.id, name: p.name, price: p.price.toFixed(2), quantity: p.quantity })));
    console.log(`Initial Balance: ${currentBalance.toFixed(2)}`);
});
