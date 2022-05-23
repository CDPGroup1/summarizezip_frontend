(() => {
  let summarizeResult;
  // 파이썬 본문 탐지
  const pythonSummary = async () => {
    // 파이썬파일에서 가져온 본문
    let mainText;

    const { href: url } = window.location;
    const postData = {
      url,
    };
    try {
      const res = await fetch('http://localhost:3000/python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error('res ok 문제 발생');
      mainText = await res.json();
      return mainText;
    } catch (error) {
      throw new Error(error);
    }
  };

  const translate = async pythonResult => {
    let translateResult;
    const postData = {
      text: pythonResult,
    };
    try {
      const res = await fetch('http://localhost:3000/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error('res ok 문제 발생');
      translateResult = await res.json();
      return translateResult;
    } catch (error) {
      throw new Error(error);
    }
  };
  // DOM 가져오는 util 함수
  const $ = selector => document.querySelector(selector);

  // DOM Element
  const $summarizeZip = $('summarize-zip');
  const $summarizeZipWrapper = $summarizeZip.shadowRoot.getElementById('summarizeZipWrapper');
  const $html = document.documentElement;
  const titleCandidate1 = document.body.querySelector('h1')?.textContent.trim();
  const titleCandidate2 = document.body.querySelector('h2')?.textContent.trim();

  const prepareLayout = () => {
    $html.setAttribute('data-summarizeZip-active', 'true');
    $summarizeZipWrapper.setAttribute('style', 'display: block');

    const $summarizeAlarm = $('summarize-zip-alarm');

    if ($summarizeAlarm) {
      $html.removeChild($summarizeAlarm);
    }
  };

  const checkLanguage = pythonResult => {
    let koScore = 0;
    let enScore = 0;
    let englishSum = 0;
    let hangulSum = 0;

    const lang = document.documentElement.lang;
    const contextLength = pythonResult.length;

    if (lang === 'ko') {
      koScore += 30;
    } else if (lang === 'en') {
      enScore += 30;
    }

    const englishFilter = /[a-zA-Z]/;
    const hangulFilter = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;

    for (let i = 0; i < contextLength; i++) {
      if (pythonResult[i].match(englishFilter)) {
        englishSum += 1;
      } else if (pythonResult[i].match(hangulFilter)) {
        hangulSum += 1;
      }
    }
    const contextSum = hangulSum + englishSum;
    const hangulRatio = (hangulSum / contextSum) * 70;
    const englishRatio = (englishSum / contextSum) * 70;

    if (koScore + hangulRatio > enScore + englishRatio) {
      // 한글
      return 1;
    }
    // 영어
    return 0;
  };

  // 전체 요약
  const fullSummary = async () => {
    // nodejs로 번역 보내는 텍스트
    let sendText;
    // 파이썬으로 가져온 본문
    let pythonResult;
    // 번역결과 텍스트
    let translateResult;
    const extractText = pythonSummary();
    await extractText.then(value => {
      pythonResult = value.answer;
    });
    // 한글
    if (checkLanguage(pythonResult)) {
      sendText = pythonResult;
    } // 영어
    else {
      translateResult = translate(pythonResult);
      await translateResult.then(value => {
        sendText = value;
      });
    }
    const title = document.querySelector("meta[property='og:title']")?.getAttribute('content');
    const bodyData = { title, content: sendText };
    try {
      const res = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });
      const data = await res.json();

      if (data === 0) {
        // 요약 불가능
        return 0;
      } else {
        const splitData = data.summary.split('\n');
        const summarizedMessage = `
          <li style="line-height: 20px;">${splitData[0] ? splitData[0] : ''}</li>
          <li style="line-height: 20px;">${splitData[1] ? splitData[1] : ''}</li>
          <li style="line-height: 20px;">${splitData[2] ? splitData[2] : ''}</li>
          `;

        return summarizedMessage;
      }
    } catch (error) {
      throw new Error(error);
    }
  };

  class SuccessUI extends HTMLElement {
    constructor() {
      super();
      this.summarizeResult = summarizeResult;
    }

    async connectedCallback() {
      const mainTitle = document.querySelector("meta[property='og:title']")?.getAttribute('content');
      const mainImgSrc = document.querySelector("meta[property='og:image']")?.getAttribute('content');

      this.innerHTML = `
      <img class="mainImg" src=${
        mainImgSrc || 'https://usagi-post.com/wp-content/uploads/2020/05/no-image-found-360x250-1.png'
      } alt=${mainImgSrc ? '메인 사진' : '메인 사진 없음'} width="280" height="160">
      <div class="suggestResult">
        <img src="https://user-images.githubusercontent.com/53992007/166511131-eac4ed0d-0225-4ed1-8bc5-30221f5e5f91.png" alt="summarizeZip" width="25">
        <span>요약된 결과를 확인하세요!</span>
      </div>
      <h2 class="summarizeTitle" style = "line-height : 20px">${mainTitle}</h2>
        <ul class="totalSummarizeResult">
          ${this.summarizeResult}
        </ul>

      <button class="totalSentenceButton">문단 요약</button>
      `;
      prepareLayout();

      this.querySelector('.totalSentenceButton').addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback() {
      this.querySelector('.totalSentenceButton').removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
      this.parentNode.removeChild(this);
      getParagraphUI();
    }
  }

  class FailureUI extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
      <img
          src="https://user-images.githubusercontent.com/53992007/168479484-d146d6e9-ffd4-41e5-b96b-f4d47caa9c38.png"
          alt="실패"
          width="70"
      />
      <h2 class="failureMessage">요약을 할 수 없습니다 :(</h2>
      <span class="failureSuggestMessage">직접 문단을 선택해서 요약해 보세요!</span>
      <button class="sentenceSummarize">문단 요약</button>
      `;

      prepareLayout();
      this.querySelector('.sentenceSummarize').addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback() {
      this.querySelector('.sentenceSummarize').removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
      this.parentNode.removeChild(this);
      getParagraphUI();
    }
  }

  class ParagraphUI extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <div class="mainSection">
          <div class="imageContainer">
            <img
              src="https://user-images.githubusercontent.com/53992007/166511131-eac4ed0d-0225-4ed1-8bc5-30221f5e5f91.png"
              alt="summarizeZip"
              width="40"
            />
            <span>문단을 선택해서 요약해보세요</span>
          </div>
          <div class="summarizeArea">
            <ul class="summarizeResult"></ul>
          </div>
          <button class="totalSummarize">전체 요약</button>
        </div>
      `;

      prepareLayout();

      document.body.onmouseover = ({ target }) => {
        target.style.border = '2px solid #8b008b';
        target.style.cursor = 'pointer';
      };

      document.body.onmouseout = ({ target }) => {
        target.removeAttribute('style');
      };

      document.body.onclick = async ({ target }) => {
        const text = target.textContent;
        const textArr = text
          .replace(/\t/g, '')
          .split('\n')
          .filter(el => el.length > 2);

        const content = textArr.join('');
        const title = document.querySelector("meta[property='og:title']")?.getAttribute('content');

        const $summarizeResult = this.querySelector('.summarizeResult');

        if (content.length >= 2000) {
          $summarizeResult.textContent = `❗️요약하려는 글은 2000자 이내여야 합니다.`;

          $summarizeResult.style.color = 'red';

          return;
        }

        if (content.length >= 100) {
          const postData = {
            title: title || titleCandidate1 + titleCandidate2,
            content,
          };

          try {
            const res = await fetch('http://localhost:3000/api/summarize', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(postData),
            });
            if (!res.ok) throw new Error('res ok 문제 발생');
            const data = await res.json();

            const splitData = data.summary.split('\n');
            $summarizeResult.removeAttribute('style');
            $summarizeResult.innerHTML = `
          <li>${splitData[0] ? splitData[0] : ''}</li>
          <li>${splitData[1] ? splitData[1] : ''}</li>
          <li>${splitData[2] ? splitData[2] : ''}</li>
          `;
          } catch (error) {
            throw new Error(error);
          }
        } else {
          $summarizeResult.textContent = `❗️요약하려는 글이 너무 짧습니다.
           다른 문단을 선택해주세요`;

          $summarizeResult.style.color = 'red';
        }
      };

      // TODO: 버튼 이벤트 필요
    }

    disconnectedCallback() {
      document.body.onmouseover = null;
      document.body.onmouseout = null;
      document.body.onclick = null;
    }
  }

  const getSuccessUI = () => {
    const $summarySuccess = $summarizeZipWrapper.querySelector('.successUI');

    if (!$summarySuccess)
      $summarizeZipWrapper.insertAdjacentHTML('beforeend', '<summary-success class="successUI"></summary-success>');

    if (!customElements.get('summary-success')) customElements.define('summary-success', SuccessUI);
  };

  const getFailureUI = () => {
    const $summaryFailure = $summarizeZipWrapper.querySelector('.failureUI');

    if (!$summaryFailure)
      $summarizeZipWrapper.insertAdjacentHTML('beforeend', '<summary-failure class="failureUI"></summary-failure>');

    if (!customElements.get('summary-failure')) customElements.define('summary-failure', FailureUI);
  };

  const getParagraphUI = () => {
    const $summaryParagraph = $summarizeZipWrapper.querySelector('.paragraphUI');

    if (!$summaryParagraph)
      $summarizeZipWrapper.insertAdjacentHTML(
        'beforeend',
        '<summary-paragraph class="paragraphUI"></summary-paragraph>'
      );

    if (!customElements.get('summary-paragraph')) customElements.define('summary-paragraph', ParagraphUI);
  };

  chrome.storage.local.get(['isOpen'], async data => {
    if (data.isOpen) {
      console.log('ho');
    } else {
      console.log('hi');

      const entireSummarize = fullSummary();
      await entireSummarize.then(value => {
        summarizeResult = value;
      });
      if (summarizeResult !== 0) {
        getSuccessUI(summarizeResult);
      } else {
        getFailureUI();
      }
    }
  });
})();

