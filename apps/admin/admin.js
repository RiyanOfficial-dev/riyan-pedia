// Admin System
const ADMIN_SYSTEM = {
    currentAdmin: null,
    isLoggedIn: false,
    settings: JSON.parse(localStorage.getItem('riyanpedia_admin_settings')) || {
        siteName: 'Riyan Pedia',
        supportEmail: 'support@riyanpedia.com',
        siteDescription: 'Platform top up game dan pulsa terpercaya'
    }
};

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    checkAdminAuth();
    setupAdminEventListeners();
}

function checkAdminAuth() {
    const adminUser = localStorage.getItem('riyanpedia_admin_user');
    if (adminUser) {
        ADMIN_SYSTEM.currentAdmin = JSON.parse(adminUser);
        ADMIN_SYSTEM.isLoggedIn = true;
        showAdminContent();
    } else {
        showAdminLoginModal();
    }
}

function setupAdminEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            if (section) {
                switchSection(section);
                
                // Update active state
                document.querySelectorAll('.admin-nav-item').forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Logout
    document.getElementById('adminLogout').addEventListener('click', function() {
        if (confirm('Logout dari admin panel?')) {
            localStorage.removeItem('riyanpedia_admin_user');
            ADMIN_SYSTEM.isLoggedIn = false;
            ADMIN_SYSTEM.currentAdmin = null;
            showAdminLoginModal();
        }
    });

    // Filter transactions
    document.getElementById('transactionFilter').addEventListener('change', loadAllTransactions);
    document.getElementById('transactionDate').addEventListener('change', loadAllTransactions);
}

function showAdminLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content centered">
            <div class="modal-header">
                <h3><i class="fas fa-lock"></i> Admin Login</h3>
            </div>
            <div class="modal-body">
                <form id="adminLoginForm">
                    <div class="form-group">
                        <label for="adminUsername"><i class="fas fa-user"></i> Username</label>
                        <input type="text" id="adminUsername" placeholder="Admin username" required>
                    </div>
                    <div class="form-group">
                        <label for="adminPassword"><i class="fas fa-lock"></i> Password</label>
                        <input type="password" id="adminPassword" placeholder="Admin password" required>
                    </div>
                    <button type="submit" class="btn-admin" style="width: 100%; padding: 12px;">
                        <i class="fas fa-sign-in-alt"></i>
                        Login sebagai Admin
                    </button>
                </form>
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border);">
                    <p style="color: var(--text-muted); font-size: 0.9em;">Default login: <strong>admin</strong> / <strong>admin123</strong></p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Form submission
    modal.querySelector('#adminLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleAdminLogin();
    });
    
    // Close modal (disabled for login)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Prevent closing login modal
        }
    });
}

function handleAdminLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Default admin credentials
    if (username === 'admin' && password === 'admin123') {
        const adminUser = {
            username: 'admin',
            name: 'Administrator',
            role: 'superadmin',
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('riyanpedia_admin_user', JSON.stringify(adminUser));
        ADMIN_SYSTEM.currentAdmin = adminUser;
        ADMIN_SYSTEM.isLoggedIn = true;
        
        document.querySelector('.modal').remove();
        showAdminContent();
        showNotification('Login admin berhasil!', 'success');
    } else {
        showNotification('Username atau password salah!', 'error');
    }
}

function showAdminContent() {
    document.getElementById('adminUserInfo').textContent = 
        `Welcome, ${ADMIN_SYSTEM.currentAdmin.name}`;
    
    loadAdminStats();
    loadAllTransactions();
    loadAllUsers();
    loadAllApiKeys();
    loadSettings();
}

function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${section}-section`).classList.add('active');
    
    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'transactions': 'Manajemen Transaksi',
        'users': 'Manajemen User',
        'api-keys': 'Manajemen API Keys',
        'settings': 'Pengaturan Sistem'
    };
    
    document.getElementById('adminTitle').textContent = titles[section] || 'Admin Panel';
}

// ==================== DASHBOARD & STATS ====================

function loadAdminStats() {
    const statsContainer = document.getElementById('adminStats');
    const allTransactions = getAllTransactions();
    const allUsers = getUsers();
    
    const totalTransactions = allTransactions.length;
    const successTransactions = allTransactions.filter(t => t.status === 'success').length;
    const totalUsers = Object.keys(allUsers).length;
    const totalRevenue = allTransactions
        .filter(t => t.status === 'success')
        .reduce((sum, t) => sum + (t.price || 0), 0);
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalTransactions}</div>
            <div class="stat-label">Total Transaksi</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${successTransactions}</div>
            <div class="stat-label">Transaksi Sukses</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalUsers}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">Rp ${formatNumber(totalRevenue)}</div>
            <div class="stat-label">Total Revenue</div>
        </div>
    `;
    
    // Update dashboard content
    updateDashboardContent(allTransactions, allUsers);
}

