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

chrome.runtime.onMessage.addListener((b, sender, sendResponse) => {
  if (b.type === "billionaire") {
    console.log("got billionaire", b.input);
    sendResponse({ modified: "billionaire" });
    console.log("billionaire sent");
  }
  return true;
});
