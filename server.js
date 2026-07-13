const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io'); // Socket.IO kütüphanesini dahil ettik
const { initDatabase, dbQueries } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Soket sunucusunu başlattık

const PORT = process.env.PORT || 3000; // Buluttaki dinamik portu veya lokalde 3000'i kullan
const JWT_SECRET = 'mesajlasma-gizli-anahtar-12345';
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Cloudinary Yapılandırması (Görsel yüklemeleri için)
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary profil fotoğrafı yükleme altyapısı hazır.');
} else {
    console.log('⚠️ Cloudinary çevre değişkenleri eksik. Profil fotoğrafı yükleme simülasyon modunda çalışacak.');
}

// Disk yazma izinleriyle uğraşmamak için bellek (MemoryStorage) depolamalı Multer kurulumu
const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary'e hafızadaki (buffer) dosyayı yükleme akışı (stream) yardımcı fonksiyonu
const uploadStream = (buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'profile_pics' },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
        stream.end(buffer);
    });
};

// E-posta Gönderme Sistemi Kurulumu (Brevo API v3)
// Render.com gibi bulut sunucuları SMTP portlarını (587/465) engellediği için e-postaları doğrudan HTTPS (REST API) üzerinden gönderiyoruz.
const hasBrevoKey = !!process.env.SMTP_PASS;
if (hasBrevoKey) {
    console.log('✅ Brevo E-posta REST API anahtarı yüklendi, gerçek mailler gönderilecek.');
} else {
    console.log('⚠️ E-posta API anahtarı eksik (SMTP_PASS). E-postalar konsola yazdırılacak (Simülasyon Modu).');
}

// Brevo API üzerinden e-posta gönderen genel yardımcı fonksiyon
async function sendEmailViaBrevo(toEmail, toName, subject, htmlContent) {
    if (!hasBrevoKey) {
        console.log(`\n==================================================`);
        console.log(`📧 [E-POSTA SİMÜLASYONU]`);
        console.log(`Kime: ${toEmail} (${toName})`);
        console.log(`Konu: ${subject}`);
        console.log(`İçerik: (Simülasyon aktif, mail gönderilmedi)`);
        console.log(`==================================================\n`);
        return true;
    }

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.SMTP_PASS, // Brevo SMTP şifresi aynı zamanda geçerli bir API Key'dir.
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: "Hızlı Mesajlaşma",
                    email: process.env.SENDER_EMAIL || process.env.SMTP_USER || "noreply@mesajlasma-uygulamasi.com"
                },
                to: [
                    {
                        email: toEmail,
                        name: toName
                    }
                ],
                subject: subject,
                htmlContent: htmlContent
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`📧 E-posta başarıyla gönderildi: ${toEmail}`);
            return true;
        } else {
            console.error('❌ Brevo API Gönderim Hatası:', data);
            return false;
        }
    } catch (error) {
        console.error('❌ E-posta gönderim sırasında HTTP hatası:', error);
        return false;
    }
}

