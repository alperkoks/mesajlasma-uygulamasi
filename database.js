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
            await client.query(`
                CREATE TABLE IF NOT EXISTS blocks (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    blocked_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id),
                    FOREIGN KEY(blocked_id) REFERENCES users(id),
                    UNIQUE(user_id, blocked_id)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS groups (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    created_by INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(created_by) REFERENCES users(id)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS group_members (
                    id SERIAL PRIMARY KEY,
                    group_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(group_id, user_id)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS deleted_messages (
                    id SERIAL PRIMARY KEY,
                    message_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(message_id, user_id)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(100) PRIMARY KEY,
                    value TEXT NOT NULL
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS push_subscriptions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    subscription TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE(user_id, subscription)
                )
            `);
            await client.query(`
                CREATE TABLE IF NOT EXISTS muted_chats (
                    user_id INTEGER NOT NULL,
                    target_id INTEGER NOT NULL,
                    target_type VARCHAR(10) NOT NULL,
                    PRIMARY KEY (user_id, target_id, target_type)
                )
            `);
            // Mevcut veritabanı şemasına yeni kolonları güvenli bir şekilde ekle
            await client.query(`ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read INTEGER DEFAULT 0`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id INTEGER`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url TEXT`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited INTEGER DEFAULT 0`);
            await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_message_id INTEGER`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified INTEGER DEFAULT 0`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_token TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS show_last_seen INTEGER DEFAULT 1`);
            await client.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS profile_pic TEXT`);
            await client.query(`ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_admin INTEGER DEFAULT 0`);

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
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN email TEXT");
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
        if (!columns.includes('bio')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN bio TEXT");
        }
        if (!columns.includes('last_seen')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN last_seen TEXT");
        }
        if (!columns.includes('show_last_seen')) {
            await dbSqlite.exec("ALTER TABLE users ADD COLUMN show_last_seen INTEGER DEFAULT 1");
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

        // SQLite için messages tablosuna is_read ve grup/dosya kolonları ekle
        const tableInfoMsg = await dbSqlite.all("PRAGMA table_info(messages)");
        const columnsMsg = tableInfoMsg.map(col => col.name);
        if (!columnsMsg.includes('is_read')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0");
        }
        if (!columnsMsg.includes('group_id')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN group_id INTEGER");
        }
        if (!columnsMsg.includes('message_type')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN message_type TEXT DEFAULT 'text'");
        }
        if (!columnsMsg.includes('file_url')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN file_url TEXT");
        }
        if (!columnsMsg.includes('is_edited')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN is_edited INTEGER DEFAULT 0");
        }
        if (!columnsMsg.includes('parent_message_id')) {
            await dbSqlite.exec("ALTER TABLE messages ADD COLUMN parent_message_id INTEGER");
        }

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

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS blocks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                blocked_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(blocked_id) REFERENCES users(id),
                UNIQUE(user_id, blocked_id)
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_by INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES users(id)
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(group_id, user_id)
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS deleted_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(message_id, user_id)
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                subscription TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, subscription)
            )
        `);

        await dbSqlite.exec(`
            CREATE TABLE IF NOT EXISTS muted_chats (
                user_id INTEGER,
                target_id INTEGER,
                target_type TEXT,
                PRIMARY KEY (user_id, target_id, target_type)
            )
        `);

        const tableInfoGroups = await dbSqlite.all("PRAGMA table_info(groups)");
        const columnsGroups = tableInfoGroups.map(col => col.name);
        if (!columnsGroups.includes('profile_pic')) {
            await dbSqlite.exec("ALTER TABLE groups ADD COLUMN profile_pic TEXT");
        }

        const tableInfoMembers = await dbSqlite.all("PRAGMA table_info(group_members)");
        const columnsMembers = tableInfoMembers.map(col => col.name);
        if (!columnsMembers.includes('is_admin')) {
            await dbSqlite.exec("ALTER TABLE group_members ADD COLUMN is_admin INTEGER DEFAULT 0");
        }

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

    // Yeni mesaj kaydetme (Grup, dosya tipleri ve alıntılama desteğiyle)
    async saveMessage(senderId, receiverId, messageText, groupId = null, messageType = 'text', fileUrl = null, parentMessageId = null) {
        if (isPostgres) {
            const finalReceiverId = groupId ? null : receiverId;
            const res = await dbPostgresPool.query(
                'INSERT INTO messages (sender_id, receiver_id, message, group_id, message_type, file_url, parent_message_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [senderId, finalReceiverId, messageText, groupId, messageType, fileUrl, parentMessageId]
            );
            return res.rows[0];
        } else {
            const finalReceiverId = groupId ? 0 : receiverId;
            const result = await dbSqlite.run(
                'INSERT INTO messages (sender_id, receiver_id, message, group_id, message_type, file_url, parent_message_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [senderId, finalReceiverId, messageText, groupId, messageType, fileUrl, parentMessageId]
            );
            return await dbSqlite.get('SELECT * FROM messages WHERE id = ?', [result.lastID]);
        }
    },

    // İki kullanıcı arasındaki mesaj geçmişini getirme (Kullanıcının kendisi için sildiği mesajları filtreleyerek)
    async getMessageHistory(userId, partnerId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT * FROM messages 
                 WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND group_id IS NULL
                   AND id NOT IN (SELECT message_id FROM deleted_messages WHERE user_id = $1)
                 ORDER BY created_at ASC`,
                [userId, partnerId]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                `SELECT * FROM messages 
                 WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND group_id IS NULL
                   AND id NOT IN (SELECT message_id FROM deleted_messages WHERE user_id = ?)
                 ORDER BY created_at ASC`,
                [userId, partnerId, partnerId, userId, userId]
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
        const queryStr = `
            SELECT * FROM (
                SELECT 
                    users.id, 
                    users.username, 
                    users.profile_pic,
                    users.bio,
                    users.last_seen,
                    users.show_last_seen,
                    COALESCE((
                        SELECT COUNT(*) FROM messages 
                        WHERE messages.sender_id = users.id 
                          AND messages.receiver_id = $1 
                          AND messages.is_read = 0
                    ), 0) AS unread_count,
                    (
                        SELECT message FROM messages 
                        WHERE (messages.sender_id = users.id AND messages.receiver_id = $1)
                           OR (messages.sender_id = $1 AND messages.receiver_id = users.id)
                        ORDER BY messages.created_at DESC 
                        LIMIT 1
                    ) AS last_message,
                    (
                        SELECT created_at FROM messages 
                        WHERE (messages.sender_id = users.id AND messages.receiver_id = $1)
                           OR (messages.sender_id = $1 AND messages.receiver_id = users.id)
                        ORDER BY messages.created_at DESC 
                        LIMIT 1
                    ) AS last_message_time
                FROM friendships 
                JOIN users ON (users.id = friendships.user_id AND friendships.friend_id = $1) 
                           OR (users.id = friendships.friend_id AND friendships.user_id = $1)
                WHERE friendships.status = 'accepted'
            ) friends_subquery
            ORDER BY CASE WHEN last_message_time IS NULL THEN 1 ELSE 0 END, last_message_time DESC, username ASC
        `;
        
        if (isPostgres) {
            const res = await dbPostgresPool.query(queryStr, [userId]);
            return res.rows;
        } else {
            // SQLite $1 yerine ? bekler
            const queryStrSqlite = queryStr.replace(/\$1/g, '?');
            return await dbSqlite.all(queryStrSqlite, [userId]);
        }
    },

    // Belirli bir kullanıcıdan gelen tüm okunmamış mesajları okundu olarak işaretle
    async markMessagesAsRead(senderId, receiverId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE messages SET is_read = 1 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0',
                [senderId, receiverId]
            );
        } else {
            await dbSqlite.run(
                'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
                [senderId, receiverId]
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
    },

    // Arkadaşlıktan Çıkar (Arkadaşlık kaydını sil)
    async removeFriendship(userId, friendId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
                [userId, friendId]
            );
        } else {
            await dbSqlite.run(
                'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
                [userId, friendId, friendId, userId]
            );
        }
    },

    // Kullanıcı Engelle
    async blockUser(userId, blockedId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'INSERT INTO blocks (user_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, blockedId]
            );
        } else {
            await dbSqlite.run(
                'INSERT OR IGNORE INTO blocks (user_id, blocked_id) VALUES (?, ?)',
                [userId, blockedId]
            );
        }
        // Engelledikten sonra aralarındaki arkadaşlığı da sil
        await this.removeFriendship(userId, blockedId);
    },

    // Engeli Kaldır
    async unblockUser(userId, blockedId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'DELETE FROM blocks WHERE user_id = $1 AND blocked_id = $2',
                [userId, blockedId]
            );
        } else {
            await dbSqlite.run(
                'DELETE FROM blocks WHERE user_id = ? AND blocked_id = ?',
                [userId, blockedId]
            );
        }
    },

    // İki kullanıcı arasında engelleme durumu var mı kontrol et (Herhangi biri engellediyse true döner)
    async isBlocked(userId, targetId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'SELECT * FROM blocks WHERE (user_id = $1 AND blocked_id = $2) OR (user_id = $3 AND blocked_id = $4)',
                [userId, targetId, targetId, userId]
            );
            return res.rows.length > 0;
        } else {
            const res = await dbSqlite.get(
                'SELECT * FROM blocks WHERE (user_id = ? AND blocked_id = ?) OR (user_id = ? AND blocked_id = ?)',
                [userId, targetId, targetId, userId]
            );
            return !!res;
        }
    },

    // Belirli bir kullanıcı tarafından engellenip engellenmediğini sorgula (Sadece blockerId mi engelledi?)
    async isUserBlockedBy(userId, blockerId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'SELECT * FROM blocks WHERE user_id = $1 AND blocked_id = $2',
                [blockerId, userId]
            );
            return res.rows.length > 0;
        } else {
            const res = await dbSqlite.get(
                'SELECT * FROM blocks WHERE user_id = ? AND blocked_id = ?',
                [blockerId, userId]
            );
            return !!res;
        }
    },

    // Engellenen kullanıcıları listele
    async getBlockedUsers(userId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                `SELECT users.id, users.username, users.profile_pic 
                 FROM blocks 
                 JOIN users ON users.id = blocks.blocked_id 
                 WHERE blocks.user_id = $1`,
                [userId]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                `SELECT users.id, users.username, users.profile_pic 
                 FROM blocks 
                 JOIN users ON users.id = blocks.blocked_id 
                 WHERE blocks.user_id = ?`,
                [userId]
            );
        }
    },

    // Yeni grup oluştur
    async createGroup(name, createdBy) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
                [name, createdBy]
            );
            return res.rows[0];
        } else {
            const result = await dbSqlite.run(
                'INSERT INTO groups (name, created_by) VALUES (?, ?)',
                [name, createdBy]
            );
            return await dbSqlite.get('SELECT * FROM groups WHERE id = ?', [result.lastID]);
        }
    },

    // Gruba üye ekle
    async addGroupMember(groupId, userId, isAdmin = 0) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'INSERT INTO group_members (group_id, user_id, is_admin) VALUES ($1, $2, $3) ON CONFLICT (group_id, user_id) DO UPDATE SET is_admin = EXCLUDED.is_admin',
                [groupId, userId, isAdmin]
            );
        } else {
            await dbSqlite.run(
                'INSERT INTO group_members (group_id, user_id, is_admin) VALUES (?, ?, ?) ON CONFLICT(group_id, user_id) DO UPDATE SET is_admin = excluded.is_admin',
                [groupId, userId, isAdmin]
            );
        }
    },

    // Kullanıcının dahil olduğu grupları listele
    async getUserGroups(userId) {
        const queryStr = `
            SELECT 
                groups.id,
                groups.name,
                groups.profile_pic,
                groups.created_by,
                (
                    SELECT message FROM messages 
                    WHERE messages.group_id = groups.id 
                    ORDER BY messages.created_at DESC 
                    LIMIT 1
                ) AS last_message,
                (
                    SELECT created_at FROM messages 
                    WHERE messages.group_id = groups.id 
                    ORDER BY messages.created_at DESC 
                    LIMIT 1
                ) AS last_message_time
            FROM groups
            JOIN group_members ON group_members.group_id = groups.id
            WHERE group_members.user_id = $1
            ORDER BY last_message_time DESC NULLS LAST, groups.name ASC
        `;
        if (isPostgres) {
            const res = await dbPostgresPool.query(queryStr, [userId]);
            return res.rows;
        } else {
            const queryStrSqlite = queryStr.replace(/\$1/g, '?').replace('DESC NULLS LAST', 'DESC');
            return await dbSqlite.all(queryStrSqlite, [userId]);
        }
    },

    // Grubun üyelerini listele
    async getGroupMembers(groupId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query(
                'SELECT users.id, users.username, users.profile_pic, group_members.is_admin FROM group_members JOIN users ON users.id = group_members.user_id WHERE group_members.group_id = $1',
                [groupId]
            );
            return res.rows;
        } else {
            return await dbSqlite.all(
                'SELECT users.id, users.username, users.profile_pic, group_members.is_admin FROM group_members JOIN users ON users.id = group_members.user_id WHERE group_members.group_id = ?',
                [groupId]
            );
        }
    },

    // Grubun mesaj geçmişini getir (Kullanıcının kendisi için sildiği mesajları filtreleyerek)
    async getGroupMessageHistory(groupId, userId) {
        const queryStr = `
            SELECT messages.*, users.username AS sender_name 
            FROM messages 
            JOIN users ON users.id = messages.sender_id 
            WHERE messages.group_id = $1 
              AND messages.id NOT IN (SELECT message_id FROM deleted_messages WHERE user_id = $2)
            ORDER BY messages.created_at ASC
        `;
        if (isPostgres) {
            const res = await dbPostgresPool.query(queryStr, [groupId, userId]);
            return res.rows;
        } else {
            const queryStrSqlite = queryStr.replace(/\$1/g, '?').replace(/\$2/g, '?');
            return await dbSqlite.all(queryStrSqlite, [groupId, userId]);
        }
    },

    // Sohbet geçmişini temizle (Sadece temizleyen kullanıcı için silinmiş gösterir)
    async clearChatHistory(userId, receiverId = null, groupId = null) {
        if (groupId) {
            if (isPostgres) {
                await dbPostgresPool.query(`
                    INSERT INTO deleted_messages (message_id, user_id)
                    SELECT id, $1 FROM messages
                    WHERE group_id = $2
                    ON CONFLICT (message_id, user_id) DO NOTHING
                `, [userId, groupId]);
            } else {
                await dbSqlite.run(`
                    INSERT INTO deleted_messages (message_id, user_id)
                    SELECT id, ? FROM messages
                    WHERE group_id = ?
                    ON CONFLICT(message_id, user_id) DO NOTHING
                `, [userId, groupId]);
            }
        } else if (receiverId) {
            if (isPostgres) {
                await dbPostgresPool.query(`
                    INSERT INTO deleted_messages (message_id, user_id)
                    SELECT id, $1 FROM messages
                    WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND group_id IS NULL
                    ON CONFLICT (message_id, user_id) DO NOTHING
                `, [userId, receiverId]);
            } else {
                await dbSqlite.run(`
                    INSERT INTO deleted_messages (message_id, user_id)
                    SELECT id, ? FROM messages
                    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND group_id IS NULL
                    ON CONFLICT(message_id, user_id) DO NOTHING
                `, [userId, userId, receiverId, receiverId, userId]);
            }
        }
    },

    // Sistem ayarlarını getir
    async getSetting(key) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT value FROM system_settings WHERE key = $1', [key]);
            return res.rows[0] ? res.rows[0].value : null;
        } else {
            const res = await dbSqlite.get('SELECT value FROM system_settings WHERE key = ?', [key]);
            return res ? res.value : null;
        }
    },

    // Sistem ayarı kaydet/güncelle
    async setSetting(key, value) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
                [key, value]
            );
        } else {
            await dbSqlite.run(
                'INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)',
                [key, value]
            );
        }
    },

    // Bildirim aboneliği ekle
    async addPushSubscription(userId, subscription) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'INSERT INTO push_subscriptions (user_id, subscription) VALUES ($1, $2) ON CONFLICT (user_id, subscription) DO NOTHING',
                [userId, subscription]
            );
        } else {
            await dbSqlite.run(
                'INSERT OR IGNORE INTO push_subscriptions (user_id, subscription) VALUES (?, ?)',
                [userId, subscription]
            );
        }
    },

    // Kullanıcının bildirim aboneliklerini getir
    async getPushSubscriptions(userId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT subscription FROM push_subscriptions WHERE user_id = $1', [userId]);
            return res.rows.map(r => JSON.parse(r.subscription));
        } else {
            const res = await dbSqlite.all('SELECT subscription FROM push_subscriptions WHERE user_id = ?', [userId]);
            return res.map(r => JSON.parse(r.subscription));
        }
    },

    // Bildirim aboneliğini sil
    async removePushSubscription(userId, subscription) {
        if (isPostgres) {
            await dbPostgresPool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND subscription = $2', [userId, subscription]);
        } else {
            await dbSqlite.run('DELETE FROM push_subscriptions WHERE user_id = ? AND subscription = ?', [userId, subscription]);
        }
    },

    // Grup ID'sine göre grup bul
    async getGroupById(groupId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT * FROM groups WHERE id = $1', [groupId]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT * FROM groups WHERE id = ?', [groupId]);
        }
    },

    // Grup ayarlarını güncelle
    async updateGroup(groupId, name, profilePic, createdBy) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE groups SET name = $1, profile_pic = $2, created_by = $3 WHERE id = $4',
                [name, profilePic, createdBy, groupId]
            );
        } else {
            await dbSqlite.run(
                'UPDATE groups SET name = ?, profile_pic = ?, created_by = ? WHERE id = ?',
                [name, profilePic, createdBy, groupId]
            );
        }
    },

    // Gruptan üye çıkar / ayrıl
    async removeGroupMember(groupId, userId) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
                [groupId, userId]
            );
        } else {
            await dbSqlite.run(
                'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
                [groupId, userId]
            );
        }
    },

    // Kullanıcı biyografisini güncelle
    async updateBio(userId, bio) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId]);
        } else {
            await dbSqlite.run('UPDATE users SET bio = ? WHERE id = ?', [bio, userId]);
        }
    },

    // Kullanıcı son görülme zamanını güncelle
    async updateLastSeen(userId, lastSeen) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET last_seen = $1 WHERE id = $2', [lastSeen, userId]);
        } else {
            await dbSqlite.run('UPDATE users SET last_seen = ? WHERE id = ?', [lastSeen, userId]);
        }
    },

    // ID'ye göre tek mesaj getir
    async getMessageById(messageId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT * FROM messages WHERE id = $1', [messageId]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT * FROM messages WHERE id = ?', [messageId]);
        }
    },

    // Mesaj içeriğini güncelle (Düzenleme)
    async updateMessageContent(messageId, senderId, message) {
        if (isPostgres) {
            await dbPostgresPool.query(
                'UPDATE messages SET message = $1, is_edited = 1 WHERE id = $2 AND sender_id = $3',
                [message, messageId, senderId]
            );
        } else {
            await dbSqlite.run(
                'UPDATE messages SET message = ?, is_edited = 1 WHERE id = ? AND sender_id = ?',
                [message, messageId, senderId]
            );
        }
    },

    // Mesajı kalıcı sil (Silme)
    async deleteMessageById(messageId, senderId) {
        if (isPostgres) {
            await dbPostgresPool.query('DELETE FROM messages WHERE id = $1 AND sender_id = $2', [messageId, senderId]);
        } else {
            await dbSqlite.run('DELETE FROM messages WHERE id = ? AND sender_id = ?', [messageId, senderId]);
        }
    },

    // Kullanıcı son görülme gizlilik ayarını güncelle
    async updateShowLastSeen(userId, val) {
        if (isPostgres) {
            await dbPostgresPool.query('UPDATE users SET show_last_seen = $1 WHERE id = $2', [val, userId]);
        } else {
            await dbSqlite.run('UPDATE users SET show_last_seen = ? WHERE id = ?', [val, userId]);
        }
    },

    // ID'ye göre kullanıcı bilgilerini getir
    async getUserById(userId) {
        if (isPostgres) {
            const res = await dbPostgresPool.query('SELECT id, username, profile_pic, bio, last_seen, show_last_seen, email FROM users WHERE id = $1', [userId]);
            return res.rows[0];
        } else {
            return await dbSqlite.get('SELECT id, username, profile_pic, bio, last_seen, show_last_seen, email FROM users WHERE id = ?', [userId]);
        }
    }
};

module.exports = {
    initDatabase,
    dbQueries,
    getDbInstance: () => (isPostgres ? dbPostgresPool : dbSqlite)
};
