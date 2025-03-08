// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'index.html';
}

// Initialize page
document.getElementById('userName').textContent = currentUser.name;

// Handle receipt scanning
document.getElementById('scannerForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('receiptImage');
    const file = fileInput.files[0];
    if (!file) return;

    // Show loading state
    const scanDetails = document.getElementById('scanDetails');
    scanDetails.innerHTML = 'Processing receipt...';
    document.getElementById('scanResult').style.display = 'block';

    try {
        // Simulate AI processing (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Mock extracted data (replace with actual OCR results)
        const extractedData = {
            amount: Math.floor(Math.random() * 1000) + 10,
            date: new Date().toISOString().split('T')[0],
            description: 'Store Purchase',
            category: 'other'
        };

        // Display extracted data
        scanDetails.innerHTML = `
            <p><strong>Amount:</strong> ${currentUser.settings?.defaultCurrency === 'INR' ? '₹' : '$'}${extractedData.amount}</p>
            <p><strong>Date:</strong> ${extractedData.date}</p>
            <p><strong>Description:</strong> ${extractedData.description}</p>
            <p><strong>Category:</strong> ${extractedData.category}</p>
        `;

        // Store extracted data for confirmation
        document.getElementById('confirmScan').onclick = function() {
            // Pre-fill transaction form
            document.getElementById('amount').value = extractedData.amount;
            document.getElementById('date').value = extractedData.date;
            document.getElementById('description').value = extractedData.description;
            document.getElementById('category').value = extractedData.category;
            document.getElementById('type').value = 'expense';

            // Reset scanner form
            document.getElementById('scannerForm').reset();
            document.getElementById('scanResult').style.display = 'none';

            // Focus on the transaction form
            document.getElementById('amount').focus();
        };
    } catch (error) {
        scanDetails.innerHTML = 'Error processing receipt. Please try again.';
    }
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Initialize charts
const expenseCtx = document.getElementById('expenseChart').getContext('2d');
const trendCtx = document.getElementById('trendChart').getContext('2d');

const expenseChart = new Chart(expenseCtx, {
    type: 'doughnut',
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FFCE56',
                '#4BC0C0',
                '#9966FF'
            ]
        }]
    }
});

const trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Income',
            data: [],
            borderColor: '#198754',
            tension: 0.1
        }, {
            label: 'Expenses',
            data: [],
            borderColor: '#dc3545',
            tension: 0.1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

// Update dashboard data
function updateDashboard() {
    const transactions = currentUser.transactions;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate monthly totals
    const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const currentBalance = transactions
        .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    // Get user's currency preference
    const currencySymbol = currentUser.settings?.defaultCurrency === 'INR' ? '₹' : '$';

    // Update summary cards
    document.getElementById('currentBalance').textContent = `${currencySymbol}${currentBalance.toFixed(2)}`;
    document.getElementById('monthlyIncome').textContent = `${currencySymbol}${monthlyIncome.toFixed(2)}`;
    document.getElementById('monthlyExpenses').textContent = `${currencySymbol}${monthlyExpenses.toFixed(2)}`;

    // Update expense chart
    const expensesByCategory = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    expenseChart.data.labels = Object.keys(expensesByCategory);
    expenseChart.data.datasets[0].data = Object.values(expensesByCategory);
    expenseChart.update();

    // Update trend chart
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push(d);
    }

    const monthlyData = last6Months.map(date => {
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        return {
            month: date.toLocaleString('default', { month: 'short' }),
            income: monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0),
            expenses: monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
        };
    });

    trendChart.data.labels = monthlyData.map(d => d.month);
    trendChart.data.datasets[0].data = monthlyData.map(d => d.income);
    trendChart.data.datasets[1].data = monthlyData.map(d => d.expenses);
    trendChart.update();

    // Update transactions list
    const transactionsList = document.getElementById('transactionsList');
    transactionsList.innerHTML = '';
    
    transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .forEach((t, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>${t.description}</td>
                <td>${t.category}</td>
                <td><span class="badge bg-${t.type === 'income' ? 'success' : 'danger'}">${t.type}</span></td>
                <td class="text-${t.type === 'income' ? 'success' : 'danger'}">₹${t.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editTransaction(${index})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${index})">Delete</button>
                </td>
            `;
            transactionsList.appendChild(row);
        });

    // Generate AI insights
    generateInsights(transactions);
}

// Handle new transaction
document.getElementById('transactionForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
    const editIndex = submitBtn.dataset.editIndex;

    const transaction = {
        date: document.getElementById('date').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value
    };

    if (editIndex !== undefined) {
        // Update existing transaction
        currentUser.transactions[editIndex] = transaction;
        submitBtn.textContent = 'Add Transaction';
        delete submitBtn.dataset.editIndex;
    } else {
        // Add new transaction
        currentUser.transactions.push(transaction);
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Update users array in localStorage
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));

    this.reset();
    updateDashboard();
});

// AI Insights Generation
function generateInsights(transactions) {
    const insights = [];
    
    // Calculate spending trends
    const currentMonth = new Date().getMonth();
    const currentMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth;
    });

    const totalExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = {};
    currentMonthTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });

    // Find highest expense category
    const highestCategory = Object.entries(expensesByCategory)
        .sort(([,a], [,b]) => b - a)[0];

    if (highestCategory) {
        insights.push(`Your highest spending category this month is ${highestCategory[0]} at $${highestCategory[1].toFixed(2)}.`);
    }

    // Compare with previous month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === lastMonth.getMonth();
    });

    const lastMonthExpenses = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthExpenses > 0) {
        const percentChange = ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
        if (Math.abs(percentChange) > 10) {
            insights.push(`Your spending has ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% compared to last month.`);
        }
    }

    // Savings rate analysis
    const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    if (monthlyIncome > 0) {
        const savingsRate = ((monthlyIncome - totalExpenses) / monthlyIncome) * 100;
        if (savingsRate < 20) {
            insights.push('Consider increasing your savings rate to at least 20% of your income.');
        } else {
            insights.push(`Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`);
        }
    }

    // Display insights
    document.getElementById('aiInsights').innerHTML = insights.length > 0
        ? insights.map(insight => `<p class="mb-2">🤖 ${insight}</p>`).join('')
        : 'Add more transactions to receive AI-powered insights.';
}

// Add edit and delete functions
function editTransaction(index) {
    const transaction = currentUser.transactions[index];
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('type').value = transaction.type;
    document.getElementById('category').value = transaction.category;
    document.getElementById('date').value = transaction.date;
    document.getElementById('description').value = transaction.description;
    
    // Change form submit button to update
    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
    submitBtn.textContent = 'Update Transaction';
    submitBtn.dataset.editIndex = index;
}

function deleteTransaction(index) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        currentUser.transactions.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update users array in localStorage
        const users = JSON.parse(localStorage.getItem('users'));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        users[userIndex] = currentUser;
        localStorage.setItem('users', JSON.stringify(users));
        
        updateDashboard();
    }
}

// Initial dashboard update
updateDashboard();

// OCR API Configuration
const OCR_API_KEY = 'K87109129488957';

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize scanner form handling
    const scannerForm = document.getElementById('scannerForm');
    const scanResult = document.getElementById('scanResult');
    const confirmScanBtn = document.getElementById('confirmScan');

    if (scannerForm) {
        scannerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await scanReceipt();
        });
    }

    if (confirmScanBtn) {
        confirmScanBtn.addEventListener('click', function() {
            populateTransactionForm();
            scanResult.style.display = 'none';
        });
    }
});

// Function to scan receipt using OCR
async function scanReceipt() {
    const fileInput = document.getElementById('receiptImage');
    const scanDetails = document.getElementById('scanDetails');
    const scanResult = document.getElementById('scanResult');

    if (!fileInput.files.length) {
        alert('Please select an image first.');
        return;
    }

    // Show loading state
    scanDetails.innerHTML = '<p class="text-center">Processing...</p>';
    scanResult.style.display = 'block';

    try {
        let formData = new FormData();
        formData.append('apikey', OCR_API_KEY);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('file', fileInput.files[0]);

        let response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });

        let data = await response.json();

        if (data.ParsedResults && data.ParsedResults[0]) {
            let extractedText = data.ParsedResults[0].ParsedText || '';
            let lines = extractedText.split('\n').map(line => line.trim()).filter(line => line);

            // Extract bill details
            let billType = extractBillType(lines);
            let billDate = extractDate(lines) || getTodayDate();
            let amount = extractAmount(lines);

            // Update scan results
            scanDetails.innerHTML = `
                <p><strong>Bill Type:</strong> <span id="billType">${billType || 'Unknown'}</span></p>
                <p><strong>Date:</strong> <span id="billDate">${billDate}</span></p>
                <p><strong>Amount:</strong> <span id="billAmount">${amount || 'Not Found'}</span></p>
            `;
        } else {
            scanDetails.innerHTML = '<p class="text-danger">Error extracting text from image.</p>';
        }
    } catch (error) {
        scanDetails.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}

// Extract bill type (first significant line)
function extractBillType(lines) {
    return lines.length > 0 ? lines[0] : 'Unknown';
}

// Extract date from text
function extractDate(lines) {
    let datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/;
    for (let line of lines) {
        let match = line.match(datePattern);
        if (match) return match[0];
    }
    return null;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    let today = new Date();
    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, '0');
    let dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Extract amount from text
function extractAmount(lines) {
    let amountPattern = /₹?\s*([\d,]+(?:\.\d{1,2})?)/g;
    let highestAmount = 0;

    for (let line of lines) {
        let matches = [...line.matchAll(amountPattern)];
        for (let match of matches) {
            let amountStr = match[1].replace(/,/g, '');
            let amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > highestAmount) {
                highestAmount = amount;
            }
        }
    }

    return highestAmount > 0 ? `₹${highestAmount.toFixed(2)}` : null;
}

// Populate transaction form with scanned details
function populateTransactionForm() {
    const billType = document.getElementById('billType').textContent;
    const billDate = document.getElementById('billDate').textContent;
    const billAmount = document.getElementById('billAmount').textContent;

    // Set form values
    document.getElementById('amount').value = billAmount.replace(/[₹,]/g, '');
    document.getElementById('date').value = formatDateForInput(billDate);
    document.getElementById('description').value = billType;
    document.getElementById('type').value = 'expense';
    document.getElementById('category').value = 'other';
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(dateStr) {
    try {
        const parts = dateStr.split(/[-\/]/);
        if (parts.length === 3) {
            // Handle both DD/MM/YYYY and YYYY/MM/DD formats
            if (parts[0].length === 4) {
                return dateStr; // Already in YYYY-MM-DD format
            } else {
                // Convert DD/MM/YYYY to YYYY-MM-DD
                const [day, month, year] = parts;
                return `${year.length === 2 ? '20' + year : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
    } catch (e) {
        console.error('Error formatting date:', e);
    }
    return getTodayDate(); // Fallback to today's date
}