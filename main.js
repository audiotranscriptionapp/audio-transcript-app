const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const fs = require('fs');
const vosk = require('vosk');

// Initialize Vosk model
const MODEL_PATH = path.join(__dirname, 'models', 'vosk-model-small-en-us-0.15');
if (!fs.existsSync(MODEL_PATH)) {
  console.error(`Model path does not exist: ${MODEL_PATH}`);
  app.quit();
}
vosk.setLogLevel(0);
const model = new vosk.Model(MODEL_PATH);

// Function to create the main application window
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

// App ready event to create the window
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// App window closed event
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Directory where MP3 files will be stored
const userDataPath = app.getPath('userData');
const mp3StoragePath = path.join(userDataPath, 'mp3_files');

// Ensure the directory exists
if (!fs.existsSync(mp3StoragePath)) {
  fs.mkdirSync(mp3StoragePath);
}

// IPC event to handle file uploads
ipcMain.on('file-uploaded', (event, filePath) => {
  console.log('File received in main process:', filePath);

  const fileName = path.basename(filePath);
  const destinationPath = path.join(mp3StoragePath, fileName);

  // Copy the file to the local storage directory
  fs.copyFile(filePath, destinationPath, (err) => {
    if (err) {
      console.error('File could not be saved:', err);
      event.reply('file-save-error', 'Failed to save file');
    } else {
      console.log('File saved successfully:', destinationPath);
      event.reply('file-saved', destinationPath);
    }
  });
  // Transcribe the audio file
  const wf = new (require('wav').Reader)();
  const fileStream = fs.createReadStream(destinationPath); // Use the copied file for transcription
  const rec = new vosk.Recognizer({model: model, sampleRate: 16000});

  wf.on('format', (format) => {
    if (format.sampleRate !== 16000) {
      console.error('Audio file sample rate must be 16000Hz');
      return;
    }

    fileStream.pipe(wf).on('data', (data) => {
      rec.acceptWaveform(data);
    });

    wf.on('end', () => {
      const result = rec.finalResult();
      console.log('Transcription Result:', result.text);
      event.reply('transcription-complete', result.text);
      rec.free();
    });
  });

  fileStream.on('error', (err) => {
    console.error('Error reading file:', err);
    event.reply('transcription-error', 'Error reading audio file');
  });
});


