let sentence = 3;

let b3 = document.querySelector('.a');
let b4 = document.querySelector('.b');
let b5 = document.querySelector('.c');

b3.addEventListener('click', () => {
  sentence = 3;
  console.log(sentence);
  chrome.storage.local.set({
    userSentence: sentence,
  });
});
b4.addEventListener('click', () => {
  sentence = 4;
  console.log(sentence);
  chrome.storage.local.set({
    userSentence: sentence,
  });
});
b5.addEventListener('click', () => {
  sentence = 5;
  console.log(sentence);
  chrome.storage.local.set({
    userSentence: sentence,
  });
});
