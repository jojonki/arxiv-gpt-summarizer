function getAbstText() {
  let absElement = document.querySelector("#abs");
  if (!absElement) {
    return "aaa";
  }
  let blockquote = absElement.querySelector("blockquote");
  // safely get text from blockquote if blockquote exists
  if (blockquote) {
    return blockquote.textContent;
  }

  return "bbb";
}

function insertTranslation(translation) {
  let absElement = document.querySelector("#abs");
  let blockquote = absElement.querySelector("blockquote");
  if (blockquote.textContent.length > 0) {
    let insertText = document.createElement("span"); // Create a new span element
    insertText.style.color = "blue";
    insertText.append(document.createElement("br"));
    insertText.append(document.createElement("br"));
    insertText.append(document.createTextNode(translation));

    blockquote.appendChild(insertText);
  }
}

function getSettingsValues(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (items) => {
      if (items[key] === undefined) {
        reject(new Error(`Setting not found: ${key}`));
      } else {
        resolve(items[key]);
      }
    });
  });
}

async function translateAndSummarize(text) {
  const prompt = await getSettingsValues("prompt");
  let summarizedText = await callOpenAI(`${prompt}\n"${text}"`);
  return summarizedText;
}

async function callOpenAI(prompt) {
  const apiKey = await getSettingsValues("apiKey");
  if (!apiKey) {
    return "Please set API key in the extension options.";
  }
  let response = await fetch("https://api.openai.com/v1/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 1000,
    }),
  });

  let data = await response.json();
  if (
    !data ||
    !data.choices ||
    data.choices.length == 0 ||
    data.choices[0].text == ""
  ) {
    return "Failed to fetch response from OpenAI API. Please check your OpenAI API key at settings page.";
  }
  console.log(data);
  return data.choices[0].text;
}

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason == "install") {
    chrome.tabs.create({ url: "options.html" });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getAbstText,
    },
    (results) => {
      // `results` is an array of results from each frame in the tab.
      // We're only interested in the result from the top-level frame.
      let pageTitle = results[0].result;

      // Translate and summarize the page title.
      translateAndSummarize(pageTitle).then((result) => {
        console.log(result); // You can change this to do whatever you want with the result.
        // Insert the result into the DOM of the current tab.
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: insertTranslation,
          args: [result],
        });
      });
    }
  );
});
