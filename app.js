import { initializeAuth } from './modules/auth.js';
import { initializeDashboard } from './modules/dashboard.js';
import { initializeAlertAreas } from './modules/alertAreas.js';
import { initializeUsers } from './modules/users.js';
import { setupNavigation } from './modules/navigation.js';
import { mockData } from './modules/mockData.js';
import { initializeSettings } from './modules/settings.js';

// Initialize the application
function init() {
    initializeAuth();
    initializeDashboard();
    initializeAlertAreas();
    initializeUsers();
    setupNavigation();
    initializeSettings();
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);