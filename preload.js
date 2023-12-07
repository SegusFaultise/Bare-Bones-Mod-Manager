const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

contextBridge.exposeInMainWorld('electronAPI', {
    addFileToMods: (filePath) => ipcRenderer.send('addFileToMods', filePath),
    openFileManager: () => ipcRenderer.send('openFileManager'),
    listFilesInMods: (callback) => ipcRenderer.invoke('listFilesInMods').then(callback),
    findSteamPath: () => ipcRenderer.invoke('findSteamPath'), // Added line
    listSteamGames: (steamPath) => ipcRenderer.invoke('listSteamGames', steamPath),
    deleteMod: (fileName) => ipcRenderer.send('deleteMod', fileName),
    unzipMods: (steamGamesPath) => ipcRenderer.send('unzipMods', steamGamesPath),
    removeAllModsFromLethalCompany: () => ipcRenderer.send('removeAllModsFromLethalCompany'),
    removeSpecificModsFromLethalCompany: () => ipcRenderer.send('removeSpecificModsFromLethalCompany')
});