// Hesap Doğrulama E-postası Gönder
async function sendVerificationEmail(email, username, token) {
    const domain = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const verifyLink = `${domain}/api/auth/verify?token=${token}`;

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4F46E5; text-align: center;">💬 Hızlı Mesajlaşma</h2>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>Hızlı Mesajlaşma uygulamasına kayıt olduğunuz için teşekkürler!</p>
            <p>Hesabınızı doğrulamak ve hemen sohbet etmeye başlamak için lütfen aşağıdaki butona tıklayın:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Hesabımı Doğrula</a>
            </div>
            <p style="font-size: 13px; color: #6B7280;">Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınızın adres çubuğuna yapıştırabilirsiniz:</p>
            <p style="font-size: 13px; word-break: break-all;"><a href="${verifyLink}" style="color: #4F46E5;">${verifyLink}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
        </div>
    `;

    // Simülasyon modunda konsola da yazdır (kolaylık olsun)
    if (!hasBrevoKey) {
        console.log(`🔗 Doğrulama Linki: ${verifyLink}`);
    }

    await sendEmailViaBrevo(email, username, 'Hesap Doğrulama - Hızlı Mesajlaşma', htmlContent);
}

// Şifre Sıfırlama E-postası Gönder
async function sendResetPasswordEmail(email, username, token) {
    const domain = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    const resetLink = `${domain}/reset-password.html?token=${token}`;

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4F46E5; text-align: center;">💬 Hızlı Mesajlaşma</h2>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p>Merhaba <strong>${username}</strong>,</p>
            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
            <p>Şifrenizi sıfırlamak için lütfen aşağıdaki butona tıklayın (Bu link 1 saat boyunca geçerlidir):</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Şifremi Sıfırla</a>
            </div>
            <p style="font-size: 13px; color: #6B7280;">Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınızın adres çubuğuna yapıştırabilirsiniz:</p>
            <p style="font-size: 13px; word-break: break-all;"><a href="${resetLink}" style="color: #4F46E5;">${resetLink}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Bu işlemi siz gerçekleştirmediyseniz lütfen bu e-postayı dikkate almayınız.</p>
        </div>
    `;

    // Simülasyon modunda konsola da yazdır (kolaylık olsun)
    if (!hasBrevoKey) {
        console.log(`🔗 Şifre Sıfırlama Linki: ${resetLink}`);
    }

    await sendEmailViaBrevo(email, username, 'Şifre Sıfırlama Talebi - Hızlı Mesajlaşma', htmlContent);
}

// Ara Katmanlar
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Test rotası (Sunucuya ulaşıp ulaşamadığımızı anlamak için)
app.get('/api/test', (req, res) => {
    res.send('Sunucu basariyla calisiyor!');
});

// Ana sayfa isteği geldiğinde doğrudan index.html dosyasını gönder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Çevrimiçi kullanıcıların ID'lerini tutan küme
const onlineUsers = new Set();
// Hangi kullanıcının (ID) hangi sokette (Socket ID) olduğunu tutan harita
const userSockets = new Map();

// --- GÜVENLİK DUVARI (JWT TOKEN DOĞRULAMA) ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Giriş yapmanız gerekiyor.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Oturum süresi dolmuş veya geçersiz anahtar.' });
        }
        req.user = user;
        next();
    });
}

// --- SOCKET.IO GÜVENLİK KONTROLÜ (MİDDLEWARE) ---
// Sokete bağlanmaya çalışan kişinin giriş anahtarını (token) kontrol eder.
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Yetkisiz bağlantı.'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error('Geçersiz anahtar.'));
        }
        socket.user = decoded; // Sokete bağlı kullanıcının id ve username bilgisini ekle
        next();
    });
});

// --- SOCKET.IO BAĞLANTI YÖNETİMİ ---
io.on('connection', (socket) => {
    const userId = socket.user.id;
    
    // Kullanıcıyı çevrimiçi listelerine ekle (Çoklu sekme/sayfa yenileme desteği için Set kullanıyoruz)
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    onlineUsers.add(userId);
    console.log(`🔌 Soket Bağlantısı: ${socket.user.username} (ID: ${userId}) çevrimiçi oldu.`);

    // Diğer tüm çevrimiçi kullanıcılara bu kişinin çevrimiçi olduğunu duyur
    io.emit('user_status_change', { userId: userId, isOnline: true });

    // Bağlantı koptuğunda (Sayfa kapatıldığında veya çıkış yapıldığında)
    socket.on('disconnect', () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSockets.delete(userId);
                onlineUsers.delete(userId);
                console.log(`🔌 Soket Bağlantısı Koptu: ${socket.user.username} (ID: ${userId}) tamamen çevrimdışı oldu.`);
                // Diğer tüm kullanıcılara bu kişinin çevrimdışı olduğunu duyur
                io.emit('user_status_change', { userId: userId, isOnline: false });
            } else {
                console.log(`🔌 Soket Bağlantısı Koptu: ${socket.user.username} (ID: ${userId}) bir sekmesi kapatıldı, diğerleri hala açık.`);
            }
        }
    });
});

