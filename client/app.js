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
        const updateThemeBtnUI = (isDark) => {
            const span = themeBtn.querySelector('span');
            if (span) {
                span.textContent = isDark 
                    ? (currentLanguage === 'tr' ? 'Aydınlık Mod' : 'Light Mode') 
                    : (currentLanguage === 'tr' ? 'Karanlık Mod' : 'Dark Mode');
                // update first text node containing emoji
                themeBtn.childNodes[0].textContent = isDark ? '☀️ ' : '🌙 ';
            } else {
                themeBtn.textContent = isDark ? '☀️' : '🌙';
            }
        };
        
        updateThemeBtnUI(savedTheme === 'dark');
        themeBtn.addEventListener('click', () => {
            tempTheme = (tempTheme === 'dark') ? 'light' : 'dark';
            document.body.classList.toggle('dark-theme', tempTheme === 'dark');
            updateThemeBtnUI(tempTheme === 'dark');
        });
    }

    // --- AYARLAR SEKMELİ DÜZEN MANTIĞI ---
    const initSettingsTabEvents = () => {
        const tabButtons = document.querySelectorAll('.settings-sidebar-btn');
        const tabContents = document.querySelectorAll('.tab-settings-content');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Aktif tab butonunu değiştir
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // İçeriği değiştir
                const targetTab = btn.getAttribute('data-tab');
                tabContents.forEach(content => {
                    if (content.id === `tab-content-${targetTab.replace('tab-', '')}`) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });
                
                // Eğer Güvenlik sekmesi açıldıysa kimlik anahtarını yükle
                if (targetTab === 'tab-security') {
                    showSecurityKeyInSettings();
                }
            });
        });
    };

    const showSecurityKeyInSettings = async () => {
        if (!currentUser) return;
        const encoder = new TextEncoder();
        const data = encoder.encode(`AgChatUserPublicIdentitySeed_${currentUser.id}`);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const formattedKey = hashHex.match(/.{1,4}/g).join('-');
        
        const keyTextarea = document.getElementById('settings-public-key');
        if (keyTextarea) {
            keyTextarea.value = `AG-DH256-${formattedKey}`;
        }
    };

    // Sekme olaylarını başlat
    initSettingsTabEvents();

    // Duvar kağıdı seçim butonlarını dinle
    document.querySelectorAll('.wp-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const wp = btn.getAttribute('data-wp');
            tempWallpaper = wp;
            applyTemporaryWallpaperUI(tempWallpaper);
        });
    });

    // Varsayılan duvar kağıdını yükle
    applyWallpaper(currentWallpaper);
});

// --- GEÇİCİ AYARLAR DRAFT DURUMU ---
let tempTheme = localStorage.getItem('theme') || 'light';
let tempWallpaper = localStorage.getItem('chatWallpaper') || 'wp-default';
let tempBanner = '';
let tempProfilePicFile = null;
let tempBannerFile = null;

function applyTemporaryWallpaperUI(wpClass) {
    const messagesHistory = document.getElementById('messages-history');
    if (messagesHistory) {
        messagesHistory.classList.remove('wp-default', 'wp-neon', 'wp-sunset', 'wp-emerald', 'wp-abstract');
        messagesHistory.classList.add(wpClass);
    }
    
    // Butonlardaki çerçeveyi görsel olarak güncelle
    document.querySelectorAll('.wp-select-btn').forEach(btn => {
        if (btn.getAttribute('data-wp') === wpClass) {
            btn.style.outline = '2px solid var(--primary-color)';
            btn.style.outlineOffset = '1px';
        } else {
            btn.style.outline = 'none';
        }
    });
}

function applyTemporaryBannerUI(bannerVal) {
    const settingsBannerPreview = document.getElementById('settings-banner-preview');
    if (settingsBannerPreview) {
        if (bannerVal.startsWith('linear-gradient')) {
            settingsBannerPreview.style.background = bannerVal;
        } else {
            settingsBannerPreview.style.background = `url(${bannerVal}) center/cover`;
        }
    }
}

function discardTemporarySettings() {
    // 1. Temayı eski kaydedilen haline geri yükle
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    
    // Tema buton UI'ını güncelle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        const span = themeBtn.querySelector('span');
        if (span) {
            const isDark = savedTheme === 'dark';
            span.textContent = isDark 
                ? (currentLanguage === 'tr' ? 'Aydınlık Mod' : 'Light Mode') 
                : (currentLanguage === 'tr' ? 'Karanlık Mod' : 'Dark Mode');
            themeBtn.childNodes[0].textContent = isDark ? '☀️ ' : '🌙 ';
        }
    }

    // 2. Duvar kağıdını eski kaydedilen haline geri yükle
    const savedWallpaper = localStorage.getItem('chatWallpaper') || 'wp-default';
    applyWallpaper(savedWallpaper);
    
    // 3. Geçici durumları temizle
    tempProfilePicFile = null;
    tempBannerFile = null;
    tempBanner = '';
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
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const fileInput = document.getElementById('file-input');
const btnAttach = document.getElementById('btn-attach');
const btnSend = document.getElementById('btn-send');
const btnEmoji = document.getElementById('btn-emoji');
const emojiPopover = document.getElementById('emoji-popover');
const tabEmojis = document.getElementById('tab-emojis');
const tabStickers = document.getElementById('tab-stickers');
const btnEmojiPopoverClose = document.getElementById('btn-emoji-popover-close');
const emojisGrid = document.getElementById('emojis-grid');
const stickersGrid = document.getElementById('stickers-grid');

// --- SOHBET ARKA PLANI DUVAR KAĞIDI MANTIĞI ---
let currentWallpaper = localStorage.getItem('chatWallpaper') || 'wp-default';

function applyWallpaper(wpClass) {
    currentWallpaper = wpClass || 'wp-default';
    localStorage.setItem('chatWallpaper', currentWallpaper);
    
    const messagesHistory = document.getElementById('messages-history');
    if (messagesHistory) {
        messagesHistory.classList.remove('wp-default', 'wp-neon', 'wp-sunset', 'wp-emerald', 'wp-abstract');
        messagesHistory.classList.add(currentWallpaper);
    }
    
    // Butonlardaki çerçeveyi güncelle
    document.querySelectorAll('.wp-select-btn').forEach(btn => {
        if (btn.getAttribute('data-wp') === currentWallpaper) {
            btn.style.outline = '2px solid var(--primary-color)';
            btn.style.outlineOffset = '1px';
        } else {
            btn.style.outline = 'none';
        }
    });
}

function clearMessageInput() {
    messageInput.value = '';
    messageInput.style.height = '40px';
    messageInput.style.overflowY = 'hidden';
    if (btnMic) btnMic.classList.remove('hidden');
    if (btnSend) btnSend.classList.add('hidden');
}

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
const tabCalls = document.getElementById('tab-calls');
const callsTabContent = document.getElementById('calls-tab-content');
const callsList = document.getElementById('calls-list');
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

// BANNER (KAPAK RESMİ) ELEMENTLERİ
const settingsBannerPreview = document.getElementById('settings-banner-preview');
const settingsBannerFileInput = document.getElementById('settings-banner-file-input');
const btnSelectBannerPhoto = document.getElementById('btn-select-banner-photo');

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

// PROFİL BİYOGRAFİ, ALINTILI YANIT VE CONTEXT MENU ELEMENTLERİ
const settingsBio = document.getElementById('settings-bio');
const settingsShowLastSeen = document.getElementById('settings-show-last-seen');
const settingsShowOnline = document.getElementById('settings-show-online');
const replyPreviewContainer = document.getElementById('reply-preview-container');
const replyPreviewSender = document.getElementById('reply-preview-sender');
const replyPreviewText = document.getElementById('reply-preview-text');
const btnReplyPreviewClose = document.getElementById('btn-reply-preview-close');
const chatContextMenu = document.getElementById('chat-context-menu');
const ctxBtnCopy = document.getElementById('ctx-btn-copy');
const ctxBtnReply = document.getElementById('ctx-btn-reply');
const ctxBtnForward = document.getElementById('ctx-btn-forward');
const ctxBtnEdit = document.getElementById('ctx-btn-edit');
const ctxBtnDelete = document.getElementById('ctx-btn-delete');
const forwardModal = document.getElementById('forward-modal');
const closeForwardModal = document.getElementById('close-forward-modal');
const forwardTargetsList = document.getElementById('forward-targets-list');
const btnAddSticker = document.getElementById('btn-add-sticker');
const stickerFileInput = document.getElementById('sticker-file-input');
const stickersContainer = document.getElementById('stickers-container');

// BAŞKA KULLANICI PROFİL MODAL ELEMENTLERİ
const userProfileModal = document.getElementById('user-profile-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const profileModalAvatar = document.getElementById('profile-modal-avatar');
const profileModalUsername = document.getElementById('profile-modal-username');
const profileModalStatus = document.getElementById('profile-modal-status');
const profileModalBio = document.getElementById('profile-modal-bio');
const btnProfileSendMessage = document.getElementById('btn-profile-send-message');
const btnProfileUnfriend = document.getElementById('btn-profile-unfriend');
const btnProfileBlock = document.getElementById('btn-profile-block');

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
let editingMessageId = null; 
let replyingMessageId = null;

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
logoutBtn.addEventListener('click', (e) => {
    if (e) e.preventDefault();
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
    
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
    
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
    if (settingsBio) {
        settingsBio.value = currentUser.bio || '';
    }
    
    // Profil resmi önizlemesini yükle
    if (currentUser.profile_pic) {
        settingsAvatarPreview.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
    } else {
        settingsAvatarPreview.textContent = currentUser.username.substring(0, 2).toUpperCase();
    }
    btnUploadPhoto.classList.add('hidden'); // Yükle butonu gizli başlasın
    
    if (settingsShowLastSeen) {
        settingsShowLastSeen.checked = currentUser.show_last_seen !== 0;
    }
    if (settingsShowOnline) {
        settingsShowOnline.checked = currentUser.show_online !== 0;
    }
    
    const settingsLang = document.getElementById('settings-lang');
    if (settingsLang) {
        settingsLang.value = currentUser.language || 'tr';
    }
    
    if (settingsVolume && settingsVolumeValue) {
        settingsVolume.value = appVolume;
        settingsVolumeValue.textContent = Math.round(appVolume * 100) + '%';
    }
    
    // Duvar kağıdı aktif seçim butonunu görsel olarak işaretle
    applyWallpaper(currentWallpaper);

    // Kendi profil kapak resmi (banner) önizlemesini yükle
    if (settingsBannerPreview) {
        const bannerVal = currentUser.profile_banner || 'linear-gradient(135deg, #4f46e5, #06b6d4)';
        if (bannerVal.startsWith('linear-gradient')) {
            settingsBannerPreview.style.background = bannerVal;
        } else {
            settingsBannerPreview.style.background = `url(${bannerVal}) center/cover`;
        }
    }

    // Ayarlar sekmelerini varsayılana sıfırla (Profilim sekmesi)
    document.querySelectorAll('.settings-sidebar-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === 'tab-profile') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    document.querySelectorAll('.tab-settings-content').forEach(content => {
        if (content.id === 'tab-content-profile') {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });

    settingsModal.classList.remove('hidden');
});

// Ayarlar Modalini Kapat
closeSettings.addEventListener('click', () => {
    discardTemporarySettings();
    settingsModal.classList.add('hidden');
});

// Modal dışına tıklandığında kapat
window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        discardTemporarySettings();
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
        tempProfilePicFile = file; // Geçici durum olarak sakla
        const reader = new FileReader();
        reader.onload = (e) => {
            settingsAvatarPreview.innerHTML = `<img src="${e.target.result}" class="avatar-img">`;
        };
        reader.readAsDataURL(file);
    }
});

