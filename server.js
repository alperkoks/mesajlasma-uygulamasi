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

// Ara Katmanlar
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

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
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });

    try {
        const existingUser = await dbQueries.findUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: 'Bu kullanıcı adı zaten alınmış.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await dbQueries.createUser(username, hashedPassword);
        
        res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Kayıt sırasında sunucu hatası oluştu.' });
    }
});

// 2. GİRİŞ YAP
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Kullanıcı adı ve şifre zorunludur.' });

    try {
        const user = await dbQueries.findUserByUsername(username);
        if (!user) return res.status(400).json({ message: 'Hatalı kullanıcı adı veya şifre.' });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Hatalı kullanıcı adı veya şifre.' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Giriş başarılı!',
            token: token,
            user: { id: user.id, username: user.username }
        });
    } catch (error) {
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
