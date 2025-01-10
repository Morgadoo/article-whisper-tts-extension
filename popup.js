// popup.js
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('configForm').addEventListener('submit', saveOptions);

async function restoreOptions() {
  const {
    apiKey = '',
    model = 'tts-1',
    voice = 'alloy',
    speed = 1.0,
    responseFormat = 'mp3',
    contentSelector = 'article'
  } = await browser.storage.local.get({
    apiKey: '',
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
    responseFormat: 'mp3',
    contentSelector: 'article'
  });
  document.getElementById('apiKey').value = apiKey;
  document.getElementById('model').value = model;
  document.getElementById('voice').value = voice;
  document.getElementById('speed').value = speed;
  document.getElementById('responseFormat').value = responseFormat;
  document.getElementById('contentSelector').value = contentSelector;
}

async function saveOptions(event) {
  event.preventDefault();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('model').value;
  const voice = document.getElementById('voice').value;
  const speed = parseFloat(document.getElementById('speed').value);
  const responseFormat = document.getElementById('responseFormat').value;
  const contentSelector = document.getElementById('contentSelector').value.trim() || 'article';

  await browser.storage.local.set({ apiKey, model, voice, speed, responseFormat, contentSelector });
  
  console.log('Options saved.');
  const saveButton = document.querySelector('button[type="submit"]');
  const originalText = saveButton.innerText;
  saveButton.innerText = "Saved!";
  setTimeout(() => {
    saveButton.innerText = originalText;
  }, 2000);

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length) {
      await browser.tabs.reload(tabs[0].id);
      console.log('Active tab reloaded to apply new settings.');
    }
  } catch (error) {
    console.error('Error reloading tab:', error);
  }
}
