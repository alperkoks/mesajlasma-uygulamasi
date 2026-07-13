// GLOBAL HATA YAKALAYICI (MOBİL HATA TAKİBİ İÇİN)
window.onerror = function(message, source, lineno, colno, error) {
    alert("🚨 GLOBAL JS HATASI:\nMesaj: " + message + "\nSatır: " + lineno + "\nDosya: " + source);
    return false;
};

// SERVICE WORKER KAYDI (PWA DESTEĞİ İÇİN)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => console.log('✅ Service Worker başarıyla kaydedildi:', reg.scope))
            .catch((err) => console.error('❌ Service Worker kaydı başarısız:', err));
    });
}

// KARANLIK / AYDINLIK TEMA YÖNETİMİ
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
}

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeBtn.textContent = isDark ? '☀️' : '🌙';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});

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
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const fileInput = document.getElementById('file-input');
const btnAttach = document.getElementById('btn-attach');

// ARKADAŞLIK SİSTEMİ ELEMENTLERİ
const friendSearchForm = document.getElementById('friend-search-form');
const friendSearchInput = document.getElementById('friend-search-input');
const searchResultBox = document.getElementById('search-result-box');
const pendingRequestsSection = document.getElementById('pending-requests-section');
const pendingCount = document.getElementById('pending-count');
const pendingRequestsList = document.getElementById('pending-requests-list');

// GRUP SİSTEMİ ELEMENTLERİ
const tabFriends = document.getElementById('tab-friends');
const tabGroups = document.getElementById('tab-groups');
const badgeFriendsDot = document.getElementById('badge-friends-dot');
const badgeGroupsDot = document.getElementById('badge-groups-dot');
const friendsTabContent = document.getElementById('friends-tab-content');
const groupsTabContent = document.getElementById('groups-tab-content');
const groupsList = document.getElementById('groups-list');
const btnCreateGroupOpen = document.getElementById('btn-create-group-open');
const groupCreateModal = document.getElementById('group-create-modal');
const closeGroupModal = document.getElementById('close-group-modal');
const groupCreateForm = document.getElementById('group-create-form');
const groupNameInput = document.getElementById('group-name-input');
const groupFriendsCheckboxes = document.getElementById('group-friends-checkboxes');

// ARAMA VE SOHBET TEMİZLEME ELEMENTLERİ
const btnToggleSearch = document.getElementById('btn-toggle-search');
const btnClearChat = document.getElementById('btn-clear-chat');
const chatSearchBar = document.getElementById('chat-search-bar');
const chatSearchInput = document.getElementById('chat-search-input');
const btnChatSearchClose = document.getElementById('btn-chat-search-close');

// GRUP AYARLARI MODAL ELEMENTLERİ
const btnGroupSettings = document.getElementById('btn-group-settings');
const groupSettingsModal = document.getElementById('group-settings-modal');
const closeGroupSettingsModal = document.getElementById('close-group-settings-modal');
const groupSettingsAvatarPreview = document.getElementById('group-settings-avatar-preview');
const lblGroupPic = document.getElementById('lbl-group-pic');
const groupPicInput = document.getElementById('group-pic-input');
const groupSettingsNameInput = document.getElementById('group-settings-name-input');
const btnGroupNameUpdate = document.getElementById('btn-group-name-update');
const groupMembersListContainer = document.getElementById('group-members-list-container');
const btnLeaveGroup = document.getElementById('btn-leave-group');
const groupAddMemberSection = document.getElementById('group-add-member-section');
const groupAddMemberSelect = document.getElementById('group-add-member-select');
const btnGroupAddMember = document.getElementById('btn-group-add-member');

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
const btnRequestNotifications = document.getElementById('btn-request-notifications');
const btnInstallApp = document.getElementById('btn-install-app');
const btnChatOptions = document.getElementById('btn-chat-options');
const chatOptionsDropdown = document.getElementById('chat-options-dropdown');
const btnMuteChat = document.getElementById('btn-mute-chat');
const settingsVolume = document.getElementById('settings-volume');
const settingsVolumeValue = document.getElementById('settings-volume-value');

// UYGULAMA DURUMU (STATE)
let currentUser = null;
let deferredPrompt = null;
let token = localStorage.getItem('token') || null;
let activeChatPartner = null;
let activeChatPartnerId = null;
let groups = [];
let activeChatGroupId = null;
let users = [];
let messages = [];
let socket = null; // Soket bağlantı nesnemiz
let titleAlertInterval = null;
const originalTitle = document.title;
let appVolume = parseFloat(localStorage.getItem('appVolume') || '1.0');
let mutedChats = JSON.parse(localStorage.getItem('mutedChats') || '[]');

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

// Bildirim İzni İsteme (Zil ikonu tıklaması)
if (btnRequestNotifications) {
    btnRequestNotifications.addEventListener('click', async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                alert('Harika! Anlık bildirimler başarıyla etkinleştirildi.');
                btnRequestNotifications.classList.add('hidden');
                await initPushNotifications();
            } else {
                alert('Bildirim izni reddedildi. Bildirim almak için tarayıcı ayarlarından izin vermeniz gerekmektedir.');
            }
        } catch (err) {
            alert('Bildirim etkinleştirilemedi: ' + err.message);
        }
    });
}

// PWA (Uygulama) Kurulum İşlemleri
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (btnInstallApp) {
        btnInstallApp.classList.remove('hidden');
    }
});