// PROFİL KAPAK RESMİ (BANNER) İNTERAKTİF İŞLEMLERİ
if (btnSelectBannerPhoto && settingsBannerFileInput) {
    btnSelectBannerPhoto.addEventListener('click', () => {
        settingsBannerFileInput.click();
    });

    settingsBannerFileInput.addEventListener('change', () => {
        const file = settingsBannerFileInput.files[0];
        if (file) {
            tempBannerFile = file; // Geçici durum olarak sakla
            tempBanner = ''; // Preset seçimini temizle
            const reader = new FileReader();
            reader.onload = (e) => {
                if (settingsBannerPreview) {
                    settingsBannerPreview.style.background = `url(${e.target.result}) center/cover`;
                }
            };
            reader.readAsDataURL(file);

            // Önizlemeyi görmek için yumuşak bir şekilde yukarı kaydır
            const contentArea = document.querySelector('.settings-content-area');
            if (contentArea) {
                contentArea.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    });
}

document.querySelectorAll('.banner-select-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const bannerVal = btn.getAttribute('data-banner');
        tempBanner = bannerVal; // Geçici durum olarak sakla
        tempBannerFile = null; // Özel dosya seçimini temizle
        applyTemporaryBannerUI(tempBanner);

        // Önizlemeyi görmek için yumuşak bir şekilde yukarı kaydır
        const contentArea = document.querySelector('.settings-content-area');
        if (contentArea) {
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

// Ayarları Kaydet
settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = settingsUsername.value.trim();
    
    const submitBtn = settingsForm.querySelector('button[type="submit"]');
    let originalBtnText = '';
    if (submitBtn) {
        originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = currentLanguage === 'tr' ? 'Kaydediliyor...' : 'Saving...';
    }

    let hasChanges = false;

    // 1. Profil Resmi Değiştiyse Yükle
    if (tempProfilePicFile) {
        const formData = new FormData();
        formData.append('profile_pic', tempProfilePicFile);
        try {
            const response = await fetch('/api/profile/upload-pic', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                token = data.token;
                currentUser.profile_pic = data.profile_pic;
                localStorage.setItem('token', token);
                if (socket) socket.auth.token = token;
                hasChanges = true;
            } else {
                throw new Error(data.message || 'Profil resmi yüklenemedi.');
            }
        } catch (err) {
            console.error('Profil resmi yükleme hatası:', err);
            alert(err.message || 'Profil resmi güncellenirken hata oldu.');
        }
    }

    // 2. Profil Kapak Resmi (Banner) Değiştiyse Yükle/Güncelle
    if (tempBannerFile) {
        const formData = new FormData();
        formData.append('profile_banner', tempBannerFile);
        try {
            const response = await fetch('/api/profile/upload-banner', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();
            if (response.ok) {
                currentUser.profile_banner = data.profile_banner;
                hasChanges = true;
            } else {
                throw new Error(data.message || 'Kapak resmi yüklenemedi.');
            }
        } catch (err) {
            console.error('Kapak resmi yükleme hatası:', err);
            alert(err.message || 'Kapak resmi güncellenirken hata oldu.');
        }
    } else if (tempBanner && tempBanner !== (currentUser.profile_banner || '')) {
        try {
            const res = await apiCall('/profile/update-banner-preset', 'POST', { banner: tempBanner });
            currentUser.profile_banner = res.profile_banner;
            hasChanges = true;
        } catch (err) {
            console.error('Kapak şablonu uygulanamadı:', err);
        }
    }

    // 3. Tema Değiştiyse Kaydet
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (tempTheme !== savedTheme) {
        localStorage.setItem('theme', tempTheme);
        hasChanges = true;
    }

    // 4. Duvar Kağıdı Değiştiyse Kaydet
    const savedWallpaper = localStorage.getItem('chatWallpaper') || 'wp-default';
    if (tempWallpaper !== savedWallpaper) {
        applyWallpaper(tempWallpaper);
        hasChanges = true;
    }

    // Ses Seviyesini Kaydet
    if (settingsVolume) {
        appVolume = parseFloat(settingsVolume.value);
        localStorage.setItem('appVolume', appVolume);
    }

    // Biyografi Değiştiyse Kaydet
    const newBio = settingsBio ? settingsBio.value.trim() : '';
    if (settingsBio && newBio !== (currentUser.bio || '')) {
        try {
            await apiCall('/profile/update-bio', 'POST', { bio: newBio });
            currentUser.bio = newBio;
            hasChanges = true;
        } catch (err) {
            console.error('Biyografi güncellenemedi:', err);
        }
    }

    // Gizlilik Ayarları (Son Görülme ve Çevrimiçi Durumu) Değiştiyse Kaydet
    const newShowLastSeen = settingsShowLastSeen ? settingsShowLastSeen.checked : true;
    const oldShowLastSeen = currentUser.show_last_seen !== 0;
    const newShowOnline = settingsShowOnline ? settingsShowOnline.checked : true;
    const oldShowOnline = currentUser.show_online !== 0;

    if ((settingsShowLastSeen && newShowLastSeen !== oldShowLastSeen) || (settingsShowOnline && newShowOnline !== oldShowOnline)) {
        try {
            const res = await apiCall('/profile/update-privacy', 'POST', { 
                showLastSeen: newShowLastSeen,
                showOnline: newShowOnline
            });
            currentUser = res.user;
            hasChanges = true;
        } catch (err) {
            console.error('Gizlilik ayarları güncellenemedi:', err);
        }
    }

    // Dil Değiştiyse Kaydet
    const settingsLang = document.getElementById('settings-lang');
    const newLang = settingsLang ? settingsLang.value : 'tr';
    if (settingsLang && newLang !== (currentUser.language || 'tr')) {
        try {
            await apiCall('/profile/update-language', 'POST', { language: newLang });
            currentUser.language = newLang;
            currentLanguage = newLang;
            translatePage();
            hasChanges = true;
        } catch (err) {
            console.error('Dil güncellenemedi:', err);
        }
    }

    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    if (!newUsername || newUsername === currentUser.username) {
        if (hasChanges) {
            alert(currentLanguage === 'tr' ? 'Profil ayarlarınız başarıyla güncellendi!' : 'Profile settings updated successfully!');
        }
        
        // Kendi arayüzümüzü güncelle
        if (currentUser.profile_pic) {
            const imgHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
            myAvatar.innerHTML = imgHTML;
        } else {
            myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();
        }

        tempProfilePicFile = null;
        tempBannerFile = null;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
        settingsModal.classList.add('hidden');
        await loadUsers();
        return;
    }

    try {
        const res = await apiCall('/profile/update-username', 'POST', { newUsername });
        alert(res.message);
        
        token = res.token;
        currentUser = res.user;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        myUsernameEl.textContent = currentUser.username;
        if (currentUser.profile_pic) {
            myAvatar.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
        } else {
            myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();
        }

        if (socket) {
            socket.auth.token = token;
        }
    } catch (err) {
        // Hata zaten apiCall içinde alert ediliyor
    }

    tempProfilePicFile = null;
    tempBannerFile = null;
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
    settingsModal.classList.add('hidden');
    await loadUsers();
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
        try {
            await registration.update();
        } catch (e) {
            console.warn('Servis işçisi güncelleme denetimi yapılamadı:', e);
        }
        
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

// ==========================================
// FAZ 2, FAZ 3 VE FAZ 4 PREMIUM ÖZELLİKLERİ
// ==========================================

// 1. ÇOKLU DİL (i18n) SÖZLÜĞÜ VE YERELLEŞTİRME
const i18n = {
    tr: {
        settings_title: "Profil Ayarları",
        settings_username: "Kullanıcı Adı",
        settings_bio: "Biyografi (Hakkımda)",
        settings_show_last_seen: "Son görülme zamanımı başkalarıyla paylaş",
        settings_show_online: "Çevrimiçi olduğumu başkalarıyla paylaş",
        settings_lang: "Dil / Language",
        settings_volume: "Uygulama İçi Ses Seviyesi",
        settings_save: "Değişiklikleri Kaydet",
        group_create_title: "Yeni Grup Oluştur",
        group_create_name: "Grup Adı",
        group_create_friends: "Gruba Eklenecek Arkadaşlar",
        group_create_submit: "Grubu Oluştur",
        group_is_channel: "Kanal Olarak Oluştur (Yalnızca yöneticiler yazabilir)",
        call_voice: "Sesli Ara",
        call_video: "Görüntülü Ara",
        disappearing_messages: "Süreli Mesajlar",
        e2ee_on: "E2EE Şifreleme: Açık",
        e2ee_off: "E2EE Şifreleme: Kapalı",
        typing: "yazıyor...",
        channel_only_admin: "Bu kanalda sadece yöneticiler mesaj gönderebilir.",
        placeholder_message: "Mesajınızı yazın...",
        voice_message: "Sesli Mesaj",
        logout_btn: "Çıkış Yap",
        theme_label: "Arayüz Teması / Theme",
        theme_dark: "Karanlık Mod",
        theme_light: "Aydınlık Mod",
        btn_enable_notifications: "🔔 Bildirimleri Etkinleştir",
        btn_install_app: "📲 Uygulamayı Yükle"
    },
    en: {
        settings_title: "Profile Settings",
        settings_username: "Username",
        settings_bio: "Biography (About Me)",
        settings_show_last_seen: "Share my last seen status with others",
        settings_show_online: "Share my online status with others",
        settings_lang: "Language / Dil",
        settings_volume: "In-App Audio Volume",
        settings_save: "Save Changes",
        group_create_title: "Create New Group",
        group_create_name: "Group Name",
        group_create_friends: "Friends to Add to Group",
        group_create_submit: "Create Group",
        group_is_channel: "Create as Channel (Only admins can post)",
        call_voice: "Voice Call",
        call_video: "Video Call",
        disappearing_messages: "Disappearing Messages",
        e2ee_on: "E2EE Encryption: Enabled",
        e2ee_off: "E2EE Encryption: Disabled",
        typing: "typing...",
        channel_only_admin: "Only admins can post in this channel.",
        placeholder_message: "Type a message...",
        voice_message: "Voice Message",
        logout_btn: "Logout",
        theme_label: "Interface Theme / Arayüz Teması",
        theme_dark: "Dark Mode",
        theme_light: "Light Mode",
        btn_enable_notifications: "🔔 Enable Notifications",
        btn_install_app: "📲 Install App"
    }
};

let currentLanguage = 'tr';

function translatePage() {
    const langData = i18n[currentLanguage];
    
    const updateText = (id, key) => {
        const el = document.getElementById(id);
        if (el && langData[key]) el.textContent = langData[key];
    };

    const settingsHeader = document.querySelector('#settings-modal h3');
    if (settingsHeader) settingsHeader.textContent = langData.settings_title;
    
    const lblUser = document.querySelector('label[for="settings-username"]');
    if (lblUser) lblUser.textContent = langData.settings_username;
    
    const lblBio = document.querySelector('label[for="settings-bio"]');
    if (lblBio) lblBio.textContent = langData.settings_bio;
    
    const lblLastSeen = document.querySelector('label[for="settings-show-last-seen"]');
    if (lblLastSeen) lblLastSeen.textContent = langData.settings_show_last_seen;
    
    const lblOnline = document.querySelector('label[for="settings-show-online"]');
    if (lblOnline) lblOnline.textContent = langData.settings_show_online;
    
    const lblLang = document.querySelector('label[for="settings-lang"]');
    if (lblLang) lblLang.textContent = langData.settings_lang;
    
    const btnSave = document.querySelector('#settings-form button[type="submit"]');
    if (btnSave) btnSave.textContent = langData.settings_save;

    const groupHeader = document.querySelector('#group-create-modal h3');
    if (groupHeader) groupHeader.textContent = langData.group_create_title;
    
    const lblGroupName = document.querySelector('label[for="group-name-input"]');
    if (lblGroupName) lblGroupName.textContent = langData.group_create_name;
    
    const lblChannel = document.querySelector('label[for="group-is-channel"]');
    if (lblChannel) lblChannel.textContent = langData.group_is_channel;
    
    const btnCreateGroup = document.querySelector('#group-create-modal button[type="submit"]');
    if (btnCreateGroup) btnCreateGroup.textContent = langData.group_create_submit;

    const spanDis = document.querySelector('#btn-disappearing-messages span');
    if (spanDis) spanDis.textContent = langData.disappearing_messages;

    const btnCallVoice = document.getElementById('btn-call-voice');
    if (btnCallVoice) btnCallVoice.title = langData.call_voice;
    
    const btnCallVideo = document.getElementById('btn-call-video');
    if (btnCallVideo) btnCallVideo.title = langData.call_video;

    // Tema Değiştirme Butonu ve Etiketi Yerelleştirme
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        const themeLabel = themeToggleBtn.previousElementSibling;
        if (themeLabel) themeLabel.textContent = langData.theme_label;
        const themeSpan = themeToggleBtn.querySelector('span');
        if (themeSpan) {
            const isDark = document.body.classList.contains('dark-theme');
            themeSpan.textContent = isDark ? langData.theme_light : langData.theme_dark;
            themeToggleBtn.childNodes[0].textContent = isDark ? '☀️ ' : '🌙 ';
        }
    }

    // Bildirim ve Yükleme Butonları Yerelleştirme
    const btnRequestNotif = document.getElementById('btn-request-notifications');
    if (btnRequestNotif) btnRequestNotif.textContent = langData.btn_enable_notifications;

    const btnInstApp = document.getElementById('btn-install-app');
    if (btnInstApp) btnInstApp.textContent = langData.btn_install_app;

    // Çıkış Yap Butonu Yerelleştirme
    const lblLogout = document.getElementById('lbl-logout');
    if (lblLogout) lblLogout.textContent = langData.logout_btn;

    if (messageInput) {
        if (!messageInput.disabled) {
            messageInput.placeholder = langData.placeholder_message;
        }
    }
}

// 2. KANAL YAZMA YETKİSİ KONTROLÜ
function checkChannelPostPermission() {
    if (activeChatGroupId) {
        const group = groups.find(g => g.id === activeChatGroupId);
        if (group && group.is_channel === 1) {
            const members = groupMembers.get(activeChatGroupId) || [];
            const me = members.find(m => m.id === currentUser.id);
            const isAdmin = me ? me.is_admin === 1 : (group.created_by === currentUser.id);
            
            if (!isAdmin) {
                messageInput.disabled = true;
                messageInput.placeholder = i18n[currentLanguage].channel_only_admin;
                document.querySelector('#message-form button[type="submit"]').disabled = true;
                
                const btnMic = document.getElementById('btn-mic');
                if (btnMic) btnMic.style.display = 'none';
                const btnGif = document.getElementById('btn-gif');
                if (btnGif) btnGif.style.display = 'none';
                if (btnEmoji) btnEmoji.style.display = 'none';
                return;
            }
        }
    }
    
    messageInput.disabled = false;
    messageInput.placeholder = i18n[currentLanguage].placeholder_message;
    document.querySelector('#message-form button[type="submit"]').disabled = false;
    const btnMic = document.getElementById('btn-mic');
    if (btnMic) btnMic.style.display = 'flex';
    const btnGif = document.getElementById('btn-gif');
    if (btnGif) btnGif.style.display = 'flex';
    if (btnEmoji) btnEmoji.style.display = 'flex';
}

// 3. TENOR GIF ENTEGRASYONU
const btnGif = document.getElementById('btn-gif');
const gifPopover = document.getElementById('gif-popover');
const btnGifPopoverClose = document.getElementById('btn-gif-popover-close');
const gifSearchInput = document.getElementById('gif-search-input');
const gifResultsGrid = document.getElementById('gif-results-grid');

if (btnGif) {
    btnGif.addEventListener('click', async (e) => {
        e.stopPropagation();
        gifPopover.classList.toggle('hidden');
        if (!gifPopover.classList.contains('hidden')) {
            gifSearchInput.value = '';
            await loadTrendingGifs();
        }
    });
}

if (btnGifPopoverClose) {
    btnGifPopoverClose.addEventListener('click', () => {
        gifPopover.classList.add('hidden');
    });
}

const fallbackGifs = [
    { tags: ["love", "heart", "cute", "kiss", "hug", "love you", "aşk", "sevgi"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG1tMmNrb2s3cmx2Zm16OG5ubGkxejJ6dnAwa2FkMmdqenpjbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13CoXDiaCcC2EA/giphy.gif" },
    { tags: ["love", "cat", "cute", "hug", "love you", "aşk", "sevgi", "sarılma"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWp3dWlzbzh5ZmVhcHF1ODl4Y2w0ZzI1azV4cjEweXlrcXk1dWptMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/WYEWdb9F6n13W/giphy.gif" },
    { tags: ["love", "dog", "cute", "kiss", "puppy", "sevgi", "aşk", "köpek"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnQ1M3c5eTdtOHp1N2lqbGNjZHpqdjdpc24ydjF6aHZibGFvOHd4MSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MDJ9IbhswvCfkGL7Go/giphy.gif" },
    { tags: ["happy", "dance", "celebrate", "excited", "yes", "mutlu", "dans"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnF5aDFpcTFocHNuaDFtcmM5M29ubDZqbjNqbm8yMzd1aDk5aWlmNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/qscdhKw2oJGqiIJ1Kb/giphy.gif" },
    { tags: ["dance", "cute", "happy", "party", "excited", "dans", "parti"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Nnb3A4Zm1xNTZ1bTZrdWZ1Yjh6ZTBpbmZ1NnpvYzJwbTRuNGM4biZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l2QDODC4jE8am08aA/giphy.gif" },
    { tags: ["laugh", "funny", "lol", "hahaha", "smile", "komik", "gülme"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdTBwdzUwbGZpY3ptOHJmYTVoMmR4dnpxaWVjZ2Y0NnFldXJzZWh6dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/1d7F9xyq6j7C1wbIW1/giphy.gif" },
    { tags: ["sad", "cry", "tears", "alone", "crying", "üzgün", "ağlama"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXplZXRqazh6cTYwdjE5MTZrb3kybnk2NDk5d3NqZ3Yyb255cmZubyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/kegwX875t4j5bT263M/giphy.gif" },
    { tags: ["angry", "mad", "no", "fight", "rage", "kızgın", "öfke"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWVmYXZoYmpyOHhveTVrc2c0dTRudmpyNW02NDc5cDF5YTA4cmk2YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3ndAvMC5LFPNMCzq7m/giphy.gif" },
    { tags: ["shocked", "omg", "wow", "surprised", "şok", "şaşkın"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGxpeDVsZHphYmszODRkNm41Nm43N2V5ZmN2azZtczkwZWhpcXl6OSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/HHz0E2p3H8P4HhS7Ww/giphy.gif" },
    { tags: ["thumbsup", "ok", "yes", "nice", "good", "evet", "tamam", "onay"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWp3dWlzbzh5ZmVhcHF1ODl4Y2w0ZzI1azV4cjEweXlrcXk1dWptMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/WYEWdb9F6n13W/giphy.gif" },
    { tags: ["hello", "wave", "hi", "welcome", "selam", "merhaba"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaDVsYzRjOWEwb2s4NmJ4b3I4NnR5bndmbm9ueHNueDhvMWxyejA4NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3ornk57KwDXfghaG4M/giphy.gif" },
    { tags: ["bye", "goodbye", "leave", "hoşçakal", "baybay"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdW1pMG83ejM5c3NreDhvdXN5Zmx5ZW85dnRreHRyeDRvMXR5eDVzMiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26u4b45b8KlgAB7iM/giphy.gif" },
    { tags: ["cool", "deal with it", "sunglasses", "havalı", "karizma"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXFidnhjOHcydnQxcmx2Zm16OG5ubGkxejJ6dnAwa2FkMmdqenpjbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l3q2t2KAyvxy9xBe0/giphy.gif" },
    { tags: ["sleep", "tired", "bed", "goodnight", "uyku", "yorgun", "iyi geceler"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExczMyejhicTN0dnQxcmx2Zm16OG5ubGkxejJ6dnAwa2FkMmdqenpjbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0MYu38R0PPhIXeXY/giphy.gif" },
    { tags: ["wait", "what", "thinking", "confused", "ne", "bekle", "düşünceli"], url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWxueGlicTN0dnQxcmx2Zm16OG5ubGkxejJ6dnAwa2FkMmdqenpjbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKSj06tqUQn27tS/giphy.gif" }
];

async function loadTrendingGifs() {
    try {
        const response = await fetch('/api/gifs/trending');
        if (!response.ok) throw new Error('Trending API error');
        const gifs = await response.json();
        if (gifs && gifs.length > 0) {
            renderGifs(gifs);
        } else {
            renderGifs(fallbackGifs.map(g => ({ preview: g.url, url: g.url })));
        }
    } catch (err) {
        console.error('Trend GIFler yüklenemedi, yedekler yükleniyor:', err);
        renderGifs(fallbackGifs.map(g => ({ preview: g.url, url: g.url })));
    }
}

let gifSearchTimeout = null;
if (gifSearchInput) {
    gifSearchInput.addEventListener('input', () => {
        clearTimeout(gifSearchTimeout);
        gifSearchTimeout = setTimeout(async () => {
            const query = gifSearchInput.value.trim();
            if (!query) {
                await loadTrendingGifs();
                return;
            }
            try {
                const response = await fetch(`/api/gifs/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) throw new Error('Search API error');
                const gifs = await response.json();
                if (gifs && gifs.length > 0) {
                    renderGifs(gifs);
                } else {
                    const filtered = fallbackGifs.filter(g => g.tags.some(t => t.includes(query.toLowerCase())));
                    renderGifs(filtered.map(g => ({ preview: g.url, url: g.url })));
                }
            } catch (err) {
                console.error('GIF arama hatası, yerel yedeklerde aranıyor:', err);
                const filtered = fallbackGifs.filter(g => g.tags.some(t => t.includes(query.toLowerCase())));
                renderGifs(filtered.map(g => ({ preview: g.url, url: g.url })));
            }
        }, 500);
    });
}

function renderGifs(gifs) {
    if (!gifResultsGrid) return;
    gifResultsGrid.innerHTML = '';
    if (!gifs || gifs.length === 0) {
        gifResultsGrid.innerHTML = `<div style="grid-column: span 2; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${currentLanguage === 'tr' ? 'GIF bulunamadı.' : 'No GIFs found.'}</div>`;
        return;
    }
    gifs.forEach(gif => {
        const img = document.createElement('img');
        img.src = gif.preview;
        img.style.width = '100%';
        img.style.borderRadius = '8px';
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.15s';
        img.addEventListener('mouseover', () => img.style.transform = 'scale(1.03)');
        img.addEventListener('mouseout', () => img.style.transform = 'scale(1)');
        img.addEventListener('click', async () => {
            gifPopover.classList.add('hidden');
            await sendGifMessage(gif.url);
        });
        gifResultsGrid.appendChild(img);
    });
}

async function sendGifMessage(url) {
    try {
        const res = await apiCall('/messages', 'POST', {
            receiverId: activeChatPartnerId,
            groupId: activeChatGroupId,
            messageType: 'image',
            fileUrl: url,
            message: '🎬 GIF'
        });
        messages.push(res);
        await renderMessages();
        socket.emit('send_message', res);
    } catch (err) {
        console.error('GIF gönderilemedi:', err);
    }
}

// 3.1 EMOJI & STICKER ENTEGRASYONU
const emojiGroups = {
    fav: [],
    smileys: [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", 
        "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
        "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳",
        "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬"
    ],
    animals: [
        "🐱", "🐶", "🦁", "🐵", "🦊", "🐻", "🐼", "🐨", "🐯", "🐮", "🐷", "🐸", "🐔", "🐧", "🐦", "🦆",
        "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🌲", "🌳",
        "🌴", "🌵", "🌶️", "🌷", "🌸", "🌹", "🍀", "🍁", "🍄", "🐚", "🌏", "⭐", "🌙", "⚡", "🌈", "🌊"
    ],
    food: [
        "🍎", "🍌", "🍇", "🍓", "🍉", "🍒", "🍑", "🍍", "🥥", "🥝", "🍅", "🥑", "🥦", "🥕", "🌽", "🥔",
        "🍞", "🥐", "🥖", "🥞", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🍳", "🍲", "🍿",
        "🍣", "🍦", "🍩", "🍪", "🎂", "🍫", "🍬", "🍭", "🍯", "🥤", "☕", "🍵", "🍺", "🍷", "🥃", "🍹"
    ],
    travel: [
        "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🎯", "🎮",
        "✈️", "🚀", "🛸", "🚁", "🚂", "🚃", "🚌", "🚗", "🚕", "🚙", "🏍️", "🛵", "🚲", "🛴", "⚓", "⛵",
        "🏔️", "⛰️", "🌋", "🧗", "🏕️", "🏖️", "🏜️", "🏝️", "🏟️", "🏛️", "🎉", "🎈", "🎊", "🎇", "🎆", "🏆"
    ],
    symbols: [
        "💡", "🕯️", "🛠️", "⚙️", "🔑", "🔒", "🔓", "🔔", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
        "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "💥", "💦", "💨",
        "💤", "💬", "💭", "✨", "🌟", "⭐", "⚡", "☄️", "🔥", "🔮", "🧿", "🔇", "🔔", "📣", "📢", "🎵"
    ]
};

const stickerCategories = {
    happy: [
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f600.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f601.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f602.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f604.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f609.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f60a.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f60d.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f618.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f929.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f970.svg"
    ],
    sad: [
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f614.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f61e.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f622.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f625.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f62d.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f630.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f62b.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f97a.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f494.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f327.svg"
    ],
    playful: [
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f61c.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f61d.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f61b.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f92a.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f92f.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f973.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f974.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f60e.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f917.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f47b.svg"
    ],
    angry: [
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f620.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f621.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f92c.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f624.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f47f.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f4a9.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f480.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f47a.svg",
        "https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/svg/1f525.svg"
    ]
};

let currentEmojiCategory = 'smileys';
let currentStickerFilter = 'all';

function populateEmojis() {
    if (!emojisGrid) return;
    emojisGrid.innerHTML = '';
    
    // Load favorite emojis
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem('favorite_emojis')) || [];
    } catch(e) {}
    emojiGroups.fav = favs;
    
    const activeEmojis = emojiGroups[currentEmojiCategory] || [];
    
    if (activeEmojis.length === 0 && currentEmojiCategory === 'fav') {
        emojisGrid.innerHTML = `<div style="grid-column: span 7; font-size: 0.8rem; color: var(--text-muted); padding: 2rem 0; text-align: center;">${currentLanguage === 'tr' ? 'Henüz favori emojiniz yok.<br><small style="font-size:0.7rem; color:var(--text-muted)">Herhangi bir emojiye sağ tıklayarak/uzun basarak ekleyebilirsiniz.</small>' : 'No favorite emojis yet.<br><small style="font-size:0.7rem; color:var(--text-muted)">Right click / long press on any emoji to add.</small>'}</div>`;
        return;
    }

    activeEmojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.style.padding = '0.2rem';
        span.style.transition = 'transform 0.1s';
        span.style.cursor = 'pointer';
        
        span.addEventListener('mouseover', () => span.style.transform = 'scale(1.2)');
        span.addEventListener('mouseout', () => span.style.transform = 'scale(1)');
        
        // Single click: add to input
        span.addEventListener('click', () => {
            messageInput.value += emoji;
            messageInput.dispatchEvent(new Event('input'));
        });

        // Right click: toggle favorite
        span.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleFavoriteEmoji(emoji);
        });
        
        emojisGrid.appendChild(span);
    });
}

function toggleFavoriteEmoji(emoji) {
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem('favorite_emojis')) || [];
    } catch(e) {}
    
    const idx = favs.indexOf(emoji);
    if (idx > -1) {
        favs.splice(idx, 1);
        alert(currentLanguage === 'tr' ? `"${emoji}" favorilerden çıkarıldı.` : `"${emoji}" removed from favorites.`);
    } else {
        favs.push(emoji);
        alert(currentLanguage === 'tr' ? `"${emoji}" favorilere eklendi!` : `"${emoji}" added to favorites!`);
    }
    localStorage.setItem('favorite_emojis', JSON.stringify(favs));
    populateEmojis();
}

function populateStickers() {
    if (!stickersGrid) return;
    stickersGrid.innerHTML = '';
    
    let localCustoms = [];
    try {
        localCustoms = JSON.parse(localStorage.getItem('custom_stickers')) || [];
    } catch(e) {
        localCustoms = [];
    }
    
    let favStickers = [];
    try {
        favStickers = JSON.parse(localStorage.getItem('favorite_stickers')) || [];
    } catch(e) {}
    
    let displayStickers = [];
    if (currentStickerFilter === 'all') {
        displayStickers = [
            ...stickerCategories.happy,
            ...stickerCategories.sad,
            ...stickerCategories.playful,
            ...stickerCategories.angry,
            ...localCustoms
        ];
    } else if (currentStickerFilter === 'happy') {
        displayStickers = [...stickerCategories.happy];
    } else if (currentStickerFilter === 'sad') {
        displayStickers = [...stickerCategories.sad];
    } else if (currentStickerFilter === 'playful') {
        displayStickers = [...stickerCategories.playful];
    } else if (currentStickerFilter === 'angry') {
        displayStickers = [...stickerCategories.angry];
    } else if (currentStickerFilter === 'fav') {
        displayStickers = favStickers;
    }
    
    if (displayStickers.length === 0) {
        const noText = currentStickerFilter === 'fav' 
            ? (currentLanguage === 'tr' ? 'Henüz favori çıkartmanız yok.' : 'No favorite stickers yet.')
            : (currentLanguage === 'tr' ? 'Bu kategoride çıkartma yok.' : 'No stickers in this category.');
        stickersGrid.innerHTML = `<div style="grid-column: span 3; font-size: 0.8rem; color: var(--text-muted); padding: 2rem 0; text-align: center;">${noText}</div>`;
        return;
    }

    displayStickers.forEach(url => {
        const div = document.createElement('div');
        div.style.position = 'relative';
        div.style.width = '100%';
        div.style.height = '75px';
        div.style.cursor = 'pointer';
        
        const isFav = favStickers.includes(url);
        const favIcon = isFav ? '⭐' : '☆';
        const starButtonHTML = `
            <button class="fav-sticker-btn" style="position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.85); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; border: none; cursor: pointer; transition: all 0.2s ease; z-index: 5; box-shadow: 0 2px 4px rgba(0,0,0,0.15); line-height: 1; padding: 0;" title="${currentLanguage === 'tr' ? 'Favorilere Ekle' : 'Add to Favorites'}">
                ${favIcon}
            </button>
        `;
        
        div.innerHTML = `
            ${starButtonHTML}
            <img src="${url}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; transition: transform 0.15s;">
        `;
        
        const img = div.querySelector('img');
        img.addEventListener('mouseover', () => img.style.transform = 'scale(1.05)');
        img.addEventListener('mouseout', () => img.style.transform = 'scale(1)');
        
        // Single click: Send sticker
        img.addEventListener('click', async () => {
            emojiPopover.classList.add('hidden');
            await sendStickerMessage(url);
        });

        // Click Star Button: Toggle favorite
        const favBtn = div.querySelector('.fav-sticker-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteSticker(url);
        });
        
        stickersGrid.appendChild(div);
    });
}

function toggleFavoriteSticker(url) {
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem('favorite_stickers')) || [];
    } catch(e) {}
    
    const idx = favs.indexOf(url);
    if (idx > -1) {
        favs.splice(idx, 1);
        alert(currentLanguage === 'tr' ? 'Çıkartma favorilerden çıkarıldı.' : 'Sticker removed from favorites.');
    } else {
        favs.push(url);
        alert(currentLanguage === 'tr' ? 'Çıkartma favorilere eklendi!' : 'Sticker added to favorites!');
    }
    localStorage.setItem('favorite_stickers', JSON.stringify(favs));
    populateStickers();
}

async function sendStickerMessage(stickerUrl) {
    try {
        const res = await apiCall('/messages', 'POST', {
            receiverId: activeChatPartnerId,
            groupId: activeChatGroupId,
            messageType: 'sticker',
            fileUrl: stickerUrl,
            message: '🎨 Sticker'
        });
        messages.push(res);
        await renderMessages();
        socket.emit('send_message', res);
    } catch (err) {
        console.error('Sticker gönderilemedi:', err);
    }
}

if (btnEmoji) {
    btnEmoji.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPopover.classList.toggle('hidden');
        if (gifPopover) gifPopover.classList.add('hidden');
        if (!emojiPopover.classList.contains('hidden')) {
            populateEmojis();
            populateStickers();
        }
    });
}

if (btnEmojiPopoverClose) {
    btnEmojiPopoverClose.addEventListener('click', () => {
        emojiPopover.classList.add('hidden');
    });
}

// Emoji Kategori Tıklama Dinleyicileri
document.querySelectorAll('.emoji-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.emoji-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentEmojiCategory = btn.getAttribute('data-cat');
        populateEmojis();
    });
});

if (tabEmojis) {
    tabEmojis.addEventListener('click', () => {
        tabEmojis.style.borderBottom = '2px solid var(--primary-color)';
        tabEmojis.style.color = 'var(--text-main)';
        tabStickers.style.borderBottom = 'none';
        tabStickers.style.color = 'var(--text-muted)';
        emojisGrid.classList.remove('hidden');
        document.getElementById('emoji-categories').classList.remove('hidden');
        stickersContainer.classList.add('hidden');
    });
}

if (tabStickers) {
    tabStickers.addEventListener('click', () => {
        tabStickers.style.borderBottom = '2px solid var(--primary-color)';
        tabStickers.style.color = 'var(--text-main)';
        tabEmojis.style.borderBottom = 'none';
        tabEmojis.style.color = 'var(--text-muted)';
        stickersContainer.classList.remove('hidden');
        emojisGrid.classList.add('hidden');
        document.getElementById('emoji-categories').classList.add('hidden');
    });
}

// Sticker Alt Filtre Tıklama Dinleyicileri
const stickerFilters = [
    { id: 'sticker-filter-all', value: 'all' },
    { id: 'sticker-filter-happy', value: 'happy' },
    { id: 'sticker-filter-sad', value: 'sad' },
    { id: 'sticker-filter-playful', value: 'playful' },
    { id: 'sticker-filter-angry', value: 'angry' },
    { id: 'sticker-filter-fav', value: 'fav' }
];

stickerFilters.forEach(filter => {
    const el = document.getElementById(filter.id);
    if (el) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Tüm sekmeleri inaktif yap
            stickerFilters.forEach(f => {
                const btn = document.getElementById(f.id);
                if (btn) {
                    btn.classList.remove('active');
                    btn.style.backgroundColor = 'var(--bg-white)';
                    btn.style.color = 'var(--text-muted)';
                    btn.style.borderColor = 'var(--border-color)';
                }
            });
            
            // Tıklanan sekmeyi aktif yap
            el.classList.add('active');
            el.style.backgroundColor = 'var(--primary-light)';
            el.style.color = 'var(--primary-color)';
            el.style.borderColor = 'var(--primary-color)';
            
            currentStickerFilter = filter.value;
            populateStickers();
        });
    }
});

// Çıkartma Yükleme (Add Sticker) Olay Dinleyicileri
if (btnAddSticker && stickerFileInput) {
    btnAddSticker.addEventListener('click', (e) => {
        e.stopPropagation();
        stickerFileInput.click();
    });

    stickerFileInput.addEventListener('change', async () => {
        const file = stickerFileInput.files[0];
        if (!file) return;
        
        const originalText = btnAddSticker.querySelector('#lbl-add-sticker').textContent;
        btnAddSticker.querySelector('#lbl-add-sticker').textContent = 'Yükleniyor...';
        btnAddSticker.disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/messages/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();
            if (data.fileUrl) {
                let localCustoms = [];
                try {
                    localCustoms = JSON.parse(localStorage.getItem('custom_stickers')) || [];
                } catch(e) {
                    localCustoms = [];
                }
                localCustoms.push(data.fileUrl);
                localStorage.setItem('custom_stickers', JSON.stringify(localCustoms));
                populateStickers();
            }
        } catch (err) {
            console.error('Çıkartma yüklenemedi:', err);
            alert('Çıkartma yüklenemedi.');
        } finally {
            btnAddSticker.querySelector('#lbl-add-sticker').textContent = originalText;
            btnAddSticker.disabled = false;
            stickerFileInput.value = '';
        }
    });
}

// Tıklama dışı kapatma (Click-Away) dinleyicileri
document.addEventListener('click', (e) => {
    if (emojiPopover && !emojiPopover.contains(e.target) && e.target !== btnEmoji) {
        emojiPopover.classList.add('hidden');
    }
    if (gifPopover && !gifPopover.contains(e.target) && e.target !== btnGif) {
        gifPopover.classList.add('hidden');
    }
});

// 4. SÜRELİ KENDİNİ SİLEN MESAJLAR
let activeDisappearingDuration = 0;
const btnDisappearingMessages = document.getElementById('btn-disappearing-messages');
if (btnDisappearingMessages) {
    btnDisappearingMessages.addEventListener('click', () => {
        chatOptionsDropdown.classList.add('hidden');
        const input = prompt(
            currentLanguage === 'tr' 
                ? "Süreli mesaj modunu saniye cinsinden girin (Örn: 10, 60, 3600). Kapatmak için 0 yazın:" 
                : "Enter disappearing message duration in seconds (e.g., 10, 60, 3600). Write 0 to disable:", 
            activeDisappearingDuration.toString()
        );
        if (input !== null) {
            const val = parseInt(input);
            if (!isNaN(val) && val >= 0) {
                activeDisappearingDuration = val;
                const timerSpan = document.querySelector('#btn-disappearing-messages span');
                if (timerSpan) {
                    timerSpan.textContent = val > 0 
                        ? `${i18n[currentLanguage].disappearing_messages} (${val}s)` 
                        : i18n[currentLanguage].disappearing_messages;
                }
                alert(
                    currentLanguage === 'tr'
                        ? (val > 0 ? `Süreli mesajlar ${val} saniye olarak ayarlandı.` : "Süreli mesajlar kapatıldı.")
                        : (val > 0 ? `Disappearing messages set to ${val} seconds.` : "Disappearing messages disabled.")
                );
            }
        }
    });
}


// 5. SES KAYDETME (MediaRecorder) VE CUSTOM SESLİ OYNATICI
const btnMic = document.getElementById('btn-mic');
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

if (btnMic) {
    btnMic.addEventListener('click', async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.addEventListener('dataavailable', (e) => {
                    audioChunks.push(e.data);
                });
                
                mediaRecorder.addEventListener('stop', async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
                    
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    try {
                        const uploadResponse = await fetch('/api/messages/upload', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: formData
                        });
                        const uploadResult = await uploadResponse.json();
                        
                        const res = await apiCall('/messages', 'POST', {
                            receiverId: activeChatPartnerId,
                            groupId: activeChatGroupId,
                            messageType: 'voice',
                            fileUrl: uploadResult.fileUrl,
                            message: i18n[currentLanguage].voice_message
                        });
                        messages.push(res);
                        await renderMessages();
                        socket.emit('send_message', res);
                    } catch (err) {
                        console.error('Sesli mesaj gönderilemedi:', err);
                    }
                });

                mediaRecorder.start();
                isRecording = true;
                btnMic.style.color = '#ef4444';
                btnMic.style.transform = 'scale(1.25)';
            } catch (err) {
                console.error('Mikrofon erişim hatası:', err);
                alert(currentLanguage === 'tr' ? 'Mikrofon izni verilmedi!' : 'Microphone permission denied!');
            }
        } else {
            mediaRecorder.stop();
            isRecording = false;
            btnMic.style.color = 'var(--text-main)';
            btnMic.style.transform = 'scale(1)';
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    });
}

function playVoice(url, btnElement, progressElement, durationElement) {
    let audio = btnElement._audio;
    const isSent = btnElement.closest('.message-row').classList.contains('sent');
    const playColor = isSent ? 'white' : 'var(--primary-color)';
    const playedColor = isSent ? '#ffffff' : 'var(--primary-color)';
    const unplayedColor = isSent ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)';

    if (!audio) {
        audio = new Audio(url);
        btnElement._audio = audio;
        
        audio.addEventListener('timeupdate', () => {
            const barCount = progressElement.children.length;
            const playedBars = Math.floor((audio.currentTime / audio.duration) * barCount);
            
            for (let i = 0; i < barCount; i++) {
                const bar = progressElement.children[i];
                if (i < playedBars) {
                    bar.style.backgroundColor = playedColor;
                } else {
                    bar.style.backgroundColor = unplayedColor;
                }
            }
            
            const formatTime = (secs) => {
                if (isNaN(secs)) return '0:00';
                const m = Math.floor(secs / 60);
                const s = Math.floor(secs % 60);
                return `${m}:${s < 10 ? '0' : ''}${s}`;
            };
            durationElement.textContent = formatTime(audio.currentTime);
        });
        
        audio.addEventListener('ended', () => {
            btnElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${playColor};"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
            for (let i = 0; i < progressElement.children.length; i++) {
                progressElement.children[i].style.backgroundColor = unplayedColor;
            }
        });
    }
    
    if (audio.paused) {
        audio.play();
        btnElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${playColor};"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
    } else {
        audio.pause();
        btnElement.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${playColor};"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }
}

// 6. UÇTAN UCA ŞİFRELEME (E2EE) KODLARI
let activeE2eeEnabled = false;
const btnToggleE2ee = document.getElementById('btn-toggle-e2ee');
const e2eeStatusText = document.getElementById('e2ee-status-text');

if (btnToggleE2ee) {
    btnToggleE2ee.addEventListener('click', () => {
        chatOptionsDropdown.classList.add('hidden');
        if (activeChatGroupId) {
            alert(currentLanguage === 'tr' ? "Şifreleme şu an sadece özel sohbetlerde geçerlidir!" : "Encryption is currently only available for private chats!");
            return;
        }
        activeE2eeEnabled = !activeE2eeEnabled;
        e2eeStatusText.textContent = activeE2eeEnabled 
            ? i18n[currentLanguage].e2ee_on 
            : i18n[currentLanguage].e2ee_off;
        
        alert(
            activeE2eeEnabled 
                ? (currentLanguage === 'tr' ? "E2EE şifreleme aktif! Mesajlar yerel olarak şifrelenecek." : "E2EE encryption active! Messages will be encrypted locally.")
                : (currentLanguage === 'tr' ? "E2EE şifreleme kapatıldı." : "E2EE encryption disabled.")
        );
    });
}

async function getE2eeKey() {
    const partnerId = activeChatPartnerId || 0;
    const userId = currentUser.id || 0;
    const minId = Math.min(userId, partnerId);
    const maxId = Math.max(userId, partnerId);
    const secretSeed = `AgChatSeed_${minId}_${maxId}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(secretSeed);
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    return await crypto.subtle.importKey(
        'raw', 
        hash, 
        { name: 'AES-GCM' }, 
        false, 
        ['encrypt', 'decrypt']
    );
}

async function encryptText(text) {
    try {
        const key = await getE2eeKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encodedText = encoder.encode(text);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encodedText
        );
        
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherBytes = new Uint8Array(encrypted);
        let cipherBinary = '';
        for (let i = 0; i < cipherBytes.byteLength; i++) {
            cipherBinary += String.fromCharCode(cipherBytes[i]);
        }
        const cipherBase64 = btoa(cipherBinary);
        
        return `__E2EE__:${ivHex}:${cipherBase64}`;
    } catch (err) {
        console.error('Şifreleme hatası:', err);
        return text;
    }
}

async function decryptText(encryptedText, senderId, receiverId) {
    if (!encryptedText || !encryptedText.startsWith('__E2EE__:')) return encryptedText;
    try {
        const userId = currentUser.id;
        const partnerId = senderId === userId ? (receiverId || activeChatPartnerId) : senderId;
        const minId = Math.min(userId, partnerId);
        const maxId = Math.max(userId, partnerId);
        const secretSeed = `AgChatSeed_${minId}_${maxId}`;
        
        const encoder = new TextEncoder();
        const hash = await crypto.subtle.digest('SHA-256', encoder.encode(secretSeed));
        
        const key = await crypto.subtle.importKey(
            'raw', 
            hash, 
            { name: 'AES-GCM' }, 
            false, 
            ['encrypt', 'decrypt']
        );

        const parts = encryptedText.split(':');
        const ivHex = parts[1];
        const cipherBase64 = parts[2];
        
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        const cipherBinary = atob(cipherBase64);
        const cipherBytes = new Uint8Array(cipherBinary.length);
        for (let i = 0; i < cipherBinary.length; i++) {
            cipherBytes[i] = cipherBinary.charCodeAt(i);
        }
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            cipherBytes
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (err) {
        console.error('Şifre çözme hatası:', err);
        return '🔑 [Şifrelenmiş Mesaj - Çözülemedi]';
    }
}

// 7. WEBRTC SESLİ VE GÖRÜNTÜLÜ ARAMA MANTIĞI
let localStream = null;
let peerConnection = null;
let callActive = false;
let isVideoCallActive = false;
let currentCallPartnerId = null;
let incomingOfferSignal = null;
let iceCandidatesQueue = [];

let ringInterval = null;
let audioCtx = null;

function startRingtone() {
    stopRingtone();
    ringInterval = setInterval(() => {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(480, audioCtx.currentTime + 0.1);
            osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.2);
            
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 1.2);
        } catch (err) {
            console.error('Zil sesi çalınamadı:', err);
        }
    }, 1500);
}

function stopRingtone() {
    if (ringInterval) {
        clearInterval(ringInterval);
        ringInterval = null;
    }
}

async function processQueuedIceCandidates() {
    if (!peerConnection || !peerConnection.remoteDescription) return;
    while (iceCandidatesQueue.length > 0) {
        const candidate = iceCandidatesQueue.shift();
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Kuyruktan ICE adayı eklenirken hata:', err);
        }
    }
}


const webrtcCallScreen = document.getElementById('webrtc-call-screen');
const callPartnerAvatar = document.getElementById('call-partner-avatar');
const callPartnerUsername = document.getElementById('call-partner-username');
const callStatus = document.getElementById('call-status');
const callVideosContainer = document.getElementById('call-videos-container');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const incomingCallButtons = document.getElementById('incoming-call-buttons');
const activeCallButtons = document.getElementById('active-call-buttons');

const btnCallVoice = document.getElementById('btn-call-voice');
const btnCallVideo = document.getElementById('btn-call-video');
const btnAcceptCall = document.getElementById('btn-accept-call');
const btnRejectCall = document.getElementById('btn-reject-call');
const btnEndCall = document.getElementById('btn-end-call');
const btnToggleMic = document.getElementById('btn-toggle-mic');
const btnToggleVideo = document.getElementById('btn-toggle-video');
const btnSwitchCamera = document.getElementById('btn-switch-camera');
let currentFacingMode = 'user'; // 'user' veya 'environment'

const rtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

if (btnCallVoice) {
    btnCallVoice.addEventListener('click', () => startWebRtcCall(false));
}
if (btnCallVideo) {
    btnCallVideo.addEventListener('click', () => startWebRtcCall(true));
}

async function startWebRtcCall(isVideo) {
    if (!activeChatPartnerId) return;
    currentCallPartnerId = activeChatPartnerId;
    isVideoCallActive = isVideo;
    
    const partnerUser = users.find(u => u.id === activeChatPartnerId);
    showCallScreen(partnerUser, isVideo, false);
    
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo
        });
        
        if (isVideo && localVideo) {
            localVideo.srcObject = localStream;
        }
        
        initPeerConnection(activeChatPartnerId);
        
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('call_user', {
            targetUserId: activeChatPartnerId,
            signalData: offer,
            isVideoCall: isVideo
        });
        
        callStatus.textContent = currentLanguage === 'tr' ? 'Arama Yapılıyor...' : 'Calling...';
    } catch (err) {
        console.error('Arama başlatma hatası:', err);
        endCallSession();
    }
}

function showCallScreen(partnerUser, isVideo, isIncoming) {
    webrtcCallScreen.classList.remove('hidden');
    callPartnerUsername.textContent = partnerUser ? partnerUser.username : 'Kullanıcı';
    
    if (partnerUser && partnerUser.profile_pic) {
        callPartnerAvatar.innerHTML = `<img src="${partnerUser.profile_pic}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        callPartnerAvatar.textContent = partnerUser ? partnerUser.username.substring(0, 2).toUpperCase() : 'U';
    }
    
    if (isVideo) {
        callVideosContainer.classList.remove('hidden');
        if (btnSwitchCamera) btnSwitchCamera.style.display = 'flex';
    } else {
        callVideosContainer.classList.add('hidden');
        if (btnSwitchCamera) btnSwitchCamera.style.display = 'none';
    }
    
    if (isIncoming) {
        incomingCallButtons.classList.remove('hidden');
        activeCallButtons.classList.add('hidden');
        callStatus.textContent = currentLanguage === 'tr' ? 'Gelen Arama...' : 'Incoming Call...';
    } else {
        incomingCallButtons.classList.add('hidden');
        activeCallButtons.classList.remove('hidden');
    }
}

function initPeerConnection(partnerId) {
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    peerConnection.addEventListener('track', (e) => {
        if (remoteVideo) {
            remoteVideo.srcObject = e.streams[0];
        }
        const remoteAudio = document.getElementById('remote-audio');
        if (remoteAudio) {
            remoteAudio.srcObject = e.streams[0];
        }
    });
    
    peerConnection.addEventListener('icecandidate', (e) => {
        if (e.candidate) {
            socket.emit('webrtc_ice_candidate', {
                targetUserId: partnerId,
                candidate: e.candidate
            });
        }
    });
}

if (btnAcceptCall) {
    btnAcceptCall.addEventListener('click', async () => {
        stopRingtone();
        if (!currentCallPartnerId || !incomingOfferSignal) return;
        incomingCallButtons.classList.add('hidden');
        activeCallButtons.classList.remove('hidden');
        callStatus.textContent = currentLanguage === 'tr' ? 'Bağlanıyor...' : 'Connecting...';
        
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideoCallActive
            });
            
            if (isVideoCallActive && localVideo) {
                localVideo.srcObject = localStream;
            }
            
            initPeerConnection(currentCallPartnerId);
            
            await peerConnection.setRemoteDescription(new RTCSessionDescription(incomingOfferSignal));
            processQueuedIceCandidates();
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            socket.emit('accept_call', {
                targetUserId: currentCallPartnerId,
                signalData: answer
            });
            
            callStatus.textContent = currentLanguage === 'tr' ? 'Görüşme' : 'Connected';
            callActive = true;
        } catch (err) {
            console.error('Arama kabul edilme hatası:', err);
            socket.emit('reject_call', { targetUserId: currentCallPartnerId });
            endCallSession();
        }
    });
}

if (btnRejectCall) {
    btnRejectCall.addEventListener('click', () => {
        if (currentCallPartnerId) {
            socket.emit('reject_call', { targetUserId: currentCallPartnerId });
        }
        endCallSession();
    });
}

if (btnEndCall) {
    btnEndCall.addEventListener('click', () => {
        if (currentCallPartnerId) {
            socket.emit('end_call', { targetUserId: currentCallPartnerId });
        }
        endCallSession();
    });
}

if (btnToggleMic) {
    btnToggleMic.addEventListener('click', () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                btnToggleMic.style.backgroundColor = audioTrack.enabled ? 'rgba(255,255,255,0.15)' : '#ef4444';
            }
        }
    });
}

if (btnToggleVideo) {
    btnToggleVideo.addEventListener('click', async () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                // Eğer zaten video track varsa kapat/aç yap
                videoTrack.enabled = !videoTrack.enabled;
                btnToggleVideo.style.backgroundColor = videoTrack.enabled ? 'rgba(255,255,255,0.15)' : '#ef4444';
            } else {
                // Sesli arama esnasında kamerayı ilk defa açmak istiyorsa (Video call upgrade)
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: currentFacingMode },
                        audio: false
                    });
                    const newVideoTrack = videoStream.getVideoTracks()[0];
                    localStream.addTrack(newVideoTrack);
                    
                    // Görsel arayüz elemanlarını görüntülü moda geçir
                    isVideoCallActive = true;
                    callVideosContainer.classList.remove('hidden');
                    if (btnSwitchCamera) btnSwitchCamera.style.display = 'flex';
                    if (localVideo) {
                        localVideo.srcObject = null;
                        localVideo.srcObject = localStream;
                    }
                    
                    // WebRTC PeerConnection'a yeni track'i ekle
                    if (peerConnection) {
                        peerConnection.addTrack(newVideoTrack, localStream);
                        // Re-negotiate tetikle
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.emit('call_user', {
                            targetUserId: currentCallPartnerId,
                            signalData: offer,
                            isVideoCall: true
                        });
                    }
                    
                    // Karşı tarafa kamerayı açma komutunu (upgrade) soketle bildir
                    socket.emit('upgrade_to_video', { targetUserId: currentCallPartnerId });
                    btnToggleVideo.style.backgroundColor = 'rgba(255,255,255,0.15)';
                    console.log('📹 Arama başarıyla görüntülü aramaya yükseltildi.');
                } catch (err) {
                    console.error('Kamera açma/yükseltme hatası:', err);
                    alert(currentLanguage === 'tr' ? 'Kamera açılamadı.' : 'Could not open camera.');
                }
            }
        }
    });
}

