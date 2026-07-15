const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');
const path = require('path');
const { Server } = require('socket.io'); // Socket.IO kütüphanesini dahil ettik
const { initDatabase, dbQueries } = require('./database');
const webpush = require('web-push');

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
// Servis işçisi dosyası için özel önbellek önleme (no-cache) rotası
app.get('/service-worker.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'client', 'service-worker.js'));
});

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

    // Diğer tüm çevrimiçi kullanıcılara bu kişinin çevrimiçi olduğunu (gizlemediyse) duyur
    dbQueries.getUserById(userId).then(dbUser => {
        const showOnline = dbUser ? dbUser.show_online !== 0 : true;
        if (showOnline) {
            io.emit('user_status_change', { userId: userId, isOnline: true });
        }
    }).catch(err => {
        console.error('Soket çevrimiçi durumu kontrol hatası:', err);
        io.emit('user_status_change', { userId: userId, isOnline: true });
    });

    // Kullanıcının dahil olduğu gruplara soket oda kaydı yap
    dbQueries.getUserGroups(userId).then(groups => {
        groups.forEach(group => {
            socket.join(`group_${group.id}`);
        });
    }).catch(err => {
        console.error('Soket grup odalarına eklenirken hata oluştu:', err);
    });

    // Yazıyor... durumunu ilet
    socket.on('typing', ({ receiverId }) => {
        const receiverSockets = userSockets.get(Number(receiverId));
        if (receiverSockets && receiverSockets.size > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('typing_status', { senderId: userId, isTyping: true });
            });
        }
    });

    socket.on('stop_typing', ({ receiverId }) => {
        const receiverSockets = userSockets.get(Number(receiverId));
        if (receiverSockets && receiverSockets.size > 0) {
            receiverSockets.forEach(socketId => {
                io.to(socketId).emit('typing_status', { senderId: userId, isTyping: false });
            });
        }
    });

    // --- WEBRTC SESLİ VE GÖRÜNTÜLÜ ARAMA SİNYALLEŞMESİ ---
    socket.on('call_user', ({ targetUserId, signalData, isVideoCall }) => {
        const targetSockets = userSockets.get(Number(targetUserId));
        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('call_incoming', {
                    fromUserId: userId,
                    fromUsername: socket.user.username,
                    signalData: signalData,
                    isVideoCall: isVideoCall
                });
            });
        }
    });

    socket.on('accept_call', ({ targetUserId, signalData }) => {
        const targetSockets = userSockets.get(Number(targetUserId));
        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('call_accepted', {
                    signalData: signalData
                });
            });
        }
    });

    socket.on('reject_call', ({ targetUserId }) => {
        const targetSockets = userSockets.get(Number(targetUserId));
        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('call_rejected', {
                    fromUserId: userId
                });
            });
        }
    });

    socket.on('end_call', ({ targetUserId }) => {
        const targetSockets = userSockets.get(Number(targetUserId));
        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('call_ended');
            });
        }
    });

    socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
        const targetSockets = userSockets.get(Number(targetUserId));
        if (targetSockets && targetSockets.size > 0) {
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('webrtc_ice_candidate', {
                    candidate: candidate
                });
            });
        }
    });

    // --- MESAJ EMOJİ TEPKİLERİ (REACTIONS) OLAYI ---
    socket.on('message_reaction', async ({ messageId, emoji, targetUserId, groupId }) => {
        try {
            const db = getDbInstance();
            let msgRow;
            if (isPostgres) {
                const res = await db.query('SELECT * FROM messages WHERE id = $1', [messageId]);
                msgRow = res.rows[0];
            } else {
                msgRow = await db.get('SELECT * FROM messages WHERE id = ?', [messageId]);
            }
            if (!msgRow) return;

            let reactions = {};
            try {
                reactions = typeof msgRow.reactions === 'string' ? JSON.parse(msgRow.reactions) : (msgRow.reactions || {});
            } catch (e) {
                reactions = {};
            }
            if (typeof reactions !== 'object' || reactions === null) {
                reactions = {};
            }

            const username = socket.user.username;
            let userHadThisReaction = false;
            Object.keys(reactions).forEach(emo => {
                if (reactions[emo] && Array.isArray(reactions[emo])) {
                    const idx = reactions[emo].indexOf(username);
                    if (idx > -1) {
                        reactions[emo].splice(idx, 1);
                        if (emo === emoji) {
                            userHadThisReaction = true;
                        }
                    }
                    if (reactions[emo].length === 0) {
                        delete reactions[emo];
                    }
                }
            });

            if (!userHadThisReaction) {
                if (!reactions[emoji]) reactions[emoji] = [];
                reactions[emoji].push(username);
            }

            const reactionsStr = JSON.stringify(reactions);
            if (isPostgres) {
                await db.query('UPDATE messages SET reactions = $1 WHERE id = $2', [reactionsStr, messageId]);
            } else {
                await db.run('UPDATE messages SET reactions = ? WHERE id = ?', [reactionsStr, messageId]);
            }

            const broadcastPayload = { messageId, reactions };
            if (groupId) {
                io.to(`group_${groupId}`).emit('message_reaction_updated', broadcastPayload);
            } else if (targetUserId) {
                const targetSockets = userSockets.get(Number(targetUserId));
                if (targetSockets) {
                    targetSockets.forEach(sid => io.to(sid).emit('message_reaction_updated', broadcastPayload));
                }
                const senderSockets = userSockets.get(Number(userId));
                if (senderSockets) {
                    senderSockets.forEach(sid => io.to(sid).emit('message_reaction_updated', broadcastPayload));
                }
            }
        } catch (err) {
            console.error('Reaksiyon güncelleme hatası:', err);
        }
    });

    // Bağlantı koptuğunda (Sayfa kapatıldığında veya çıkış yapıldığında)
    socket.on('disconnect', () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
                userSockets.delete(userId);
                onlineUsers.delete(userId);
                console.log(`🔌 Soket Bağlantısı Koptu: ${socket.user.username} (ID: ${userId}) tamamen çevrimdışı oldu.`);
                
                const lastSeenTime = new Date().toISOString();
                dbQueries.getUserById(userId).then(dbUser => {
                    const showLastSeen = dbUser ? dbUser.show_last_seen !== 0 : true;
                    return dbQueries.updateLastSeen(userId, lastSeenTime).then(() => {
                        io.emit('user_status_change', { 
                            userId: userId, 
                            isOnline: false, 
                            last_seen: showLastSeen ? lastSeenTime : null 
                        });
                    });
                }).catch(err => {
                    console.error('Son görülme güncellenirken hata:', err);
                    io.emit('user_status_change', { userId: userId, isOnline: false, last_seen: null });
                });
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
            user: { 
                id: user.id, 
                username: user.username, 
                email: user.email, 
                profile_pic: user.profile_pic,
                bio: user.bio || '',
                show_last_seen: user.show_last_seen,
                show_online: user.show_online
            }
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

        const dbUser = await dbQueries.getUserById(userId);
        res.json({
            message: 'Kullanıcı adınız başarıyla güncellendi!',
            token: token,
            user: dbUser
        });
    } catch (error) {
        console.error('Kullanıcı adı güncelleme hatası:', error);
        res.status(500).json({ message: 'Kullanıcı adı güncellenirken sunucu hatası oluştu.' });
    }
});

