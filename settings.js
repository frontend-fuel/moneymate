// Check if user is logged in
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'index.html';
}

// Initialize page
document.getElementById('userName').textContent = currentUser.name;

// Load user settings
function loadSettings() {
    const settings = currentUser.settings || {
        defaultCurrency: 'USD',
        theme: 'light',
        monthlyBudget: 0,
        budgetWarning: 80,
        emailNotifications: false,
        budgetAlerts: true,
        weeklyReports: false
    };

    document.getElementById('defaultCurrency').value = settings.defaultCurrency;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('monthlyBudget').value = settings.monthlyBudget;
    document.getElementById('budgetWarning').value = settings.budgetWarning;
    document.getElementById('emailNotifications').checked = settings.emailNotifications;
    document.getElementById('budgetAlerts').checked = settings.budgetAlerts;
    document.getElementById('weeklyReports').checked = settings.weeklyReports;

    // Apply theme
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
}

// Save settings
document.getElementById('settingsForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const settings = {
        defaultCurrency: document.getElementById('defaultCurrency').value,
        theme: document.getElementById('theme').value,
        monthlyBudget: parseFloat(document.getElementById('monthlyBudget').value) || 0,
        budgetWarning: parseInt(document.getElementById('budgetWarning').value) || 80,
        emailNotifications: document.getElementById('emailNotifications').checked,
        budgetAlerts: document.getElementById('budgetAlerts').checked,
        weeklyReports: document.getElementById('weeklyReports').checked
    };

    // Update user settings
    currentUser.settings = settings;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Update users array in localStorage
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));

    // Show success message
    alert('Settings saved successfully!');
});

// Theme change handler
document.getElementById('theme').addEventListener('change', function(event) {
    document.body.classList.toggle('dark-mode', event.target.value === 'dark');
});

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Load settings on page load
loadSettings();