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
    
    // Kullanıcıyı çevrimiçi listelerine ekle
    userSockets.set(userId, socket.id);
    onlineUsers.add(userId);
    console.log(`🔌 Soket Bağlantısı: ${socket.user.username} (ID: ${userId}) çevrimiçi oldu.`);

    // Diğer tüm çevrimiçi kullanıcılara bu kişinin çevrimiçi olduğunu duyur
    io.emit('user_status_change', { userId: userId, isOnline: true });

    // Bağlantı koptuğunda (Sayfa kapatıldığında veya çıkış yapıldığında)
    socket.on('disconnect', () => {
        userSockets.delete(userId);
        onlineUsers.delete(userId);
        console.log(`🔌 Soket Bağlantısı Koptu: ${socket.user.username} (ID: ${userId}) çevrimdışı oldu.`);

        // Diğer tüm kullanıcılara bu kişinin çevrimdışı olduğunu duyur
        io.emit('user_status_change', { userId: userId, isOnline: false });
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

// 3. TÜM KULLANICILARI LİSTELEME
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await dbQueries.getAllUsers();
        const usersWithStatus = users.map(user => ({
            id: user.id,
            username: user.username,
            isOnline: onlineUsers.has(user.id) // Kümede bu ID varsa true döner
        }));
        res.json(usersWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar getirilirken hata oluştu.' });
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
    const { receiverId, message } = req.body;

    if (!receiverId || !message) return res.status(400).json({ message: 'Alıcı ve mesaj içeriği zorunludur.' });

    try {
        // Mesajı veritabanına kaydet
        const savedMessage = await dbQueries.saveMessage(senderId, parseInt(receiverId), message);
        
        // --- GERÇEK ZAMANLI SOKET İLETİMİ ---
        // Alıcı çevrimiçi ise onun soketine mesajı anında fırlat
        const receiverSocketId = userSockets.get(parseInt(receiverId));
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('receive_message', savedMessage);
        }

        res.status(201).json(savedMessage);
    } catch (error) {
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
