const { contextBridge, ipcRenderer } = require('electron');

/**
 * Tek güncelleme köprüsü.
 * Eski arayüz checkForUpdates / syncContent çağırsa da çalışır.
 */
contextBridge.exposeInMainWorld('erpDesktop', {
    isElectron: true,
    readAssetBase64: (fileName) => ipcRenderer.invoke('erp-read-asset', fileName),
    readAssetBytes: (fileName) => ipcRenderer.invoke('erp-read-asset', fileName),
    getAppVersion: () => ipcRenderer.invoke('erp-app-version'),
    checkAllUpdates: () => ipcRenderer.invoke('erp-check-all-updates'),
    checkForUpdates: () => ipcRenderer.invoke('erp-check-for-updates'),
    getContentInfo: () => ipcRenderer.invoke('erp-get-content-info'),
    syncContent: () => ipcRenderer.invoke('erp-sync-content'),
    startUpdateDownload: (opts) => ipcRenderer.invoke('erp-start-update-download', opts || {}),
    installUpdate: () => ipcRenderer.invoke('erp-install-update'),
    reloadWindow: () => ipcRenderer.invoke('erp-reload-window'),
    onUpdateStatus: (cb) => {
        if (typeof cb !== 'function') return () => {};
        const handler = (_evt, data) => cb(data || {});
        ipcRenderer.on('erp-update-status', handler);
        return () => ipcRenderer.removeListener('erp-update-status', handler);
    }
});
