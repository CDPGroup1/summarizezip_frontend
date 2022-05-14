(() => {
  var s = '';
  let summarizedMessage = '';
  const summarizeFail = () => {
    let summarizeResult = false;

    if (!summarizeResult) {
      return 1;
    }
  };
  const textFilter = () => {
    let numberFilter = /[0-9]/;
    let englishFilter = /[a-zA-Z]/;
    let hangulFilter = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    let specialFilter = /[~!@#\#$%<>^&*]/;

    let numberSum = 0;
    let englishSum = 0;
    let hangulSum = 0;
    let specialSum = 0;

    let newsText = document.querySelector('#dic_area').textContent.trim().replace(/\n/g, '');
    for (let i = 0; i < newsText.length; i++) {
      if (newsText[i].match(numberFilter)) {
        numberSum += 1;
      } else if (newsText[i].match(englishFilter)) {
        englishSum += 1;
      } else if (newsText[i].match(hangulFilter)) {
        hangulSum += 1;
      } else if (newsText[i].match(specialFilter)) {
        specialSum += 1;
      }
    }

    console.log(numberSum);
    console.log(englishSum);
    console.log(hangulSum);
    console.log(specialSum);

    if (hangulSum > englishSum) {
      alert('한글로 번역');
    } else {
      alert('영어로 번역');
    }
  };
  const summary1 = async () => {
    textFilter();
    const text = document.querySelector('#dic_area').textContent.trim().replace(/\n/g, '');
    console.log(text);
    const bodyData = { content: text };
    try {
      const res = await fetch('http://localhost:3000/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      let summaryData = data.summary;
      summaryData = summaryData.split('\n');
      summaryData.forEach((a, i) => {
        summarizedMessage += `${i + 1} ${a}` + '\n';
      });
      s = summarizedMessage;
      console.log(s);
      chrome.storage.local.set(
        {
          key: summarizedMessage,
        },
        function () {}
      );
    } catch (error) {
      throw new Error(error);
    }
  };

  const $summarizeZipWrapper = document.getElementById('summarizeZipWrapper');

  const isWrapperExisted = selector => selector !== null;

  // 익스텐션 클릭시 왼쪽 화면에서 나옴
  const getWidget = () => {
    let sum = '';

    summary1();

    chrome.storage.local.get(['key'], function (result) {
      let imageSrc = document.querySelector("meta[property='og:image']").getAttribute('content');
      let image = ``;

      sum += result.key;
      let sum1 = sum.split('.');
      const $html = document.documentElement;
      $html.setAttribute('data-summarizeZip-active', 'true');

      // const titles = document.body.querySelector('h1');
      const titleCandidate1 = document.body.querySelector('h1')?.textContent.trim();
      const titleCandidate2 = document.body.querySelector('h2')?.textContent.trim();

      let title = '';

      const $div = document.createElement('div');
      $div.setAttribute('id', 'summarizeZipWrapper');
      // 정상적으로 동작하면 li태그, 아니면 오류 표시
      let template = ``;
      let alarmMessage = '';
      if (!summarizeFail) {
        alarmMessage = '요약을 할 수 없습니다 :(';
      } else {
        if (titleCandidate1) {
          title = titleCandidate1;
        } else {
          title = titleCandidate2;
        }
        alarmMessage = '요약된 결과를 확인하세요!';
        if (imageSrc) {
          image = `<img
            class = "siteImg"
            src= ${imageSrc}
            width="200px"
            height="200px"
            style="object-fit:contain"
          />`;
        } else {
          image = null;
        }
      }
      template = `
      <button class="closeButton" aria-label="닫기">
      <img
        src="https://user-images.githubusercontent.com/53992007/166632199-9962060b-7681-4aca-8fac-db72a8063853.png"
        alt="닫기"
        width="20"
        height="20"
      />
      </button>
      ${image ? image : ''}

      <div class="successUI"></div>
      <div class="failureUI"></div>
      <div class="paragraphSummarize">
        <div class="mainSection">
          <div class="imageContainer">
            <img src="https://user-images.githubusercontent.com/53992007/166511131-eac4ed0d-0225-4ed1-8bc5-30221f5e5f91.png" alt="summarizeZip" width="40" />
            
          </div>
          <h2 class="alarm">${alarmMessage}</h2>
          <h2 class="pageTitle">${title}</h2>
          <div class="summarizeArea">
          ${
            summarizeFail
              ? ` <ul class="summarizeResult">
          <h5 class="summarizeText">${sum1[0]}</h5>
          <h5 class="summarizeText">${sum1[1]}</h5>
          <h5 class="summarizeText">${sum1[2]}</h5>
          <h5>${s}</h5>
          </ul>`
              : ''
          }
           
            
          </div>
          <button class="totalSummarize">문단 요약</button>
        </div>
      </div>
      `;

      $div.insertAdjacentHTML('afterbegin', template);

      document.body.insertAdjacentElement('beforebegin', $div);

      document.querySelector('.closeButton').addEventListener('click', () => {
        closeWidget();
      });

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

        const $summarizeResult = document.querySelector('.summarizeResult');

        if (content.length >= 2000) {
          $summarizeResult.textContent = `❗️요약하려는 글은 2000자 이내여야 합니다.`;

          $summarizeResult.style.color = 'red';

          return;
        }

        if (content.length >= 100) {
          const postData = {
            title: titleCandidate1 + titleCandidate2,
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
    });
  };

  const closeWidget = () => {
    const widget = document.getElementById('summarizeZipWrapper');
    const widgetParent = widget.parentNode;

    widgetParent.removeChild(widget);
    widgetParent.removeAttribute('data-summarizezip-active');

    document.body.onmouseover = null;
    document.body.onmouseout = null;
  };

  if (isWrapperExisted($summarizeZipWrapper)) {
    closeWidget();
  } else {
    getWidget();
  }
})();