// 2.1.2 BİYOGRAFİ GÜNCELLEME
app.post('/api/profile/update-bio', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { bio } = req.body;

    const trimmedBio = bio !== undefined ? bio.trim().substring(0, 255) : '';

    try {
        await dbQueries.updateBio(userId, trimmedBio);

        // Soket üzerinden diğer kullanıcılara duyur
        io.emit('user_bio_changed', {
            userId: userId,
            bio: trimmedBio
        });

        res.json({
            message: 'Biyografiniz başarıyla güncellendi!',
            bio: trimmedBio
        });
    } catch (error) {
        console.error('Biyografi güncelleme hatası:', error);
        res.status(500).json({ message: 'Biyografi güncellenirken sunucu hatası oluştu.' });
    }
});

// 2.1.3 GİZLİLİK AYARLARINI GÜNCELLE
app.post('/api/profile/update-privacy', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { showLastSeen, showOnline } = req.body;

    try {
        if (showLastSeen !== undefined) {
            const valLastSeen = showLastSeen ? 1 : 0;
            await dbQueries.updateShowLastSeen(userId, valLastSeen);
        }
        if (showOnline !== undefined) {
            const valOnline = showOnline ? 1 : 0;
            await dbQueries.updateShowOnline(userId, valOnline);
            
            // Eğer çevrimiçi olma durumunu kapattıysa, hemen diğer kullanıcılara çevrimdışı yapalım
            if (!valOnline) {
                io.emit('user_status_change', { userId: userId, isOnline: false, last_seen: null });
            } else {
                // Eğer açtıysa ve çevrimiçiyse çevrimiçi duyurusu yapalım
                if (onlineUsers.has(userId)) {
                    io.emit('user_status_change', { userId: userId, isOnline: true });
                }
            }
        }

        const dbUser = await dbQueries.getUserById(userId);
        res.json({
            message: 'Gizlilik ayarlarınız başarıyla güncellendi!',
            user: dbUser
        });
    } catch (error) {
        console.error('Gizlilik ayarları güncelleme hatası:', error);
        res.status(500).json({ message: 'Gizlilik ayarları güncellenirken sunucu hatası oluştu.' });
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

// 2.3 SOHBET İÇİ DOSYA/RESİM YÜKLEME
app.post('/api/messages/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Lütfen yüklenecek bir dosya seçin.' });
    }

    try {
        let fileUrl = '';
        const isImage = req.file.mimetype.startsWith('image/');

        // Eğer Cloudinary ayarları girilmişse resmi veya dosyayı yükle
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'chat_files', resource_type: 'auto' },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(req.file.buffer);
            });
            fileUrl = uploadResult.secure_url;
        } else {
            // Eğer Cloudinary kurulu değilse simüle et
            console.log('📷 [SOHBET DOSYA SİMÜLASYONU] Cloudinary ayarları eksik, test linki üretiliyor.');
            if (isImage) {
                fileUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
            } else {
                fileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
            }
        }

        res.json({
            fileUrl: fileUrl,
            messageType: isImage ? 'image' : 'file',
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        res.status(500).json({ message: 'Dosya yüklenirken hata oluştu.' });
    }
});