if (btnSwitchCamera) {
    btnSwitchCamera.addEventListener('click', async () => {
        if (!localStream) return;
        
        try {
            // Kamera yönünü değiştir
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            
            // Mevcut video yayını varsa durdur ve temizle
            const oldVideoTrack = localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
                oldVideoTrack.stop();
                localStream.removeTrack(oldVideoTrack);
            }
            
            // Yeni yönlendirmeyle kamera akışını al
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: currentFacingMode },
                audio: false
            });
            
            const newVideoTrack = newStream.getVideoTracks()[0];
            localStream.addTrack(newVideoTrack);
            
            // Yerel video elementini güncelle
            if (localVideo) {
                localVideo.srcObject = null;
                localVideo.srcObject = localStream;
            }
            
            // WebRTC bağlantısında video track'ini değiştir (karşı tarafa yansısın)
            if (peerConnection) {
                const senders = peerConnection.getSenders();
                const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
                if (videoSender) {
                    await videoSender.replaceTrack(newVideoTrack);
                }
            }
            
            console.log('📷 Kamera başarıyla değiştirildi:', currentFacingMode);
        } catch (err) {
            console.error('Kamera değiştirme hatası:', err);
            alert(currentLanguage === 'tr' ? 'Kamera değiştirilemedi.' : 'Could not switch camera.');
        }
    });
}