function updateDashboardContent(transactions, users) {
    const dashboardContent = document.getElementById('dashboardContent');
    
    // Recent transactions
    const recentTransactions = transactions.slice(0, 5);
    
    // User growth (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsers = Object.values(users).filter(user => 
        new Date(user.createdAt) > oneWeekAgo
    ).length;
    
    dashboardContent.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: var(--background); padding: 20px; border-radius: 8px;">
                <h3><i class="fas fa-chart-line"></i> Statistik Cepat</h3>
                <p>User baru (7 hari): <strong>${newUsers}</strong></p>
                <p>Success rate: <strong>${transactions.length > 0 ? Math.round((transactions.filter(t => t.status === 'success').length / transactions.length) * 100) : 0}%</strong></p>
                <p>Rata-rata transaksi/hari: <strong>${Math.round(transactions.length / 30)}</strong></p>
            </div>
            <div style="background: var(--background); padding: 20px; border-radius: 8px;">
                <h3><i class="fas fa-clock"></i> Transaksi Terbaru</h3>
                ${recentTransactions.length > 0 ? recentTransactions.map(transaction => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);">
                        <div>
                            <div style="font-weight: bold; font-size: 0.9em;">${transaction.product_name}</div>
                            <div style="font-size: 0.8em; color: var(--text-muted);">${transaction.customer_no}</div>
                        </div>
                        <span class="status-badge status-${transaction.status}">${transaction.status}</span>
                    </div>
                `).join('') : '<p style="text-align: center; color: var(--text-muted);">Tidak ada transaksi</p>'}
            </div>
        </div>
        
        <div style="background: var(--background); padding: 20px; border-radius: 8px;">
            <h3><i class="fas fa-tachometer-alt"></i> Quick Actions</h3>
            <div style="display: flex; gap: 10px; margin-top: 15px; flex-wrap: wrap;">
                <button class="btn-admin" onclick="switchSection('transactions')">
                    <i class="fas fa-exchange-alt"></i>
                    Lihat Semua Transaksi
                </button>
                <button class="btn-admin" onclick="switchSection('users')">
                    <i class="fas fa-users"></i>
                    Kelola User
                </button>
                <button class="btn-admin" onclick="switchSection('api-keys')">
                    <i class="fas fa-key"></i>
                    Kelola API Keys
                </button>
            </div>
        </div>
    `;
}

function refreshStats() {
    loadAdminStats();
    showNotification('Data diperbarui!', 'success');
}

// ==================== TRANSACTIONS MANAGEMENT ====================

