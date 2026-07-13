// SERVICE WORKER KAYDI (PWA DESTEĞİ İÇİN)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('✅ Service Worker başarıyla kaydedildi:', reg.scope))
            .catch((err) => console.error('❌ Service Worker kaydı başarısız:', err));
    });
}

// EKRANLAR VE ELEMENTLER
const authScreen = document.getElementById('auth-screen');
const chatScreen = document.getElementById('chat-screen');

// FORM VE BUTON ELEMENTLERİ
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const showForgotLink = document.getElementById('show-forgot');
const forgotShowLoginLink = document.getElementById('forgot-show-login');
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
const btnUnfriend = document.getElementById('btn-unfriend');
const btnBlock = document.getElementById('btn-block');
const mobileBackBtn = document.getElementById('mobile-back-btn');

// ARKADAŞLIK SİSTEMİ ELEMENTLERİ
const friendSearchForm = document.getElementById('friend-search-form');
const friendSearchInput = document.getElementById('friend-search-input');
const searchResultBox = document.getElementById('search-result-box');
const pendingRequestsSection = document.getElementById('pending-requests-section');
const pendingCount = document.getElementById('pending-count');
const pendingRequestsList = document.getElementById('pending-requests-list');

// PROFİL AYARLARI ELEMENTLERİ
const settingsModal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings-btn');
const closeSettings = document.getElementById('close-settings');
const settingsForm = document.getElementById('settings-form');
const settingsUsername = document.getElementById('settings-username');
const settingsAvatarPreview = document.getElementById('settings-avatar-preview');
const settingsFileInput = document.getElementById('settings-file-input');
const btnSelectPhoto = document.getElementById('btn-select-photo');
const btnUploadPhoto = document.getElementById('btn-upload-photo');

// LIGHTBOX (BÜYÜK RESİM ÖNİZLEME) ELEMENTLERİ
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightbox = document.getElementById('close-lightbox');

// UYGULAMA DURUMU (STATE)
let currentUser = null;
let token = localStorage.getItem('token') || null;
let activeChatPartner = null;
let activeChatPartnerId = null;
let users = [];
let messages = [];
let socket = null; // Soket bağlantı nesnemiz
let titleAlertInterval = null;
const originalTitle = document.title;

// API Sunucu Adresi (Hem lokalde hem bulutta otomatik çalışması için bağıl yol yapıyoruz)
const API_URL = '/api';

// --- ARAYÜZ GEÇİŞLERİ ---

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    forgotForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

showForgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
});

forgotShowLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotForm.classList.add('hidden');
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
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
        const data = await apiCall('/auth/register', 'POST', { username, email, password });
        alert(data.message || 'Kayıt başarılı! Lütfen doğrulama linki için e-postanızı kontrol edin.');
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        document.getElementById('login-username').value = username;
    } catch (err) {}
});

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value.trim();

    try {
        const data = await apiCall('/auth/forgot-password', 'POST', { email });
        alert(data.message || 'Şifre sıfırlama linki e-postanıza gönderildi.');
        forgotForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
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

// Arkadaşlıktan Çıkarma Butonunu Dinle
btnUnfriend.addEventListener('click', async () => {
    if (!activeChatPartnerId) return;
    const confirmRemove = confirm(`"${activeChatPartner}" adlı kullanıcıyı arkadaşlarınızdan çıkarmak istediğinize emin misiniz?`);
    if (!confirmRemove) return;

    try {
        const res = await apiCall('/friends/remove', 'POST', { friendId: activeChatPartnerId });
        alert(res.message);
        activeChatPartner = null;
        activeChatPartnerId = null;
        chatActiveScreen.classList.add('hidden');
        noChatSelectedScreen.classList.remove('hidden');
        await loadUsers();
    } catch (err) {
        console.error('Arkadaşlıktan çıkarılamadı', err);
    }
});

// Engelleme Butonunu Dinle
btnBlock.addEventListener('click', async () => {
    if (!activeChatPartnerId) return;
    const confirmBlock = confirm(`"${activeChatPartner}" adlı kullanıcıyı engellemek istediğinize emin misiniz? Bu işlem arkadaşlığınızı sonlandıracak ve size mesaj atmasını engelleyecektir.`);
    if (!confirmBlock) return;

    try {
        const res = await apiCall('/friends/block', 'POST', { blockedId: activeChatPartnerId });
        alert(res.message);
        activeChatPartner = null;
        activeChatPartnerId = null;
        chatActiveScreen.classList.add('hidden');
        noChatSelectedScreen.classList.remove('hidden');
        await loadUsers();
    } catch (err) {
        console.error('Kullanıcı engellenemedi', err);
    }
});

// Ayarlar Modalini Aç
openSettingsBtn.addEventListener('click', () => {
    settingsUsername.value = currentUser.username;
    
    // Profil resmi önizlemesini yükle
    if (currentUser.profile_pic) {
        settingsAvatarPreview.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
    } else {
        settingsAvatarPreview.textContent = currentUser.username.substring(0, 2).toUpperCase();
    }
    btnUploadPhoto.classList.add('hidden'); // Yükle butonu gizli başlasın
    
    settingsModal.classList.remove('hidden');
});

// Ayarlar Modalini Kapat
closeSettings.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// Modal dışına tıklandığında kapat
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
    }
});