if (btnInstallApp) {
    btnInstallApp.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA Kurulum Seçimi: ${outcome}`);
        deferredPrompt = null;
        btnInstallApp.classList.add('hidden');
    });
}

window.addEventListener('appinstalled', () => {
    console.log('PWA Uygulaması kuruldu.');
    if (btnInstallApp) {
        btnInstallApp.classList.add('hidden');
    }
});

// Ses Seviyesi Kaydırıcı Anlık Değişim Dinleyicisi
if (settingsVolume && settingsVolumeValue) {
    settingsVolume.addEventListener('input', () => {
        settingsVolumeValue.textContent = Math.round(settingsVolume.value * 100) + '%';
    });
}

// Sohbet Sessize Alma İşlemleri
if (btnMuteChat) {
    btnMuteChat.addEventListener('click', async (e) => {
        e.stopPropagation();
        const targetId = activeChatPartnerId ? `user_${activeChatPartnerId}` : `group_${activeChatGroupId}`;
        if (!targetId) return;

        if (mutedChats.includes(targetId)) {
            mutedChats = mutedChats.filter(id => id !== targetId);
            alert('Sohbet sesi açıldı.');
        } else {
            mutedChats.push(targetId);
            alert('Sohbet sessize alındı. Bu sohbetten gelen bildirimler telefonunuzu titretmeyecek ve ses çıkarmayacaktır.');
        }

        // Değişiklikleri kaydet
        localStorage.setItem('mutedChats', JSON.stringify(mutedChats));
        await saveMutedChatsToCache(mutedChats);
        updateMuteButtonUI();
    });
}

function updateMuteButtonUI() {
    if (!btnMuteChat) return;
    const targetId = activeChatPartnerId ? `user_${activeChatPartnerId}` : `group_${activeChatGroupId}`;
    if (!targetId) {
        btnMuteChat.classList.add('hidden');
        return;
    }
    btnMuteChat.classList.remove('hidden');

    if (mutedChats.includes(targetId)) {
        btnMuteChat.innerHTML = '🔔 <span>Sesi Aç</span>';
    } else {
        btnMuteChat.innerHTML = '🔕 <span>Sessize Al</span>';
    }
}

async function saveMutedChatsToCache(mutedList) {
    try {
        if ('caches' in window) {
            const cache = await caches.open('app-settings');
            await cache.put('/muted-chats', new Response(JSON.stringify(mutedList)));
        }
    } catch (e) {
        console.warn('Mute listesi Cache API\'ye kaydedilemedi:', e);
    }
}

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
    
    if (settingsVolume && settingsVolumeValue) {
        settingsVolume.value = appVolume;
        settingsVolumeValue.textContent = Math.round(appVolume * 100) + '%';
    }
    
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
    // Ses Seviyesini Kaydet
    if (settingsVolume) {
        appVolume = parseFloat(settingsVolume.value);
        localStorage.setItem('appVolume', appVolume);
    }

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
let globalAudioContext = null;

function initAudioContext() {
    try {
        if (!globalAudioContext) {
            globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioContext.state === 'suspended') {
            globalAudioContext.resume();
        }
    } catch (e) {
        console.warn('AudioContext başlatılamadı:', e);
    }
}

// Kullanıcının ekrana ilk dokunuşunda ses motorunu uyandır
document.addEventListener('click', initAudioContext);
document.addEventListener('touchstart', initAudioContext);

function playNotificationSound(chatId = null) {
    // Sohbet sessize alınmışsa ses çalma
    if (chatId && mutedChats.includes(chatId)) {
        return;
    }

    try {
        initAudioContext();
        if (!globalAudioContext) return;
        
        const audioCtx = globalAudioContext;
        
        // Kullanıcının belirlediği ses seviyesi (maksimum 0.8)
        const vol = appVolume * 0.8;
        if (vol <= 0) return; // Ses sıfırsa çalma
        
        // 1. Nota (C5 - Do)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gain1.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.start();
        osc1.stop(audioCtx.currentTime + 0.15);

        // 2. Nota (E5 - Mi) - 80ms sonra çalarak tınıyı zenginleştirir
        setTimeout(() => {
            try {
                if (audioCtx.state === 'suspended') return;
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime);
                gain2.gain.setValueAtTime(vol, audioCtx.currentTime);
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

// --- WEB PUSH BİLDİRİM ABONELİĞİ ---
async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Web Push bildirimleri bu tarayıcıda desteklenmiyor.');
        return;
    }

    // Bildirim izni verilmediyse veya sorulmadıysa zil simgesini göster (kullanıcı jesti gerekliliği)
    if (Notification.permission !== 'granted') {
        if (btnRequestNotifications) {
            btnRequestNotifications.classList.remove('hidden');
        }
        return;
    }

    // Zaten izin verilmişse zili gizle ve sessizce kaydol
    if (btnRequestNotifications) {
        btnRequestNotifications.classList.add('hidden');
    }

    try {
        // Service worker dosyasını kaydet
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        // Sunucudan VAPID Public Key al
        const keyData = await apiCall('/push/public-key');
        const publicKey = keyData.publicKey;
        if (!publicKey) return;

        // Mevcut aboneliği kontrol et veya yeni abonelik oluştur
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey)
            });
        }

        // Aboneliği JSON formatına çevirip kaydet (bazı tarayıcılarda doğrudan stringify boş nesne döner)
        const subscriptionJSON = subscription.toJSON();

        // Aboneliği sunucuya kaydet
        await apiCall('/push/subscribe', 'POST', { subscription: subscriptionJSON });
        console.log('Web Push aboneliği başarıyla sunucuya kaydedildi.');
    } catch (err) {
        console.error('Web Push bildirim kaydı hatası:', err);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

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

        // Web Push ve Bildirim Yetkilerini Başlat
        initPushNotifications();

        showScreen('chat');
        await loadUsers();
        await loadPendingRequests();
        await loadGroups();
        
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
            // Sadece kimlik doğrulama/token yetki hatalarında çıkış yap, geçici ağ kesintilerinde çıkış yapma!
            if (err.message === 'Yetkisiz bağlantı.' || err.message === 'Geçersiz anahtar.') {
                logoutBtn.click();
            }
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

        // Başka bir kullanıcının yazma durumu değiştiğinde çalışan olay
        socket.on('typing_status', (data) => {
            const user = users.find(u => u.id === data.senderId);
            if (user) {
                user.isTyping = data.isTyping;
                renderUsersList();
                
                // Eğer yazan kişi şu an aktif sohbet ortağımızsa başlığı da güncelle
                if (activeChatPartnerId === data.senderId) {
                    activeChatStatus.textContent = data.isTyping ? 'yazıyor...' : (user.isOnline ? 'çevrimiçi' : 'çevrimdışı');
                }
            }
        });

        // Başka bir kullanıcı gönderdiğimiz mesajları okuduğunda çalışan olay
        socket.on('messages_read', (data) => {
            if (activeChatPartnerId === data.readerId) {
                messages.forEach(msg => {
                    if (msg.sender_id === currentUser.id) {
                        msg.is_read = 1;
                    }
                });
                renderMessages();
            }
        });

        // SUNUCUDAN ANLIK MESAJ GELDİĞİNDE çalışan olay
        socket.on('receive_message', (msg) => {
            if (msg.group_id) {
                const isCurrentGroup = (activeChatGroupId === msg.group_id);
                if (isCurrentGroup) {
                    const isAlreadyAdded = messages.some(m => m.id === msg.id);
                    if (!isAlreadyAdded) {
                        messages.push(msg);
                        renderMessages();
                    }
                }
                
                // Grubun son mesajını güncelle ve okunmamış bildirim sayısını artır
                const grp = groups.find(g => g.id === msg.group_id);
                if (grp) {
                    grp.last_message = msg.message;
                    grp.last_message_time = msg.created_at;
                    if (!isCurrentGroup) {
                        grp.unread_count = (grp.unread_count || 0) + 1;
                    }
                    renderGroupsList();
                } else {
                    loadGroups();
                }
                
                // Sadece başkası gönderdiyse ses çal
                if (msg.sender_id !== currentUser.id) {
                    playNotificationSound(`group_${msg.group_id}`);
                }

                if (document.hidden || !isCurrentGroup) {
                    const senderName = msg.sender_name || 'Grup Üyesi';
                    startTitleAlert(senderName);

                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(grp ? grp.name : "Yeni Grup Mesajı", {
                            body: `${senderName}: ${msg.message}`,
                            tag: `group-${msg.group_id}`,
                            renotify: true
                        });
                    }
                }
                return;
            }

            const isCurrentChat = (activeChatPartnerId === msg.sender_id);
            
            if (isCurrentChat) {
                const isAlreadyAdded = messages.some(m => m.id === msg.id);
                if (!isAlreadyAdded) {
                    messages.push(msg);
                    renderMessages();
                }
                
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
            // Sadece başkası gönderdiyse ses çal
            if (msg.sender_id !== currentUser.id) {
                playNotificationSound(`user_${msg.sender_id}`);
            }

            // Eğer sekme arka plandaysa (kullanıcı başka sekmedeyse) veya sohbet o kişiyle açık değilse uyar
            if (document.hidden || !isCurrentChat) {
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

        // YENİ GRUP OLUŞTURULDUĞUNDA çalışan olay
        socket.on('group_created', (group) => {
            loadGroups();
        });

        // GRUP GÜNCELLEMELERİ VE MODERASYON SOKET OLAYLARI
        socket.on('group_updated', (updatedGroup) => {
            if (activeChatGroupId === updatedGroup.id) {
                activeChatName.textContent = updatedGroup.name;
                if (updatedGroup.profile_pic) {
                    activeChatAvatar.style.backgroundColor = 'transparent';
                    activeChatAvatar.innerHTML = `<img src="${updatedGroup.profile_pic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                }
            }
            loadGroups();
        });

        socket.on('member_removed', (data) => {
            if (activeChatGroupId === data.groupId) {
                if (groupSettingsModal && !groupSettingsModal.classList.contains('hidden')) {
                    const group = groups.find(g => g.id === data.groupId);
                    if (group) loadGroupMembers(group);
                }
            }
        });

        socket.on('left_group', (data) => {
            if (activeChatGroupId === data.groupId) {
                alert('Bu gruptan çıkarıldınız moruk!');
                activeChatGroupId = null;
                chatActiveScreen.classList.add('hidden');
                noChatSelectedScreen.classList.remove('hidden');
            }
            loadGroups();
        });

        // SOHBET TEMİZLENDİĞİNDE çalışan olay
        socket.on('chat_cleared', (data) => {
            if (data.groupId && activeChatGroupId === data.groupId) {
                messages = [];
                renderMessages();
                const grp = groups.find(g => g.id === data.groupId);
                if (grp) {
                    grp.last_message = 'Sohbet temizlendi';
                    grp.last_message_time = null;
                    renderGroupsList();
                }
            } else if (data.senderId && activeChatPartnerId === data.senderId) {
                messages = [];
                renderMessages();
                const partner = users.find(u => u.id === data.senderId);
                if (partner) {
                    partner.last_message = 'Sohbet temizlendi';
                    partner.last_message_time = null;
                    renderUsersList();
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
        console.error('Uygulama başlatma hatası:', err);
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
    
    // Arkadaşları son mesaj tarihine göre sırala (en yeni mesaj atan en üstte olsun)
    otherUsers.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        if (timeA !== timeB) {
            return timeB - timeA;
        }
        return a.username.localeCompare(b.username);
    });
    
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

        // Son mesaj içeriği veya çevrimiçi durumu (Yazıyor kontrolü ile)
        let lastMsgText = user.last_message 
            ? escapeHTML(user.last_message) 
            : (user.isOnline ? 'çevrimiçi' : 'çevrimdışı');

        if (user.isTyping) {
            lastMsgText = '<span style="color:var(--primary-color); font-weight:500; font-style:italic;">yazıyor...</span>';
        }

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
    updateTabBadges();
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
    try {
        activeChatPartner = user.username;
        activeChatPartnerId = user.id;
        activeChatGroupId = null;
        updateMuteButtonUI();

        // Arama barını kapat ve sıfırla
        if (chatSearchBar) chatSearchBar.classList.add('hidden');
        if (chatSearchInput) chatSearchInput.value = '';

        // Butonları görünür kıl
        btnUnfriend.classList.remove('hidden');
        btnBlock.classList.remove('hidden');
        if (btnGroupSettings) btnGroupSettings.classList.add('hidden');

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

        // Yükleniyor durumunu göstermek için skeleton loader ekle
        messagesHistory.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-item received"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item sent"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item received"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item sent"><div class="skeleton-bubble"></div></div>
            </div>
        `;

        await loadMessages();
    } catch (err) {
        alert("Hata (selectUserChat): " + err.message + "\nStack: " + err.stack);
    }
}

// Mobilde sohbet alanından arkadaş listesine geri dönme butonu
if (mobileBackBtn) {
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
}

async function loadMessages() {
    try {
        let history;
        if (activeChatGroupId) {
            history = await apiCall(`/groups/${activeChatGroupId}/messages`);
        } else {
            history = await apiCall(`/messages/${activeChatPartnerId}`);
        }
        messages = history;
        renderMessages();
    } catch (err) {
        console.error('Mesajlar yüklenemedi', err);
    }
}

function renderMessages() {
    messagesHistory.innerHTML = '';
    
    const searchQuery = chatSearchInput ? chatSearchInput.value.toLowerCase().trim() : '';
    const filteredMessages = messages.filter(msg => {
        if (!searchQuery) return true;
        return msg.message && msg.message.toLowerCase().includes(searchQuery);
    });

    if (filteredMessages.length === 0) {
        if (searchQuery) {
            messagesHistory.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:2rem;">Arama kriterine uygun mesaj bulunamadı.</div>';
        } else {
            messagesHistory.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-top:2rem;">Sohbetin başlangıcı. İlk mesajı siz yazın!</div>';
        }
        return;
    }

    filteredMessages.forEach(msg => {
        const row = document.createElement('div');
        const isSentByMe = msg.sender_id === currentUser.id;
        row.className = `message-row ${isSentByMe ? 'sent' : 'received'}`;

        const msgTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let ticksHTML = '';
        if (isSentByMe) {
            if (msg.is_read === 1) {
                ticksHTML = '<span class="msg-tick read" style="color:#60a5fa; margin-left:4px; font-weight:bold;">✓✓</span>';
            } else {
                const partner = users.find(u => u.id === msg.receiver_id);
                if (partner && partner.isOnline) {
                    ticksHTML = '<span class="msg-tick delivered" style="color:var(--text-muted); margin-left:4px;">✓✓</span>';
                } else {
                    ticksHTML = '<span class="msg-tick sent" style="color:var(--text-muted); margin-left:4px;">✓</span>';
                }
            }
        }

        let msgContentHTML = '';
        if (msg.message_type === 'image') {
            msgContentHTML = `<img src="${msg.file_url}" alt="görsel" style="max-width:100%; max-height:240px; border-radius:8px; display:block; cursor:pointer; margin-bottom: 2px;" onclick="window.open('${msg.file_url}', '_blank')">`;
        } else if (msg.message_type === 'file') {
            msgContentHTML = `<a href="${msg.file_url}" target="_blank" style="color:inherit; font-weight:600; display:inline-flex; align-items:center; gap:6px; text-decoration:underline; word-break:break-all;">📁 ${escapeHTML(msg.message)}</a>`;
        } else {
            msgContentHTML = escapeHTML(msg.message);
        }

        let senderNameHTML = '';
        if (activeChatGroupId && !isSentByMe) {
            senderNameHTML = `<div style="font-size:0.75rem; font-weight:600; color:var(--primary-color); margin-bottom: 2.5px;">${escapeHTML(msg.sender_name || 'Grup Üyesi')}</div>`;
        }

        row.innerHTML = `
            <div class="message-bubble">
                ${senderNameHTML}
                <div class="message-text">${msgContentHTML}</div>
                <span class="message-time" style="display:inline-flex; align-items:center; gap: 2px;">
                    ${msgTime}
                    ${ticksHTML}
                </span>
            </div>
        `;
        messagesHistory.appendChild(row);
    });

    messagesHistory.scrollTop = messagesHistory.scrollHeight;
}

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || (!activeChatPartnerId && !activeChatGroupId)) return;

    try {
        const newMsg = await apiCall('/messages', 'POST', {
            receiverId: activeChatPartnerId,
            groupId: activeChatGroupId,
            message: text
        });

        const isAlreadyAdded = messages.some(m => m.id === newMsg.id);
        if (!isAlreadyAdded) {
            messages.push(newMsg);
            renderMessages();
        }
        messageInput.value = '';

        if (activeChatGroupId) {
            // Grubun son mesaj bilgisini güncelle
            const grp = groups.find(g => g.id === activeChatGroupId);
            if (grp) {
                grp.last_message = newMsg.message;
                grp.last_message_time = newMsg.created_at;
                renderGroupsList();
            }
        } else {
            // Gönderdiğimiz mesajı listedeki son mesaj olarak güncelle
            const partner = users.find(u => u.id === activeChatPartnerId);
            if (partner) {
                partner.last_message = newMsg.message;
                partner.last_message_time = newMsg.created_at;
                renderUsersList();
            }
            if (isCurrentlyTyping) {
                isCurrentlyTyping = false;
                socket.emit('stop_typing', { receiverId: activeChatPartnerId });
            }
        }
    } catch (err) {
        console.error('Mesaj gönderilemedi', err);
    }
});

// --- YAZIYOR... ALGILAMA VE TETİKLEME ---
let typingTimeout;
let isCurrentlyTyping = false;

if (messageInput) {
    messageInput.addEventListener('input', () => {
        if (!isCurrentlyTyping && activeChatPartnerId) {
            isCurrentlyTyping = true;
            socket.emit('typing', { receiverId: activeChatPartnerId });
        }

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            if (isCurrentlyTyping && activeChatPartnerId) {
                isCurrentlyTyping = false;
                socket.emit('stop_typing', { receiverId: activeChatPartnerId });
            }
        }, 1500);
    });

    messageInput.addEventListener('blur', () => {
        if (isCurrentlyTyping && activeChatPartnerId) {
            isCurrentlyTyping = false;
            socket.emit('stop_typing', { receiverId: activeChatPartnerId });
        }
    });
}

// --- SOHBET İÇİ DOSYA VE RESİM GÖNDERİMİ ---
if (btnAttach && fileInput) {
    btnAttach.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || (!activeChatPartnerId && !activeChatGroupId)) return;

        // Dosya boyutu limiti (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('Dosya boyutu 10MB\'tan büyük olamaz moruk.');
            fileInput.value = '';
            return;
        }

        // Arayüz yükleme görsel geri bildirimi
        btnAttach.disabled = true;
        const originalText = btnAttach.textContent;
        btnAttach.textContent = '⏳';

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Sunucuya yükle
            const uploadRes = await fetch('/api/messages/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!uploadRes.ok) {
                const errData = await uploadRes.json();
                throw new Error(errData.message || 'Yükleme başarısız.');
            }

            const data = await uploadRes.json();

            // Mesajı veritabanına gönder
            const newMsg = await apiCall('/messages', 'POST', {
                receiverId: activeChatPartnerId,
                groupId: activeChatGroupId,
                message: data.fileName,
                messageType: data.messageType,
                fileUrl: data.fileUrl
            });

            const isAlreadyAdded = messages.some(m => m.id === newMsg.id);
            if (!isAlreadyAdded) {
                messages.push(newMsg);
                renderMessages();
            }

            // Son mesaj bilgisini listede güncelle
            if (activeChatGroupId) {
                const grp = groups.find(g => g.id === activeChatGroupId);
                if (grp) {
                    grp.last_message = newMsg.message;
                    grp.last_message_time = newMsg.created_at;
                    renderGroupsList();
                }
            } else {
                const partner = users.find(u => u.id === activeChatPartnerId);
                if (partner) {
                    partner.last_message = newMsg.message;
                    partner.last_message_time = newMsg.created_at;
                    renderUsersList();
                }
            }
        } catch (err) {
            alert('Dosya gönderilemedi moruk: ' + err.message);
        } finally {
            btnAttach.disabled = false;
            btnAttach.textContent = originalText;
            fileInput.value = '';
        }
    });
}

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

// --- GRUP SOHBETLERİ UI VE İŞLEVSELLİK MANTIĞI ---

// Sekme Geçişleri (Arkadaşlar / Gruplar)
if (tabFriends && tabGroups) {
    tabFriends.addEventListener('click', () => {
        tabFriends.classList.add('active');
        tabFriends.style.backgroundColor = 'var(--primary-color)';
        tabFriends.style.color = 'white';

        tabGroups.classList.remove('active');
        tabGroups.style.backgroundColor = 'transparent';
        tabGroups.style.color = 'var(--text-main)';
        tabGroups.style.border = '1px solid var(--border-color)';

        friendsTabContent.classList.remove('hidden');
        groupsTabContent.classList.add('hidden');
        updateTabBadges();
    });

    tabGroups.addEventListener('click', async () => {
        tabGroups.classList.add('active');
        tabGroups.style.backgroundColor = 'var(--primary-color)';
        tabGroups.style.color = 'white';

        tabFriends.classList.remove('active');
        tabFriends.style.backgroundColor = 'transparent';
        tabFriends.style.color = 'var(--text-main)';
        tabFriends.style.border = '1px solid var(--border-color)';

        groupsTabContent.classList.remove('hidden');
        friendsTabContent.classList.add('hidden');

        await loadGroups();
        updateTabBadges();
    });
}

// Grup Oluşturma Modalı Aç/Kapat
if (btnCreateGroupOpen) {
    btnCreateGroupOpen.addEventListener('click', () => {
        groupFriendsCheckboxes.innerHTML = '';
        if (users.length === 0) {
            groupFriendsCheckboxes.innerHTML = '<div style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding-top:1rem;">Gruba eklenecek arkadaşınız bulunmuyor.</div>';
        } else {
            users.forEach(user => {
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.gap = '0.5rem';
                div.style.padding = '0.25rem 0';
                div.innerHTML = `
                    <input type="checkbox" id="chk-group-friend-${user.id}" value="${user.id}" class="group-friend-checkbox" style="width:18px; height:18px; cursor:pointer;">
                    <label for="chk-group-friend-${user.id}" style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-size:0.9rem; user-select:none;">
                        <div style="width:26px; height:26px; border-radius:50%; background-color:var(--border-color); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:bold; overflow:hidden;">
                            ${user.profile_pic ? `<img src="${user.profile_pic}" style="width:100%; height:100%; object-fit:cover;">` : user.username.substring(0,2).toUpperCase()}
                        </div>
                        <span>${escapeHTML(user.username)}</span>
                    </label>
                `;
                groupFriendsCheckboxes.appendChild(div);
            });
        }
        groupCreateModal.classList.remove('hidden');
    });
}

if (closeGroupModal) {
    closeGroupModal.addEventListener('click', () => {
        groupCreateModal.classList.add('hidden');
        groupNameInput.value = '';
        groupFriendsCheckboxes.innerHTML = '';
    });
}

// Grup Oluşturma Formu Submit
if (groupCreateForm) {
    groupCreateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const groupName = groupNameInput.value.trim();
        if (!groupName) return;

        const checkedBoxes = document.querySelectorAll('.group-friend-checkbox:checked');
        const memberIds = Array.from(checkedBoxes).map(cb => cb.value);

        try {
            const newGroup = await apiCall('/groups/create', 'POST', {
                name: groupName,
                memberIds: memberIds
            });

            groupCreateModal.classList.add('hidden');
            groupNameInput.value = '';
            groupFriendsCheckboxes.innerHTML = '';

            await loadGroups();
            selectGroupChat(newGroup);
        } catch (err) {
            alert('Grup oluşturulamadı: ' + err.message);
        }
    });
}

// Grupları Veritabanından Yükle
async function loadGroups() {
    try {
        const res = await apiCall('/groups');
        groups = res;
        renderGroupsList();
    } catch (err) {
        console.error('Gruplar yüklenemedi', err);
    }
}

// Grup Listesini Ekrana Çiz
function renderGroupsList() {
    groupsList.innerHTML = '';
    
    // Grupları son mesaj tarihine göre sırala (en yeni mesaj gelen en üstte olsun)
    groups.sort((a, b) => {
        const timeA = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const timeB = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        if (timeA !== timeB) {
            return timeB - timeA;
        }
        return a.name.localeCompare(b.name);
    });

    if (groups.length === 0) {
        groupsList.innerHTML = '<li class="user-item placeholder">Henüz bir gruba dahil değilsiniz.</li>';
        return;
    }

    groups.forEach(group => {
        const li = document.createElement('li');
        li.className = `user-item ${activeChatGroupId === group.id ? 'active' : ''}`;
        
        const initial = group.name.substring(0, 2).toUpperCase();
        const avatarHTML = group.profile_pic 
            ? `<img src="${group.profile_pic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` 
            : initial;

        const lastMsgText = group.last_message 
            ? escapeHTML(group.last_message) 
            : 'Grup kuruldu';

        const lastMsgTimeText = group.last_message_time 
            ? formatMessageTime(group.last_message_time) 
            : '';

        const unreadBadge = (group.unread_count && group.unread_count > 0)
            ? `<div class="unread-badge" style="background-color:#EF4444; color:white; font-size:0.7rem; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 4px; margin-left:auto;">${group.unread_count}</div>`
            : '';

        li.innerHTML = `
            <div class="avatar" style="background-color: var(--primary-light); color: var(--primary-color); font-weight: bold; display: flex; align-items: center; justify-content: center; border-radius: 50%; width: 44px; height: 44px; overflow: hidden;">${avatarHTML}</div>
            <div class="user-item-info">
                <div class="user-item-header">
                    <span class="name">${escapeHTML(group.name)}</span>
                    <span class="last-msg-time">${lastMsgTimeText}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="last-msg">${lastMsgText}</span>
                    ${unreadBadge}
                </div>
            </div>
        `;

        li.addEventListener('click', () => {
            selectGroupChat(group);
        });

        groupsList.appendChild(li);
    });
    updateTabBadges();
}