// (() => {
//   let s = '';
//   let summarizedMessage = '';

//   // 익스텐션 클릭시 왼쪽 화면에서 나옴
//   const getWidget = () => {
//     let sum = '';

//     fullSummary();

//     chrome.storage.local.get(['key'], result => {
//       const imageSrc = document.querySelector("meta[property='og:image']").getAttribute('content');
//       let image = ``;

//       sum += result.key;
//       const sum1 = sum.split('.');

//       const $html = document.documentElement;
//       $html.setAttribute('data-summarizeZip-active', 'true');

//       // const titles = document.body.querySelector('h1');
//       const titleCandidate1 = document.body.querySelector('h1')?.textContent.trim();
//       const titleCandidate2 = document.body.querySelector('h2')?.textContent.trim();

//       let title = '';

//       const $div = document.createElement('div');
//       $div.setAttribute('id', 'summarizeZipWrapper');

//       let template = ``;
//       let alarmMessage = '';
//       if (!summarizeFail) {
//         alarmMessage = '요약을 할 수 없습니다 :(';
//       } else {
//         if (titleCandidate1) {
//           title = titleCandidate1;
//         } else {
//           title = titleCandidate2;
//         }
//         alarmMessage = '요약된 결과를 확인하세요!';
//         if (imageSrc) {
//           image = `<img
//           class = "siteImg"
//           src= ${imageSrc}
//           width="200px"
//           height="200px"
//           style="object-fit:contain"
//         />`;
//         } else {
//           image = null;
//         }
//       }
//       template = `
//     <button class="closeButton" aria-label="닫기">
//     <img
//       src="https://user-images.githubusercontent.com/53992007/166632199-9962060b-7681-4aca-8fac-db72a8063853.png"
//       alt="닫기"
//       width="20"
//       height="20"
//     />
//     </button>
//     ${image || ''}
//     <div class="successUI"></div>
//     <div class="failureUI"></div>
//     <div class="paragraphSummarize">
//       <div class="mainSection">
//         <div class="imageContainer">
//           <img src="https://user-images.githubusercontent.com/53992007/166511131-eac4ed0d-0225-4ed1-8bc5-30221f5e5f91.png" alt="summarizeZip" width="40" />

//         </div>
//         <h2 class="alarm">${alarmMessage}</h2>
//         <h2 class="pageTitle">${title}</h2>
//         <div class="summarizeArea">
//         ${
//           summarizeFail
//             ? ` <ul class="summarizeResult">
//         <h5 class="summarizeText">${sum1[0]}</h5>
//         <h5 class="summarizeText">${sum1[1]}</h5>
//         <h5 class="summarizeText">${sum1[2]}</h5>
//         <h5>${s}</h5>
//         </ul>`
//             : ''
//         }

//         </div>
//         <button class="totalSummarize">문단 요약</button>
//       </div>
//     </div>
//     `;

//       $div.insertAdjacentHTML('afterbegin', template);

//       document.body.insertAdjacentElement('beforebegin', $div);

// })();