function endCallSession() {
    stopRingtone();
    webrtcCallScreen.classList.add('hidden');
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    localStream = null;
    peerConnection = null;
    callActive = false;
    currentCallPartnerId = null;
    incomingOfferSignal = null;
    iceCandidatesQueue = [];
    
    if (btnToggleMic) btnToggleMic.style.backgroundColor = 'rgba(255,255,255,0.15)';
    if (btnToggleVideo) btnToggleVideo.style.backgroundColor = 'rgba(255,255,255,0.15)';
    
    // Arama geçmişini güncelle
    loadCallHistory();
}

// --- UYGULAMAYI BAŞLATMA VE VERİ ÇEKME ---

async function initApp() {
    if (!token) {
        showScreen('auth');
        return;
    }

    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser && currentUser.language) {
            currentLanguage = currentUser.language;
            translatePage();
        }
        myUsernameEl.textContent = currentUser.username;
        if (currentUser.profile_pic) {
            myAvatar.innerHTML = `<img src="${currentUser.profile_pic}" alt="${currentUser.username}" class="avatar-img">`;
        } else {
            myAvatar.textContent = currentUser.username.substring(0, 2).toUpperCase();
        }

        // Web Push ve Bildirim Yetkilerini Başlat
        initPushNotifications();

        showScreen('chat');
        
        // Geri tuşu kontrolünü başlat (Sentinel ve Main durumları)
        history.replaceState({ screen: 'sentinel' }, '');
        history.pushState({ screen: 'main' }, '');

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
                if (data.last_seen !== undefined) {
                    user.last_seen = data.last_seen;
                }
                renderUsersList();
                
                // Eğer durum değişikliği olan kullanıcı şu an sohbet ettiğimiz kişiyse, tepedeki başlık bilgisini de anlık güncelle
                if (activeChatPartnerId === data.userId) {
                    let statusText = data.isOnline ? 'çevrimiçi' : (user.last_seen ? `son görülme ${formatLastSeen(user.last_seen)}` : 'çevrimdışı');
                    if (user.bio) {
                        statusText += ` | ℹ️ ${user.bio}`;
                    }
                    activeChatStatus.textContent = statusText;
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

        // BİYOGRAFİ DEĞİŞTİĞİNDE çalışan olay
        socket.on('user_bio_changed', (data) => {
            const user = users.find(u => u.id === data.userId);
            if (user) {
                user.bio = data.bio;
                renderUsersList();
                if (activeChatPartnerId === data.userId) {
                    let statusText = user.isOnline ? 'çevrimiçi' : (user.last_seen ? `son görülme ${formatLastSeen(user.last_seen)}` : 'çevrimdışı');
                    if (data.bio) {
                        statusText += ` | ℹ️ ${data.bio}`;
                    }
                    activeChatStatus.textContent = statusText;
                }
            }
        });

        // MESAJ DÜZENLENDİĞİNDE çalışan olay
        socket.on('message_edited', (data) => {
            const isGroupMatch = activeChatGroupId && Number(data.groupId) === Number(activeChatGroupId);
            const isUserMatch = !activeChatGroupId && activeChatPartnerId && (Number(data.receiverId) === Number(activeChatPartnerId) || Number(data.receiverId) === Number(currentUser.id));

            if (isGroupMatch || isUserMatch) {
                const msg = messages.find(m => Number(m.id) === Number(data.messageId));
                if (msg) {
                    msg.message = data.message;
                    msg.is_edited = 1;
                    renderMessages();
                }
            }
        });

        // MESAJ BENDEN SİLİNDİĞİNDE çalışan olay
        socket.on('message_deleted_for_me', (data) => {
            messages = messages.filter(m => Number(m.id) !== Number(data.messageId));
            renderMessages();
        });

        // MESAJ HERKESTEN SİLİNDİĞİNDE çalışan olay
        socket.on('message_deleted_for_everyone', (data) => {
            const msg = messages.find(m => Number(m.id) === Number(data.id));
            if (msg) {
                msg.message = data.message;
                msg.message_type = data.message_type;
                msg.file_url = data.file_url;
                msg.reactions = data.reactions;
                msg.decrypted_message = null; // Eski şifresi çözülmüş önbelleği temizle
                renderMessages();
            }
        });

        // MESAJ EMOJİ REAKSİYONU GÜNCELLENDİĞİNDE çalışan olay
        socket.on('message_reaction_updated', (data) => {
            const msg = messages.find(m => Number(m.id) === Number(data.messageId));
            if (msg) {
                msg.reactions = data.reactions;
                renderMessages();
            }
        });
        
        socket.on('call_incoming', ({ fromUserId, fromUsername, signalData, isVideoCall }) => {
            currentCallPartnerId = fromUserId;
            isVideoCallActive = isVideoCall;
            incomingOfferSignal = signalData;
            
            // Zil sesini çal
            startRingtone();
            
            const callerUser = { username: fromUsername };
            showCallScreen(callerUser, isVideoCall, true);
        });

        socket.on('call_accepted', async ({ signalData }) => {
            stopRingtone();
            callStatus.textContent = currentLanguage === 'tr' ? 'Görüşme' : 'Connected';
            callActive = true;
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(signalData));
                processQueuedIceCandidates();
            }
        });

        socket.on('call_rejected', () => {
            stopRingtone();
            alert(currentLanguage === 'tr' ? 'Arama reddedildi.' : 'Call rejected.');
            endCallSession();
        });

        socket.on('call_ended', () => {
            stopRingtone();
            endCallSession();
        });

        socket.on('upgrade_to_video', async () => {
            isVideoCallActive = true;
            callVideosContainer.classList.remove('hidden');
            if (btnSwitchCamera) btnSwitchCamera.style.display = 'flex';
            
            // Eğer yerel video track'imiz yoksa bizim kameramızı da açıp akışa dahil et
            if (localStream && localStream.getVideoTracks().length === 0) {
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: currentFacingMode },
                        audio: false
                    });
                    const newVideoTrack = videoStream.getVideoTracks()[0];
                    localStream.addTrack(newVideoTrack);
                    if (localVideo) {
                        localVideo.srcObject = null;
                        localVideo.srcObject = localStream;
                    }
                    if (peerConnection) {
                        peerConnection.addTrack(newVideoTrack, localStream);
                        // Bağlantıyı tazelemek için re-negotiate tetiklenebilir
                        const offer = await peerConnection.createOffer();
                        await peerConnection.setLocalDescription(offer);
                        socket.emit('call_user', {
                            targetUserId: currentCallPartnerId,
                            signalData: offer,
                            isVideoCall: true
                        });
                    }
                } catch (e) {
                    console.error('Kamera otomatik açma hatası:', e);
                }
            }
        });

        socket.on('webrtc_ice_candidate', async ({ candidate }) => {
            if (peerConnection && peerConnection.remoteDescription) {
                try {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('ICE adayı eklenirken hata oluştu:', err);
                }
            } else {
                iceCandidatesQueue.push(candidate);
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

        const avatarEl = li.querySelector('.avatar');
        if (avatarEl) {
            avatarEl.addEventListener('click', (e) => {
                e.stopPropagation();
                showUserProfile(user);
            });
        }

        usersList.appendChild(li);
    });
    updateTabBadges();
}

