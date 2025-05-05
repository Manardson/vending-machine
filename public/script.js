const API_BASE_URL = ''; // Keep empty for same-origin requests

const productListDiv = document.getElementById('productList');
const currentBalanceDiv = document.getElementById('currentBalance');
const statusMessageDiv = document.getElementById('statusMessage');
const refundAmountInput = document.getElementById('refundAmountInput');

// --- Helpers ---

// Update the status message display
function updateStatus(message, isError = false) {
    statusMessageDiv.textContent = message;
    statusMessageDiv.className = 'status-message';
    if (isError) {
        statusMessageDiv.classList.add('status-error');
    } else {
        statusMessageDiv.classList.add('status-success');
    }
}

function formatCurrency(amount) {
    // Convert amount to number in case it's a string, handle potential NaN
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return "$NaN";
    }
    return `$${numericAmount.toFixed(2)}`;
}

// --- API Interaction ---

async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        productListDiv.innerHTML = ''; // Clear previous list
        if (products.length === 0) {
            productListDiv.innerHTML = '<p>No products available.</p>';
            return;
        }

        products.forEach(product => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product-item';
            productDiv.innerHTML = `
                <strong>${product.name}</strong><br/>
                <strong>${product.qty}</strong> Available
                <p>Price: ${formatCurrency(product.price)}</p>
                <button onclick="purchaseProduct('${product.id}')">Buy</button>
            `;
            productListDiv.appendChild(productDiv);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        updateStatus('Could not load products.', true);
        productListDiv.innerHTML = '<p>Error loading products.</p>';
    }
}

async function fetchBalance() {
    try {
        const response = await fetch(`${API_BASE_URL}/balance`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentBalanceDiv.textContent = formatCurrency(data.currentBalance);
    } catch (error) {
        console.error('Error fetching balance:', error);
        updateStatus('Could not fetch balance.', true);
    }
}

async function insertCoin(coinValue) {
    try {
        const response = await fetch(`${API_BASE_URL}/insert-coin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coin: coinValue })
        });
        const data = await response.json();

        if (!response.ok) {
            updateStatus(`Error: ${data.error || 'Could not insert coin.'}`, true);
            if(data.returnedCoin !== undefined) {
                updateStatus(`Invalid coin: ${formatCurrency(data.returnedCoin)}. Accepted: 0.05, 0.10, 0.20, 0.50, 1.00, 2.00`, true);
            }
        } else {
            updateStatus(data.message || `Coin ${formatCurrency(coinValue)} accepted.`);
            currentBalanceDiv.textContent = formatCurrency(data.currentBalance);
        }

    } catch (error) {
        console.error('Error inserting coin:', error);
        updateStatus('Network error inserting coin.', true);
    }
}

async function purchaseProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/purchase/${productId}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (!response.ok) {
            updateStatus(`Error: ${data.error || 'Purchase failed.'}`, true);
            if (data.amountNeeded) {
                updateStatus(`Insufficient balance for ${data.productName || 'item'}. Need ${formatCurrency(data.amountNeeded)} more.`, true);
            }
        } else {
            updateStatus(`${data.message} Change: ${formatCurrency(data.changeReturned)}`);
            fetchProducts();
            fetchBalance();
        }

    } catch (error) {
        console.error('Error purchasing product:', error);
        updateStatus('Network error during purchase.', true);
    }
}

async function requestRefund() {
    const amount = parseFloat(refundAmountInput.value);
    if (isNaN(amount) || amount <= 0) {
        updateStatus('Please enter a valid positive amount to refund.', true);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/return-coins/${amount}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (!response.ok) {
            updateStatus(`Error: ${data.error || 'Refund failed.'}`, true);
        } else {
            updateStatus(`${data.message} Remaining Balance: ${formatCurrency(data.remainingBalance)}`);
            currentBalanceDiv.textContent = formatCurrency(data.remainingBalance);
        }
        refundAmountInput.value = '';

    } catch (error) {
        console.error('Error requesting refund:', error);
        updateStatus('Network error during refund.', true);
    }
}

async function requestFullRefund() {
    let balanceToRefund = 0;
    try {
        const balanceResponse = await fetch(`${API_BASE_URL}/balance`);
        if (!balanceResponse.ok) throw new Error('Failed to fetch balance for refund.');
        const balanceData = await balanceResponse.json();
        balanceToRefund = parseFloat(balanceData.currentBalance);
    } catch (error) {
        console.error('Error getting balance for full refund:', error);
        updateStatus('Could not get balance to process full refund.', true);
        return;
    }

    if (balanceToRefund <= 0) {
        updateStatus('No balance to refund.', false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/return-coins/${balanceToRefund}`, {
            method: 'POST'
        });
        const data = await response.json();

        if (!response.ok) {
            updateStatus(`Error during full refund: ${data.error || 'Refund failed.'}`, true);
        } else {
            updateStatus(`${data.message} (Total Returned: ${formatCurrency(data.returnedAmount)})`);
            currentBalanceDiv.textContent = formatCurrency(data.remainingBalance); // Should be $0.00
        }

    } catch (error) {
        console.error('Error requesting full refund:', error);
        updateStatus('Network error during full refund.', true);
    }
}

async function resetMachine() {
    if (!confirm('Are you sure you want to reset the vending machine?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/reset`, {
            method: 'POST'
        });
        const data = await response.json();

        if (!response.ok) {
            updateStatus(`Error: ${data.error || 'Reset failed.'}`, true);
        } else {
            updateStatus(data.message);
            fetchProducts();
            fetchBalance();
        }

    } catch (error) {
        console.error('Error resetting machine:', error);
        updateStatus('Network error during reset.', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchBalance();
});