const express = require('express');
const path = require('path');
const VendingController = require('./vendingController');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// ==Routes==

app.get('/products', VendingController.handleGetProducts);
app.get('/balance', VendingController.handleGetBalance);

app.post('/insert-coin', VendingController.handleInsertCoin);
app.post('/purchase/:productId', VendingController.handlePurchaseProduct);
app.post('/return-coins/:amount', VendingController.handleRefundAmount);
app.post('/admin/reset', VendingController.handleResetMachine); // Admin endpoint

/*app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});*/


// --- Start Server ---
app.listen(port, () => {
    console.log(`Vending Machine API listening at http://localhost:${port}`);
});