// 3. SADECE ONAYLI ARKADAŞLARI LİSTELEME
app.get('/api/users', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const friends = await dbQueries.getFriends(userId);
        const friendsWithStatus = friends.map(friend => {
            const isOnlineActual = onlineUsers.has(friend.id);
            const showOnline = friend.show_online !== 0;
            return {
                id: friend.id,
                username: friend.username,
                profile_pic: friend.profile_pic,
                bio: friend.bio || '',
                last_seen: friend.show_last_seen !== 0 ? (friend.last_seen || null) : null,
                unread_count: parseInt(friend.unread_count || 0),
                last_message: friend.last_message || null,
                last_message_time: friend.last_message_time || null,
                isOnline: isOnlineActual && showOnline,
                show_last_seen: friend.show_last_seen,
                show_online: friend.show_online
            };
        });
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

// 3.9 KULLANICININ GRUPLARINI LİSTELE
app.get('/api/groups', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const groups = await dbQueries.getUserGroups(userId);
        res.json(groups);
    } catch (error) {
        console.error('Grupları çekme hatası:', error);
        res.status(500).json({ message: 'Gruplar listelenirken hata oluştu.' });
    }
});

// 3.10 YENİ GRUP OLUŞTUR
app.post('/api/groups/create', authenticateToken, async (req, res) => {
    const creatorId = req.user.id;
    const { name, memberIds, isChannel } = req.body;
    const isChannelVal = isChannel ? 1 : 0;

    if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Grup ismi zorunludur.' });
    }

    try {
        // Grubu veritabanında oluştur
        const group = await dbQueries.createGroup(name.trim(), creatorId, isChannelVal);
        const groupId = group.id;

        // Oluşturucuyu otomatik üye olarak ekle (is_admin = 1)
        await dbQueries.addGroupMember(groupId, creatorId, 1);

        // Seçilen diğer arkadaşları gruba üye olarak ekle (is_admin = 0)
        if (memberIds && Array.isArray(memberIds)) {
            for (const memberId of memberIds) {
                await dbQueries.addGroupMember(groupId, parseInt(memberId), 0);
            }
        }

        // Tüm grup üyelerinin aktif soket bağlantılarını bul ve gruba oda kanalı (room) aç
        const allMembers = [creatorId, ...(memberIds || []).map(Number)];
        allMembers.forEach(mId => {
            const sockets = userSockets.get(mId);
            if (sockets) {
                sockets.forEach(sId => {
                    const socketInstance = io.sockets.sockets.get(sId);
                    if (socketInstance) {
                        socketInstance.join(`group_${groupId}`);
                    }
                });
            }
        });

        // Gruba katılan üyelere anlık soket bildirimiyle grubun kurulduğunu haber ver
        allMembers.forEach(mId => {
            const sockets = userSockets.get(mId);
            if (sockets) {
                sockets.forEach(sId => {
                    io.to(sId).emit('group_created', group);
                });
            }
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Grup oluşturma hatası:', error);
        res.status(500).json({ message: 'Grup oluşturulurken hata oluştu.' });
    }
});

// 3.11 GRUBUN MESAJ GEÇMİŞİNİ GETİR
app.get('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user.id;

    try {
        // Güvenlik kontrolü: Kullanıcı grubun üyesi mi?
        const members = await dbQueries.getGroupMembers(groupId);
        const isMember = members.some(m => m.id === userId);
        if (!isMember) {
            return res.status(403).json({ message: 'Bu grubun üyesi değilsiniz.' });
        }

        const messages = await dbQueries.getGroupMessageHistory(groupId);
        res.json(messages);
    } catch (error) {
        console.error('Grup mesaj geçmişi çekme hatası:', error);
        res.status(500).json({ message: 'Grup mesajları listelenirken hata oluştu.' });
    }
});

// 3.12 GRUP ÜYELERİNİ GETİR
app.get('/api/groups/:groupId/members', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    try {
        const members = await dbQueries.getGroupMembers(groupId);
        res.json(members);
    } catch (error) {
        console.error('Grup üyeleri getirme hatası:', error);
        res.status(500).json({ message: 'Grup üyeleri listelenirken hata oluştu.' });
    }
});

// 3.13 GRUP AYARLARINI GÜNCELLE (AD DEĞİŞTİRME & YÖNETİCİLİK EKLEME)
app.post('/api/groups/:groupId/update', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;
    const { name, profilePic, createdBy } = req.body;

    try {
        const group = await dbQueries.getGroupById(groupId);
        if (!group) return res.status(404).json({ message: 'Grup bulunamadı.' });

        // Yöneticilik yetkisi kontrolü (group_members tablosundan is_admin değerine göre)
        const members = await dbQueries.getGroupMembers(groupId);
        const currentUserMember = members.find(m => m.id === currentUserId);
        const isUserAdmin = (currentUserMember && currentUserMember.is_admin === 1) || group.created_by === currentUserId;

        if (!isUserAdmin) {
            return res.status(403).json({ message: 'Grup ayarlarını sadece yönetici güncelleyebilir.' });
        }

        // Eğer yeni bir yönetici atanmak isteniyorsa
        if (createdBy) {
            await dbQueries.addGroupMember(groupId, parseInt(createdBy), 1);
        }

        const finalName = name ? name.trim() : group.name;
        const finalProfilePic = profilePic !== undefined ? profilePic : group.profile_pic;

        await dbQueries.updateGroup(groupId, finalName, finalProfilePic, group.created_by);

        const updatedGroup = {
            id: groupId,
            name: finalName,
            profile_pic: finalProfilePic,
            created_by: group.created_by
        };

        // Soketle tüm gruba duyur
        io.to(`group_${groupId}`).emit('group_updated', updatedGroup);

        res.json({ message: 'Grup başarıyla güncellendi.', group: updatedGroup });
    } catch (error) {
        console.error('Grup güncelleme hatası:', error);
        res.status(500).json({ message: 'Grup güncellenirken hata oluştu.' });
    }
});