// "Görsel Seç" butonuna basıldığında dosya seçiciyi tetikle
btnSelectPhoto.addEventListener('click', () => {
    settingsFileInput.click();
});

// Dosya seçildiğinde önizleme yap
settingsFileInput.addEventListener('change', () => {
    const file = settingsFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            settingsAvatarPreview.innerHTML = `<img src="${e.target.result}" class="avatar-img">`;
            btnUploadPhoto.classList.remove('hidden'); // Fotoğrafı Yükle butonunu göster
        };
        reader.readAsDataURL(file);
    }
});

// "Fotoğrafı Yükle" butonuna basıldığında görseli sunucuya yükle (Cloudinary)
btnUploadPhoto.addEventListener('click', async () => {
    const file = settingsFileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_pic', file);

    try {
        const response = await fetch('/api/profile/upload-pic', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Yükleme başarısız oldu.');
        }

        alert(data.message);

        // Token ve Kullanıcı bilgisini güncelle
        token = data.token;
        currentUser.profile_pic = data.profile_pic;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Kendi avatarlarımızı anlık güncelle
        if (currentUser.profile_pic) {
            const imgHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
            myAvatar.innerHTML = imgHTML;
            settingsAvatarPreview.innerHTML = imgHTML;
        }

        btnUploadPhoto.classList.add('hidden');

        if (socket) {
            socket.auth.token = token;
        }

        await loadUsers();
    } catch (err) {
        console.error('Profil resmi yükleme hatası:', err);
        alert(err.message || 'Profil resmi yüklenirken bir hata oluştu.');
    }
});

// Ayarları Kaydet (Kullanıcı Adı Güncelleme)
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = settingsUsername.value.trim();
    if (!newUsername || newUsername === currentUser.username) {
        settingsModal.classList.add('hidden');
        return;
    }

    try {
        const res = await apiCall('/profile/update-username', 'POST', { newUsername });
        alert(res.message);
        
        // Token ve Kullanıcı bilgisini güncelle
        token = res.token;
        currentUser = res.user;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Kendi arayüzümüzü güncelle
        myUsernameEl.textContent = currentUser.username;
        if (currentUser.profile_pic) {
            myAvatar.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
        } else {
            myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();
        }

        settingsModal.classList.add('hidden');
        
        if (socket) {
            socket.auth.token = token;
        }
    } catch (err) {
        // Hata zaten apiCall içinde alert ediliyor
    }
});

// Profil resmine tıklanınca resmi büyük aç (Lightbox)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('avatar-img')) {
        const imgSrc = e.target.src;
        if (imgSrc) {
            lightboxImg.src = imgSrc;
            lightboxModal.classList.remove('hidden');
        }
    }
});

