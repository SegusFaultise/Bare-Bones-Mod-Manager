const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const os = require('os');
const AdmZip = require('adm-zip');

const modsDir = path.join(__dirname, "Mods/");

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1500,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },

        icon: path.join(__dirname, 'skull.png') // Update the path to your icon
    })
    mainWindow.loadFile('index.html')
}

ipcMain.on('addFileToMods', (event, filePath) => {
    if (!fs.existsSync(modsDir)) {
        fs.mkdirSync(modsDir);
    }
    const destinationPath = path.join(modsDir, path.basename(filePath));
    fs.copyFileSync(filePath, destinationPath);
    // Add any additional code needed after copying the file
});

ipcMain.on('deleteMod', (event, fileName) => {
    const filePath = path.join(modsDir, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Deletes the file
        // Handle any additional logic or error handling
    }
});

ipcMain.on('openFileManager', async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
    });

    result.filePaths.forEach(filePath => {
        const destinationPath = path.join(modsDir, path.basename(filePath));
        fs.copyFileSync(filePath, destinationPath);
        // Add any additional code needed after copying the file
    });
});

ipcMain.handle('listFilesInMods', async (event) => {
    const files = fs.readdirSync(modsDir);
    return files.filter(file => file.endsWith('.zip'));
});

// Steam-related functions
function findSteamInstallPath() {
    let defaultPaths = {
        'win32': [
            'C:\\Program Files (x86)\\Steam',
            'C:\\Program Files\\Steam'
        ],
        'darwin': [
            path.join(os.homedir(), 'Library/Application Support/Steam')
        ],
        'linux': [
            path.join(os.homedir(), '.steam/steam')
        ]
    };

    let platform = os.platform();
    let pathsToCheck = defaultPaths[platform] || [];

    for (let p of pathsToCheck) {
        if (fs.existsSync(p)) {
            return p;
        }
    }
    return null;
}

function listSteamGames(steamPath) {
    const steamAppsPath = path.join(steamPath, 'steamapps');
    const libraryFoldersPath = path.join(steamAppsPath, 'libraryfolders.vdf');

    let libraryPaths = [steamAppsPath]; // Default library

    if (fs.existsSync(libraryFoldersPath)) {
        // Parse the libraryfolders.vdf file to find additional library folders
        // This requires reading and interpreting the .vdf file format
        // Add each found path to the libraryPaths array
    }

    let gamePaths = [];
    libraryPaths.forEach(libraryPath => {
        const commonPath = path.join(libraryPath, 'common');
        if (fs.existsSync(commonPath)) {
            const games = fs.readdirSync(commonPath);
            games.forEach(game => gamePaths.push(path.join(commonPath, game)));
        }
    });

    return gamePaths;
}

ipcMain.handle('listSteamGames', async (event, steamPath) => {
    return listSteamGames(steamPath);
});

// IPC event to find and return Steam install path
ipcMain.handle('findSteamPath', async (event) => {
    return findSteamInstallPath();
});

ipcMain.on('unzipMods', async (event) => {
    // Use the findSteamInstallPath method to get the Steam directory
    const steamPath = findSteamInstallPath();
    if (!steamPath) {
        console.log("Steam installation path not found.");
        // You may want to send a message back to the renderer process to handle this error
        return;
    }

    // Construct the path to the "Lethal Company" directory in the Steam folder
    const destinationPath = path.join(steamPath, 'steamapps', 'common', 'Lethal Company');
    
    // Ensure the "Lethal Company" directory exists
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }

    // Path to the Mods directory within your Electron app
    const modsPath = path.join(__dirname, 'Mods');

    // Your logic to unzip files goes here
    fs.readdir(modsPath, (err, files) => {
        if (err) {
            console.error("Error reading Mods directory:", err);
            // Again, you may want to inform the renderer process
            return;
        }

        files.forEach(file => {
            if (file.endsWith('.zip')) {
                const filePath = path.join(modsPath, file);
                try {
                    const zip = new AdmZip(filePath);
                    zip.extractAllTo(destinationPath, true); // true to overwrite existing files
                    console.log(`Extracted ${file} to ${destinationPath}`);
                } catch (zipError) {
                    console.error(`Error unzipping ${file}:`, zipError);
                }
            }
        });
        
        // Send a message back to the renderer process if needed
    });
});

ipcMain.on('removeAllModsFromLethalCompany', async (event) => {
    const steamPath = findSteamInstallPath();
    if (!steamPath) {
        console.error("Steam installation path not found.");
        // Inform the renderer process that the Steam path was not found
        return;
    }

    const lethalCompanyPath = path.join(steamPath, 'steamapps', 'common', 'Lethal Company');

    fs.readdir(lethalCompanyPath, (err, files) => {
        if (err) {
            console.error("Error reading Lethal Company directory:", err);
            // Inform the renderer process about the error
            return;
        }

        files.forEach(file => {
            const filePath = path.join(lethalCompanyPath, file);
            // Ensure it's a file and not a directory
            if (fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        });

        console.log("All mods have been removed from Lethal Company.");
        // Inform the renderer process that mods have been successfully removed
    });
});

ipcMain.on('removeSpecificModsFromLethalCompany', async (event) => {
    const steamPath = findSteamInstallPath();
    if (!steamPath) {
        console.error("Steam installation path not found.");
        return;
    }

    const lethalCompanyPath = path.join(steamPath, 'steamapps', 'common', 'Lethal Company');
    const itemsToDelete = ['BepInEx', 'doorstop_config.ini', 'winhttp.dll'];

    itemsToDelete.forEach(itemName => {
        const itemPath = path.join(lethalCompanyPath, itemName);
        if (fs.existsSync(itemPath)) {
            try {
                if (fs.lstatSync(itemPath).isDirectory()) {
                    // Recursively delete directory
                    fs.rmdirSync(itemPath, { recursive: true });
                } else {
                    // Delete file
                    fs.unlinkSync(itemPath);
                }
                console.log(`Deleted ${itemName} from Lethal Company.`);
            } catch (err) {
                console.error(`Error deleting ${itemName}:`, err);
            }
        } else {
            console.log(`${itemName} not found in Lethal Company.`);
        }
    });

    // Inform the renderer process that the operation is complete
});

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
