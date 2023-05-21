function _debug_sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function getAbstText() {
  let titleText = "";
  let abstText = "";

  // abst
  let absElement = document.querySelector("#abs");
  if (!absElement) {
    return null;
  }
  let blockquote = absElement.querySelector("blockquote");
  if (!blockquote) {
    return null;
  }
  let descriptor = blockquote.querySelector(".descriptor");
  if (descriptor) {
    abstText = blockquote.textContent
      .replace(descriptor.textContent, "")
      .trim();
  }

  let titleElement = document.querySelector(".title.mathjax");
  if (titleElement) {
    descriptor = titleElement.querySelector(".descriptor");
    titleText = titleElement.textContent
      .replace(descriptor.textContent, "")
      .trim();
  }

  return { title: titleText, abst: abstText };
}

function addWaitingDom() {
  let summaryId = "arxiv-gpt-summarizer-summary";
  let summaryDom = document.querySelector("#" + summaryId);
  if (summaryDom) {
    summaryDom.parentNode.removeChild(summaryDom);
  }

  let absElement = document.querySelector("#abs");
  let blockquote = absElement.querySelector("blockquote");
  let insertText = document.createElement("span");
  insertText.style.color = "gray";
  insertText.id = "arxiv-gpt-summarizer-waiting";
  insertText.append(document.createElement("br"));
  insertText.append(document.createElement("br"));
  insertText.append(document.createTextNode("Calling OpenAI API..."));
  blockquote.appendChild(insertText);
}

function insertTranslation(translation) {
  let summaryId = "arxiv-gpt-summarizer-summary";
  let waitingDom = document.querySelector("#arxiv-gpt-summarizer-waiting");
  if (waitingDom) {
    waitingDom.parentNode.removeChild(waitingDom);
  }

  let absElement = document.querySelector("#abs");
  let blockquote = absElement.querySelector("blockquote");
  if (blockquote.textContent.length > 0) {
    let insertText = document.createElement("span");
    insertText.style.color = "blue";
    insertText.id = summaryId;
    insertText.append(document.createElement("br"));
    insertText.append(document.createElement("br"));
    insertText.append(document.createTextNode(translation));

    blockquote.appendChild(insertText);
  }
}

async function translateAndSummarize(paperInfo) {
  let prompt = await getSettingsValues("prompt");
  console.log(prompt);
  console.log(paperInfo);
  let title = paperInfo.title;
  let abst = paperInfo.abst;
  if (title) {
    prompt = prompt.replace("${title}", title);
  }
  if (abst) {
    prompt = prompt.replace("${abst}", abst);
  }
  let summarizedText = await callOpenAI(prompt);

  return summarizedText;
}

async function callOpenAI(prompt) {
  // await _debug_sleep(500);
  // return prompt;

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
      // insert waiting dom
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: addWaitingDom,
      });

      // `results` is an array of results from each frame in the tab.
      // We're only interested in the result from the top-level frame.
      let paperInfo = results[0].result;

      translateAndSummarize(paperInfo).then((result) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: insertTranslation,
          args: [result],
        });
      });
    }
  );
});
