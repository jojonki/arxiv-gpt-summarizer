const apiKeyInput = document.getElementById("apiKey");
const engineInput = document.getElementById("engine");
const promptInput = document.getElementById("prompt");

// Load saved values when the page is loaded
window.onload = function () {
  chrome.storage.sync.get(["apiKey", "engine", "prompt"], function (result) {
    if (result.apiKey !== undefined) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.engine !== undefined) {
      engineInput.value = result.engine;
    }
    if (result.prompt !== undefined) {
      promptInput.value = result.prompt;
    }
  });
};

document.getElementById("settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  let apiKey = apiKeyInput.value;
  let engine = engineInput.value;
  let prompt = promptInput.value;

  let messageElement = document.getElementById("message");
  if (!apiKey) {
    messageElement.textContent = "API Key is required.";
    return;
  }
  if (!prompt) {
    messageElement.textContent = "Prompt is required.";
    return;
  }

  // Save the settings
  chrome.storage.sync.set(
    { apiKey: apiKey, engine: engine, prompt: prompt },
    function () {
      messageElement.textContent = "Settings saved!";
      setTimeout(function () {
        messageElement.textContent = "";
      }, 3000);
    }
  );
});
