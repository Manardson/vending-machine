const VendingService = require('./vendingService');

// --- Controller Functions ---

function handleGetProducts(req, res) {
    try {
        const products = VendingService.getAvailableProducts();
        res.status(200).json(products);
    } catch (error) {
        console.error("Controller Error [GetProducts]:", error);
        res.status(500).json({ error: 'Internal server error retrieving products.' });
    }
}

function handleGetBalance(req, res) {
    try {
        const balance = VendingService.getBalance();
        res.status(200).json({ currentBalance: balance.toFixed(2) });
    } catch (error) {
        console.error("Controller Error [GetBalance]:", error);
        res.status(500).json({ error: 'Internal server error retrieving balance.' });
    }
}

// POST /insert-coin
function handleInsertCoin(req, res) {
    try {
        const { coin } = req.body;

        if (coin === undefined) {
            return res.status(400).json({ error: 'Request body must include a "coin" value.' });
        }

        const newBalance = VendingService.insertCoin(coin);
        res.status(200).json({
            message: `Coin accepted.`,
            currentBalance: newBalance.toFixed(2)
        });

    } catch (error) {
        console.error("Controller Error [InsertCoin]:", error.message);
        // Handle specific errors thrown by the service
        if (error.code === 'INVALID_COIN') {
            res.status(400).json({
                error: error.message,
                returnedCoin: error.details.returnedCoin,
                accepted: error.details.accepted.join(', ')
            });
        } else if (error.message.includes('Invalid coin value')) {
            res.status(400).json({ error: error.message });
        } else {
            // Generic error for unexpected issues
            res.status(500).json({ error: 'Internal server error processing coin.' });
        }
    }
}

// POST /purchase/:productId
function handlePurchaseProduct(req, res) {
    try {
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID missing in URL.' });
        }

        const result = VendingService.purchaseProduct(productId);
        res.status(200).json({
            message: `Purchase successful! Dispensing ${result.dispensedProduct.name}.`,
            product: result.dispensedProduct,
            changeReturned: result.changeReturned.toFixed(2)
        });

    } catch (error) {
        console.error("Controller Error [PurchaseProduct]:", error.message);
        // Handle specific service errors
        if (error.code === 'PRODUCT_NOT_FOUND') {
            res.status(404).json({ error: error.message });
        } else if (error.code === 'OUT_OF_STOCK') {
            res.status(400).json({ error: error.message });
        } else if (error.code === 'INSUFFICIENT_FUNDS') {
            res.status(400).json({
                error: error.message,
                currentBalance: error.details.currentBalance.toFixed(2),
                productPrice: error.details.productPrice.toFixed(2),
                amountNeeded: error.details.amountNeeded.toFixed(2)
            });
        } else {
            res.status(500).json({ error: 'Internal server error during purchase.' });
        }
    }
}

// POST /return-coins/:amount
function handleRefundAmount(req, res) {
    try {
        const { amount } = req.params;
        if (!amount) {
            return res.status(400).json({ error: 'Refund amount missing in URL.' });
        }

        const result = VendingService.refundAmount(amount);
        res.status(200).json({
            message: `Refund processed. ${result.returnedAmount.toFixed(2)} returned.`,
            returnedAmount: result.returnedAmount.toFixed(2),
            remainingBalance: result.remainingBalance.toFixed(2)
        });

    } catch (error) {
        console.error("Controller Error [RefundAmount]:", error.message);
        if (error.code === 'INVALID_REFUND_AMOUNT') {
            res.status(400).json({ error: error.message });
        } else if (error.code === 'REFUND_TOO_HIGH') {
            res.status(400).json({
                error: error.message,
                requestedAmount: error.details.requestedAmount.toFixed(2),
                currentBalance: error.details.currentBalance.toFixed(2)
            });
        } else {
            res.status(500).json({ error: 'Internal server error during refund.' });
        }
    }
}

function handleResetMachine(req, res) {
    try {
        const result = VendingService.resetMachine();
        res.status(200).json({ message: 'Vending machine has been reset to initial state.' });
    } catch (error) {
        console.error("Controller Error [ResetMachine]:", error);
        res.status(500).json({ error: 'Internal server error during reset.' });
    }
}

// Export the handlers
module.exports = {
    handleGetProducts,
    handleGetBalance,
    handleInsertCoin,
    handlePurchaseProduct,
    handleRefundAmount,
    handleResetMachine
};