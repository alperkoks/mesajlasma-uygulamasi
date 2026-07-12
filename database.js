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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

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
        console.log('SQLite Tabloları kontrol edildi/oluşturuldu.');
    }
}

// Veritabanı işlemlerini gerçekleştiren yardımcı fonksiyonlar
const dbQueries = {
    // Yeni kullanıcı kaydetme
    async createUser(username, hashedPassword) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
                [username, hashedPassword]
            );
            return res.rows[0];
        } else {
            const result = await dbSqlite.run(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                [username, hashedPassword]
            );
            return { id: result.lastID, username };
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

    // Kullanıcı ID'sine göre kullanıcı bulma
    async findUserById(id) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT id, username FROM users WHERE id = $1', [id]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT id, username FROM users WHERE id = ?', [id]);
        }
    },

    // Tüm kullanıcıları listeleme
    async getAllUsers() {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT id, username FROM users ORDER BY username ASC');
            return res.rows;
        } else {
            return await dbSqlite.all('SELECT id, username FROM users ORDER BY username ASC');
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
    }
};

module.exports = {
    initDatabase,
    dbQueries,
    getDbInstance: () => (isPostgres ? dbPostgresPool : dbSqlite)
};
