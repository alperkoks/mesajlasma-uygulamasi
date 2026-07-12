const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let db;

// Veritabanı bağlantısını başlatan fonksiyon
async function initDatabase() {
    // Proje klasörümüzün içinde 'chat.db' adında bir veritabanı dosyası oluşturup bağlıyoruz
    db = await open({
        filename: path.join(__dirname, 'chat.db'),
        driver: sqlite3.Database
    });

    console.log('SQLite Veritabanı başarıyla bağlandı.');

    // 1. KULLANICILAR TABLOSU (Yoksa oluştur)
    // id: Her kullanıcıya özel benzersiz numara
    // username: Benzersiz kullanıcı adı
    // password: Şifrelenmiş şifre
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. MESAJLAR TABLOSU (Yoksa oluştur)
    // id: Her mesaja özel benzersiz numara
    // sender_id: Mesajı gönderen kullanıcının id'si
    // receiver_id: Mesajı alan kullanıcının id'si
    // message: Mesaj metni
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES users(id),
            FOREIGN KEY(receiver_id) REFERENCES users(id)
        )
    `);

    console.log('Veritabanı tabloları kontrol edildi/oluşturuldu.');
}

// Veritabanı işlemlerini kolaylaştıracak yardımcı fonksiyonlar
const dbQueries = {
    // Yeni kullanıcı kaydetme
    async createUser(username, hashedPassword) {
        const result = await db.run(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword]
        );
        return { id: result.lastID, username };
    },

    // Kullanıcı adına göre kullanıcı bulma (Giriş yaparken kullanacağız)
    async findUserByUsername(username) {
        return await db.get('SELECT * FROM users WHERE username = ?', [username]);
    },

    // Kullanıcı ID'sine göre kullanıcı bulma
    async findUserById(id) {
        return await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    },

    // Tüm kullanıcıları listeleme
    async getAllUsers() {
        return await db.all('SELECT id, username FROM users ORDER BY username ASC');
    },

    // Yeni mesaj kaydetme
    async saveMessage(senderId, receiverId, messageText) {
        const result = await db.run(
            'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
            [senderId, receiverId, messageText]
        );
        
        // Kaydedilen mesajı detaylarıyla geri dön
        return await db.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
    },

    // İki kullanıcı arasındaki mesaj geçmişini getirme
    async getMessageHistory(user1Id, user2Id) {
        return await db.all(
            `SELECT * FROM messages 
             WHERE (sender_id = ? AND receiver_id = ?) 
                OR (sender_id = ? AND receiver_id = ?) 
             ORDER BY created_at ASC`,
            [user1Id, user2Id, user2Id, user1Id]
        );
    }
};

module.exports = {
    initDatabase,
    dbQueries,
    getDbInstance: () => db
};