async function loadCallHistory() {
    if (!callsList) return;
    try {
        const history = await apiCall('/calls/history');
        renderCallHistory(history);
    } catch (err) {
        console.error('Arama geçmişi yüklenemedi:', err);
    }
}

function renderCallHistory(calls) {
    callsList.innerHTML = '';
    if (!calls || calls.length === 0) {
        callsList.innerHTML = `<li class="user-item placeholder">${currentLanguage === 'tr' ? 'Arama geçmişi temiz.' : 'No calls history.'}</li>`;
        return;
    }
    
    calls.forEach(call => {
        const isOutgoing = call.caller_id === currentUser.id;
        const otherName = isOutgoing ? call.receiver_name : call.caller_name;
        const otherPic = isOutgoing ? call.receiver_pic : call.caller_pic;
        
        let statusIcon = '↙️';
        let statusText = currentLanguage === 'tr' ? 'Cevapsız Arama' : 'Missed Call';
        let statusColor = '#EF4444'; // Red
        
        if (call.status === 'accepted') {
            statusIcon = isOutgoing ? '↗️' : '↙️';
            statusText = isOutgoing ? (currentLanguage === 'tr' ? 'Giden Arama' : 'Outgoing Call') : (currentLanguage === 'tr' ? 'Gelen Arama' : 'Incoming Call');
            statusColor = '#10B981'; // Green
        } else if (call.status === 'rejected') {
            statusIcon = '🚫';
            statusText = currentLanguage === 'tr' ? 'Reddedildi' : 'Rejected';
            statusColor = '#6B7280'; // Gray
        } else if (call.status === 'cancelled') {
            statusIcon = '⚠️';
            statusText = currentLanguage === 'tr' ? 'İptal Edildi' : 'Cancelled';
            statusColor = '#F59E0B'; // Amber
        }
        
        const durationText = call.duration > 0 
            ? (call.duration >= 60 
                ? `${Math.floor(call.duration / 60)} dk ${call.duration % 60} sn` 
                : `${call.duration} sn`)
            : '';

        const li = document.createElement('li');
        li.className = 'user-item';
        li.style.cursor = 'default';
        
        const initial = otherName ? otherName.substring(0, 2).toUpperCase() : 'U';
        const avatarHTML = otherPic 
            ? `<img src="${otherPic}" alt="${otherName}" class="avatar-img">`
            : initial;
            
        li.innerHTML = `
            <div class="avatar">${avatarHTML}</div>
            <div class="user-item-info">
                <div class="user-item-header">
                    <span class="name" style="font-weight:600;">${otherName || 'Kullanıcı'}</span>
                    <span class="last-msg-time" style="font-size:0.75rem;">${formatMessageTime(call.created_at)}</span>
                </div>
                <span class="last-msg" style="display:flex; align-items:center; gap:4px; font-size:0.8rem; color:var(--text-muted);">
                    <span style="color:${statusColor}; font-weight:bold;">${statusIcon}</span>
                    ${statusText} ${durationText ? `(${durationText})` : ''}
                </span>
            </div>
            <div style="display:flex; align-items:center; gap:0.25rem; margin-left:auto;">
                <button class="btn-action-round call-back-btn" data-type="voice" data-partner-name="${otherName}" data-partner-id="${isOutgoing ? call.receiver_id : call.caller_id}" title="${currentLanguage === 'tr' ? 'Sesli Ara' : 'Voice Call'}" style="width:32px; height:32px; font-size:0.9rem; background:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center; border:none; border-radius:50%; cursor:pointer;">
                    📞
                </button>
                <button class="btn-action-round call-back-btn" data-type="video" data-partner-name="${otherName}" data-partner-id="${isOutgoing ? call.receiver_id : call.caller_id}" title="${currentLanguage === 'tr' ? 'Görüntülü Ara' : 'Video Call'}" style="width:32px; height:32px; font-size:0.9rem; background:var(--primary-light); color:var(--primary-color); display:flex; align-items:center; justify-content:center; border:none; border-radius:50%; cursor:pointer;">
                    📹
                </button>
            </div>
        `;
        
        // Button actions
        li.querySelectorAll('.call-back-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pId = Number(btn.getAttribute('data-partner-id'));
                const type = btn.getAttribute('data-type');
                
                // Set active partner so calling works!
                activeChatPartnerId = pId;
                activeChatPartner = btn.getAttribute('data-partner-name');
                
                startWebRtcCall(type === 'video');
            });
        });
        
        callsList.appendChild(li);
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
    try {
        clearMessageInput();
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
        
        const btnCallVoice = document.getElementById('btn-call-voice');
        const btnCallVideo = document.getElementById('btn-call-video');
        if (btnCallVoice) btnCallVoice.style.display = 'flex';
        if (btnCallVideo) btnCallVideo.style.display = 'flex';
        
        const btnToggleE2ee = document.getElementById('btn-toggle-e2ee');
        if (btnToggleE2ee) {
            btnToggleE2ee.classList.remove('hidden');
            const e2eeStatusText = document.getElementById('e2ee-status-text');
            if (e2eeStatusText) {
                e2eeStatusText.textContent = activeE2eeEnabled 
                    ? i18n[currentLanguage].e2ee_on 
                    : i18n[currentLanguage].e2ee_off;
            }
        }
        
        checkChannelPostPermission();

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

        // Geri tuşu kontrolü için geçmişe chat durumunu ekle
        if (history.state && history.state.screen !== 'chat') {
            history.pushState({ screen: 'chat' }, '');
        }

        activeChatName.textContent = user.username;
        if (user.profile_pic) {
            activeChatAvatar.innerHTML = `<img src="${user.profile_pic}" alt="${user.username}" class="avatar-img">`;
        } else {
            activeChatAvatar.textContent = user.username.substring(0, 2).toUpperCase();
        }
        let statusText = user.isOnline ? 'çevrimiçi' : (user.last_seen ? `son görülme ${formatLastSeen(user.last_seen)}` : 'çevrimdışı');
        if (user.bio) {
            statusText += ` | ℹ️ ${user.bio}`;
        }
        activeChatStatus.textContent = statusText;

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

function closeActiveChatUI() {
    activeChatPartner = null;
    activeChatPartnerId = null;
    activeChatGroupId = null;
    
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
        chatContainer.classList.remove('mobile-chat-active');
    }
    
    chatActiveScreen.classList.add('hidden');
    noChatSelectedScreen.classList.remove('hidden');
    
    renderUsersList();
}