// 3.14 GRUPTAN ÜYE ÇIKAR VEYA AYRIL
app.post('/api/groups/:groupId/remove-member', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.body.userId);

    try {
        const group = await dbQueries.getGroupById(groupId);
        if (!group) return res.status(404).json({ message: 'Grup bulunamadı.' });

        // Yalnızca grup yöneticisi birini çıkarabilir, ancak üye kendisi gruptan ayrılabilir
        const members = await dbQueries.getGroupMembers(groupId);
        const currentUserMember = members.find(m => m.id === currentUserId);
        const isUserAdmin = (currentUserMember && currentUserMember.is_admin === 1) || group.created_by === currentUserId;

        if (!isUserAdmin && targetUserId !== currentUserId) {
            return res.status(403).json({ message: 'Yalnızca grup yöneticisi üye çıkartabilir.' });
        }

        // Grup kurucusu gruptan çıkarılamaz (kendi isteğiyle ayrılmak hariç)
        if (targetUserId !== currentUserId && targetUserId === group.created_by) {
            return res.status(403).json({ message: 'Grup kurucusu gruptan çıkarılamaz.' });
        }

        // Yöneticileri gruptan sadece grup kurucusu çıkartabilir (kendileri hariç)
        const targetMember = members.find(m => m.id === targetUserId);
        const isTargetAdmin = targetMember && targetMember.is_admin === 1;
        const isCallerFounder = group.created_by === currentUserId;

        if (targetUserId !== currentUserId && isTargetAdmin && !isCallerFounder) {
            return res.status(403).json({ message: 'Diğer yöneticileri gruptan sadece grup kurucusu çıkartabilir.' });
        }

        // Eğer kurucu yönetici (group.created_by) kendisi ayrılmaya çalışıyorsa ve grupta başkaları varsa, önce kurucu devretmeli veya gruptan çıkmamalı (eğer başka yönetici yoksa devretmeli)
        if (targetUserId === currentUserId && group.created_by === currentUserId) {
            if (members.length > 1) {
                // Başka bir yönetici olup olmadığını kontrol et
                const otherAdmins = members.filter(m => m.id !== currentUserId && m.is_admin === 1);
                if (otherAdmins.length === 0) {
                    return res.status(400).json({ message: 'Gruptan ayrılmadan önce en az bir üyeyi yönetici yapmalısınız.' });
                }
            }
        }

        await dbQueries.removeGroupMember(groupId, targetUserId);

        // Soket üzerinden üye çıkışını duyur
        io.to(`group_${groupId}`).emit('member_removed', { groupId, userId: targetUserId });

        // Çıkarılan üyenin soketlerini odadan çıkar ve uyar
        const targetSockets = userSockets.get(targetUserId);
        if (targetSockets) {
            targetSockets.forEach(sId => {
                const s = io.sockets.sockets.get(sId);
                if (s) {
                    s.leave(`group_${groupId}`);
                    s.emit('left_group', { groupId });
                }
            });
        }

        res.json({ message: targetUserId === currentUserId ? 'Gruptan başarıyla ayrıldınız.' : 'Üye gruptan çıkartıldı.' });
    } catch (error) {
        console.error('Üye çıkarma hatası:', error);
        res.status(500).json({ message: 'Üye gruptan çıkarılırken hata oluştu.' });
    }
});

// 3.14.1 GRUBA YENİ ÜYE EKLE
app.post('/api/groups/:groupId/add-member', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.body.userId);

    if (!targetUserId) return res.status(400).json({ message: 'Eklenecek kullanıcı ID zorunludur.' });

    try {
        const group = await dbQueries.getGroupById(groupId);
        if (!group) return res.status(404).json({ message: 'Grup bulunamadı.' });

        // Yöneticilik yetkisi kontrolü
        const members = await dbQueries.getGroupMembers(groupId);
        const currentUserMember = members.find(m => m.id === currentUserId);
        const isUserAdmin = (currentUserMember && currentUserMember.is_admin === 1) || group.created_by === currentUserId;

        if (!isUserAdmin) {
            return res.status(403).json({ message: 'Gruba sadece yöneticiler üye ekleyebilir.' });
        }

        // Zaten üye mi?
        const isAlreadyMember = members.some(m => m.id === targetUserId);
        if (isAlreadyMember) {
            return res.status(400).json({ message: 'Kullanıcı zaten grubun üyesi.' });
        }

        await dbQueries.addGroupMember(groupId, targetUserId, 0);

        // Eklenen üyenin socket bağlantılarını bulup odaya join et
        const targetSockets = userSockets.get(targetUserId);
        if (targetSockets) {
            targetSockets.forEach(sId => {
                const socketInstance = io.sockets.sockets.get(sId);
                if (socketInstance) {
                    socketInstance.join(`group_${groupId}`);
                }
            });
        }

        // Soket üzerinden ekleme bilgisini gruba duyur
        io.to(`group_${groupId}`).emit('member_added', { groupId, userId: targetUserId });

        res.json({ message: 'Üye başarıyla gruba eklendi.' });
    } catch (error) {
        console.error('Üye ekleme hatası:', error);
        res.status(500).json({ message: 'Üye gruba eklenirken hata oluştu.' });
    }
});