// Lightbox modalını kapat
closeLightbox.addEventListener('click', () => {
    lightboxModal.classList.add('hidden');
});

// Modal dışına tıklandığında da kapat
lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
        lightboxModal.classList.add('hidden');
    }
});

// --- BİLDİRİM VE SES YARDIMCI FONKSİYONLARI ---

// Web Audio API ile programatik, tatlı bir bildirim melodisi sentezle
function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // 1. Nota (C5 - Do)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.15);

        // 2. Nota (E5 - Mi) - 80ms sonra çalarak tınıyı zenginleştirir
        setTimeout(() => {
            try {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.20);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.20);
            } catch (e) {}
        }, 80);
    } catch (err) {
        console.warn('Web Audio API desteklenmiyor veya engellendi:', err);
    }
}

// Sekme başlığının (title) yanıp sönmesini başlat
function startTitleAlert(senderName) {
    if (titleAlertInterval) clearInterval(titleAlertInterval);
    
    let showingAlert = false;
    titleAlertInterval = setInterval(() => {
        document.title = showingAlert 
            ? originalTitle 
            : `💬 (1) ${senderName} mesaj yazdı...`;
        showingAlert = !showingAlert;
    }, 1000);
}

// Sekme başlığını orijinal haline döndür
function stopTitleAlert() {
    if (titleAlertInterval) {
        clearInterval(titleAlertInterval);
        titleAlertInterval = null;
    }
    document.title = originalTitle;
}

