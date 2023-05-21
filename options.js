document.getElementById("settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  let apiKey = document.getElementById("apiKey").value;
  let prompt = document.getElementById("prompt").value;
  // let temperature = document.getElementById("temperature").value;

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
  chrome.storage.sync.set({ apiKey: apiKey, prompt: prompt }, function () {
    messageElement.textContent = "Settings saved!";
    setTimeout(function () {
      messageElement.textContent = "";
    }, 3000);
  });
});
