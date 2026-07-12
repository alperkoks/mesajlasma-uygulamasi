// EKRANLAR VE ELEMENTLER
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');

// FORM VE BUTON ELEMENTLERİ
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const logoutBtn = document.getElementById('logout-btn');

// KULLANICI PROFİLİ VE SOHBET ELEMENTLERİ
const myAvatar = document.getElementById('my-avatar');
const myUsernameEl = document.getElementById('my-username');
const usersList = document.getElementById('users-list');
const noChatSelectedScreen = document.getElementById('no-chat-selected');
const chatActiveScreen = document.getElementById('chat-active');
const activeChatAvatar = document.getElementById('active-chat-avatar');
const activeChatName = document.getElementById('active-chat-name');
const activeChatStatus = document.getElementById('active-chat-status');
const messagesHistory = document.getElementById('messages-history');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');

// UYGULAMA DURUMU (STATE)
let currentUser = null;
let token = localStorage.getItem('token') || null;
let activeChatPartner = null;
let activeChatPartnerId = null;
let users = [];
let messages = [];
let socket = null; // Soket bağlantı nesnemiz

// API Sunucu Adresi
const API_URL = 'http://localhost:3000/api';

// --- ARAYÜZ GEÇİŞLERİ ---

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

function showScreen(screen) {
    if (screen === 'auth') {
        authScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
    } else if (screen === 'chat') {
        authScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
    }
}

// --- API BAĞLANTILARI ---

async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method: method,
        headers: headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Bir hata oluştu.');
        }
        return data;
    } catch (error) {
        console.error('API Hatası:', error);
        alert(error.message);
        throw error;
    }
}

// --- KAYIT VE GİRİŞ İŞLEMLERİ ---

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    try {
        await apiCall('/auth/register', 'POST', { username, password });
        alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        document.getElementById('login-username').value = username;
    } catch (err) {}
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiCall('/auth/login', 'POST', { username, password });
        token = data.token;
        currentUser = data.user;
        
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        initApp();
    } catch (err) {}
});

// Çıkış Butonuna Basıldığında Soket Bağlantısını da Kopar
logoutBtn.addEventListener('click', () => {
    // Soketi güvenli bir şekilde kapat
    if (socket) {
        socket.disconnect();
        socket = null;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    token = null;
    currentUser = null;
    activeChatPartner = null;
    activeChatPartnerId = null;
    
    showScreen('auth');
});

// --- UYGULAMAYI BAŞLATMA VE VERİ ÇEKME ---

async function initApp() {
    if (!token) {
        showScreen('auth');
        return;
    }

    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        myUsernameEl.textContent = currentUser.username;
        myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();

        showScreen('chat');
        await loadUsers();
        
        // --- SOCKET.IO BAĞLANTISINI KURMA ---
        // Sayfa her yüklendiğinde ve giriş yapıldığında soket hattını açıyoruz.
        // Kimliğimizi doğrulamak için token bilgisini soket bağlantı isteğine ekliyoruz.
        socket = io({
            auth: {
                token: token
            }
        });

        // Bağlantı hatası alırsak (örneğin token geçersizse) otomatik çıkış yap
        socket.on('connect_error', (err) => {
            console.error('Soket bağlantı hatası:', err.message);
            logoutBtn.click();
        });

        // Başka bir kullanıcının ÇEVRİMİÇİ/ÇEVRİMDIŞI durumu değiştiğinde çalışan olay
        socket.on('user_status_change', (data) => {
            const user = users.find(u => u.id === data.userId);
            if (user) {
                user.isOnline = data.isOnline;
                renderUsersList();
                
                // Eğer durum değişikliği olan kullanıcı şu an sohbet ettiğimiz kişiyse, tepedeki başlık bilgisini de anlık güncelle
                if (activeChatPartnerId === data.userId) {
                    activeChatStatus.textContent = data.isOnline ? 'çevrimiçi' : 'çevrimdışı';
                }
            }
        });

        // SUNUCUDAN ANLIK MESAJ GELDİĞİNDE çalışan olay
        socket.on('receive_message', (msg) => {
            // Gelen mesaj şu an sohbet penceresi açık olan kişiden mi geldi?
            if (activeChatPartnerId === msg.sender_id) {
                messages.push(msg);
                renderMessages(); // Mesajı ekrana anında çiz ve kaydır
            } else {
                // Başka birinden geldiyse, kullanıcı listesini güncelle (çevrimiçi/çevrimdışı ve son durumlar için)
                loadUsers();
            }
        });
        
    } catch (err) {
        logoutBtn.click();
    }
}