// Mobilde sohbet alanından arkadaş listesine geri dönme butonu
if (mobileBackBtn) {
    mobileBackBtn.addEventListener('click', () => {
        history.back();
    });
}

// Tarayıcı geri butonu ve popstate yönetimi
window.addEventListener('popstate', (e) => {
    const state = e.state;
    if (!state) return;

    if (state.screen === 'sentinel') {
        // Ana ekrandayken geri basılırsa onay iste
        const confirmExit = confirm(currentLanguage === 'tr' ? 'Uygulamadan çıkmak istiyor musunuz?' : 'Do you want to exit the application?');
        if (confirmExit) {
            history.back();
        } else {
            // Çıkmak istemiyorsa history durumunu 'main' olarak restore et
            history.pushState({ screen: 'main' }, '');
        }
    } else if (state.screen === 'main') {
        // Sohbet açıksa kapatıp listeye dön
        closeActiveChatUI();
    }
});

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

async function renderMessages() {
    // Tüm şifreli mesajları arka planda çöz
    for (const msg of messages) {
        if (msg.is_encrypted === 1 && !msg.decrypted_message) {
            msg.decrypted_message = await decryptText(msg.message, msg.sender_id, msg.receiver_id);
        }
    }

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

        // Alıntılı mesaj kontrolü ve HTML inşası
        let replyQuoteHTML = '';
        if (msg.parent_message_id) {
            const parentMsg = messages.find(m => m.id === msg.parent_message_id);
            if (parentMsg) {
                const parentSenderName = parentMsg.sender_id === currentUser.id ? 'Siz' : (parentMsg.sender_name || activeChatPartner || 'Arkadaş');
                const parentTextRaw = parentMsg.decrypted_message || parentMsg.message;
                let parentPreviewText = parentMsg.message_type === 'image' ? '📷 Görsel' : (parentMsg.message_type === 'file' ? '📁 Dosya' : parentTextRaw);
                
                if (parentPreviewText && parentPreviewText.length > 60) {
                    parentPreviewText = parentPreviewText.substring(0, 60) + '...';
                }
                
                replyQuoteHTML = `
                    <div class="reply-quote-box" data-parent-id="${parentMsg.id}" style="background-color: rgba(0,0,0,0.06); border-left: 3px solid var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-bottom: 0.35rem; cursor: pointer; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none;">
                        <div style="font-weight: 600; color: var(--primary-color); font-size: 0.7rem; margin-bottom: 0.1rem;">${escapeHTML(parentSenderName)}</div>
                        <div style="color: var(--text-muted); overflow: hidden; text-overflow: ellipsis;">${escapeHTML(parentPreviewText)}</div>
                    </div>
                `;
            }
        }

        let msgContentHTML = '';
        const displayText = msg.decrypted_message || msg.message;
        
        if (msg.message_type === 'deleted') {
            msgContentHTML = `<span style="color:var(--text-muted); font-style:italic; opacity:0.75; display:inline-flex; align-items:center; gap:0.25rem;">🚫 ${escapeHTML(displayText)}</span>`;
        } else if (msg.message_type === 'sticker' || msg.message === '🎨 Sticker') {
            msgContentHTML = `<img src="${msg.file_url}" alt="sticker" style="width:110px; height:110px; object-fit:contain; display:block; border:none; background:transparent; box-shadow:none;">`;
        } else if (msg.message_type === 'image') {
            msgContentHTML = `<img src="${msg.file_url}" alt="görsel" style="max-width:100%; max-height:240px; border-radius:8px; display:block; cursor:pointer; margin-bottom: 2px;" onclick="window.open('${msg.file_url}', '_blank')">`;
        } else if (msg.message_type === 'file') {
            msgContentHTML = `<a href="${msg.file_url}" download="${escapeHTML(displayText)}" style="color:inherit; font-weight:600; display:inline-flex; align-items:center; gap:6px; text-decoration:underline; word-break:break-all;">📁 ${escapeHTML(displayText)}</a>`;
        } else if (msg.message_type === 'voice') {
            const uniqueId = `voice_${msg.id}`;
            const isSent = msg.sender_id === currentUser.id;
            const playColor = isSent ? 'white' : 'var(--primary-color)';
            
            // Deterministik ses dalga formu çubukları oluştur
            let waveformBars = '';
            const barCount = 28;
            for (let i = 0; i < barCount; i++) {
                const height = 6 + ((msg.id * (i + 1) * 7) % 16); // heights 6px to 22px
                const barColor = isSent ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)';
                waveformBars += `<div class="waveform-bar" style="height: ${height}px; width: 2px; background-color: ${barColor}; border-radius: 1px; transition: background-color 0.1s;"></div>`;
            }
            
            msgContentHTML = `
                <div class="voice-player-premium">
                    <button type="button" class="voice-play-btn-premium" id="btn-play-${uniqueId}" style="display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: ${playColor};"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </button>
                    <div class="voice-waveform-container" id="waveform-${uniqueId}">
                        ${waveformBars}
                    </div>
                    <span class="voice-duration-premium" id="duration-${uniqueId}">0:00</span>
                </div>
            `;
        } else {
            msgContentHTML = escapeHTML(displayText);
        }

        // Emoji Tepkileri (Reactions) HTML İnşası
        let reactionsHTML = '';
        let reactionsObj = {};
        if (msg.reactions) {
            try {
                reactionsObj = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : msg.reactions;
            } catch (e) {}
        }
        
        if (reactionsObj && typeof reactionsObj === 'object') {
            const keys = Object.keys(reactionsObj);
            if (keys.length > 0) {
                let list = [];
                keys.forEach(emo => {
                    const usersWhoReacted = reactionsObj[emo] || [];
                    if (usersWhoReacted.length > 0) {
                        list.push({
                            emoji: emo,
                            users: usersWhoReacted,
                            count: usersWhoReacted.length
                        });
                    }
                });
                
                // Sayılarına göre azalan sırada sırala (en çok tıklanan en solda)
                list.sort((a, b) => b.count - a.count);
                
                // En fazla 4 adet emojiyi göster
                const top4 = list.slice(0, 4);
                
                if (top4.length > 0) {
                    const isSent = msg.sender_id === currentUser.id;
                    const reactionsAlignStyle = isSent ? 'right: 12px;' : 'left: 12px;';
                    reactionsHTML = `<div class="message-reactions-row" style="position: absolute; bottom: -12px; ${reactionsAlignStyle} display: flex; gap: 4px; z-index: 15;">`;
                    top4.forEach(item => {
                        const isMyReaction = item.users.includes(currentUser.username);
                        const activeClass = isMyReaction ? 'active' : '';
                        reactionsHTML += `
                            <span class="reaction-pill ${activeClass}" data-emoji="${item.emoji}" data-msg-id="${msg.id}" title="${item.users.join(', ')}">
                                <span>${item.emoji}</span>
                                <span style="font-size: 0.65rem; font-weight: 700; margin-left: 2px;">${item.count}</span>
                            </span>
                        `;
                    });
                    reactionsHTML += '</div>';
                }
            }
        }

        // İletildi (Forwarded) İşareti
        let forwardedHTML = '';
        if (msg.is_forwarded === 1) {
            forwardedHTML = `
                <div class="message-forwarded-badge" style="font-size: 0.65rem; color: var(--text-muted); font-style: italic; margin-bottom: 3px; display: flex; align-items: center; gap: 3px; opacity: 0.75; user-select: none;">
                    ↪️ ${currentLanguage === 'tr' ? 'İletildi' : 'Forwarded'}
                </div>
            `;
        }

        let senderNameHTML = '';
        if (activeChatGroupId && !isSentByMe) {
            senderNameHTML = `<div style="font-size:0.75rem; font-weight:600; color:var(--primary-color); margin-bottom: 2.5px;">${escapeHTML(msg.sender_name || 'Grup Üyesi')}</div>`;
        }

        let editedBadge = msg.is_edited === 1 ? '<span class="msg-edited-badge" style="font-size:0.65rem; color:var(--text-muted); margin-left: 4px; font-style: italic;">(düzenlendi)</span>' : '';
        let e2eeIcon = msg.is_encrypted === 1 ? '<span class="message-encrypted-badge" title="Uçtan Uca Şifreli" style="font-size: 0.7rem; color: #10b981; display: inline-flex; align-items: center; gap: 0.2rem;">🔒 E2EE</span>' : '';

        const isSticker = msg.message_type === 'sticker' || msg.message === '🎨 Sticker';
        const bubbleClass = isSticker ? 'message-bubble sticker-bubble' : 'message-bubble';

        const isDeleted = msg.message_type === 'deleted';
        const arrowStyle = isDeleted ? 'display: none !important;' : '';

        row.innerHTML = `
            <div class="${bubbleClass}" data-msg-id="${msg.id}" data-sender-id="${msg.sender_id}">
                <span class="ctx-trigger-arrow" style="${arrowStyle}" title="Menü">▼</span>
                ${forwardedHTML}
                ${replyQuoteHTML}
                ${senderNameHTML}
                <div class="message-text">${msgContentHTML}</div>
                ${reactionsHTML}
                <span class="message-time" style="display:inline-flex; align-items:center; gap: 2px;">
                    ${e2eeIcon}
                    ${msgTime}
                    ${editedBadge}
                    ${ticksHTML}
                </span>
            </div>
        `;
        messagesHistory.appendChild(row);

        // Sesli mesaj olay bağlama
        if (msg.message_type === 'voice') {
            const uniqueId = `voice_${msg.id}`;
            const playBtn = document.getElementById(`btn-play-${uniqueId}`);
            const waveform = document.getElementById(`waveform-${uniqueId}`);
            const duration = document.getElementById(`duration-${uniqueId}`);
            if (playBtn && waveform && duration) {
                playBtn.addEventListener('click', () => {
                    playVoice(msg.file_url, playBtn, waveform, duration);
                });
            }
        }

        // Olay Dinleyicileri Ekle
        const bubbleEl = row.querySelector('.message-bubble');
        if (bubbleEl) {
            // 1. Sağ tık olayı (Context Menu - Masaüstü)
            bubbleEl.addEventListener('contextmenu', (e) => {
                if (isDeleted) return;
                e.preventDefault();
                showContextMenu(e.clientX, e.clientY, msg);
            });

            // 2. Mobil için uzun basım (Long Press)
            let pressTimer;
            bubbleEl.addEventListener('touchstart', (e) => {
                if (isDeleted) return;
                pressTimer = window.setTimeout(() => {
                    e.preventDefault();
                    const touch = e.touches[0] || e.changedTouches[0];
                    showContextMenu(touch.clientX, touch.clientY, msg);
                }, 600);
            }, { passive: false });

            bubbleEl.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            bubbleEl.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
            });

            // 3. Sağ üstteki Menü Oku Olayı
            const arrowEl = bubbleEl.querySelector('.ctx-trigger-arrow');
            if (arrowEl) {
                arrowEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = arrowEl.getBoundingClientRect();
                    showContextMenu(rect.left, rect.bottom + window.scrollY, msg);
                });
            }

            // 4. Tepki Hapları (Reaction Pills) Tıklama Olayı
            bubbleEl.querySelectorAll('.reaction-pill').forEach(pill => {
                pill.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const emoji = pill.getAttribute('data-emoji');
                    socket.emit('message_reaction', {
                        messageId: msg.id,
                        emoji: emoji,
                        targetUserId: activeChatPartnerId,
                        groupId: activeChatGroupId
                    });
                });
            });
        }

        // 3. Alıntıya tıklandığında yukarı kaydırma ve vurgulama
        const quoteEl = row.querySelector('.reply-quote-box');
        if (quoteEl) {
            quoteEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const parentId = e.currentTarget.getAttribute('data-parent-id');
                const targetBubble = messagesHistory.querySelector(`.message-bubble[data-msg-id="${parentId}"]`);
                if (targetBubble) {
                    targetBubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetBubble.style.transition = 'background-color 0.3s, transform 0.3s';
                    targetBubble.style.backgroundColor = 'rgba(96, 165, 250, 0.3)'; // Vurgulama rengi
                    targetBubble.style.transform = 'scale(1.03)';
                    setTimeout(() => {
                        targetBubble.style.backgroundColor = '';
                        targetBubble.style.transform = '';
                    }, 800);
                }
            });
        }
    });

    messagesHistory.scrollTop = messagesHistory.scrollHeight;
}

messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || (!activeChatPartnerId && !activeChatGroupId)) return;

    try {
        // Eğer Düzenleme Modundaysak
        if (editingMessageId) {
            await apiCall(`/messages/${editingMessageId}/edit`, 'POST', { message: text });
            
            const localMsg = messages.find(m => m.id === editingMessageId);
            if (localMsg) {
                localMsg.message = text;
                localMsg.is_edited = 1;
            }
            renderMessages();
            
            editingMessageId = null;
            clearMessageInput();
            messageInput.style.border = '';
            messageInput.placeholder = 'Mesajınızı yazın...';
            return;
        }

        // Eğer Alıntılı Yanıt Modundaysak
        let finalMsgText = text;
        let isEncryptedVal = 0;
        if (activeE2eeEnabled && !activeChatGroupId) {
            finalMsgText = await encryptText(text);
            isEncryptedVal = 1;
        }

        const requestBody = {
            receiverId: activeChatPartnerId,
            groupId: activeChatGroupId,
            message: finalMsgText
        };
        if (replyingMessageId) {
            requestBody.parentMessageId = replyingMessageId;
        }
        if (activeDisappearingDuration > 0) {
            requestBody.durationSeconds = activeDisappearingDuration;
        }
        if (isEncryptedVal === 1) {
            requestBody.isEncrypted = 1;
        }

        const newMsg = await apiCall('/messages', 'POST', requestBody);

        const isAlreadyAdded = messages.some(m => m.id === newMsg.id);
        if (!isAlreadyAdded) {
            messages.push(newMsg);
            renderMessages();
        }
        clearMessageInput();

        // Yanıt durumunu temizle
        if (replyingMessageId) {
            replyingMessageId = null;
            if (replyPreviewContainer) replyPreviewContainer.classList.add('hidden');
        }

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
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift + Enter: Yeni satır ekle
            } else {
                // Sadece Enter: Formu gönder
                e.preventDefault();
                messageForm.dispatchEvent(new Event('submit'));
            }
        }
    });

    messageInput.addEventListener('input', () => {
        // Textarea otomatik yükseklik ayarlama
        messageInput.style.height = '40px';
        const scrollHeight = messageInput.scrollHeight;
        if (scrollHeight > 40) {
            messageInput.style.height = Math.min(scrollHeight, 120) + 'px';
            messageInput.style.overflowY = scrollHeight > 120 ? 'auto' : 'hidden';
        } else {
            messageInput.style.overflowY = 'hidden';
        }

        // Akıllı buton geçişi (Mic / Send)
        const text = messageInput.value.trim();
        if (text) {
            if (btnMic) btnMic.classList.add('hidden');
            if (btnSend) btnSend.classList.remove('hidden');
        } else {
            if (btnMic) btnMic.classList.remove('hidden');
            if (btnSend) btnSend.classList.add('hidden');
        }

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
        const originalHTML = btnAttach.innerHTML;
        btnAttach.innerHTML = '⏳';

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
            btnAttach.innerHTML = originalHTML;
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
if (tabFriends && tabGroups && tabCalls) {
    tabFriends.addEventListener('click', () => {
        tabFriends.classList.add('active');
        tabFriends.style.backgroundColor = 'var(--primary-color)';
        tabFriends.style.color = 'white';

        tabGroups.classList.remove('active');
        tabGroups.style.backgroundColor = 'transparent';
        tabGroups.style.color = 'var(--text-main)';
        tabGroups.style.border = '1px solid var(--border-color)';

        tabCalls.classList.remove('active');
        tabCalls.style.backgroundColor = 'transparent';
        tabCalls.style.color = 'var(--text-main)';
        tabCalls.style.border = '1px solid var(--border-color)';

        friendsTabContent.classList.remove('hidden');
        groupsTabContent.classList.add('hidden');
        callsTabContent.classList.add('hidden');
        renderUsersList();
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

        tabCalls.classList.remove('active');
        tabCalls.style.backgroundColor = 'transparent';
        tabCalls.style.color = 'var(--text-main)';
        tabCalls.style.border = '1px solid var(--border-color)';

        groupsTabContent.classList.remove('hidden');
        friendsTabContent.classList.add('hidden');
        callsTabContent.classList.add('hidden');

        await loadGroups();
        updateTabBadges();
    });

    tabCalls.addEventListener('click', async () => {
        tabCalls.classList.add('active');
        tabCalls.style.backgroundColor = 'var(--primary-color)';
        tabCalls.style.color = 'white';

        tabFriends.classList.remove('active');
        tabFriends.style.backgroundColor = 'transparent';
        tabFriends.style.color = 'var(--text-main)';
        tabFriends.style.border = '1px solid var(--border-color)';

        tabGroups.classList.remove('active');
        tabGroups.style.backgroundColor = 'transparent';
        tabGroups.style.color = 'var(--text-main)';
        tabGroups.style.border = '1px solid var(--border-color)';

        callsTabContent.classList.remove('hidden');
        friendsTabContent.classList.add('hidden');
        groupsTabContent.classList.add('hidden');

        await loadCallHistory();
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
            const isChannelCheckbox = document.getElementById('group-is-channel');
            const isChannel = isChannelCheckbox ? isChannelCheckbox.checked : false;

            const newGroup = await apiCall('/groups/create', 'POST', {
                name: groupName,
                memberIds: memberIds,
                isChannel: isChannel
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
        clearMessageInput();
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

        // Geri tuşu kontrolü için geçmişe chat durumunu ekle
        if (history.state && history.state.screen !== 'chat') {
            history.pushState({ screen: 'chat' }, '');
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

        const btnCallVoice = document.getElementById('btn-call-voice');
        const btnCallVideo = document.getElementById('btn-call-video');
        if (btnCallVoice) btnCallVoice.style.display = 'none';
        if (btnCallVideo) btnCallVideo.style.display = 'none';

        const btnToggleE2ee = document.getElementById('btn-toggle-e2ee');
        if (btnToggleE2ee) {
            btnToggleE2ee.classList.add('hidden');
        }

        checkChannelPostPermission();

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

// --- BİLDİRİM/SAĞ TIK VE CONTEXT MENU MANTIKLARI ---
let activeContextMessage = null; // Menünün açıldığı mesaj nesnesi

function hideContextMenu() {
    if (chatContextMenu) {
        chatContextMenu.classList.add('hidden');
    }
    document.querySelectorAll('.message-bubble').forEach(b => b.classList.remove('active-context'));
}

function showContextMenu(x, y, msg) {
    if (!chatContextMenu) return;
    activeContextMessage = msg;

    // Aktif mesaj vurgusunu ekle
    document.querySelectorAll('.message-bubble').forEach(b => b.classList.remove('active-context'));
    const currentBubble = messagesHistory.querySelector(`.message-bubble[data-msg-id="${msg.id}"]`);
    if (currentBubble) {
        currentBubble.classList.add('active-context');
    }

    // Menünün butonlarını yetkiye göre aç/kapa
    const isMyMessage = msg.sender_id === currentUser.id;
    if (isMyMessage) {
        const msgTime = new Date(msg.created_at);
        const now = new Date();
        const diffMins = (now - msgTime) / 60000;
        
        if (diffMins <= 5 && (!msg.message_type || msg.message_type === 'text')) {
            ctxBtnEdit.style.display = 'block';
        } else {
            ctxBtnEdit.style.display = 'none';
        }
    } else {
        ctxBtnEdit.style.display = 'none';
    }
    // Silme seçeneği (Herkesten veya Benden sil) her iki taraf için de görünür olsun
    ctxBtnDelete.style.display = 'block';

    // Emoji tepki butonlarını bağlama
    const reactionElements = chatContextMenu.querySelectorAll('.ctx-reaction-emoji');
    reactionElements.forEach(elm => {
        const newElm = elm.cloneNode(true);
        elm.parentNode.replaceChild(newElm, elm);
        
        newElm.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = newElm.getAttribute('data-emoji');
            socket.emit('message_reaction', {
                messageId: msg.id,
                emoji: emoji,
                targetUserId: activeChatPartnerId,
                groupId: activeChatGroupId
            });
            hideContextMenu();
        });
    });

    // Pozisyonu ayarla (ekrandan taşmayı engellemek için)
    chatContextMenu.classList.remove('hidden');
    const menuWidth = chatContextMenu.offsetWidth || 200;
    const menuHeight = chatContextMenu.offsetHeight || 160;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (x + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 10;
    }
    if (y + menuHeight > windowHeight) {
        top = windowHeight - menuHeight - 10;
    }

    chatContextMenu.style.left = `${left}px`;
    chatContextMenu.style.top = `${top}px`;
}

// Menü buton olayları
if (ctxBtnReply) {
    ctxBtnReply.addEventListener('click', () => {
        if (!activeContextMessage) return;
        replyingMessageId = activeContextMessage.id;
        
        const senderName = activeContextMessage.sender_id === currentUser.id ? 'Siz' : (activeContextMessage.sender_name || activeContextMessage.sender_username || activeChatPartner || 'Arkadaş');
        const textPreview = activeContextMessage.message_type === 'image' ? '📷 Görsel' : (activeContextMessage.message_type === 'file' ? '📁 Dosya' : activeContextMessage.message);
        
        replyPreviewSender.textContent = senderName;
        replyPreviewText.textContent = textPreview;
        replyPreviewContainer.classList.remove('hidden');
        
        // Düzenleme modunu kapat
        editingMessageId = null;
        messageInput.style.border = '';
        messageInput.placeholder = 'Yanıtınızı yazın...';
        messageInput.focus();
        
        hideContextMenu();
    });
}

if (ctxBtnCopy) {
    ctxBtnCopy.addEventListener('click', async () => {
        if (!activeContextMessage) return;
        const textToCopy = activeContextMessage.decrypted_message || activeContextMessage.message;
        try {
            await navigator.clipboard.writeText(textToCopy);
            alert(currentLanguage === 'tr' ? 'Mesaj panoya kopyalandı!' : 'Message copied to clipboard!');
        } catch (err) {
            console.error('Kopyalama hatası:', err);
        }
        hideContextMenu();
    });
}

if (ctxBtnEdit) {
    ctxBtnEdit.addEventListener('click', () => {
        if (!activeContextMessage) return;
        // Sadece text mesajları düzenlenebilir
        if (activeContextMessage.message_type && activeContextMessage.message_type !== 'text') {
            alert('Yalnızca metin mesajları düzenlenebilir.');
            hideContextMenu();
            return;
        }

        editingMessageId = activeContextMessage.id;
        messageInput.value = activeContextMessage.message;
        messageInput.placeholder = 'Mesajı düzenle...';
        messageInput.style.border = '2px solid var(--primary-color)';
        messageInput.focus();

        // Yanıt modunu kapat
        replyingMessageId = null;
        replyPreviewContainer.classList.add('hidden');

        hideContextMenu();
    });
}

if (ctxBtnDelete) {
    ctxBtnDelete.addEventListener('click', async () => {
        if (!activeContextMessage) return;
        
        const isMyMsg = activeContextMessage.sender_id === currentUser.id;
        let deleteType = 'me';
        
        if (isMyMsg) {
            const promptText = currentLanguage === 'tr'
                ? "Lütfen silme türünü seçin:\n1 - Herkesten Sil\n2 - Benden Sil"
                : "Select delete type:\n1 - Delete for Everyone\n2 - Delete for Me";
            const choice = prompt(promptText, "1");
            if (choice === "1") {
                deleteType = 'everyone';
            } else if (choice === "2") {
                deleteType = 'me';
            } else {
                hideContextMenu();
                return;
            }
        } else {
            const confirmText = currentLanguage === 'tr'
                ? "Bu mesajı sadece kendinizden silmek istediğinize emin misiniz?"
                : "Are you sure you want to delete this message for yourself?";
            if (!confirm(confirmText)) {
                hideContextMenu();
                return;
            }
            deleteType = 'me';
        }

        try {
            await apiCall(`/messages/${activeContextMessage.id}/delete`, 'POST', { deleteType });
            
            if (deleteType === 'me') {
                messages = messages.filter(m => Number(m.id) !== Number(activeContextMessage.id));
                renderMessages();
            }
        } catch (err) {
            alert('Mesaj silinemedi: ' + err.message);
        }

        hideContextMenu();
    });
}

// Mesaj İletme (Forward) Olayları ve Yardımcı Fonksiyonları
if (ctxBtnForward) {
    ctxBtnForward.addEventListener('click', () => {
        if (!activeContextMessage) return;
        hideContextMenu();
        if (forwardModal) {
            forwardModal.classList.remove('hidden');
            renderForwardTargets();
        }
    });
}

if (closeForwardModal) {
    closeForwardModal.addEventListener('click', () => {
        forwardModal.classList.add('hidden');
    });
}

function renderForwardTargets() {
    if (!forwardTargetsList) return;
    forwardTargetsList.innerHTML = '';
    
    // Arkadaşları listele
    users.forEach(u => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.75rem';
        div.style.padding = '0.6rem';
        div.style.border = '1px solid var(--border-color)';
        div.style.borderRadius = '10px';
        div.style.cursor = 'pointer';
        div.style.backgroundColor = 'var(--bg-white)';
        div.style.transition = 'background 0.2s, transform 0.1s';
        
        div.addEventListener('mouseover', () => {
            div.style.backgroundColor = 'var(--bg-hover)';
            div.style.transform = 'translateY(-1px)';
        });
        div.addEventListener('mouseout', () => {
            div.style.backgroundColor = 'var(--bg-white)';
            div.style.transform = 'none';
        });
        
        div.innerHTML = `
            <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem; background-color: var(--primary-light); color: var(--primary-color); font-weight: bold; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${u.username.substring(0, 2).toUpperCase()}</div>
            <div style="font-size:0.85rem; font-weight:600; flex:1; color: var(--text-main);">${escapeHTML(u.username)}</div>
            <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 20px; font-weight: 600;">İlet</button>
        `;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            forwardMessageTo(activeContextMessage, u.id, null);
        });
        forwardTargetsList.appendChild(div);
    });
    
    // Grupları listele
    groups.forEach(g => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '0.75rem';
        div.style.padding = '0.6rem';
        div.style.border = '1px solid var(--border-color)';
        div.style.borderRadius = '10px';
        div.style.cursor = 'pointer';
        div.style.backgroundColor = 'var(--bg-white)';
        div.style.transition = 'background 0.2s, transform 0.1s';
        
        div.addEventListener('mouseover', () => {
            div.style.backgroundColor = 'var(--bg-hover)';
            div.style.transform = 'translateY(-1px)';
        });
        div.addEventListener('mouseout', () => {
            div.style.backgroundColor = 'var(--bg-white)';
            div.style.transform = 'none';
        });
        
        div.innerHTML = `
            <div class="user-avatar" style="width:32px; height:32px; font-size:0.8rem; background-color: #e0e7ff; color: #4f46e5; font-weight: bold; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${g.name.substring(0, 2).toUpperCase()}</div>
            <div style="font-size:0.85rem; font-weight:600; flex:1; color: var(--text-main);">${escapeHTML(g.name)}</div>
            <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; border-radius: 20px; font-weight: 600;">İlet</button>
        `;
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            forwardMessageTo(activeContextMessage, null, g.id);
        });
        forwardTargetsList.appendChild(div);
    });
}