// Kullanıcı pencereyi/sekmesini aktifleştirdiğinde başlık uyarısını temizle
window.addEventListener('focus', () => {
    stopTitleAlert();
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
        if (currentUser.profile_pic) {
            myAvatar.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
        } else {
            myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();
        }

        // Masaüstü bildirim izni iste
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        showScreen('chat');
        await loadUsers();
        await loadPendingRequests();
        
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
            const isCurrentChat = (activeChatPartnerId === msg.sender_id);
            
            if (isCurrentChat) {
                messages.push(msg);
                renderMessages(); // Mesajı ekrana anında çiz ve kaydır
                
                // Mesajı okuduğumuzu sunucuya bildir (arka planda)
                apiCall(`/messages/${msg.sender_id}`).catch(() => {});
            }
            
            // Son mesaj içeriğini ve zamanını yerel listede güncelle
            const sender = users.find(u => u.id === msg.sender_id);
            if (sender) {
                sender.last_message = msg.message;
                sender.last_message_time = msg.created_at;
                if (!isCurrentChat) {
                    sender.unread_count = (sender.unread_count || 0) + 1;
                }
                renderUsersList();
            } else {
                // Eğer listede yoksa baştan çek
                loadUsers();
            }

            // --- BİLDİRİM VE SES TETİKLEMELERİ ---
            // Eğer sekme arka plandaysa (kullanıcı başka sekmedeyse) veya sohbet o kişiyle açık değilse uyar
            if (document.hidden || !isCurrentChat) {
                // Ses çal
                playNotificationSound();
                
                // Gönderenin adını bul
                const sender = users.find(u => u.id === msg.sender_id);
                const senderName = sender ? sender.username : 'Bir arkadaşınız';

                // Sekme başlığını titret
                startTitleAlert(senderName);

                // Eğer izin verildiyse masaüstü bildirim yolla
                if ('Notification' in window && Notification.permission === 'granted') {
                    const notification = new Notification(senderName, {
                        body: msg.message,
                        tag: `msg-${msg.sender_id}`, // Aynı kişiden gelen bildirimleri üst üste yığmak için
                        renotify: true
                    });
                    notification.onclick = () => {
                        window.focus();
                        if (sender) selectUserChat(sender);
                    };
                }
            }
        });

        // ARKADAŞLIK İSTEĞİ GELDİĞİNDE çalışan olay
        socket.on('friend_request_received', async (data) => {
            console.log('Yeni arkadaşlık isteği alındı:', data);
            await loadPendingRequests();
        });

        // ARKADAŞLIK İSTEĞİ KABUL EDİLDİĞİNDE çalışan olay
        socket.on('friend_request_accepted', async (data) => {
            console.log('Arkadaşlık isteği kabul edildi:', data);
            await loadUsers();
            // Arama sonucunu da yenilemek için eğer arama kutusu açıksa
            if (!searchResultBox.classList.contains('hidden') && friendSearchInput.value.trim() !== '') {
                friendSearchForm.dispatchEvent(new Event('submit'));
            }
        });

        // ARKADAŞLIKTAN ÇIKARILDIĞINDA VEYA ENGELLENDİĞİNDE çalışan olay
        socket.on('friendship_removed', async (data) => {
            console.log('Arkadaşlık ilişkisi silindi:', data);
            if (activeChatPartnerId === data.friendId) {
                alert('Bu kullanıcıyla olan arkadaşlık ilişkiniz sonlandırıldı.');
                activeChatPartner = null;
                activeChatPartnerId = null;
                chatActiveScreen.classList.add('hidden');
                noChatSelectedScreen.classList.remove('hidden');
            }
            await loadUsers();
        });

        // KULLANICI ADI DEĞİŞTİĞİNDE çalışan olay
        socket.on('username_changed', (data) => {
            console.log('Kullanıcı adı değişti:', data);
            
            // 1. Arkadaşlarımız arasındaysa ismini güncelle
            const friend = users.find(u => u.id === data.userId);
            if (friend) {
                friend.username = data.newUsername;
                renderUsersList();
            }

            // 2. Eğer şu an sohbet ettiğimiz partner ise başlık bilgisini güncelle
            if (activeChatPartnerId === data.userId) {
                activeChatPartner = data.newUsername;
                activeChatName.textContent = data.newUsername;
                activeChatAvatar.textContent = data.newUsername.substring(0, 2).toUpperCase();
            }
        });

        // KULLANICI PROFİL FOTOĞRAFINI DEĞİŞTİRDİĞİNDE çalışan olay
        socket.on('profile_pic_changed', (data) => {
            console.log('Profil fotoğrafı değişti:', data);
            
            // 1. Arkadaşlarımız arasındaysa profil resmini güncelle
            const friend = users.find(u => u.id === data.userId);
            if (friend) {
                friend.profile_pic = data.profilePic;
                renderUsersList();
            }

            // 2. Eğer şu an sohbet ettiğimiz partner ise başlık bilgisini güncelle
            if (activeChatPartnerId === data.userId) {
                activeChatAvatar.innerHTML = `<img src="${data.profilePic}" alt="${activeChatPartner}" class="avatar-img">`;
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

function formatMessageTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function renderUsersList() {
    usersList.innerHTML = '';
    // Arayüzde sadece kendimiz dışındaki kişileri listeliyoruz (zaten API sadece arkadaşlarımızı dönüyor)
    const otherUsers = users.filter(user => user.username !== currentUser.username);
    
    if (otherUsers.length === 0) {
        usersList.innerHTML = '<li class="user-item placeholder">Henüz arkadaş eklemediniz. Yukarıdan aratıp ekleyebilirsiniz!</li>';
        return;
    }

    otherUsers.forEach(user => {
        const li = document.createElement('li');
        li.className = `user-item ${activeChatPartnerId === user.id ? 'active' : ''}`;
        
        const initial = user.username.substring(0, 2).toUpperCase();
        const statusClass = user.isOnline ? 'online' : 'offline';

        // Okunmamış mesaj sayısı rozeti (Badge)
        const badgeHTML = user.unread_count > 0 
            ? `<div class="unread-badge">${user.unread_count}</div>` 
            : '';

        // Son mesaj içeriği veya çevrimiçi durumu
        const lastMsgText = user.last_message 
            ? user.last_message 
            : (user.isOnline ? 'çevrimiçi' : 'çevrimdışı');

        const lastMsgTimeText = user.last_message_time 
            ? formatMessageTime(user.last_message_time) 
            : '';

        const avatarHTML = user.profile_pic 
            ? `<img src="${user.profile_pic}" alt="${user.username}" class="avatar-img">`
            : initial;

        li.innerHTML = `
            <div class="avatar">${avatarHTML}</div>
            <div class="user-item-info">
                <div class="user-item-header">
                    <span class="name">${user.username}</span>
                    <span class="last-msg-time">${lastMsgTimeText}</span>
                </div>
                <span class="last-msg">${lastMsgText}</span>
            </div>
            ${badgeHTML}
            <div class="user-item-status-dot ${statusClass}"></div>
        `;

        li.addEventListener('click', () => selectUserChat(user));
        usersList.appendChild(li);
    });
}

// --- ARKADAŞLIK SİSTEMİ FONKSİYONLARI ---

// Bekleyen İstekleri Sunucudan Çek
async function loadPendingRequests() {
    try {
        const requests = await apiCall('/friends/requests');
        renderPendingRequests(requests);
    } catch (err) {
        console.error('Bekleyen istekler yüklenemedi', err);
    }
}

// Bekleyen İstekleri Arayüze Çiz
function renderPendingRequests(requests) {
    if (requests.length === 0) {
        pendingRequestsSection.classList.add('hidden');
        return;
    }

    pendingRequestsSection.classList.remove('hidden');
    pendingCount.textContent = requests.length;
    pendingRequestsList.innerHTML = '';

    requests.forEach(req => {
        const li = document.createElement('li');
        li.className = 'pending-request-item';
        
        const initial = req.username.substring(0, 2).toUpperCase();
        const avatarHTML = req.profile_pic 
            ? `<img src="${req.profile_pic}" alt="${req.username}" class="avatar-img">`
            : initial;
        
        li.innerHTML = `
            <div class="pending-request-info">
                <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem; min-width: 32px;">${avatarHTML}</div>
                <span class="username" style="font-weight: 500;">${req.username}</span>
            </div>
            <div class="pending-request-actions">
                <button class="btn-small btn-accept" data-id="${req.user_id}">Kabul Et</button>
            </div>
        `;

        li.querySelector('.btn-accept').addEventListener('click', async (e) => {
            const friendId = parseInt(e.target.getAttribute('data-id'));
            try {
                const res = await apiCall('/friends/accept', 'POST', { friendId });
                alert(res.message);
                await loadPendingRequests();
                await loadUsers();
            } catch (err) {
                console.error('İstek kabul edilemedi', err);
            }
        });

        pendingRequestsList.appendChild(li);
    });
}

// Arkadaş Arama Formunu Dinle
friendSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = friendSearchInput.value.trim();
    if (!username) return;

    try {
        const result = await apiCall(`/friends/search?username=${username}`);
        searchResultBox.classList.remove('hidden');
        renderSearchResult(result);
    } catch (err) {
        searchResultBox.classList.remove('hidden');
        searchResultBox.innerHTML = `<div style="font-size: 0.85rem; color: #EF4444; text-align: center;">Kullanıcı bulunamadı.</div>`;
    }
});

// Arama Girişi Temizlendiğinde Sonuçları Gizle
friendSearchInput.addEventListener('input', () => {
    if (friendSearchInput.value.trim() === '') {
        searchResultBox.classList.add('hidden');
        searchResultBox.innerHTML = '';
    }
});

// Arama Sonucunu Çiz
function renderSearchResult(user) {
    const initial = user.username.substring(0, 2).toUpperCase();
    
    let actionBtnHTML = '';
    if (user.friendshipStatus === 'none') {
        actionBtnHTML = `<button class="btn-add-friend" id="btn-action-add" data-id="${user.id}">Ekle</button>`;
    } else if (user.friendshipStatus === 'pending_sent') {
        actionBtnHTML = `<span class="search-result-status-text">İstek Gönderildi</span>`;
    } else if (user.friendshipStatus === 'pending_received') {
        actionBtnHTML = `<button class="btn-add-friend btn-accept" id="btn-action-accept" data-id="${user.id}">Onayla</button>`;
    } else if (user.friendshipStatus === 'friends') {
        actionBtnHTML = `<span class="search-result-status-text" style="color: #10B981; font-weight: bold;">Arkadaşsınız</span>`;
    } else if (user.friendshipStatus === 'blocked') {
        actionBtnHTML = `<button class="btn-add-friend" style="background-color: #EF4444;" id="btn-action-unblock" data-id="${user.id}">Engeli Kaldır</button>`;
    }

    const avatarHTML = user.profile_pic 
        ? `<img src="${user.profile_pic}" alt="${user.username}" class="avatar-img">`
        : initial;

    searchResultBox.innerHTML = `
        <div class="search-result-item">
            <div class="search-result-info">
                <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem; min-width: 32px;">${avatarHTML}</div>
                <span style="font-weight: 500;">${user.username}</span>
            </div>
            <div class="search-result-action">
                ${actionBtnHTML}
            </div>
        </div>
    `;

    // Arama buton dinleyicilerini bağla
    const addBtn = document.getElementById('btn-action-add');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            try {
                const res = await apiCall('/friends/request', 'POST', { friendId: user.id });
                alert(res.message);
                user.friendshipStatus = 'pending_sent';
                renderSearchResult(user);
            } catch (err) {
                console.error('İstek gönderilemedi', err);
            }
        });
    }

    const acceptBtn = document.getElementById('btn-action-accept');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            try {
                const res = await apiCall('/friends/accept', 'POST', { friendId: user.id });
                alert(res.message);
                user.friendshipStatus = 'friends';
                renderSearchResult(user);
                await loadPendingRequests();
                await loadUsers();
            } catch (err) {
                console.error('İstek onaylanamadı', err);
            }
        });
    }

    const unblockBtn = document.getElementById('btn-action-unblock');
    if (unblockBtn) {
        unblockBtn.addEventListener('click', async () => {
            try {
                const res = await apiCall('/friends/unblock', 'POST', { blockedId: user.id });
                alert(res.message);
                user.friendshipStatus = 'none';
                renderSearchResult(user);
            } catch (err) {
                console.error('Engel kaldırılamadı', err);
            }
        });
    }
}

