// renderer.js

let steamGamesPath = '';

document.addEventListener('DOMContentLoaded', () => {
    const findSteamButton = document.getElementById('findSteamButton');

    if (findSteamButton) {
        findSteamButton.addEventListener('click', () => {
            window.electronAPI.findSteamPath().then((steamPath) => {
                if (steamPath) {
                    console.log("Steam is installed at:", steamPath);
                    // Update the UI or perform actions based on the Steam path
                } else {
                    console.log("Steam installation not found.");
                    // Update the UI to reflect that Steam isn't found
                }
            });
        });
    }

    const updateGamesList = (gamePaths) => {
        const gamesList = document.getElementById('gamesList');
        gamesList.innerHTML = ''; // Clear existing list

        gamePaths.forEach(path => {
            const pathParts = path.split(/[/\\]/); // Split on both forward and backslashes
            const gameName = pathParts.pop(); // Extracts the game name

            let listItem = document.createElement('li');
            listItem.className = 'game-item';

            let title = document.createElement('h3');
            title.className = 'game-title';
            title.textContent = gameName; // Sets the extracted game name as the text

            listItem.appendChild(title);
            gamesList.appendChild(listItem);
        });
    };


    document.getElementById('unzipModsButton').addEventListener('click', () => {
        window.electronAPI.unzipMods(steamGamesPath);

        const modMessageElement = document.getElementById('modMessage');

        modMessageElement.textContent = "Mods have been added!";
        modMessageElement.style.color = "green";
        setTimeout(() => modMessageElement.textContent = '', 3000);
    })

    const removeButton = document.getElementById('removeSpecificModsButton');
    if (removeButton) {
        removeButton.addEventListener('click', () => {
            window.electronAPI.removeSpecificModsFromLethalCompany();
            const modMessageElement = document.getElementById('modMessage');

            modMessageElement.textContent = "Mods have been removed!";
            modMessageElement.style.color = "red";
            setTimeout(() => modMessageElement.textContent = '', 3000);
        });
    } 
    else {
        console.error('Button not found');
    }

    // Example of how you might trigger the game list update
    window.electronAPI.findSteamPath().then((path) => {
        if (path) {
            window.electronAPI.listSteamGames(path).then(updateGamesList);
            steamGamesPath = path; // Store the Steam path
        }
    });
});