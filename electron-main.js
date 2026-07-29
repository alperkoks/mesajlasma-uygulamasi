const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        title: "Antigravity Chat",
        icon: path.join(__dirname, 'client', 'icon-512.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    // Render canlı sunucu adresi
    const liveUrl = 'https://mesajlasma-uygulamasi-5rev.onrender.com';
    
    // Canlı sunucuyu yükle, başarısız olursa şık bir hata sayfası göster
    win.loadURL(liveUrl).catch(() => {
        const errorHtml = `
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Bağlantı Hatası</title>
                </head>
                <body style="background-color: #1a1a24; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🌐</div>
                    <h2 style="margin: 0 0 10px 0; font-weight: 600;">Sunucuya Bağlanılamadı</h2>
                    <p style="color: #a0a0b0; margin: 0 0 25px 0; max-width: 320px; font-size: 0.95rem; line-height: 1.4;">
                        Sohbet sunucusu şu anda kapalı veya uykuda olabilir (Render ücretsiz sunucularının açılması 1 dakika sürebilir).
                    </p>
                    <button onclick="window.location.href='${liveUrl}'" style="background-color: #4f46e5; color: white; border: none; padding: 12px 28px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.95rem; transition: background 0.2s; box-shadow: 0 4px 12px rgba(79,70,229,0.3);">
                        Yeniden Bağlanmayı Dene
                    </button>
                </body>
            </html>
        `;
        win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorHtml));
    });

    // Menü çubuğunu gizle
    win.removeMenu();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