function updateTabBadges() {
    if (badgeFriendsDot) {
        const hasUnreadFriends = users.some(u => u.unread_count > 0);
        const isFriendsTabActive = tabFriends && tabFriends.classList.contains('active');
        if (hasUnreadFriends && !isFriendsTabActive) {
            badgeFriendsDot.classList.remove('hidden');
        } else {
            badgeFriendsDot.classList.add('hidden');
        }
    }
    
    if (badgeGroupsDot) {
        const hasUnreadGroups = groups.some(g => g.unread_count > 0);
        const isGroupsTabActive = tabGroups && tabGroups.classList.contains('active');
        if (hasUnreadGroups && !isGroupsTabActive) {
            badgeGroupsDot.classList.remove('hidden');
        } else {
            badgeGroupsDot.classList.add('hidden');
        }
    }
}

// Grup Sohbetini Aktifleştir
async function selectGroupChat(group) {
    try {
        activeChatPartner = null;
        activeChatPartnerId = null;
        activeChatGroupId = group.id;
        updateMuteButtonUI();

        // Arama barını kapat ve sıfırla
        if (chatSearchBar) chatSearchBar.classList.add('hidden');
        if (chatSearchInput) chatSearchInput.value = '';

        // Okunmamış mesaj sayısını sıfırla
        group.unread_count = 0;
        const localGrp = groups.find(g => g.id === group.id);
        if (localGrp) {
            localGrp.unread_count = 0;
        }

        // Sol menüde aktif olan grubu boyamak için listeyi tekrar çiz
        renderGroupsList();

        // Mobilde sohbet penceresini aktif yap
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            chatContainer.classList.add('mobile-chat-active');
        }

        // Başlık güncellemeleri
        if (group.profile_pic) {
            activeChatAvatar.style.backgroundColor = 'transparent';
            activeChatAvatar.innerHTML = `<img src="${group.profile_pic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            activeChatAvatar.style.backgroundColor = 'var(--primary-light)';
            activeChatAvatar.style.color = 'var(--primary-color)';
            activeChatAvatar.style.fontWeight = 'bold';
            activeChatAvatar.innerHTML = group.name.substring(0, 2).toUpperCase();
        }

        activeChatName.textContent = group.name;
        activeChatStatus.textContent = 'Grup Sohbeti';

        // Arkadaşlık butonlarını gizle
        btnUnfriend.classList.add('hidden');
        btnBlock.classList.add('hidden');
        if (btnGroupSettings) btnGroupSettings.classList.remove('hidden');

        noChatSelectedScreen.classList.add('hidden');
        chatActiveScreen.classList.remove('hidden');

        // Yükleniyor skeleton loader'ı bas
        messagesHistory.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-item received"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item sent"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item received"><div class="skeleton-bubble"></div></div>
                <div class="skeleton-item sent"><div class="skeleton-bubble"></div></div>
            </div>
        `;

        await loadMessages();
    } catch (err) {
        alert("Hata (selectGroupChat): " + err.message);
    }
}