async function forwardMessageTo(msg, targetUserId, targetGroupId) {
    try {
        forwardModal.classList.add('hidden');
        
        const res = await apiCall('/messages', 'POST', {
            receiverId: targetUserId,
            groupId: targetGroupId,
            messageType: msg.message_type || 'text',
            fileUrl: msg.file_url || null,
            message: msg.decrypted_message || msg.message,
            isEncrypted: 0,
            isForwarded: 1
        });
        
        const isCurrentPrivate = !activeChatGroupId && targetUserId && activeChatPartnerId === targetUserId;
        const isCurrentGroup = activeChatGroupId && targetGroupId && activeChatGroupId === targetGroupId;
        if (isCurrentPrivate || isCurrentGroup) {
            messages.push(res);
            renderMessages();
        }
        
        socket.emit('send_message', res);
    } catch(err) {
        console.error('İletme hatası:', err);
        alert('Mesaj iletilemedi.');
    }
}

// Menüyü veya diğer öğeleri kapatmak için boşluğa tıklama
document.addEventListener('click', (e) => {
    if (chatContextMenu && !chatContextMenu.classList.contains('hidden')) {
        // Eğer tıklanan yer context menü elemanı değilse kapat
        if (!chatContextMenu.contains(e.target)) {
            hideContextMenu();
        }
    }
});

// Yanıt önizlemesini kapat butonu
if (btnReplyPreviewClose) {
    btnReplyPreviewClose.addEventListener('click', () => {
        replyingMessageId = null;
        replyPreviewContainer.classList.add('hidden');
        messageInput.placeholder = 'Mesajınızı yazın...';
    });
}

// --- KULLANICI PROFİL GÖSTERİM SİSTEMİ ---
let activeProfileUser = null; // Profil detayları gösterilen kullanıcı

function showUserProfile(user) {
    if (!userProfileModal) return;
    activeProfileUser = user;

    profileModalUsername.textContent = user.username;
    
    const statusText = user.isOnline 
        ? 'çevrimiçi' 
        : (user.last_seen ? `son görülme ${formatLastSeen(user.last_seen)}` : 'çevrimdışı');
    profileModalStatus.textContent = statusText;
    profileModalStatus.style.color = user.isOnline ? '#10B981' : 'var(--text-muted)';

    profileModalBio.textContent = user.bio || 'Biyografi bulunmuyor.';

    const initial = user.username.substring(0, 2).toUpperCase();
    if (user.profile_pic) {
        profileModalAvatar.innerHTML = `<img src="${user.profile_pic}" alt="${user.username}" style="width:100%; height:100%; object-fit:cover;">`;
        profileModalAvatar.style.cursor = 'pointer';
    } else {
        profileModalAvatar.innerHTML = initial;
        profileModalAvatar.style.cursor = 'default';
    }

    const profileModalBanner = document.getElementById('profile-modal-banner');
    if (profileModalBanner) {
        const bannerVal = user.profile_banner || 'linear-gradient(135deg, #4f46e5, #06b6d4)';
        if (bannerVal.startsWith('linear-gradient')) {
            profileModalBanner.style.background = bannerVal;
        } else {
            profileModalBanner.style.background = `url(${bannerVal}) center/cover`;
        }
    }

    userProfileModal.classList.remove('hidden');
}

// Profil Kapatma
if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => {
        userProfileModal.classList.add('hidden');
        activeProfileUser = null;
    });
}

userProfileModal.addEventListener('click', (e) => {
    if (e.target === userProfileModal) {
        userProfileModal.classList.add('hidden');
        activeProfileUser = null;
    }
});

// Profil Fotoğrafına Tıklayınca Lightbox'ta Büyüt
if (profileModalAvatar) {
    profileModalAvatar.addEventListener('click', () => {
        if (activeProfileUser && activeProfileUser.profile_pic) {
            lightboxImg.src = activeProfileUser.profile_pic;
            lightboxModal.classList.remove('hidden');
        }
    });
}

// Mesaj Gönder Butonu
if (btnProfileSendMessage) {
    btnProfileSendMessage.addEventListener('click', () => {
        if (!activeProfileUser) return;
        userProfileModal.classList.add('hidden');
        selectUserChat(activeProfileUser);
    });
}

// Arkadaşı Çıkar Butonu
if (btnProfileUnfriend) {
    btnProfileUnfriend.addEventListener('click', async () => {
        if (!activeProfileUser) return;
        const confirmRemove = confirm(`"${activeProfileUser.username}" adlı kullanıcıyı arkadaşlarınızdan çıkarmak istediğinize emin misiniz?`);
        if (!confirmRemove) return;

        try {
            const res = await apiCall('/friends/remove', 'POST', { friendId: activeProfileUser.id });
            alert(res.message);
            
            if (activeChatPartnerId === activeProfileUser.id) {
                activeChatPartner = null;
                activeChatPartnerId = null;
                chatActiveScreen.classList.add('hidden');
                noChatSelectedScreen.classList.remove('hidden');
            }
            
            userProfileModal.classList.add('hidden');
            await loadUsers();
        } catch (err) {
            alert('Arkadaşlıktan çıkarılamadı: ' + err.message);
        }
    });
}

// Engelle Butonu
if (btnProfileBlock) {
    btnProfileBlock.addEventListener('click', async () => {
        if (!activeProfileUser) return;
        const confirmBlock = confirm(`"${activeProfileUser.username}" adlı kullanıcıyı engellemek istediğinize emin misiniz? Bu işlem arkadaşlığınızı sonlandıracak ve size mesaj atmasını engelleyecektir.`);
        if (!confirmBlock) return;

        try {
            const res = await apiCall('/friends/block', 'POST', { blockedId: activeProfileUser.id });
            alert(res.message);

            if (activeChatPartnerId === activeProfileUser.id) {
                activeChatPartner = null;
                activeChatPartnerId = null;
                chatActiveScreen.classList.add('hidden');
                noChatSelectedScreen.classList.remove('hidden');
            }

            userProfileModal.classList.add('hidden');
            await loadUsers();
        } catch (err) {
            alert('Kullanıcı engellenemedi: ' + err.message);
        }
    });
}

// Tepedeki Aktif Sohbet İsmi ve Avatara Tıklayınca Profil Açılması
if (activeChatName) {
    activeChatName.style.cursor = 'pointer';
    activeChatName.addEventListener('click', () => {
        if (activeChatPartnerId) {
            const user = users.find(u => u.id === activeChatPartnerId);
            if (user) showUserProfile(user);
        }
    });
}
// Profil detaylarına isimden de erişilebilir

function formatLastSeen(isoString) {
    if (!isoString) return 'yakınlarda';
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'az önce';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) {
            const todayStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (date.getDate() === now.getDate()) {
                return `bugün ${todayStr}`;
            } else {
                return `dün ${todayStr}`;
            }
        }
        return date.toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return 'yakınlarda';
    }
}

initApp();
