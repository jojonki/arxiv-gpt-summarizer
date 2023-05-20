// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   translateAndSummarize(request.text).then(sendResponse);
//   return true; // Will respond asynchronously.
// });

function getPageTitle() {
  // This function is converted to a string and runs in the context of the current tab.
  return document.title;
}

function insertTranslation(translation) {
  // let div = document.createElement("blackquote");
  // div.textContent = translation;
  // div.className = "abstract mathjax";

  // Find the element with id="abs" and class="metatable", and insert the new div before it.
  let absElement = document.querySelector("#abs");
  let blockquote = absElement.querySelector("blockquote");
  // absElement.insertBefore(div, metaTableElement);
  if (blockquote.textContent.length > 0) {
    blockquote.append(document.createElement("br"));
    blockquote.append(document.createElement("br"));
  }

  // Append the translated text.
  blockquote.append(document.createTextNode(translation));
}

chrome.action.onClicked.addListener((tab) => {
  // Run a content script in the current tab to get the page title.
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: getPageTitle,
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

async function translateAndSummarize(text) {
  return text + " ---> TEST TRANSLATED TEXT";
  let translatedText = await callOpenAI(
    `Translate the following English text to Japanese:\n"${text}"`
  );
  let summarizedText = await callOpenAI(
    `Summarize the following Japanese text:\n"${translatedText}"`
  );
  return summarizedText;
}

async function callOpenAI(prompt) {
  let response = await fetch(
    "https://api.openai.com/v1/engines/davinci-codex/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_OPENAI_API_KEY",
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 60,
      }),
    }
  );

  let data = await response.json();
  return data.choices[0].text.strip();
}
