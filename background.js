// background.js

// Listen for browser action (icon) clicks to open the options page
browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage().catch((error) => {
    console.error("Error opening options page:", error);
  });
});

browser.runtime.onMessage.addListener(async (message) => {
  if (message.action === 'fetchTTS' && message.payload) {
    const { apiKey, text, model, voice, responseFormat, speed } = message.payload;
    console.log("Background: Received fetchTTS request with payload:", message.payload);
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          voice: voice,
          input: text,
          response_format: responseFormat,
          speed: speed
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Background: Error response from API:", errorText);
        throw new Error(`HTTP error: ${response.status}, details: ${errorText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      console.log("Background: Received audio data from API.");
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);
      console.log("Background: Converted audio data to base64.");
      return { success: true, audioData: base64Audio };

    } catch (error) {
      console.error("Background: Error during OpenAI TTS request:", error);
      return { success: false, error: error.message };
    }
  }
});