// --- SOHBET ÜÇ NOKTA SEÇENEKLER MENÜSÜ ---
if (btnChatOptions && chatOptionsDropdown) {
    btnChatOptions.addEventListener('click', (e) => {
        e.stopPropagation();
        chatOptionsDropdown.classList.toggle('hidden');
    });

    // Menü dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!chatOptionsDropdown.classList.contains('hidden') && !chatOptionsDropdown.contains(e.target) && e.target !== btnChatOptions) {
            chatOptionsDropdown.classList.add('hidden');
        }
    });

    // Butonlardan birine tıklandığında menüyü kapat
    chatOptionsDropdown.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            chatOptionsDropdown.classList.add('hidden');
        });
    });
}

// --- ARAMA VE SOHBET TEMİZLEME UI İŞLEMLERİ ---

// Arama Çubuğu Aç/Kapat
if (btnToggleSearch && chatSearchBar && chatSearchInput) {
    btnToggleSearch.addEventListener('click', () => {
        chatSearchBar.classList.toggle('hidden');
        if (!chatSearchBar.classList.contains('hidden')) {
            chatSearchInput.focus();
        } else {
            chatSearchInput.value = '';
            renderMessages();
        }
    });
}

// Arama Çubuğu Kapatma Butonu
if (btnChatSearchClose && chatSearchBar && chatSearchInput) {
    btnChatSearchClose.addEventListener('click', () => {
        chatSearchBar.classList.add('hidden');
        chatSearchInput.value = '';
        renderMessages();
    });
}