// 3.14.2 YÖNETİCİLİKTEN AL (DEMOTE)
app.post('/api/groups/:groupId/demote-member', authenticateToken, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;
    const targetUserId = parseInt(req.body.userId);

    if (!targetUserId) return res.status(400).json({ message: 'Kullanıcı ID zorunludur.' });

    try {
        const group = await dbQueries.getGroupById(groupId);
        if (!group) return res.status(404).json({ message: 'Grup bulunamadı.' });

        // Sadece kurucu bir yöneticiyi görevden alabilir
        if (group.created_by !== currentUserId) {
            return res.status(403).json({ message: 'Sadece grup kurucusu yöneticilik yetkisini alabilir.' });
        }

        if (targetUserId === group.created_by) {
            return res.status(400).json({ message: 'Grup kurucusunun yöneticilik yetkisi geri alınamaz.' });
        }

        // Tabloda is_admin = 0 olarak güncelle
        await dbQueries.addGroupMember(groupId, targetUserId, 0);

        io.to(`group_${groupId}`).emit('member_demoted', { groupId, userId: targetUserId });

        res.json({ message: 'Kullanıcının yöneticilik yetkisi başarıyla geri alındı.' });
    } catch (error) {
        console.error('Yöneticilik alma hatası:', error);
        res.status(500).json({ message: 'Yöneticilik yetkisi geri alınırken hata oluştu.' });
    }
});

// 3.15 GRUP PROFİL FOTOĞRAFI YÜKLEME
app.post('/api/groups/:groupId/upload-pic', authenticateToken, upload.single('group_pic'), async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user.id;

    if (!req.file) return res.status(400).json({ message: 'Lütfen geçerli bir görsel seçin.' });

    try {
        const group = await dbQueries.getGroupById(groupId);
        if (!group) return res.status(404).json({ message: 'Grup bulunamadı.' });
        // Yöneticilik yetkisi kontrolü
        const members = await dbQueries.getGroupMembers(groupId);
        const currentUserMember = members.find(m => m.id === currentUserId);
        const isUserAdmin = (currentUserMember && currentUserMember.is_admin === 1) || group.created_by === currentUserId;

        if (!isUserAdmin) {
            return res.status(403).json({ message: 'Grup fotoğrafını yalnızca yönetici güncelleyebilir.' });
        }

        let imageUrl = '';
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const uploadResult = await uploadStream(req.file.buffer);
            imageUrl = uploadResult.secure_url;
        } else {
            console.log('📷 [GRUP FOTOĞRAF SİMÜLASYONU] Cloudinary ayarları eksik.');
            imageUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=150&h=150';
        }

        await dbQueries.updateGroup(groupId, group.name, imageUrl, group.created_by);

        // Soketle tüm gruba duyur
        io.to(`group_${groupId}`).emit('group_updated', {
            id: groupId,
            name: group.name,
            profile_pic: imageUrl,
            created_by: group.created_by
        });

        res.json({ message: 'Grup fotoğrafı başarıyla güncellendi.', profile_pic: imageUrl });
    } catch (error) {
        console.error('Grup fotoğrafı yükleme hatası:', error);
        res.status(500).json({ message: 'Grup fotoğrafı güncellenirken hata oluştu.' });
    }
});

// 4. İKİ KULLANICI ARASINDAKİ MESAJ GEÇMİŞİ
app.get('/api/messages/:receiverId', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = parseInt(req.params.receiverId);

    try {
        // Mesaj geçmişini getirmeden önce karşı taraftan gelen okunmamış mesajları okundu olarak işaretle
        await dbQueries.markMessagesAsRead(receiverId, senderId);
        
        // Göndericiye mesajlarının okunduğunu soketle bildir
        const senderSockets = userSockets.get(receiverId);
        if (senderSockets && senderSockets.size > 0) {
            senderSockets.forEach(socketId => {
                io.to(socketId).emit('messages_read', { readerId: senderId });
            });
        }
        
        const messages = await dbQueries.getMessageHistory(senderId, receiverId);
        res.json(messages);
    } catch (error) {
        console.error('Mesaj geçmişi getirme hatası:', error);
        res.status(500).json({ message: 'Mesaj geçmişi getirilirken hata oluştu.' });
    }
});