// --- API YOLLARI ---

// 1. KAYIT OL
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Kullanıcı adı, e-posta ve şifre zorunludur.' });
    }

    try {
        const existingUser = await dbQueries.findUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });

        const existingEmail = await dbQueries.findUserByEmail(email);
        if (existingEmail) return res.status(400).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await dbQueries.createUser(username, email, hashedPassword, verificationToken);
        
        // Doğrulama mailini arka planda gönder (hata verirse kaydı iptal etmeyelim)
        sendVerificationEmail(email, username, verificationToken);
        
        res.status(201).json({ message: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-postanıza gönderilen linke tıklayın.', user: newUser });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ message: 'Kayıt sırasında sunucu hatası oluştu.' });
    }
});

// 1.1 HESAP DOĞRULAMA (E-POSTA LİNKİ)
app.get('/api/auth/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('<h1>Geçersiz İstek</h1><p>Doğrulama anahtarı bulunamadı.</p>');
    }

    try {
        const user = await dbQueries.findUserByVerificationToken(token);
        if (!user) {
            return res.status(400).send('<h1>Doğrulama Başarısız</h1><p>Geçersiz veya süresi dolmuş doğrulama anahtarı.</p>');
        }

        await dbQueries.verifyUser(user.id);
        
        // Kullanıcıyı doğrudan uygulamanın ana sayfasına tebrik mesajıyla yönlendir
        res.send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px; background-color: #f9fafb; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 400px; width: 100%;">
                    <h1 style="color: #10B981; margin-bottom: 20px; font-size: 28px;">Hesabınız Doğrulandı!</h1>
                    <p style="color: #4B5563; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Hızlı Mesajlaşma hesabınız başarıyla aktifleştirildi. Artık giriş yapabilirsiniz.</p>
                    <a href="/" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">Giriş Yapmaya Git</a>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        res.status(500).send('<h1>Sunucu Hatası</h1><p>Hesap doğrulanırken bir hata oluştu.</p>');
    }
});

// 1.2 ŞİFREMİ UNUTTUM (TALEBİ)
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-posta adresi zorunludur.' });

    try {
        const user = await dbQueries.findUserByEmail(email);
        if (!user) {
            // Güvenlik amacıyla e-posta bulunmasa bile başarılıymış gibi genel yanıt dönelim
            return res.json({ message: 'Eğer e-posta adresi sistemimizde kayıtlı ise şifre sıfırlama linki gönderilmiştir.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 saat geçerli

        await dbQueries.setResetPasswordToken(email, resetToken, expires.toISOString());
        
        // Mail gönder
        sendResetPasswordEmail(email, user.username, resetToken);

        res.json({ message: 'Şifre sıfırlama linki e-postanıza başarıyla gönderildi.' });
    } catch (error) {
        console.error('Şifre sıfırlama talebi hatası:', error);
        res.status(500).json({ message: 'Talebiniz işlenirken hata oluştu.' });
    }
});

// 1.3 ŞİFRE SIFIRLAMA (YENİ ŞİFREYİ KAYDETME)
app.post('/api/auth/reset-password', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token ve yeni şifre alanları zorunludur.' });

    try {
        const user = await dbQueries.findUserByResetToken(token);
        if (!user) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş sıfırlama token\'ı.' });

        const expires = new Date(user.reset_password_expires);
        if (expires < new Date()) return res.status(400).json({ message: 'Şifre sıfırlama linkinin süresi dolmuş.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await dbQueries.updatePassword(user.id, hashedPassword);

        res.json({ message: 'Şifreniz başarıyla sıfırlandı! Yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        res.status(500).json({ message: 'Şifre sıfırlanırken sunucu hatası oluştu.' });
    }
});

// 2. GİRİŞ YAP
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });

    try {
        const user = await dbQueries.findUserByUsername(username);
        if (!user) return res.status(400).json({ message: 'Hatalı kullanıcı adı veya şifre.' });

        // E-posta aktivasyonu kontrol et
        if (user.is_verified === 0) {
            return res.status(400).json({ message: 'Lütfen giriş yapmadan önce e-posta adresinize gönderilen linke tıklayarak hesabınızı doğrulayın.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Hatalı kullanıcı adı veya şifre.' });

        const token = jwt.sign(
            { id: user.id, username: user.username, profile_pic: user.profile_pic }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Giriş başarılı!',
            token: token,
            user: { id: user.id, username: user.username, email: user.email, profile_pic: user.profile_pic }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ message: 'Giriş sırasında sunucu hatası oluştu.' });
    }
});

