// content-script.js
(function() {
  function onReady(callback) {
    if (document.readyState !== "loading") {
      callback();
    } else {
      document.addEventListener("DOMContentLoaded", callback);
    }
  }

  // Utility function to split text into chunks of given size
  function splitTextIntoChunks(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  onReady(async () => {
    console.log("Content script: Document is ready.");

    // Retrieve the content selector from storage
    const { contentSelector = 'article' } = await browser.storage.local.get({ contentSelector: 'article' });
    console.log(`Content script: Using selector "${contentSelector}" to find content.`);

    const article = document.querySelector(contentSelector);
    if (!article) {
      console.log(`Content script: No element found using selector "${contentSelector}".`);
      return;
    }

    console.log(`Content script: Element found using selector "${contentSelector}".`);
    const button = document.createElement('button');
    button.innerText = "Whisper TTS";
    button.style.margin = "10px";
    button.style.padding = "5px 10px";
    button.style.fontSize = "14px";

    article.parentNode.insertBefore(button, article);
    console.log("Content script: Button inserted.");

button.addEventListener('click', async () => {
  console.log("Content script: Button clicked.");

  // Retrieve configuration values
  const { apiKey, model = "tts-1", voice = "alloy", speed = 1.0, responseFormat = "mp3" } = await browser.storage.local.get({
    apiKey: '',
    model: 'tts-1',
    voice: 'alloy',
    speed: 1.0,
    responseFormat: 'mp3'
  });

  if (!apiKey) {
    alert("Please configure your OpenAI API key in the extension options.");
    console.log("Content script: No API key provided.");
    return;
  }

  let fullText = article.innerText.trim();
  if (!fullText) {
    alert("No text found in the article.");
    console.log("Content script: Article has no text.");
    return;
  }

  // Split text and proceed as before...
  const chunkSize = 4096;
  const textChunks = splitTextIntoChunks(fullText, chunkSize);
  console.log(`Content script: Split text into ${textChunks.length} chunk(s).`);

  button.disabled = true;
  button.innerText = "Processing...";

      // Container to hold audio elements
      const audioContainer = document.createElement('div');
      article.parentNode.insertBefore(audioContainer, button.nextSibling);

      // Array to store created audio elements
      const audioElements = [];

      try {
        // For each chunk, request audio and create an audio element
        for (let i = 0; i < textChunks.length; i++) {
          const text = textChunks[i];
          console.log(`Content script: Sending message to background for chunk ${i+1}/${textChunks.length}.`);
          const result = await browser.runtime.sendMessage({
            action: 'fetchTTS',
            payload: { apiKey, text, model, voice, responseFormat, speed }
          });

          if (!result.success) {
            throw new Error(result.error);
          }

          console.log(`Content script: Received audio data for chunk ${i+1}.`);
          const binaryString = atob(result.audioData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let j = 0; j < len; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const blob = new Blob([bytes], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);

          const audioElem = document.createElement('audio');
          audioElem.controls = true;
          audioElem.src = audioUrl;
          audioElem.style.display = "block";
          audioElem.style.margin = "10px";

          // Don't autoplay except for the first audio element
          if (i === 0) {
            audioElem.autoplay = true;
          }

          audioContainer.appendChild(audioElem);
          audioElements.push(audioElem);
          console.log(`Content script: Audio element for chunk ${i+1} appended.`);
        }

        // Set up sequential autoplay: when one audio ends, play the next
        for (let i = 0; i < audioElements.length - 1; i++) {
          audioElements[i].addEventListener('ended', () => {
            console.log(`Content script: Chunk ${i+1} ended, playing chunk ${i+2}.`);
            audioElements[i+1].play();
          });
        }

        button.innerText = "Done!";
      } catch (error) {
        console.error("Content script: Error during TTS process:", error);
        alert("Failed to generate audio using OpenAI TTS.");
        button.innerText = "Whisper TTS";
      } finally {
        button.disabled = false;
      }
    });
  });
})();
