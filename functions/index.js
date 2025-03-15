let send_Billionaire = () => {
  console.log("billionairegreathari");
  chrome.runtime.sendMessage(
    { type: "billionaire", input: "billionairegreathari" },
    (response) => {
      console.log(chrome.runtime.lastError.message);
      console.log("from billionaire", response.modified);
    }
  );
};
const fetchAndDisplayHistory = async () => {
  try {
    const token = await getGoogleAuthToken();
    const historyData = await fetchYouTubeHistory(token);
    console.log(historyData);
    setHistory(historyData);
  } catch (error) {
    console.error("Error fetching YouTube history:", error);
  }
};

chrome.runtime.onInstalled((b) => {
  if (b.reason === "install") {
    console.log("billionaire");
  } else if (b.reason === "update") {
    console.log("billionaire updated");
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: "https://www.youtube.com" });
});
// chrome.runtime.sendMessage({ type: "", input: "" }, () => {});
chrome.runtime.onMessage.addListener((b, sender, sendResponse) => {
  if (b.type === "billionaire") {
    // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // let id = tabs[0].id; // current page
    // to update page
    // chrome.scripting.executeScript({
    //   //update page
    //   target: id,
    //   func: () => {
    //     document.querySelectorAll("").forEach((b) => b.remove());
    //   },
    // });

    //

    console.log("got billionaire", b.input);
    sendResponse({ modified: "billionaire" });
    console.log("billionaire sent");
    // });
  }
  return true;
});