async function loadUsers() {
    try {
        const fetchedUsers = await apiCall('/users');
        users = fetchedUsers;
        renderUsersList();
    } catch (err) {
        console.error('Kullanıcı listesi çekilemedi', err);
    }
}

function renderUsersList() {
    usersList.innerHTML = '';
    const otherUsers = users.filter(user => user.username !== currentUser.username);
    
    if (otherUsers.length === 0) {
        usersList.innerHTML = '<li class="user-item placeholder">Henüz başka kayıtlı kullanıcı yok.</li>';
        return;
    }

    otherUsers.forEach(user => {
        const li = document.createElement('li');
        li.className = `user-item ${activeChatPartnerId === user.id ? 'active' : ''}`;
        
        const initial = user.username.substring(0, 2).toUpperCase();
        const statusClass = user.isOnline ? 'online' : 'offline';
        const statusText = user.isOnline ? 'çevrimiçi' : 'çevrimdışı';

        li.innerHTML = `
            <div class="avatar">${initial}</div>
            <div class="user-item-info">
                <div class="user-item-header">
                    <span class="name">${user.username}</span>
                    <span class="last-msg-time"></span>
                </div>
                <span class="last-msg">${statusText}</span>
            </div>
            <div class="user-item-status-dot ${statusClass}"></div>
        `;

        li.addEventListener('click', () => selectUserChat(user));
        usersList.appendChild(li);
    });
}

async function selectUserChat(user) {
    activeChatPartner = user.username;
    activeChatPartnerId = user.id;

    renderUsersList();

    activeChatName.textContent = user.username;
    activeChatAvatar.textContent = user.username.substring(0, 2).toUpperCase();
    activeChatStatus.textContent = user.isOnline ? 'çevrimiçi' : 'çevrimdışı';

    noChatSelectedScreen.classList.add('hidden');
    chatActiveScreen.classList.remove('hidden');

    await loadMessages();
}

async function loadMessages() {
    try {
        const history = await apiCall(`/messages/${activeChatPartnerId}`);
        messages = history;
        renderMessages();
    } catch (err) {
        console.error('Mesajlar yüklenemedi', err);
    }
}

function renderMessages() {
    messagesHistory.innerHTML = '';
    
    if (messages.length === 0) {
        messagesHistory.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:2rem;">Sohbetin başlangıcı. İlk mesajı siz yazın!</div>';
        return;
    }

    messages.forEach(msg => {
        const row = document.createElement('div');
        const isSentByMe = msg.sender_id === currentUser.id;
        row.className = `message-row ${isSentByMe ? 'sent' : 'received'}`;

        const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <div class="message-bubble">
                <div class="message-text">${escapeHTML(msg.message)}</div>
                <span class="message-time">${msgTime}</span>
            </div>
        `;
        messagesHistory.appendChild(row);
    });

    messagesHistory.scrollTop = messagesHistory.scrollHeight;
}

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !activeChatPartnerId) return;

    try {
        const newMsg = await apiCall('/messages', 'POST', {
            receiverId: activeChatPartnerId,
            message: text
        });

        messages.push(newMsg);
        renderMessages();
        messageInput.value = '';
        
    } catch (err) {
        console.error('Mesaj gönderilemedi', err);
    }
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

initApp();
