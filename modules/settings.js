export function initializeSettings() {
    const logoutBtn = document.getElementById('logout-btn');
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');

    // Update the logout button to use Font Awesome icon
    logoutBtn.innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        יציאה
    `;

    logoutBtn.addEventListener('click', () => {
        appContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    });
    
    // Initialize system info display
    renderSystemInfo();
}

function renderSystemInfo() {
    const systemInfoContainer = document.getElementById('system-info-container');
    
    // System info items
    const infoItems = [
        { label: 'גרסת מערכת', value: '1.0.3' },
        { label: 'תאריך עדכון אחרון', value: '15.11.2023' },
        { label: 'מספר משתמשים פעילים', value: '12' },
        { label: 'אזורי התרעה פעילים', value: '3' }
    ];
    
    // Clear container
    systemInfoContainer.innerHTML = '';
    
    // Create items
    infoItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'info-item';
        
        itemEl.innerHTML = `
            <div class="info-label">${item.label}</div>
            <div class="info-value">${item.value}</div>
        `;
        
        // Add to container
        systemInfoContainer.appendChild(itemEl);
        
        // Add separator for all but last item
        if (index < infoItems.length - 1) {
            itemEl.style.borderBottom = '1px solid var(--border-color)';
            itemEl.style.paddingBottom = '0.75rem';
            itemEl.style.marginBottom = '0.75rem';
        }
    });
}