// Arama Girdisi Yazıldığında Anlık Filtreleme
if (chatSearchInput) {
    chatSearchInput.addEventListener('input', () => {
        renderMessages();
    });
}

// Sohbet Temizleme (Silme) Olayı
if (btnClearChat) {
    btnClearChat.addEventListener('click', async () => {
        if (!activeChatPartnerId && !activeChatGroupId) return;

        const isGroup = !!activeChatGroupId;
        const confirmMsg = isGroup 
            ? 'Bu grubun tüm mesaj geçmişini temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz!'
            : 'Bu arkadaşınızla olan tüm sohbet geçmişini temizlemek istediğinize emin misiniz? Bu işlem geri alınamaz!';

        if (!confirm(confirmMsg)) return;

        try {
            const res = await apiCall('/messages/clear', 'DELETE', {
                receiverId: activeChatPartnerId,
                groupId: activeChatGroupId
            });

            alert(res.message);
            messages = [];
            renderMessages();

            // Sol listelerdeki son mesaj bilgisini de güncelle
            if (isGroup) {
                const grp = groups.find(g => g.id === activeChatGroupId);
                if (grp) {
                    grp.last_message = 'Sohbet temizlendi';
                    grp.last_message_time = null;
                    renderGroupsList();
                }
            } else {
                const partner = users.find(u => u.id === activeChatPartnerId);
                if (partner) {
                    partner.last_message = 'Sohbet temizlendi';
                    partner.last_message_time = null;
                    renderUsersList();
                }
            }
        } catch (err) {
            alert('Sohbet temizlenirken hata oluştu: ' + err.message);
        }
    });
}