// 5. YENİ MESAJ GÖNDERME VE ANLIK İLETME
app.post('/api/messages', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.body.receiverId ? parseInt(req.body.receiverId) : null;
    const { message, groupId, messageType, fileUrl, parentMessageId, durationSeconds, isEncrypted } = req.body;

    if (!groupId && !receiverId) {
        return res.status(400).json({ message: 'Alıcı ID veya Grup ID zorunludur.' });
    }
    if (!message && !fileUrl) {
        return res.status(400).json({ message: 'Mesaj içeriği veya dosya zorunludur.' });
    }

    try {
        // Grup/Kanal yetki ve engelleme kontrolleri
        if (groupId) {
            const parsedGroupId = parseInt(groupId);
            const db = getDbInstance();
            let groupObj;
            if (isPostgres) {
                const groupRes = await db.query('SELECT * FROM groups WHERE id = $1', [parsedGroupId]);
                groupObj = groupRes.rows[0];
            } else {
                groupObj = await db.get('SELECT * FROM groups WHERE id = ?', [parsedGroupId]);
            }

            if (groupObj) {
                const memberPerms = await dbQueries.getGroupMemberPermissions(parsedGroupId, senderId);
                if (!memberPerms) {
                    return res.status(403).json({ message: 'Bu grubun üyesi değilsiniz.' });
                }

                // 1. Kanal Kontrolü
                if (groupObj.is_channel === 1 && memberPerms.is_admin === 0) {
                    return res.status(403).json({ message: 'Bu kanalda sadece yöneticiler mesaj gönderebilir.' });
                }

                // 2. Mesaj Gönderme İzni
                if (memberPerms.can_send_messages === 0) {
                    return res.status(403).json({ message: 'Bu grupta mesaj gönderme yetkiniz kısıtlanmıştır.' });
                }

                // 3. Medya Paylaşma İzni
                const isMedia = messageType && messageType !== 'text';
                if (isMedia && memberPerms.can_send_media === 0) {
                    return res.status(403).json({ message: 'Bu grupta medya paylaşma yetkiniz kısıtlanmıştır.' });
                }
            }
        } else if (receiverId) {
            const isBlocked = await dbQueries.isBlocked(senderId, receiverId);
            if (isBlocked) {
                return res.status(403).json({ message: 'Bu kullanıcıyla aranızda engelleme bulunduğu için mesaj gönderilemez.' });
            }
        }

        let expiresAt = null;
        if (durationSeconds) {
            expiresAt = new Date(Date.now() + parseInt(durationSeconds) * 1000).toISOString();
        }
        const isEncryptedVal = isEncrypted ? 1 : 0;

        // Mesajı veritabanına kaydet
        const savedMessage = await dbQueries.saveMessage(
            senderId, 
            receiverId, 
            message || '', 
            groupId || null, 
            messageType || 'text', 
            fileUrl || null,
            parentMessageId || null,
            expiresAt,
            isEncryptedVal
        );
        
        // --- GERÇEK ZAMANLI SOKET İLETİMİ ---
        if (groupId) {
            // Grup mesajı iletimi (Grup odasına üye olanlara fırlat)
            io.to(`group_${groupId}`).emit('receive_message', savedMessage);
        } else if (receiverId) {
            // Özel mesaj iletimi
            const receiverSockets = userSockets.get(receiverId);
            if (receiverSockets && receiverSockets.size > 0) {
                receiverSockets.forEach(socketId => {
                    io.to(socketId).emit('receive_message', savedMessage);
                });
            }
        }

        // --- ÇEVRİMDIŞI KULLANICILAR İÇİN WEB PUSH BİLDİRİMLERİ ---
        // Mesaj göndereni bul
        const senderUser = await dbQueries.findUserById(senderId);
        const senderName = senderUser ? senderUser.username : 'Birisi';

        const pushPayload = {
            title: senderName,
            body: savedMessage.message_type === 'text' ? savedMessage.message : '📁 Bir dosya gönderdi.',
            icon: '/favicon.ico',
            data: {
                groupId: groupId || null,
                senderId: senderId
            }
        };

        if (groupId) {
            const members = await dbQueries.getGroupMembers(groupId);
            const groupInfo = await dbQueries.getGroupById(groupId);
            const groupName = groupInfo ? groupInfo.name : 'Grup';
            
            for (const member of members) {
                // Kendimiz hariç ve o anda aktif soket bağlantısı olmayan (offline) üyelere push gönder
                if (member.id !== senderId) {
                    sendPushNotification(member.id, {
                        title: groupName,
                        body: `${senderName}: ${pushPayload.body}`,
                        icon: '/favicon.ico',
                        data: {
                            groupId: groupId,
                            senderId: senderId
                        }
                    });
                }
            }
        } else if (receiverId) {
            sendPushNotification(receiverId, pushPayload);
        }

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        res.status(500).json({ message: 'Mesaj kaydedilirken hata oluştu.' });
    }
});

