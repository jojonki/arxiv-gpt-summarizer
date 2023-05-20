document.getElementById("saveButton").addEventListener("click", () => {
  let apiKey = document.getElementById("apiKey").value;
  chrome.storage.sync.set({ apiKey: apiKey }, () => {
    console.log("API Key saved.");
  });
});
