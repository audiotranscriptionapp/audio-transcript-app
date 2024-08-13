console.log('Renderer process is running');
const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const transcriptionOutput = document.getElementById('transcriptionOutput');

  // Click event for the "UPLOAD MP3 FILE" button
  document.querySelector('button').addEventListener('click', () => {
    fileInput.click();
  });

  // File input change event
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Drag and drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });

  // Function to handle the selected or dropped files
  function handleFiles(files) {
    for (const file of files) {
      // Check if the file is an MP3
      if (file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3')) {
        console.log('Valid MP3 file:', file.name);

        // Send the file path to the main process
        ipcRenderer.send('file-uploaded', file.path);
      } else {
        console.log('Invalid file type. Please upload an MP3 file.');
        alert('Please upload only MP3 files.');
      }
    }
  }

  // Listen for the response from the main process
  ipcRenderer.on('file-saved', (event, savedFilePath) => {
    console.log('File saved at:', savedFilePath);
    alert(`File saved successfully at ${savedFilePath}`);
  });

  ipcRenderer.on('file-save-error', (event, errorMessage) => {
    alert(errorMessage);
  });

  ipcRenderer.on('transcription-complete', (event, transcription) => {
    console.log('Transcription complete:', transcription);
    transcriptionOutput.textContent = transcription;
});

ipcRenderer.on('transcription-error', (event, errorMessage) => {
    console.error('Transcription error:', errorMessage);
    alert('Error during transcription. Please try again.');
});
});