// --- GRUP AYARLARI VE MODERASYON UI İŞLEMLERİ ---

if (btnGroupSettings) {
    btnGroupSettings.addEventListener('click', openGroupSettings);
}

if (closeGroupSettingsModal) {
    closeGroupSettingsModal.addEventListener('click', () => {
        groupSettingsModal.classList.add('hidden');
    });
}

// Grup Adı Güncelleme
if (btnGroupNameUpdate) {
    btnGroupNameUpdate.addEventListener('click', async () => {
        const newName = groupSettingsNameInput.value.trim();
        if (!newName) return;
        try {
            await apiCall(`/groups/${activeChatGroupId}/update`, 'POST', { name: newName });
            alert('Grup adı başarıyla güncellendi.');
            await loadGroups();
            const grp = groups.find(g => g.id === activeChatGroupId);
            if (grp) {
                activeChatName.textContent = grp.name;
            }
        } catch (err) {
            alert('Grup adı güncellenemedi: ' + err.message);
        }
    });
}

// Grup Profil Fotoğrafı Seçme & Yükleme
if (groupPicInput) {
    groupPicInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('group_pic', file);

        const originalText = lblGroupPic.textContent;
        lblGroupPic.textContent = 'Yükleniyor...';
        lblGroupPic.style.opacity = '0.7';

        try {
            const res = await fetch(`/api/groups/${activeChatGroupId}/upload-pic`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Fotoğraf yüklenemedi.');

            alert(data.message);
            groupSettingsAvatarPreview.innerHTML = `<img src="${data.profile_pic}" style="width:100%; height:100%; object-fit:cover;">`;
            await loadGroups();
            
            if (activeChatAvatar) {
                activeChatAvatar.style.backgroundColor = 'transparent';
                activeChatAvatar.innerHTML = `<img src="${data.profile_pic}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
            }
        } catch (err) {
            alert('Hata: ' + err.message);
        } finally {
            lblGroupPic.textContent = originalText;
            lblGroupPic.style.opacity = '1';
            groupPicInput.value = '';
        }
    });
}

// Gruptan Ayrıl / Sil
if (btnLeaveGroup) {
    btnLeaveGroup.addEventListener('click', async () => {
        const group = groups.find(g => g.id === activeChatGroupId);
        if (!group) return;

        const isAdmin = group.created_by === currentUser.id;
        const confirmMsg = isAdmin
            ? 'Bu grubu tamamen kapatmak/ayrılmak istediğinize emin misiniz?'
            : 'Gruptan ayrılmak istediğinize emin misiniz?';

        if (!confirm(confirmMsg)) return;

        try {
            await apiCall(`/groups/${activeChatGroupId}/remove-member`, 'POST', {
                userId: currentUser.id
            });

            groupSettingsModal.classList.add('hidden');
            activeChatGroupId = null;
            chatActiveScreen.classList.add('hidden');
            noChatSelectedScreen.classList.remove('hidden');

            await loadGroups();
        } catch (err) {
            alert('Gruptan ayrılırken hata oluştu: ' + err.message);
        }
    });
}

// Gruba Üye Ekleme
if (btnGroupAddMember) {
    btnGroupAddMember.addEventListener('click', async () => {
        const targetUserId = groupAddMemberSelect.value;
        if (!targetUserId || !activeChatGroupId) return;

        try {
            btnGroupAddMember.disabled = true;
            await apiCall(`/groups/${activeChatGroupId}/add-member`, 'POST', {
                userId: targetUserId
            });
            alert('Üye gruba başarıyla eklendi.');
            
            const group = groups.find(g => g.id === activeChatGroupId);
            if (group) {
                await loadGroupMembers(group);
            }
        } catch (err) {
            alert('Üye eklenirken hata oluştu: ' + err.message);
        } finally {
            btnGroupAddMember.disabled = false;
        }
    });
}

async function openGroupSettings() {
    if (!activeChatGroupId) return;

    try {
        const group = groups.find(g => g.id === activeChatGroupId);
        if (!group) return;

        groupSettingsNameInput.value = group.name;

        if (group.profile_pic) {
            groupSettingsAvatarPreview.style.backgroundColor = 'transparent';
            groupSettingsAvatarPreview.innerHTML = `<img src="${group.profile_pic}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            groupSettingsAvatarPreview.style.backgroundColor = 'var(--primary-light)';
            groupSettingsAvatarPreview.innerHTML = group.name.substring(0, 2).toUpperCase();
        }

        // Üyeleri ve yetkileri yükle
        await loadGroupMembers(group);

        groupSettingsModal.classList.remove('hidden');
    } catch (err) {
        alert('Grup ayarları yüklenemedi: ' + err.message);
    }
}

async function loadGroupMembers(group) {
    try {
        const members = await apiCall(`/groups/${group.id}/members`);
        groupMembersListContainer.innerHTML = '';

        // Giriş yapmış kullanıcının yetkilerini denetle
        const myMemberInfo = members.find(m => m.id === currentUser.id);
        const isFounder = group.created_by === currentUser.id;
        const isUserAdmin = (myMemberInfo && myMemberInfo.is_admin === 1) || isFounder;

        // UI Yetkilerini Ayarla
        if (isUserAdmin) {
            lblGroupPic.style.display = 'inline-block';
            groupSettingsNameInput.removeAttribute('disabled');
            btnGroupNameUpdate.style.display = 'block';
            btnLeaveGroup.textContent = isFounder ? 'Grubu Sil / Ayrıl' : 'Gruptan Ayrıl';
            if (groupAddMemberSection) groupAddMemberSection.style.display = 'flex';
            if (groupAddMemberSelect) {
                groupAddMemberSelect.innerHTML = '<option value="">Eklenecek arkadaş seçin...</option>';
                const memberIds = members.map(m => m.id);
                const nonMembers = users.filter(u => u.username !== currentUser.username && !memberIds.includes(u.id));
                nonMembers.forEach(friend => {
                    const opt = document.createElement('option');
                    opt.value = friend.id;
                    opt.textContent = friend.username;
                    groupAddMemberSelect.appendChild(opt);
                });
            }
        } else {
            lblGroupPic.style.display = 'none';
            groupSettingsNameInput.setAttribute('disabled', 'true');
            btnGroupNameUpdate.style.display = 'none';
            btnLeaveGroup.textContent = 'Gruptan Ayrıl';
            if (groupAddMemberSection) groupAddMemberSection.style.display = 'none';
        }

        members.forEach(member => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '0.5rem 0';
            div.style.borderBottom = '1px solid var(--border-color)';

            const isMemberAdmin = member.is_admin === 1;
            const isMemberFounder = group.created_by === member.id;

            let actionHTML = '';
            if (isMemberFounder) {
                actionHTML = '<span style="font-size: 0.75rem; background-color: var(--primary-light); color: var(--primary-color); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">Grup Kurucusu</span>';
            } else if (isMemberAdmin) {
                if (isFounder) {
                    actionHTML = `
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn btn-demote-admin" data-uid="${member.id}" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; background-color: var(--primary-light); color: var(--primary-color); border: none; border-radius: 4px; cursor: pointer;">Yöneticiliği Al</button>
                            <button class="btn btn-kick-member" data-uid="${member.id}" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; background-color: var(--danger-light); color: var(--danger-color); border: none; border-radius: 4px; cursor: pointer;">Çıkar</button>
                        </div>
                    `;
                } else {
                    actionHTML = '<span style="font-size: 0.75rem; background-color: var(--primary-light); color: var(--primary-color); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">Yönetici</span>';
                }
            } else if (isUserAdmin) {
                actionHTML = `
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-make-admin" data-uid="${member.id}" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; background-color: var(--primary-light); color: var(--primary-color); border: none; border-radius: 4px; cursor: pointer;">Yönetici Yap</button>
                        <button class="btn btn-kick-member" data-uid="${member.id}" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; background-color: var(--danger-light); color: var(--danger-color); border: none; border-radius: 4px; cursor: pointer;">Çıkar</button>
                    </div>
                `;
            }

            const initial = member.username.substring(0, 2).toUpperCase();

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; overflow: hidden;">
                        ${member.profile_pic ? `<img src="${member.profile_pic}" style="width: 100%; height: 100%; object-fit: cover;">` : initial}
                    </div>
                    <span style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">${escapeHTML(member.username)}</span>
                </div>
                <div>${actionHTML}</div>
            `;

            groupMembersListContainer.appendChild(div);
        });

        // Yönetici Yap Olayları
        groupMembersListContainer.querySelectorAll('.btn-make-admin').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetUserId = e.target.getAttribute('data-uid');
                if (!confirm('Bu üyeye yöneticilik yetkisi vermek istediğinize emin misiniz?')) return;

                try {
                    await apiCall(`/groups/${group.id}/update`, 'POST', {
                        createdBy: targetUserId
                    });
                    await loadGroupMembers(group);
                } catch (err) {
                    alert('Yöneticilik verilemedi: ' + err.message);
                }
            });
        });

        // Yöneticilikten Düşürme (Demote) Olayları
        groupMembersListContainer.querySelectorAll('.btn-demote-admin').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetUserId = e.target.getAttribute('data-uid');
                if (!confirm('Bu kullanıcının yöneticilik yetkisini geri almak istediğinize emin misiniz?')) return;

                try {
                    await apiCall(`/groups/${group.id}/demote-member`, 'POST', {
                        userId: targetUserId
                    });
                    await loadGroupMembers(group);
                } catch (err) {
                    alert('Yöneticilik yetkisi geri alınamadı: ' + err.message);
                }
            });
        });

        // Çıkar Olayları
        groupMembersListContainer.querySelectorAll('.btn-kick-member').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetUserId = e.target.getAttribute('data-uid');
                if (!confirm('Bu üyeyi gruptan çıkartmak istediğinize emin misiniz?')) return;

                try {
                    await apiCall(`/groups/${group.id}/remove-member`, 'POST', {
                        userId: targetUserId
                    });
                    await loadGroupMembers(group);
                } catch (err) {
                    alert('Üye çıkartılamadı: ' + err.message);
                }
            });
        });

    } catch (err) {
        console.error('Grup üyeleri yüklenemedi', err);
    }
}

initApp();