// 5.0.1 MESAJ DÜZENLE (EDIT)
app.post('/api/messages/:messageId/edit', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const messageId = parseInt(req.params.messageId);
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Mesaj içeriği boş olamaz.' });
    }

    try {
        const msgObj = await dbQueries.getMessageById(messageId);
        if (!msgObj) {
            return res.status(404).json({ message: 'Mesaj bulunamadı.' });
        }
        if (msgObj.sender_id !== senderId) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        // Son 5 dakika içinde mi gönderilmiş?
        const msgTime = new Date(msgObj.created_at);
        const now = new Date();
        const diffMins = (now - msgTime) / 60000;
        if (diffMins > 5) {
            return res.status(400).json({ message: 'Mesajlar yalnızca gönderildikten sonraki ilk 5 dakika içinde düzenlenebilir.' });
        }

        await dbQueries.updateMessageContent(messageId, senderId, message.trim());

        const updatedMsg = {
            messageId,
            message: message.trim(),
            groupId: msgObj.group_id || null,
            receiverId: msgObj.receiver_id || null,
            is_edited: 1
        };

        // --- SOKET İLE ANLIK DUYUR (Ekranların güncellenmesi için) ---
        if (msgObj.group_id) {
            io.to(`group_${msgObj.group_id}`).emit('message_edited', updatedMsg);
        } else {
            // Hem alıcıya hem göndericiye gönder
            const targets = [msgObj.sender_id, msgObj.receiver_id];
            targets.forEach(tId => {
                const sockets = userSockets.get(tId);
                if (sockets) {
                    sockets.forEach(sId => {
                        io.to(sId).emit('message_edited', updatedMsg);
                    });
                }
            });
        }

        res.json({ message: 'Mesaj başarıyla düzenlendi.', updatedMessage: updatedMsg });
    } catch (error) {
        console.error('Mesaj düzenleme hatası:', error);
        res.status(500).json({ message: 'Mesaj düzenlenirken sunucu hatası oluştu.' });
    }
});

// 5.0.2 MESAJ SİL (DELETE)
app.post('/api/messages/:messageId/delete', authenticateToken, async (req, res) => {
    const senderId = req.user.id;
    const messageId = parseInt(req.params.messageId);

    try {
        const msgObj = await dbQueries.getMessageById(messageId);
        if (!msgObj) {
            return res.status(404).json({ message: 'Mesaj bulunamadı.' });
        }
        if (msgObj.sender_id !== senderId) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        await dbQueries.deleteMessageById(messageId, senderId);

        const deletedInfo = {
            messageId,
            groupId: msgObj.group_id || null,
            receiverId: msgObj.receiver_id || null
        };

        // --- SOKET İLE ANLIK SİL (Ekranlardan kaldırılması için) ---
        if (msgObj.group_id) {
            io.to(`group_${msgObj.group_id}`).emit('message_deleted', deletedInfo);
        } else {
            const targets = [msgObj.sender_id, msgObj.receiver_id];
            targets.forEach(tId => {
                const sockets = userSockets.get(tId);
                if (sockets) {
                    sockets.forEach(sId => {
                        io.to(sId).emit('message_deleted', deletedInfo);
                    });
                }
            });
        }

        res.json({ message: 'Mesaj başarıyla silindi.', deletedInfo });
    } catch (error) {
        console.error('Mesaj silme hatası:', error);
        res.status(500).json({ message: 'Mesaj silinirken sunucu hatası oluştu.' });
    }
});

// 5.1 SOHBET GEÇMİŞİNİ TEMİZLE (SİL)
app.delete('/api/messages/clear', authenticateToken, async (req, res) => {
    const currentUserId = req.user.id;
    const receiverId = req.body.receiverId ? parseInt(req.body.receiverId) : null;
    const groupId = req.body.groupId ? parseInt(req.body.groupId) : null;

    if (!groupId && !receiverId) {
        return res.status(400).json({ message: 'Alıcı ID veya Grup ID zorunludur.' });
    }

    try {
        await dbQueries.clearChatHistory(currentUserId, receiverId, groupId);

        // Sadece temizleme işlemini yapan kullanıcının açık olan tüm sekmelerine haber ver
        const mySockets = userSockets.get(currentUserId);
        if (mySockets && mySockets.size > 0) {
            mySockets.forEach(socketId => {
                io.to(socketId).emit('chat_cleared', { receiverId, groupId });
            });
        }

        res.json({ message: 'Sohbet geçmişi başarıyla temizlendi.' });
    } catch (error) {
        console.error('Sohbet temizleme hatası:', error);
        res.status(500).json({ message: 'Sohbet temizlenirken hata oluştu.' });
    }
});

// 6. WEB PUSH BİLDİRİM ROTASI - PUBLIC KEY AL
app.get('/api/push/public-key', authenticateToken, async (req, res) => {
    try {
        const vapidPublicKey = await dbQueries.getSetting('vapid_public_key');
        if (!vapidPublicKey) {
            return res.status(404).json({ message: 'VAPID anahtarı henüz oluşturulmadı.' });
        }
        res.json({ publicKey: vapidPublicKey });
    } catch (error) {
        console.error('VAPID public key çekme hatası:', error);
        res.status(500).json({ message: 'Anahtar çekilirken hata oluştu.' });
    }
});

// 6.1 WEB PUSH BİLDİRİM ROTASI - ABONE OL
app.post('/api/push/subscribe', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) return res.status(400).json({ message: 'Abonelik bilgisi zorunludur.' });

    try {
        const subStr = JSON.stringify(subscription);
        await dbQueries.addPushSubscription(userId, subStr);
        res.json({ message: 'Başarıyla anlık bildirimlere abone olundu.' });
    } catch (error) {
        console.error('Abone olma hatası:', error);
        res.status(500).json({ message: 'Abone olunurken hata oluştu.' });
    }
});

// 6.2 WEB PUSH BİLDİRİM ROTASI - ABONELİKTEN ÇIK
app.post('/api/push/unsubscribe', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) return res.status(400).json({ message: 'Abonelik bilgisi zorunludur.' });

    try {
        const subStr = JSON.stringify(subscription);
        await dbQueries.removePushSubscription(userId, subStr);
        res.json({ message: 'Bildirim aboneliği iptal edildi.' });
    } catch (error) {
        console.error('Abonelik iptal hatası:', error);
        res.status(500).json({ message: 'Abonelik iptal edilirken hata oluştu.' });
    }
});