// 2.1 KULLANICI ADI GÜNCELLEME
app.post('/api/profile/update-username', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const oldUsername = req.user.username;
    const { newUsername } = req.body;

    if (!newUsername || newUsername.trim() === '') {
        return res.status(400).json({ message: 'Yeni kullanıcı adı boş olamaz.' });
    }

    const trimmedUsername = newUsername.trim();

    try {
        // Kullanıcı adının benzersizliğini kontrol et
        const existingUser = await dbQueries.findUserByUsername(trimmedUsername);
        if (existingUser && existingUser.id !== userId) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });
        }

        // Güncelle
        await dbQueries.updateUsername(userId, trimmedUsername);

        // Yeni JWT Token üret (Kullanıcı adını güncellemek için)
        const token = jwt.sign(
            { id: userId, username: trimmedUsername, profile_pic: req.user.profile_pic }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Soket üzerinden diğer tüm kullanıcılara duyuru yap (böylece sol menüler ve aktif sohbet başlıkları güncellenir)
        io.emit('username_changed', {
            userId: userId,
            oldUsername: oldUsername,
            newUsername: trimmedUsername
        });

        res.json({
            message: 'Kullanıcı adınız başarıyla güncellendi!',
            token: token,
            user: { id: userId, username: trimmedUsername, email: req.user.email, profile_pic: req.user.profile_pic }
        });
    } catch (error) {
        console.error('Kullanıcı adı güncelleme hatası:', error);
        res.status(500).json({ message: 'Kullanıcı adı güncellenirken sunucu hatası oluştu.' });
    }
});

// 2.2 PROFİL FOTOĞRAFI YÜKLEME
app.post('/api/profile/upload-pic', authenticateToken, upload.single('profile_pic'), async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
        return res.status(400).json({ message: 'Lütfen geçerli bir görsel dosyası seçin.' });
    }

    try {
        let imageUrl = '';

        // Eğer Cloudinary ayarları girilmişse resmi yükle
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const uploadResult = await uploadStream(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        } else {
            // Eğer Cloudinary kurulu değilse simüle et
            console.log('📷 [FOTOĞRAF SİMÜLASYONU] Cloudinary ayarları eksik, yerel test resmi kullanılıyor.');
            imageUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150';
        }

        // Veritabanını güncelle
        await dbQueries.updateProfilePic(userId, imageUrl);

        // Yeni bilgileri içeren taze bir JWT token üret (Token içindeki profile_pic güncellensin)
        const token = jwt.sign(
            { id: userId, username: req.user.username, profile_pic: imageUrl }, 
            JWT_SECRET, 
            { expiresIn: '7d' }
        );

        // Tüm aktif kullanıcılara profil resminin değiştiğini duyur (soket ile anlık güncellensin)
        io.emit('profile_pic_changed', {
            userId: userId,
            profilePic: imageUrl
        });

        res.json({
            message: 'Profil fotoğrafınız başarıyla güncellendi!',
            token: token,
            profile_pic: imageUrl
        });
    } catch (error) {
        console.error('Profil resmi yükleme hatası:', error);
        res.status(500).json({ message: 'Profil resmi yüklenirken hata oluştu.' });
    }
});

