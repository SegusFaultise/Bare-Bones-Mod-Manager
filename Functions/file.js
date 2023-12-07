const dropZone = document.getElementById('drop_zone');

const updateFileList = () => {
    window.electronAPI.listFilesInMods((files) => {
        const fileList = document.getElementById('file-list');

        fileList.innerHTML = ''; // Clear existing list

        files.forEach(file => {
            if (file.endsWith('.zip')) {
                const li = document.createElement('li');
                const sideBar = document.getElementById('sidebar');

                li.className = 'mod-file-item';
        
                const textSpan = document.createElement('span');

                textSpan.textContent = file;
                textSpan.className = 'file-name';
        
                const deleteButton = document.createElement('button');

                deleteButton.innerHTML = '&times;';
                deleteButton.className = 'delete-mod-button';
                deleteButton.onclick = () => {
                    window.electronAPI.deleteMod(file);
                    updateFileList();
                };
        
                // If using an <img> tag
                const img = document.createElement('img');
                img.src = './Styles/delete.png'; // Path to your trash can icon
                //img.alt = 'Delete';
                deleteButton.appendChild(img);
        
                li.appendChild(textSpan);
                li.appendChild(deleteButton);
                fileList.appendChild(li);
            }
        });
    });
};


dropZone.addEventListener('dragover', (event) => {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    dropZone.classList.add('hover');
});

dropZone.addEventListener('dragleave', (event) => {
    dropZone.classList.remove('hover');
});

dropZone.addEventListener('drop', (event) => {
    event.stopPropagation();
    event.preventDefault();
    dropZone.classList.remove('hover');

    const files = event.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
        // You can perform additional checks here (e.g., file type)
        // Send each file path to the Electron back end
        window.electronAPI.addFileToMods(files[i].path);
    }

    updateFileList();
});

updateFileList();