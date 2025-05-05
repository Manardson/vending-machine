const { ACCEPTED_COINS, initialProducts } = require('./config');

// --- Mutable Vending Machine State ---
let products = JSON.parse(JSON.stringify(initialProducts));
let currentBalance = 0.00;

// --- Helper for Precision ---
function toFixedNumber(num, digits = 2) {
    return parseFloat(num.toFixed(digits));
}

// --- Service Functions ---

function getAvailableProducts() {
    return products
        .filter(p => p.quantity > 0)
        .map(p => ({ id: p.id, name: p.name, price: toFixedNumber(p.price), qty: p.quantity }));
}

function getBalance() {
    return toFixedNumber(currentBalance);
}

function insertCoin(coinValue) {
    if (coinValue === undefined || coinValue === null) {
        throw new Error('Coin value missing.');
    }
    const parsedCoin = parseFloat(coinValue);
    if (isNaN(parsedCoin)) {
        throw new Error('Invalid coin value. Must be a number.');
    }
    if (!ACCEPTED_COINS.includes(parsedCoin)) {
        const error = new Error(`Invalid coin denomination.`);
        error.details = { returnedCoin: parsedCoin, accepted: ACCEPTED_COINS };
        error.code = 'INVALID_COIN';
        throw error;
    }

    currentBalance = toFixedNumber(currentBalance + parsedCoin);
    console.log(`Service: Coin ${parsedCoin.toFixed(2)} accepted. New Balance: ${currentBalance.toFixed(2)}`);
    return getBalance();
}

function purchaseProduct(productId) {
    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        const error = new Error(`Product ID '${productId}' not found.`);
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
    }

    const product = products[productIndex];

    if (product.quantity <= 0) {
        const error = new Error(`Product '${product.name}' is out of stock.`);
        error.code = 'OUT_OF_STOCK';
        error.details = { productName: product.name };
        throw error;
    }

    if (currentBalance < product.price) {
        const error = new Error(`Insufficient balance for '${product.name}'.`);
        error.code = 'INSUFFICIENT_FUNDS';
        error.details = {
            productName: product.name,
            currentBalance: getBalance(),
            productPrice: toFixedNumber(product.price),
            amountNeeded: toFixedNumber(product.price - currentBalance)
        };
        throw error;
    }

    const change = toFixedNumber(currentBalance - product.price);
    products[productIndex].quantity--;
    currentBalance = 0.00;

    console.log(`Service: Purchased ${product.name}. Stock: ${products[productIndex].quantity}. Change: ${change.toFixed(2)}`);

    return {
        dispensedProduct: {
            id: product.id,
            name: product.name,
            price: toFixedNumber(product.price)
        },
        changeReturned: change
    };
}

function refundAmount(amountToRefund) {
    const parsedAmount = parseFloat(amountToRefund);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        const error = new Error('Invalid refund amount requested.');
        error.code = 'INVALID_REFUND_AMOUNT';
        throw error;
    }

    if (parsedAmount > currentBalance) {
        const error = new Error('Requested refund amount exceeds current balance.');
        error.code = 'REFUND_TOO_HIGH';
        error.details = {
            requestedAmount: parsedAmount,
            currentBalance: getBalance()
        };
        throw error;
    }

    currentBalance = toFixedNumber(currentBalance - parsedAmount);
    console.log(`Service: Refunded ${parsedAmount.toFixed(2)}. Remaining balance: ${currentBalance.toFixed(2)}`);

    return {
        returnedAmount: parsedAmount,
        remainingBalance: getBalance()
    };
}

function resetMachine() {
    console.log('Service: Resetting vending machine state...');
    currentBalance = 0.00;
    products = JSON.parse(JSON.stringify(initialProducts));
    console.log('Service: Vending machine reset complete.');
    return { success: true, message: 'Machine reset.' };
}

// Public interface
module.exports = {
    getAvailableProducts,
    getBalance,
    insertCoin,
    purchaseProduct,
    refundAmount,
    resetMachine,
    ACCEPTED_COINS
};