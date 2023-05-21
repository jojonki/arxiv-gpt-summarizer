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

function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get("apiKey", (items) => {
      resolve(items.apiKey);
    });
  });
}

async function translateAndSummarize(text) {
  let summarizedText = await callOpenAI(
    `次に示す学術論文のabstractを分かりやすく日本語に3行程度に要約:\n"${text}"`
  );
  return summarizedText;
}

async function callOpenAI(prompt) {
  const apiKey = await getApiKey();
  if (apiKey == null) {
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
  console.log(data);
  if (data.choices.length == 0) {
    return "No response from OpenAI API.";
  }
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