// 3. SADECE ONAYLI ARKADAŞLARI LİSTELEME
app.get('/api/users', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const friends = await dbQueries.getFriends(userId);
        const friendsWithStatus = friends.map(friend => ({
            id: friend.id,
            username: friend.username,
            profile_pic: friend.profile_pic,
            isOnline: onlineUsers.has(friend.id) // Kümede bu ID varsa çevrimiçi
        }));
        res.json(friendsWithStatus);
    } catch (error) {
        console.error('Arkadaş listesi getirme hatası:', error);
        res.status(500).json({ message: 'Arkadaşlar listelenirken hata oluştu.' });
    }
});

// 3.1 KULLANICI ARAMA VE ARKADAŞLIK DURUMUNU SORGULAMA
app.get('/api/friends/search', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const { username } = req.query;

    if (!username) return res.status(400).json({ message: 'Kullanıcı adı girilmelidir.' });

    try {
        const targetUser = await dbQueries.findUserByUsername(username);
        if (!targetUser) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        if (targetUser.id === currentUserId) return res.status(400).json({ message: 'Kendinizi arkadaş olarak ekleyemezsiniz.' });

        // Engellenme durumlarını kontrol et
        const isBlockedByTarget = await dbQueries.isUserBlockedBy(currentUserId, targetUser.id);
        if (isBlockedByTarget) {
            // Karşı taraf beni engellediyse gizlilik için "Kullanıcı bulunamadı" dönüyoruz
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }

        const isBlockedByMe = await dbQueries.isUserBlockedBy(targetUser.id, currentUserId);
        if (isBlockedByMe) {
            return res.json({
                id: targetUser.id,
                username: targetUser.username,
                profile_pic: targetUser.profile_pic,
                friendshipStatus: 'blocked' // Benim tarafımdan engellenmiş
            });
        }

        // Arkadaşlık durumunu kontrol et
        const friendship = await dbQueries.checkFriendshipStatus(currentUserId, targetUser.id);
        
        let status = 'none'; // hiçbir ilişki yok
        if (friendship) {
            if (friendship.status === 'accepted') {
                status = 'friends';
            } else if (friendship.status === 'pending') {
                if (friendship.user_id === currentUserId) {
                    status = 'pending_sent'; // isteği ben yolladım
                } else {
                    status = 'pending_received'; // isteği o yolladı, benden onay bekliyor
                }
            }
        }

        res.json({
            id: targetUser.id,
            username: targetUser.username,
            profile_pic: targetUser.profile_pic,
            friendshipStatus: status
        });
    } catch (error) {
        console.error('Kullanıcı arama hatası:', error);
        res.status(500).json({ message: 'Arama sırasında hata oluştu.' });
    }
});

// 3.2 ARKADAŞLIK İSTEĞİ GÖNDERME
app.post('/api/friends/request', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const friendId = parseInt(req.body.friendId);

    if (!friendId) return res.status(400).json({ message: 'Arkadaş ID zorunludur.' });

    try {
        const targetUser = await dbQueries.findUserById(friendId);
        if (!targetUser) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        const isBlocked = await dbQueries.isBlocked(currentUserId, friendId);
        if (isBlocked) {
            return res.status(400).json({ message: 'Bu kullanıcıyla bağlantı kurulamaz.' });
        }

        const friendship = await dbQueries.checkFriendshipStatus(currentUserId, friendId);
        if (friendship) {
            if (friendship.status === 'accepted') {
                return res.status(400).json({ message: 'Zaten arkadaşsınız.' });
            } else {
                return res.status(400).json({ message: 'Zaten bekleyen bir arkadaşlık isteği mevcut.' });
            }
        }

        await dbQueries.sendFriendRequest(currentUserId, friendId);

        // Alıcının tüm aktif sekmelerine anlık soket bildirimi at
        const receiverSockets = userSockets.get(friendId);
        if (receiverSockets && receiverSockets.size > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('friend_request_received', {
                    senderId: currentUserId,
                    senderUsername: req.user.username
                });
            });
        }

        res.json({ message: 'Arkadaşlık isteği başarıyla gönderildi!' });
    } catch (error) {
        console.error('İstek gönderme hatası:', error);
        res.status(500).json({ message: 'Arkadaşlık isteği gönderilirken hata oluştu.' });
    }
});