function loadAllTransactions() {
    const filterStatus = document.getElementById('transactionFilter').value;
    const filterDate = document.getElementById('transactionDate').value;
    
    let allTransactions = getAllTransactions();
    
    // Apply filters
    if (filterStatus !== 'all') {
        allTransactions = allTransactions.filter(t => t.status === filterStatus);
    }
    
    if (filterDate) {
        allTransactions = allTransactions.filter(t => t.date === filterDate);
    }
    
    const transactionsContent = document.getElementById('transactionsContent');
    
    if (allTransactions.length === 0) {
        transactionsContent.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada transaksi ditemukan</p>';
        return;
    }
    
    transactionsContent.innerHTML = `
        <div class="admin-table">
            <div class="table-header" style="grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 1fr;">
                <div>Tanggal</div>
                <div>Produk</div>
                <div>Customer</div>
                <div>User</div>
                <div>Status</div>
                <div>Harga</div>
                <div>Aksi</div>
            </div>
            ${allTransactions.map(transaction => `
                <div class="table-row" style="grid-template-columns: 1fr 2fr 1fr 1fr 1fr 1fr 1fr;">
                    <div style="font-size: 0.8em;">${transaction.timestamp}</div>
                    <div>
                        <strong>${transaction.product_name}</strong>
                        <div style="font-size: 0.8em; color: var(--text-muted);">${transaction.brand}</div>
                    </div>
                    <div>${transaction.customer_no}</div>
                    <div style="font-size: 0.8em;">${getUserEmailFromTransaction(transaction.ref_id) || 'N/A'}</div>
                    <div><span class="status-badge status-${transaction.status}">${transaction.status.toUpperCase()}</span></div>
                    <div>Rp ${formatNumber(transaction.price)}</div>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewTransaction('${transaction.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteTransaction('${transaction.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getAllTransactions() {
    let allTransactions = [];
    
    // Get transactions from all users
    const allUsers = getUsers();
    Object.keys(allUsers).forEach(userEmail => {
        const userHistory = JSON.parse(localStorage.getItem(`riyanpedia_history_${userEmail}`)) || [];
        userHistory.forEach(transaction => {
            transaction.userEmail = userEmail; // Add user email to transaction
            allTransactions.push(transaction);
        });
    });
    
    // Sort by timestamp (newest first)
    return allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getUsers() {
    return JSON.parse(localStorage.getItem('riyanpedia_users')) || {};
}

function getUserEmailFromTransaction(refId) {
    const allUsers = getUsers();
    for (let userEmail of Object.keys(allUsers)) {
        const userHistory = JSON.parse(localStorage.getItem(`riyanpedia_history_${userEmail}`)) || [];
        if (userHistory.some(t => t.ref_id === refId)) {
            return userEmail;
        }
    }
    return null;
}

function viewTransaction(transactionId) {
    const allTransactions = getAllTransactions();
    const transaction = allTransactions.find(t => t.id == transactionId);
    
    if (transaction) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3><i class="fas fa-receipt"></i> Detail Transaksi</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="form-group">
                            <label>Produk</label>
                            <div class="form-control">${transaction.product_name}</div>
                        </div>
                        <div class="form-group">
                            <label>Brand</label>
                            <div class="form-control">${transaction.brand}</div>
                        </div>
                        <div class="form-group">
                            <label>Customer No</label>
                            <div class="form-control">${transaction.customer_no}</div>
                        </div>
                        <div class="form-group">
                            <label>User</label>
                            <div class="form-control">${transaction.userEmail || 'N/A'}</div>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <div class="form-control">
                                <span class="status-badge status-${transaction.status}">${transaction.status.toUpperCase()}</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Harga</label>
                            <div class="form-control">Rp ${formatNumber(transaction.price)}</div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Reference ID</label>
                            <div class="form-control" style="font-family: monospace;">${transaction.ref_id}</div>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label>Pesan</label>
                            <div class="form-control">${transaction.message || 'No message'}</div>
                        </div>
                        <div class="form-group">
                            <label>Tanggal</label>
                            <div class="form-control">${transaction.timestamp}</div>
                        </div>
                        <div class="form-group">
                            <label>SN</label>
                            <div class="form-control">${transaction.sn || 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

function deleteTransaction(transactionId) {
    if (!confirm('Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.')) {
        return;
    }
    
    const allTransactions = getAllTransactions();
    const transaction = allTransactions.find(t => t.id == transactionId);
    
    if (transaction && transaction.userEmail) {
        // Remove from user's history
        const userHistory = JSON.parse(localStorage.getItem(`riyanpedia_history_${transaction.userEmail}`)) || [];
        const updatedHistory = userHistory.filter(t => t.id != transactionId);
        localStorage.setItem(`riyanpedia_history_${transaction.userEmail}`, JSON.stringify(updatedHistory));
        
        showNotification('Transaksi berhasil dihapus!', 'success');
        loadAllTransactions();
        loadAdminStats();
    }
}

// ==================== USERS MANAGEMENT ====================

function loadAllUsers() {
    const allUsers = getUsers();
    const usersContent = document.getElementById('usersContent');
    
    if (Object.keys(allUsers).length === 0) {
        usersContent.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada user terdaftar</p>';
        return;
    }
    
    usersContent.innerHTML = `
        <div class="admin-table">
            <div class="table-header" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr;">
                <div>User</div>
                <div>Role</div>
                <div>Tanggal Daftar</div>
                <div>API Key</div>
                <div>Aksi</div>
            </div>
            ${Object.values(allUsers).map(user => {
                const userTransactions = JSON.parse(localStorage.getItem(`riyanpedia_history_${user.email}`)) || [];
                const hasApiKey = localStorage.getItem('riyanpedia_apikeys') ? 
                    JSON.parse(localStorage.getItem('riyanpedia_apikeys'))[user.email] : false;
                
                return `
                    <div class="table-row" style="grid-template-columns: 2fr 1fr 1fr 1fr 1fr;">
                        <div>
                            <strong>${user.name}</strong>
                            <div style="font-size: 0.8em; color: var(--text-muted);">${user.email}</div>
                        </div>
                        <div>
                            <span class="user-role ${user.email === 'admin' ? 'role-admin' : 'role-user'}">
                                ${user.email === 'admin' ? 'ADMIN' : 'USER'}
                            </span>
                        </div>
                        <div>${new Date(user.createdAt).toLocaleDateString('id-ID')}</div>
                        <div>${hasApiKey ? '✓' : '✗'}</div>
                        <div class="action-buttons">
                            <button class="btn-action btn-view" onclick="viewUser('${user.email}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${user.email !== 'admin' ? `
                                <button class="btn-action btn-delete" onclick="deleteUser('${user.email}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function viewUser(userEmail) {
    const users = getUsers();
    const user = users[userEmail];
    const userTransactions = JSON.parse(localStorage.getItem(`riyanpedia_history_${userEmail}`)) || [];
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large">
            <div class="modal-header">
                <h3><i class="fas fa-user"></i> Detail User</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div class="form-group">
                        <label>Nama</label>
                        <div class="form-control">${user.name}</div>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <div class="form-control">${user.email}</div>
                    </div>
                    <div class="form-group">
                        <label>Tanggal Daftar</label>
                        <div class="form-control">${new Date(user.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="form-group">
                        <label>Total Transaksi</label>
                        <div class="form-control">${userTransactions.length}</div>
                    </div>
                    <div class="form-group">
                        <label>Digiflazz API</label>
                        <div class="form-control">${localStorage.getItem('riyanpedia_apikeys') && JSON.parse(localStorage.getItem('riyanpedia_apikeys'))[user.email] ? '✓ Terkonfigurasi' : '✗ Belum'}</div>
                    </div>
                </div>
                
                <h4 style="margin-top: 20px; margin-bottom: 15px;">Riwayat Transaksi</h4>
                ${userTransactions.length > 0 ? `
                    <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                        ${userTransactions.slice(0, 10).map(transaction => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--border);">
                                <div style="flex: 1;">
                                    <div style="font-weight: bold; font-size: 0.9em;">${transaction.product_name}</div>
                                    <div style="font-size: 0.8em; color: var(--text-muted);">${transaction.timestamp}</div>
                                </div>
                                <span class="status-badge status-${transaction.status}">${transaction.status}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="text-align: center; color: var(--text-muted);">Belum ada transaksi</p>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function deleteUser(userEmail) {
    if (!confirm(`Hapus user ${userEmail}? Semua data user akan dihapus permanen.`)) {
        return;
    }
    
    const users = getUsers();
    
    // Remove user data
    delete users[userEmail];
    
    // Remove from localStorage
    localStorage.setItem('riyanpedia_users', JSON.stringify(users));
    
    // Remove user-specific data
    const apiKeys = JSON.parse(localStorage.getItem('riyanpedia_apikeys')) || {};
    delete apiKeys[userEmail];
    localStorage.setItem('riyanpedia_apikeys', JSON.stringify(apiKeys));
    
    const customApiKeys = JSON.parse(localStorage.getItem('riyanpedia_custom_apikeys')) || {};
    delete customApiKeys[userEmail];
    localStorage.setItem('riyanpedia_custom_apikeys', JSON.stringify(customApiKeys));
    
    localStorage.removeItem(`riyanpedia_history_${userEmail}`);
    
    showNotification('User berhasil dihapus!', 'success');
    loadAllUsers();
    loadAdminStats();
}

function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> Tambah User Baru</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addUserForm">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" id="newUserName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="newUserEmail" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="newUserPassword" class="form-control" required>
                    </div>
                    <button type="submit" class="btn-admin" style="width: 100%; padding: 12px;">
                        <i class="fas fa-user-plus"></i>
                        Tambah User
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('#addUserForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewUser();
    });
    
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function addNewUser() {
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    
    const users = getUsers();
    
    if (users[email]) {
        showNotification('Email sudah terdaftar!', 'error');
        return;
    }
    
    users[email] = {
        name: name,
        email: email,
        password: md5(password),
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('riyanpedia_users', JSON.stringify(users));
    
    showNotification('User berhasil ditambahkan!', 'success');
    document.querySelector('.modal').remove();
    loadAllUsers();
}

// ==================== API KEYS MANAGEMENT ====================

function loadAllApiKeys() {
    let allApiKeys = [];
    
    // Collect all API keys from all users
    const customApiKeys = JSON.parse(localStorage.getItem('riyanpedia_custom_apikeys')) || {};
    const users = getUsers();
    
    Object.keys(customApiKeys).forEach(userEmail => {
        const userKeys = customApiKeys[userEmail] || [];
        userKeys.forEach(key => {
            if (key.isActive) {
                allApiKeys.push({
                    ...key,
                    userEmail: userEmail,
                    userName: users[userEmail]?.name || 'Unknown User'
                });
            }
        });
    });
    
    const apiKeysContent = document.getElementById('apiKeysContent');
    
    if (allApiKeys.length === 0) {
        apiKeysContent.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Tidak ada API Key aktif</p>';
        return;
    }
    
    apiKeysContent.innerHTML = `
        <div class="admin-table">
            <div class="table-header" style="grid-template-columns: 1fr 1fr 2fr 1fr 1fr;">
                <div>Nama</div>
                <div>User</div>
                <div>Key</div>
                <div>Permissions</div>
                <div>Aksi</div>
            </div>
            ${allApiKeys.map(apiKey => `
                <div class="table-row" style="grid-template-columns: 1fr 1fr 2fr 1fr 1fr;">
                    <div>${apiKey.name}</div>
                    <div>${apiKey.userName}</div>
                    <div style="font-family: monospace; font-size: 0.8em;">${apiKey.key.substring(0, 20)}...</div>
                    <div>${apiKey.permissions.length} permissions</div>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewApiKey('${apiKey.id}', '${apiKey.userEmail}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="revokeAdminApiKey('${apiKey.id}', '${apiKey.userEmail}')">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function viewApiKey(apiKeyId, userEmail) {
    const customApiKeys = JSON.parse(localStorage.getItem('riyanpedia_custom_apikeys')) || {};
    const userKeys = customApiKeys[userEmail] || [];
    const apiKey = userKeys.find(k => k.id === apiKeyId);
    
    if (apiKey) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> Detail API Key</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nama</label>
                        <div class="form-control">${apiKey.name}</div>
                    </div>
                    <div class="form-group">
                        <label>User</label>
                        <div class="form-control">${getUsers()[userEmail]?.name || 'Unknown'} (${userEmail})</div>
                    </div>
                    <div class="form-group">
                        <label>API Key</label>
                        <div class="form-control" style="font-family: monospace;">${apiKey.key}</div>
                    </div>
                    <div class="form-group">
                        <label>Dibuat</label>
                        <div class="form-control">${new Date(apiKey.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                    <div class="form-group">
                        <label>Permissions</label>
                        <div class="form-control">
                            ${apiKey.permissions.map(perm => `
                                <span class="status-badge" style="background: var(--secondary); color: #000; margin: 2px;">${getPermissionLabel(perm)}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
}

function revokeAdminApiKey(apiKeyId, userEmail) {
    if (!confirm('Cabut API Key ini?')) {
        return;
    }
    
    const customApiKeys = JSON.parse(localStorage.getItem('riyanpedia_custom_apikeys')) || {};
    const userKeys = customApiKeys[userEmail] || [];
    const keyIndex = userKeys.findIndex(k => k.id === apiKeyId);
    
    if (keyIndex !== -1) {
        userKeys[keyIndex].isActive = false;
        localStorage.setItem('riyanpedia_custom_apikeys', JSON.stringify(customApiKeys));
        showNotification('API Key berhasil dicabut!', 'success');
        loadAllApiKeys();
    }
}

// ==================== SETTINGS ====================

function loadSettings() {
    document.getElementById('siteName').value = ADMIN_SYSTEM.settings.siteName;
    document.getElementById('supportEmail').value = ADMIN_SYSTEM.settings.supportEmail;
    document.getElementById('siteDescription').value = ADMIN_SYSTEM.settings.siteDescription;
}

function saveSettings() {
    ADMIN_SYSTEM.settings = {
        siteName: document.getElementById('siteName').value,
        supportEmail: document.getElementById('supportEmail').value,
        siteDescription: document.getElementById('siteDescription').value
    };
    
    localStorage.setItem('riyanpedia_admin_settings', JSON.stringify(ADMIN_SYSTEM.settings));
    showNotification('Pengaturan berhasil disimpan!', 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function formatNumber(num) {
    return parseInt(num || 0).toLocaleString('id-ID');
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 4000;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 400px;
    `;
    
    if (type === 'success') {
        notification.style.background = 'var(--success)';
    } else if (type === 'error') {
        notification.style.background = 'var(--error)';
    } else if (type === 'warning') {
        notification.style.background = 'var(--warning)';
        notification.style.color = '#000';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function getPermissionLabel(permission) {
    const labels = {
        'products': 'Lihat Produk',
        'transactions': 'Transaksi',
        'balance': 'Cek Saldo',
        'history': 'Riwayat'
    };
    return labels[permission] || permission;
}

// Ensure MD5 is available
if (typeof md5 === 'undefined') {
    console.error('MD5 library not loaded!');
    window.md5 = function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    };
}