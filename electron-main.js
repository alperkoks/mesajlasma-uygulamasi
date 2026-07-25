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

    // Render canlı sunucu adresine yönlendir, bağlantı yoksa yerel dosyayı yükle
    const liveUrl = 'https://mesajlasma-uygulamasi.onrender.com';
    win.loadURL(liveUrl).catch(() => {
        win.loadFile(path.join(__dirname, 'client', 'index.html'));
    });

    // Menü çubuğunu gizle (daha temiz, yerel bir görünüm için)
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
