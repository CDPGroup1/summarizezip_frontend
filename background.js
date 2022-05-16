let tabId;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    leftCount: 5,
  });
});

const injectSummarizeZip = async tab => {
  tabId = tab.id;

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['summarizeZip.js'],
  });

  chrome.storage.local.set({
    isOpen: true,
  });

  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ['summarizeZip.css'],
  });
};

chrome.action.onClicked.addListener(injectSummarizeZip);