// 3.3 BEKLEYEN İSTEKLERİ LİSTELEME
app.get('/api/friends/requests', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const requests = await dbQueries.getPendingRequests(userId);
        res.json(requests);
    } catch (error) {
        console.error('İstek listesi getirme hatası:', error);
        res.status(500).json({ message: 'Bekleyen istekler listelenirken hata oluştu.' });
    }
});

// 3.4 ARKADAŞLIK İSTEĞİNİ KABUL ETME
app.post('/api/friends/accept', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const friendId = parseInt(req.body.friendId);

    if (!friendId) return res.status(400).json({ message: 'Arkadaş ID zorunludur.' });

    try {
        const friendship = await dbQueries.checkFriendshipStatus(currentUserId, friendId);
        if (!friendship || friendship.status !== 'pending') {
            return res.status(400).json({ message: 'Kabul edilecek bekleyen bir istek bulunamadı.' });
        }

        await dbQueries.acceptFriendRequest(currentUserId, friendId);

        // Her iki tarafın tüm açık sekmelerine anlık arkadaş olunduğuna dair haber ver (sidebar yenilensin)
        const sockets1 = userSockets.get(currentUserId);
        const sockets2 = userSockets.get(friendId);

        if (sockets1 && sockets1.size > 0) {
            sockets1.forEach(socketId => {
                io.to(socketId).emit('friend_request_accepted', { friendId });
            });
        }
        if (sockets2 && sockets2.size > 0) {
            sockets2.forEach(socketId => {
                io.to(socketId).emit('friend_request_accepted', { friendId: currentUserId });
            });
        }

        res.json({ message: 'Arkadaşlık isteği kabul edildi!' });
    } catch (error) {
        console.error('İstek onaylama hatası:', error);
        res.status(500).json({ message: 'İstek onaylanırken hata oluştu.' });
    }
});

// 3.5 ARKADAŞLIKTAN ÇIKAR
app.post('/api/friends/remove', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const friendId = parseInt(req.body.friendId);

    if (!friendId) return res.status(400).json({ message: 'Arkadaş ID zorunludur.' });

    try {
        await dbQueries.removeFriendship(currentUserId, friendId);

        // Her iki tarafın açık sekmelerine arkadaşlıktan çıkarıldığı haberini uçur (listeler yenilensin)
        const sockets1 = userSockets.get(currentUserId);
        const sockets2 = userSockets.get(friendId);

        if (sockets1 && sockets1.size > 0) {
            sockets1.forEach(socketId => {
                io.to(socketId).emit('friendship_removed', { friendId });
            });
        }
        if (sockets2 && sockets2.size > 0) {
            sockets2.forEach(socketId => {
                io.to(socketId).emit('friendship_removed', { friendId: currentUserId });
            });
        }

        res.json({ message: 'Arkadaşlıktan başarıyla çıkarıldı.' });
    } catch (error) {
        console.error('Arkadaşlıktan çıkarma hatası:', error);
        res.status(500).json({ message: 'Arkadaşlıktan çıkarılırken hata oluştu.' });
    }
});

