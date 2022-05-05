let tabId;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    leftCount: 5,
  });
});

const injectSummarizeZip = async tab => {
  tabId = tab.id;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['summarizeZip.js'],
  });

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['summarizeZip.css'],
  });
};

chrome.action.onClicked.addListener(injectSummarizeZip);