// 7. HTTPS JSON GET YARDIMCISI (Eski Node sürümlerinde fetch hata vermesin diye)
function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`HTTPS isteği ${res.statusCode} ile başarısız oldu.`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// 7.1 GIPHY GIF PROXY ROTASI (Herkese açık ücretsiz beta anahtarı kullanır)
app.get('/api/gifs/trending', async (req, res) => {
    try {
        const url = `https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=15`;
        const data = await httpsGetJson(url);
        const gifs = (data.data || []).map(item => ({
            id: item.id,
            title: item.title || "",
            url: item.images.fixed_height.url,
            preview: item.images.fixed_height_small.url
        }));
        res.json(gifs);
    } catch (error) {
        console.error('GIF trending hatası:', error);
        res.status(500).json({ message: 'GIFler getirilirken hata oluştu.' });
    }
});

app.get('/api/gifs/search', async (req, res) => {
    const q = req.query.q || '';
    try {
        const url = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q)}&api_key=dc6zaTOxFJmzC&limit=15`;
        const data = await httpsGetJson(url);
        const gifs = (data.data || []).map(item => ({
            id: item.id,
            title: item.title || "",
            url: item.images.fixed_height.url,
            preview: item.images.fixed_height_small.url
        }));
        res.json(gifs);
    } catch (error) {
        console.error('GIF arama hatası:', error);
        res.status(500).json({ message: 'GIFler aranırken hata oluştu.' });
    }
});

// Web Push Bildirim Gönderme Yardımcısı
async function sendPushNotification(recipientId, payload) {
    try {
        const subscriptions = await dbQueries.getPushSubscriptions(recipientId);
        if (!subscriptions || subscriptions.length === 0) return;

        console.log(`Sending push notification to user ${recipientId} (${subscriptions.length} subscription(s))...`);
        const payloadStr = JSON.stringify(payload);

        for (const sub of subscriptions) {
            try {
                await webpush.sendNotification(sub, payloadStr);
            } catch (err) {
                // Eğer abonelik artık geçersizse (kullanıcı tarayıcısından izni kaldırmışsa vb.) veritabanından temizle
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription for user ${recipientId}...`);
                    await dbQueries.removePushSubscription(recipientId, JSON.stringify(sub));
                } else {
                    console.error('Failed to send push notification:', err);
                }
            }
        }
    } catch (error) {
        console.error('Push notification helper error:', error);
    }
}

// Sunucuyu başlat
async function startServer() {
    try {
        await initDatabase();

        // Web Push VAPID Anahtarlarını Yapılandır/Yükle
        let vapidPublicKey = await dbQueries.getSetting('vapid_public_key');
        let vapidPrivateKey = await dbQueries.getSetting('vapid_private_key');

        if (!vapidPublicKey || !vapidPrivateKey) {
            console.log('🗝️ VAPID anahtarları bulunamadı. Yeni anahtar seti üretiliyor...');
            const keys = webpush.generateVAPIDKeys();
            vapidPublicKey = keys.publicKey;
            vapidPrivateKey = keys.privateKey;
            await dbQueries.setSetting('vapid_public_key', vapidPublicKey);
            await dbQueries.setSetting('vapid_private_key', vapidPrivateKey);
        }

        webpush.setVapidDetails(
            'mailto:admin@mesajlasma-uygulamasi.com',
            vapidPublicKey,
            vapidPrivateKey
        );
        console.log('✅ Web Push VAPID anahtarları başarıyla yapılandırıldı.');

        // --- SÜRELİ (KENDİNİ SİLEN) MESAJ TEMİZLEME ZAMANLAYICISI ---
        setInterval(async () => {
            try {
                const db = getDbInstance();
                const nowStr = new Date().toISOString();
                let expiredMessages = [];

                if (isPostgres) {
                    const res = await db.query('SELECT * FROM messages WHERE expires_at IS NOT NULL AND expires_at < $1', [new Date()]);
                    expiredMessages = res.rows;
                } else {
                    expiredMessages = await db.all('SELECT * FROM messages WHERE expires_at IS NOT NULL AND expires_at < ?', [nowStr]);
                }

                if (expiredMessages.length > 0) {
                    console.log(`⏰ ${expiredMessages.length} adet süresi dolmuş mesaj tespit edildi. Siliniyor...`);
                    for (const msg of expiredMessages) {
                        if (isPostgres) {
                            await db.query('DELETE FROM messages WHERE id = $1', [msg.id]);
                        } else {
                            await db.run('DELETE FROM messages WHERE id = ?', [msg.id]);
                        }
                        
                        // İstemcileri soketle haberdar et
                        io.emit('message_deleted', {
                            messageId: msg.id,
                            groupId: msg.group_id || null,
                            receiverId: msg.receiver_id || null
                        });
                    }
                }
            } catch (err) {
                console.error('⏰ Süreli mesaj temizleme hatası:', err);
            }
        }, 3000);

        server.listen(PORT, () => {
            console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor!`);
        });
    } catch (error) {
        console.error('Sunucu başlatılamadı:', error);
    }
}

startServer();
