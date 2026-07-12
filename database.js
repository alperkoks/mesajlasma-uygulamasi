const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const { Pool } = require('pg'); // PostgreSQL kütüphanesini dahil ettik

let dbSqlite;
let dbPostgresPool;
let isPostgres = false;

// Veritabanı bağlantısını başlatan fonksiyon
async function initDatabase() {
    // Eğer bulut sunucusunda DATABASE_URL ayarlanmışsa (Neon PostgreSQL kullan)
    if (process.env.DATABASE_URL) {
        isPostgres = true;
        dbPostgresPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false // Neon veritabanı güvenli SSL bağlantısı gerektirir
            }
        });
        
        console.log('PostgreSQL (Neon Bulut) Veritabanı bağlantısı hazırlandı.');

        // PostgreSQL Tablolarını Oluştur (PostgreSQL sözdizimi ile)
        const client = await dbPostgresPool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email VARCHAR(100) UNIQUE,
                    is_verified INTEGER DEFAULT 0,
                    verification_token TEXT,
                    reset_password_token TEXT,
                    reset_password_expires TIMESTAMP,
                    profile_pic TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    sender_id INTEGER NOT NULL,
                    receiver_id INTEGER NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(sender_id) REFERENCES users(id),
                    FOREIGN KEY(receiver_id) REFERENCES users(id)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS friendships (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    friend_id INTEGER NOT NULL,
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(friend_id) REFERENCES users(id),
                    UNIQUE(user_id, friend_id)
                )
            `);
            
            // Mevcut veritabanı şemasına yeni kolonları güvenli bir şekilde ekle
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER DEFAULT 0`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT`);

            console.log('PostgreSQL Tabloları kontrol edildi/oluşturuldu.');
        } finally {
            client.release();
        }
    } else {
        // Eğer DATABASE_URL yoksa (Bilgisayarımızda lokal çalışıyorsak SQLite kullan)
        isPostgres = false;
        dbSqlite = await open({
            filename: path.join(__dirname, 'chat.db'),
            driver: sqlite3.Database
        });

        console.log('SQLite (Lokal) Veritabanı başarıyla bağlandı.');

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE,
                is_verified INTEGER DEFAULT 0,
                verification_token TEXT,
                reset_password_token TEXT,
                reset_password_expires TEXT,
                profile_pic TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // SQLite için mevcut tabloya yeni kolonları güvenli bir şekilde ekle
        const tableInfo = await dbSqlite.all("PRAGMA table_info(users)");
        const columns = tableInfo.map(col => col.name);

        if (!columns.includes('email')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN email TEXT UNIQUE");
        }
        if (!columns.includes('is_verified')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
        }
        if (!columns.includes('verification_token')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN verification_token TEXT");
        }
        if (!columns.includes('reset_password_token')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN reset_password_token TEXT");
        }
        if (!columns.includes('reset_password_expires')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN reset_password_expires TEXT");
        }
        if (!columns.includes('profile_pic')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN profile_pic TEXT");
        }

        await dbSqlite.exec(`
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

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(friend_id) REFERENCES users(id),
                UNIQUE(user_id, friend_id)
            )
        `);

        console.log('SQLite Tabloları kontrol edildi/oluşturuldu.');
    }
}

// Veritabanı işlemlerini gerçekleştiren yardımcı fonksiyonlar
const dbQueries = {
    // Yeni kullanıcı kaydetme
    async createUser(username, email, hashedPassword, verificationToken) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'INSERT INTO users (username, email, password, verification_token, is_verified) VALUES ($1, $2, $3, $4, 0) RETURNING id, username, email',
                [username, email, hashedPassword, verificationToken]
            );
            return res.rows[0];
        } else {
            const result = await dbSqlite.run(
                'INSERT INTO users (username, email, password, verification_token, is_verified) VALUES (?, ?, ?, ?, 0)',
                [username, email, hashedPassword, verificationToken]
            );
            return { id: result.lastID, username, email };
        }
    },

    // Kullanıcı adına göre kullanıcı bulma
    async findUserByUsername(username) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT * FROM users WHERE username = $1', [username]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT * FROM users WHERE username = ?', [username]);
        }
    },

    // E-posta adresine göre kullanıcı bulma
    async findUserByEmail(email) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT * FROM users WHERE email = $1', [email]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT * FROM users WHERE email = ?', [email]);
        }
    },

    // Doğrulama token'ına göre kullanıcı bulma
    async findUserByVerificationToken(token) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT * FROM users WHERE verification_token = ?', [token]);
        }
    },

    // Kullanıcıyı doğrulanmış olarak işaretleme
    async verifyUser(id) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = $1', [id]);
        } else {
            await dbSqlite.run('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [id]);
        }
    },

    // Şifre sıfırlama token'ı tanımlama
    async setResetPasswordToken(email, token, expires) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3',
                [token, expires, email]
            );
        } else {
            await dbSqlite.run(
                'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?',
                [token, expires, email]
            );
        }
    },

    // Şifre sıfırlama token'ına göre kullanıcı bulma
    async findUserByResetToken(token) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'SELECT * FROM users WHERE reset_password_token = $1',
                [token]
            );
            return res.rows[0];
        } else {
            return await dbSqlite.get(
                'SELECT * FROM users WHERE reset_password_token = ?',
                [token]
            );
        }
    },

    // Şifre güncelleme
    async updatePassword(id, hashedPassword) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
                [hashedPassword, id]
            );
        } else {
            await dbSqlite.run(
                'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
                [hashedPassword, id]
            );
        }
    },

    // Kullanıcı adı güncelleme
    async updateUsername(id, newUsername) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET username = $1 WHERE id = $2', [newUsername, id]);
        } else {
            await dbSqlite.run('UPDATE users SET username = ? WHERE id = ?', [newUsername, id]);
        }
    },

    // Profil resmi güncelleme
    async updateProfilePic(id, imageUrl) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET profile_pic = $1 WHERE id = $2', [imageUrl, id]);
        } else {
            await dbSqlite.run('UPDATE users SET profile_pic = ? WHERE id = ?', [imageUrl, id]);
        }
    },

    // Kullanıcı ID'sine göre kullanıcı bulma
    async findUserById(id) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT id, username, email, profile_pic, is_verified FROM users WHERE id = $1', [id]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT id, username, email, profile_pic, is_verified FROM users WHERE id = ?', [id]);
        }
    },

    // Tüm kullanıcıları listeleme
    async getAllUsers() {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT id, username, profile_pic FROM users ORDER BY username ASC');
            return res.rows;
        } else {
            return await dbSqlite.all('SELECT id, username, profile_pic FROM users ORDER BY username ASC');
        }
    },

    // Yeni mesaj kaydetme
    async saveMessage(senderId, receiverId, messageText) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *',
                [senderId, receiverId, messageText]
            );
            return res.rows[0];
        } else {
            const result = await dbSqlite.run(
                'INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
                [senderId, receiverId, messageText]
            );
            return await dbSqlite.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
        }
    },

    // İki kullanıcı arasındaki mesaj geçmişini getirme
    async getMessageHistory(user1Id, user2Id) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT * FROM messages 
                 WHERE (sender_id = $1 AND receiver_id = $2) 
                    OR (sender_id = $3 AND receiver_id = $4) 
                 ORDER BY created_at ASC`,
                [user1Id, user2Id, user2Id, user1Id]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                `SELECT * FROM messages 
                 WHERE (sender_id = ? AND receiver_id = ?) 
                    OR (sender_id = ? AND receiver_id = ?) 
                 ORDER BY created_at ASC`,
                [user1Id, user2Id, user2Id, user1Id]
            );
        }
    },

    // Arkadaşlık İsteği Gönder (Çift yönlü istek kontrolü veya ekleme)
    async sendFriendRequest(userId, friendId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT DO NOTHING',
                [userId, friendId]
            );
        } else {
            await dbSqlite.run(
                'INSERT OR IGNORE INTO friendships (user_id, friend_id, status) VALUES (?, ?, \'pending\')',
                [userId, friendId]
            );
        }
    },

    // Arkadaşlık İsteğini Kabul Et
    async acceptFriendRequest(userId, friendId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE friendships SET status = \'accepted\' WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
                [friendId, userId]
            );
        } else {
            await dbSqlite.run(
                'UPDATE friendships SET status = \'accepted\' WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [friendId, userId, userId, friendId]
            );
        }
    },

    // Bekleyen Arkadaşlık İsteklerini Listele (Kullanıcıya gelen istekler)
    async getPendingRequests(userId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT friendships.id as friendship_id, users.id as user_id, users.username, users.profile_pic 
                 FROM friendships 
                 JOIN users ON users.id = friendships.user_id 
                 WHERE friendships.friend_id = $1 AND friendships.status = 'pending'`,
                [userId]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                `SELECT friendships.id as friendship_id, users.id as user_id, users.username, users.profile_pic 
                 FROM friendships 
                 JOIN users ON users.id = friendships.user_id 
                 WHERE friendships.friend_id = ? AND friendships.status = 'pending'`,
                [userId]
            );
        }
    },

    // Arkadaş Listesini Getir (onaylı arkadaşlıklar)
    async getFriends(userId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT users.id, users.username, users.profile_pic 
                 FROM friendships 
                 JOIN users ON (users.id = friendships.user_id AND friendships.friend_id = $1) 
                            OR (users.id = friendships.friend_id AND friendships.user_id = $2)
                 WHERE friendships.status = 'accepted'`,
                [userId, userId]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                `SELECT users.id, users.username, users.profile_pic 
                 FROM friendships 
                 JOIN users ON (users.id = friendships.user_id AND friendships.friend_id = ?) 
                            OR (users.id = friendships.friend_id AND friendships.user_id = ?)
                 WHERE friendships.status = 'accepted'`,
                [userId, userId]
            );
        }
    },

    // İki kullanıcı arasındaki arkadaşlık durumunu sorgula
    async checkFriendshipStatus(user1Id, user2Id) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT * FROM friendships 
                 WHERE (user_id = $1 AND friend_id = $2) 
                    OR (user_id = $3 AND friend_id = $4)`,
                [user1Id, user2Id, user2Id, user1Id]
            );
            return res.rows[0];
        } else {
            return await dbSqlite.get(
                `SELECT * FROM friendships 
                 WHERE (user_id = ? AND friend_id = ?) 
                    OR (user_id = ? AND friend_id = ?)`,
                [user1Id, user2Id, user2Id, user1Id]
            );
        }
    }
};

module.exports = {
    initDatabase,
    dbQueries,
    getDbInstance: () => (isPostgres ? dbPostgresPool : dbSqlite)
};
