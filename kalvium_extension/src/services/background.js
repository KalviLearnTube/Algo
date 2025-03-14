import { GoogleGenerativeAI } from "@google/generative-ai";


chrome.commands.onCommand.addListener(async (command) => {  
  if (command === "extract-data") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    chrome.runtime.sendMessage({ action: "extraction-Data" });
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: displaySelectedText,
      });
    } catch (err) {
      console.error("Failed to execute script:", err);
    }
  }

  if (command === "save-event") {
    chrome.storage.sync.get(['geminiExtractedData'], (result) => {
      if (result.geminiExtractedData) {
        chrome.runtime.sendMessage({ action: "Save-Data" });
      } else {
        console.error('No event data to save');
      }
    });
  }
});




function executeDisplaySelectedText() {
  chrome.windows.getLastFocused({ populate: true }, (window) => {
    const activeTab = window.tabs.find(
      (tab) => tab.active && !tab.url.startsWith("chrome-extension://")
    );

    if (!activeTab || !activeTab.id) {
      console.error("No valid active tab found. Retrying in 1 second...");
      setTimeout(executeDisplaySelectedText, 1000);
      return;
    }

    

    chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      function: () =>
        new Promise((resolve) => {
          if (document.readyState === "complete") {
            resolve();
          } else {
            window.addEventListener("load", resolve, { once: true });
          }
        }),
    }, () => {
      
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: displaySelectedText,
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error("Error executing script:", chrome.runtime.lastError.message);
        } else {
          console.log("Script executed successfully:", results);
        }
      });
    });
  });
}




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "display-selected-text") {
    executeDisplaySelectedText();
    sendResponse({ success: true });
    return false;
  }
});

function displaySelectedText() {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) {
    alert("No text selected! Please select some text and try again.");
    return;
  }

  chrome.runtime.sendMessage({
    action: "processText",
    text: selectedText,
  });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "processText") {
    executePrompt(message.text)
      .then((responseText) => {
        try {
          let parsedResponse = JSON.parse(responseText);
          const eventDetails = {
            eventName: parsedResponse.eventName || null,
            description: parsedResponse.description || null,
            date: parsedResponse.date || null,
            startTime: parsedResponse.startTime || null,
            endTime: parsedResponse.endTime || null,
            location: parsedResponse.location || null,
            virtualLink: parsedResponse.virtualLink || null
          };

          chrome.storage.sync.set({ geminiExtractedData: eventDetails }, () => {
            sendResponse({ success: true, responseText: eventDetails });
          });

        } catch (error) {
          console.error("Error parsing JSON:", error);
          sendResponse({ success: false, error: "Invalid JSON format from API" });
        }
      })
      .catch((error) => {
        console.error("Error processing text:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; 
  }
  return false;
});



const now = new Date();
const todayDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
const currentTime = now.toTimeString().split(" ")[0].substring(0, 5);

async function executePrompt(text) {
const prompt = `Extract event details from the provided text: "${text}"

Context Information:
Today's date: ${todayDate}
Current time: ${currentTime}

Rules for Date and Time:
- For "tomorrow" in text, add 1 day to ${todayDate}
- For "after X hours", add X hours to ${currentTime}
- For "after X minutes", add X minutes to ${currentTime}
- Convert all times to 24-hour format (HH:mm). Examples:
  * "3 PM" → "15:00"
  * "2.00pm" → "14:00"
  * "after 5 hours from ${currentTime}" → calculate exact time
- For time ranges (e.g., "2pm to 4pm"), extract both startTime and endTime

General Rules:
- Missing information should be null
- Return only JSON object, no extra text or formatting
- Extract location as a complete phrase (e.g., "Chennai near Zoho" as one location)

Return exactly this JSON format:
{
  "eventName": "<event name or null>",
  "description": "<description or null>",
  "date": "<YYYY-MM-DD or null>",
  "startTime": "<HH:mm or null>",
  "endTime": "<HH:mm or null>",
  "location": "<location or null>",
  "virtualLink": "<virtual link or null>"
}`

async function getGeminiResponse(content) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["userAPIKey"], async (result) => {
      const API_KEY = result.userAPIKey || "";
      if (!API_KEY) {
        return reject("No API key found. Please set your API key.");
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      try {
        const GoogleData = await model.generateContent(content);
        let responseText = GoogleData.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          resolve(jsonMatch[0]);
        } else {
          reject("Response did not contain valid JSON.");
        }
      } catch (error) {
        reject("Error generating response: " + error.message);
      }
    });
  });
}


  return await getGeminiResponse(prompt);
}



