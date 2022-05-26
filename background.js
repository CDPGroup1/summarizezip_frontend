let tabId;

chrome.storage.local.clear();

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

const isSummarizingPossible = async url => {
  const reg = /[^a-zA-Z,. ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;

  try {
    const res = await fetch('http://localhost:3000/python', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('res ok 문제 발생');
    const data = await res.json();
    const pureContent = data.replace(reg, '');
    if (pureContent.length < 2000 && pureContent.length > 200) {
      return true;
    }
    throw new Error('요약이 불가능함!');
  } catch (error) {
    throw new Error(error.message);
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'summarizing') {
    const { url, tab } = sender;

    isSummarizingPossible(url)
      .then(() => {
        sendResponse(true);
        chrome.storage.local.set({
          isSummaryPossible: true,
          isthroughToast: true,
        });
        injectSummarizeZip(tab);
      })
      .catch(() => {
        sendResponse(false);
        chrome.storage.local.set({
          isSummaryPossible: false,
          isthroughToast: true,
        });
        injectSummarizeZip(tab);
      });

    return true;
  }
});
