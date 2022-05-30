(() => {
  let summarizeResult;

  const isSummarizePossible = text => {
    const reg = /[^a-zA-Z,. ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g;
    const pureContent = text.replace(reg, '');
    if (pureContent.length < 2000 && pureContent.length > 200) {
      return true;
    }
    return false;
  };

  const pythonSummary = async () => {
    const { href: url } = window.location;
    const postData = { url };

    try {
      const res = await fetch('http://localhost:3000/python', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
      if (!res.ok) throw new Error('res ok 문제 발생');
      return await res.json();
    } catch (error) {
      throw new Error(error);
    }
  };

  const translate = async pythonResult => {
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
      return await res.json();
    } catch (error) {
      throw new Error(error);
    }
  };

  const checkLanguage = pythonResult => {
    let koScore = 0;
    let enScore = 0;
    let englishSum = 0;
    let hangulSum = 0;

    const { lang } = document.documentElement;
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

    const pythonResult = await pythonSummary();

    // 한글
    if (checkLanguage(pythonResult)) {
      sendText = pythonResult;
    } // 영어
    else {
      try {
        const { translateText } = await translate(pythonResult);
        console.log(translateText);
        sendText = translateText;
      } catch (error) {
        throw new Error(error);
      }
    }

    console.log(sendText);

    if (isSummarizePossible(sendText)) {
      const title = document.querySelector("meta[property='og:title']")?.getAttribute('content').replace(/"/g, "'");
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

        const splitData = data.summary.split('\n');
        const summarizedMessage = `
          <li style="line-height: 20px;">${splitData[0] ? splitData[0] : ''}</li>
          <li style="line-height: 20px;">${splitData[1] ? splitData[1] : ''}</li>
          <li style="line-height: 20px;">${splitData[2] ? splitData[2] : ''}</li>
          `;

        chrome.storage.local.set({
          summaryResult: summarizedMessage,
          isSummaryPossible: true,
        });

        return summarizedMessage;
      } catch (error) {
        throw new Error(error);
      }
    } else {
      chrome.storage.local.set({
        isSummaryPossible: false,
      });
      return false;
    }
  };

  // DOM 가져오는 util 함수
  const $ = selector => document.querySelector(selector);

  // DOM Element
  const $summarizeZip = $('summarize-zip');
  const $summarizeZipWrapper = $summarizeZip.shadowRoot.getElementById('summarizeZipWrapper');
  const $html = document.documentElement;
  const titleCandidate1 = document.body.querySelector('h1')?.textContent.trim().replace(/"/g, "'");
  const titleCandidate2 = document.body.querySelector('h2')?.textContent.trim().replace(/"/g, "'");

  const prepareLayout = () => {
    $html.setAttribute('data-summarizeZip-active', 'true');
    $summarizeZipWrapper.setAttribute('style', 'display: block');

    const $summarizeAlarm = $('summarize-zip-alarm');

    if ($summarizeAlarm) {
      setTimeout(() => {
        $html.removeChild($summarizeAlarm);
      }, 1000);
    }
  };

  class SuccessUI extends HTMLElement {
    connectedCallback() {
      const mainTitle = document.querySelector("meta[property='og:title']")?.getAttribute('content').replace(/"/g, "'");
      const mainImgSrc = document.querySelector("meta[property='og:image']")?.getAttribute('content');

      this.innerHTML = `
      <img class="mainImg" src=${
        mainImgSrc || 'https://usagi-post.com/wp-content/uploads/2020/05/no-image-found-360x250-1.png'
      } alt=${mainImgSrc ? '메인 사진' : '메인 사진 없음'} width="280" height="160">
      <div class="suggestResult">
        <img src="https://user-images.githubusercontent.com/53992007/166511131-eac4ed0d-0225-4ed1-8bc5-30221f5e5f91.png" alt="summarizeZip" width="25">
        <span>요약된 결과를 확인하세요!</span>
      </div>
      <h2 class="summarizeTitle">${mainTitle}</h2>
        <ul class="totalSummarizeResult">
        ${summarizeResult}
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
        const title = document.querySelector("meta[property='og:title']")?.getAttribute('content').replace(/"/g, "'");

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

      this.querySelector('.totalSummarize').addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback() {
      document.body.onmouseover = null;
      document.body.onmouseout = null;
      document.body.onclick = null;
      this.querySelector('.totalSummarize').removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
      this.parentNode.removeChild(this);
      chrome.storage.local.get(['isSummaryPossible'], data => {
        if (data.isSummaryPossible) {
          getSuccessUI();
        } else {
          getFailureUI();
        }
      });
    }
  }

  const getSuccessUI = async () => {
    const $summarySuccess = $summarizeZipWrapper.querySelector('.successUI');

    if (summarizeResult === null) summarizeResult = await fullSummary();

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

  chrome.storage.local.get(null, async data => {
    const { isOpen, isSummaryPossible, isthroughToast, summaryResult } = data;

    console.log('isOpen:', isOpen);
    console.log('isSummaryPossible:', isSummaryPossible);
    console.log('isthroughToast:', isthroughToast);

    summarizeResult = summaryResult;

    // 토스트를 통과했다면 summaryPossible을 사용할 수 있음
    if (isthroughToast) {
      if (isSummaryPossible) {
        getSuccessUI();
      } else {
        getFailureUI();
      }
      // 토스트를 통과하지 않았다면 summary가 가능한지 판단해야함
    } else {
      if (summarizeResult === null) summarizeResult = await fullSummary();

      if (summarizeResult) {
        getSuccessUI();
      } else {
        getFailureUI();
      }
    }
  });
})();