async function selectUserChat(user) {
    activeChatPartner = user.username;
    activeChatPartnerId = user.id;

    // Okunmamış mesaj sayısını sıfırla
    user.unread_count = 0;
    const localUser = users.find(u => u.id === user.id);
    if (localUser) {
        localUser.unread_count = 0;
    }

    renderUsersList();

    // Mobilde sohbet alanını öne getirmek için container'a sınıf ekle
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.classList.add('mobile-chat-active');
    }

    activeChatName.textContent = user.username;
    if (user.profile_pic) {
        activeChatAvatar.innerHTML = `<img src="${user.profile_pic}" alt="${user.username}" class="avatar-img">`;
    } else {
        activeChatAvatar.textContent = user.username.substring(0, 2).toUpperCase();
    }
    activeChatStatus.textContent = user.isOnline ? 'çevrimiçi' : 'çevrimdışı';

    noChatSelectedScreen.classList.add('hidden');
    chatActiveScreen.classList.remove('hidden');

    await loadMessages();
}

// Mobilde sohbet alanından arkadaş listesine geri dönme butonu
mobileBackBtn.addEventListener('click', () => {
    activeChatPartner = null;
    activeChatPartnerId = null;
    
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.classList.remove('mobile-chat-active');
    }
    
    chatActiveScreen.classList.add('hidden');
    noChatSelectedScreen.classList.remove('hidden');
    
    renderUsersList();
});

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

        // Gönderdiğimiz mesajı listedeki son mesaj olarak güncelle
        const partner = users.find(u => u.id === activeChatPartnerId);
        if (partner) {
            partner.last_message = newMsg.message;
            partner.last_message_time = newMsg.created_at;
            renderUsersList();
        }
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