// 3.6 KULLANICIYI ENGELLE
app.post('/api/friends/block', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const blockedId = parseInt(req.body.blockedId);

    if (!blockedId) return res.status(400).json({ message: 'Engellenecek kullanıcı ID zorunludur.' });
    if (blockedId === currentUserId) return res.status(400).json({ message: 'Kendinizi engelleyemezsiniz.' });

    try {
        await dbQueries.blockUser(currentUserId, blockedId);

        // Arkadaş listelerinden birbirlerini sildirmek için socket duyurusu yap
        const sockets1 = userSockets.get(currentUserId);
        const sockets2 = userSockets.get(blockedId);

        if (sockets1 && sockets1.size > 0) {
            sockets1.forEach(socketId => {
                io.to(socketId).emit('friendship_removed', { friendId: blockedId });
            });
        }
        if (sockets2 && sockets2.size > 0) {
            sockets2.forEach(socketId => {
                io.to(socketId).emit('friendship_removed', { friendId: currentUserId });
            });
        }

        res.json({ message: 'Kullanıcı başarıyla engellendi.' });
    } catch (error) {
        console.error('Engelleme hatası:', error);
        res.status(500).json({ message: 'Kullanıcı engellenirken hata oluştu.' });
    }
});

// 3.7 ENGELİ KALDIR
app.post('/api/friends/unblock', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const blockedId = parseInt(req.body.blockedId);

    if (!blockedId) return res.status(400).json({ message: 'Engeli kaldırılacak kullanıcı ID zorunludur.' });

    try {
        await dbQueries.unblockUser(currentUserId, blockedId);
        res.json({ message: 'Engel başarıyla kaldırıldı.' });
    } catch (error) {
        console.error('Engeli kaldırma hatası:', error);
        res.status(500).json({ message: 'Engel kaldırılırken hata oluştu.' });
    }
});

// 3.8 ENGELLENEN KULLANICILARI LİSTELE
app.get('/api/friends/blocked', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const blockedUsers = await dbQueries.getBlockedUsers(userId);
        res.json(blockedUsers);
    } catch (error) {
        console.error('Engelli listesi getirme hatası:', error);
        res.status(500).json({ message: 'Engelli listesi getirilirken hata oluştu.' });
    }
});

// 4. İKİ KULLANICI ARASINDAKİ MESAJ GEÇMİŞİ
app.get('/api/messages/:receiverId', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = parseInt(req.params.receiverId);

    try {
        const messages = await dbQueries.getMessageHistory(senderId, receiverId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Mesaj geçmişi getirilirken hata oluştu.' });
    }
});

// 5. YENİ MESAJ GÖNDERME VE ANLIK İLETME
app.post('/api/messages', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = parseInt(req.body.receiverId);
    const { message } = req.body;

    if (!receiverId || !message) return res.status(400).json({ message: 'Alıcı ve mesaj içeriği zorunludur.' });

    try {
        // Engelleme durumunu kontrol et
        const isBlocked = await dbQueries.isBlocked(senderId, receiverId);
        if (isBlocked) {
            return res.status(403).json({ message: 'Bu kullanıcıyla aranızda engelleme bulunduğu için mesaj gönderilemez.' });
        }

        // Mesajı veritabanına kaydet
        const savedMessage = await dbQueries.saveMessage(senderId, receiverId, message);
        
        // --- GERÇEK ZAMANLI SOKET İLETİMİ ---
        // Alıcı çevrimiçi ise onun tüm aktif sekmelerine mesajı anında fırlat
        const receiverSockets = userSockets.get(receiverId);
        if (receiverSockets && receiverSockets.size > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('receive_message', savedMessage);
            });
        }

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        res.status(500).json({ message: 'Mesaj kaydedilirken hata oluştu.' });
    }
});

// Sunucuyu başlat
async function startServer() {
    try {
        await initDatabase();
        server.listen(PORT, () => {
            console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor!`);
        });
    } catch (error) {
        console.error('Sunucu başlatılamadı:', error);
    }
}

startServer();
