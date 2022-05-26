window.addEventListener('load', () => {
  document.body.insertAdjacentHTML('beforebegin', `<summarize-zip-alarm></summarize-zip-alarm>`);
  document.body.insertAdjacentHTML('beforebegin', `<summarize-zip></summarize-zip>`);

  chrome.storage.local.set({
    isOpen: false,
  });

  const alarmTemplate = document.createElement('template');
  alarmTemplate.innerHTML = `
            <style>              
              .summarizeButton {
                  position: absolute;
                  right: 0;
                  top: 40%;
                  z-index: 10000;
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 20px;
                  border: 0;
                  background-color: #5ca0a1;
                  cursor: pointer;
                  border-radius: 5px 0 0 5px;
                  box-shadow: 2px 2px 9px 6px rgba(0, 0, 0, 0.11);
                  color: white;
                  width: 150px;
                  height: 60px;
                  animation: bounceInRight 1s;
                  }
              .toastAlarmText {
                  font-weight: bold;
                  }
              @keyframes bounceInRight {
                  from,
                  60%,
                  75%,
                  90%,
                  to {
                      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
                  }
                  from {
                      opacity: 0;
                      transform: translate3d(3000px, 0, 0) scaleX(3);
                  }
                  60% {
                      opacity: 1;
                      transform: translate3d(-25px, 0, 0) scaleX(1);
                  }
                  75% {
                      transform: translate3d(10px, 0, 0) scaleX(0.98);
                  }
                  90% {
                      transform: translate3d(-5px, 0, 0) scaleX(0.995);
                  }
                  to {
                      transform: translate3d(0, 0, 0);
                  }
                  }
              .summarizing {
                  position: absolute;
                  right: 20px;
                  top: 20px;
                  
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 18px;
                  z-index: 10000 !important;
                  
                  color: #5ca0a1;
                  font-size: 20px;
                  font-weight: 300;
                  box-shadow: 2px 2px 9px 6px rgba(0, 0, 0, 0.11);
                  border-radius: 10px;
                  background: white;
                  
                  animation: bounceInDown 1s;
                  
                  width: 240px;
                  height: 60px;
                  }
                  
                  @keyframes bounceInDown {
                  from,
                  60%,
                  75%,
                  90%,
                  to {
                      animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
                  }
                  
                  0% {
                      opacity: 0;
                      transform: translate3d(0, -3000px, 0) scaleY(3);
                  }
                  
                  60% {
                      opacity: 1;
                      transform: translate3d(0, 25px, 0) scaleY(0.9);
                  }
                  
                  75% {
                      transform: translate3d(0, -10px, 0) scaleY(0.95);
                  }
                  
                  90% {
                      transform: translate3d(0, 5px, 0) scaleY(0.985);
                  }
                  
                  to {
                      transform: translate3d(0, 0, 0);
                  }
                  }
                  
                  .loading {
                  width: 32px;
                  height: 32px;
                  
                  border-radius: 50%;
                  border: 4px solid rgba(92, 160, 161, 0.5);
                  border-top-color: #5ca0a1;
                  border-right-color: #5ca0a1;
                  box-sizing: border-box;
                  
                  animation: spinner 0.8s linear infinite;
                  }
                  
                  @keyframes spinner {
                  from {
                      transform: rotate(0deg);
                  }
                  to {
                      transform: rotate(360deg);
                  }
                  } 
  
                  @keyframes bounceToUp {
  
  
                      from {
                          transform: translate3d(0, 0px, 0);
                      }
  
                      90% {
                          transform: translate3d(0, 15px, 0);
                      }
  
                      to {
                          transform: translate3d(0, -100px, 0);
                      }
  
                  }
            </style>
            <summarize-zip-toast></summarize-zip-toast>
            <summarize-zip-loading></summarize-zip-loading>
            `;

  const mainTemplate = document.createElement('template');

  mainTemplate.innerHTML = `
  <style>
    #summarizeZipWrapper {
      display: none;
      position: fixed !important;
      height: 100% !important;
      margin: 0 !important;
      left: 0 !important;
      z-index: 100000 !important;
      overflow: auto !important;
      background: #f2f2f2 !important;
      width: 350px !important;
      box-shadow: 0 0 5px rgba(50, 50, 50, 0.7) !important;
      box-sizing: border-box;
      padding: 50px 30px;
    }

    .closeButton {
      position: absolute;
      right: 7px;
      top: 10px;
    
      border: 0;
      cursor: pointer;
      background-color: inherit;
    }
    
    .mainSection {
      display: flex;
      flex-direction: column;
    
      align-items: center;
      width: 290px;
    }
    
    .imageContainer {
      display: flex;
      flex-direction: row;
    
      justify-content: center;
      align-items: center;
    
      gap: 20px;
      color: #868484;
    }
    
    .summarizeArea {
      margin-top: 50px;
      width: 250px;
      min-height: 200px;
    
      background-color: white;
    
      padding: 20px;
      box-sizing: border-box;
    }
    
    .summarizeResult {
      list-style: none;
      padding: 0;
    
      font-weight: bold;
      font-size: 15px;
      list-height: 1.5;
    }
    
    .summarizeResult > li:nth-child(1):before {
      content: '1.';
      margin-right: 7px;
    }
    
    .summarizeResult > li:nth-child(1) {
      margin-bottom: 20px;
    }
    
    .summarizeResult > li:nth-child(2):before {
      content: '2.';
      margin-right: 7px;
    }
    
    .summarizeResult > li:nth-child(2) {
      margin-bottom: 20px;
    }
    
    .summarizeResult > li:nth-child(3):before {
      content: '3.';
      margin-right: 7px;
    }
    
    .sentenceSummarize,
    .totalSummarize {
      width: 150px;
      height: 50px;
      font-weight: bold;
    
      margin-top: 50px;
      filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    
      border: 0;
      border-radius: 10px;
      cursor: pointer;
      color: white;
      background-color: #5ca0a1;
    }
    
    .failureUI {
      display: flex;
      flex-direction: column;
    
      justify-content: center;
      align-items: center;
    }
    
    .failureMessage {
      font-size: 20px;
      margin-top: 40px;
      color: black;
    }
    
    .failureSuggestMessage {
      margin-top: 20px;
      color: black;
    }

    .successUI {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      color: black;
      width: 280px
    }
    
    .mainImg {
      object-fit: cover;
    }
    
    .suggestResult {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 20px;
    
      margin-top: 30px;
      color: #868484;
      font-size: 14px;
    }
    
    .summarizeTitle {
      margin-top: 40px;
      font-size: 20px;
    }
    
    .totalSummarizeResult {
      list-style: none;
      padding: 10px;
    
      font-weight: bold;
      font-size: 15px;
      /* list-height: 1.5; */
    }
    
    .totalSummarizeResult > li:nth-child(1):before {
      content: '1.';
      margin-right: 7px;
    }
    
    .totalSummarizeResult > li:nth-child(1) {
      margin-bottom: 20px;
    }
    
    .totalSummarizeResult > li:nth-child(2):before {
      content: '2.';
      margin-right: 7px;
    }
    
    .totalSummarizeResult > li:nth-child(2) {
      margin-bottom: 20px;
    }
    
    .totalSummarizeResult > li:nth-child(3):before {
      content: '3.';
      margin-right: 7px;
    }
    
    .totalSentenceButton {
      align-self: center;
    
      width: 150px;
      height: 50px;
      font-weight: bold;
    
      margin-top: 50px;
      filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    
      border: 0;
      border-radius: 10px;
      cursor: pointer;
      color: white;
      background-color: #5ca0a1;
    }
  </style>
  <div id="summarizeZipWrapper">
  <button class="closeButton" aria-label="닫기">
  <img
    src="https://user-images.githubusercontent.com/53992007/166632199-9962060b-7681-4aca-8fac-db72a8063853.png"
    alt="닫기"
    width="20"
    height="20"
  />
  </button>
  <summary-success class="successUI"></summary-success>
  </div>
  `;

  class SummarizeZipAlarm extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(alarmTemplate.content.cloneNode(true));
    }
  }

  class SummarizeZip extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(mainTemplate.content.cloneNode(true));

      this.shadowRoot.querySelector('.closeButton').addEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
      this.shadowRoot.getElementById('summarizeZipWrapper').setAttribute('style', 'display: hidden');
      [...this.shadowRoot.getElementById('summarizeZipWrapper').children].forEach($el => {
        if ($el.className.match(/UI/)) $el.parentNode.removeChild($el);
      });
      document.documentElement.removeAttribute('data-summarizezip-active');

      chrome.storage.local.set({
        isOpen: false,
      });
    }
  }

  class Toast extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
                <button class="summarizeButton">
                  <img
                  src="https://user-images.githubusercontent.com/53992007/167380232-2dad5af6-9824-4d01-8f2f-7dc65dca06b7.png"
                  alt="summarize-zip"
                  width="30"
                  />
                  <span class="toastAlarmText">Go to summarize</span>
                </button>`;

      this.addEventListener('click', this.handleClick.bind(this));
    }

    disconnectedCallback() {
      customElements.define('summarize-zip-loading', Loading);

      this.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
      const $el = this;
      $el.parentNode.removeChild($el);
    }
  }

  class Loading extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
                  <div class="summarizing">
                      <div class="loading"></div>
                      <span>summarizing...</span>
                  </div>
                  `;

      setTimeout(() => {
        this.querySelector('.summarizing').style.animation = 'bounceToUp 1s ease 0s 1 normal forwards';
        setTimeout(() => {
          this.parentNode.removeChild(this);
        }, 1000);
      }, 3000);
    }
  }

  async function isPopUpToast0(){
    //화이트리스트 방식
    let fullUrl = document.URL;

    let whiteList;

    await fetch("./whitelist.json")
    .then(response => {
      return response.json();
    }).then(jsonData => {whiteList = jsonData})

    fullUrl = fullUrl.replace('https://','');
    urlQuery = fullUrl.split('/');
    keyUrl = urlQuery[0] + '/' + urlQuery[1];

    if(whiteList[keyUrl] == undefined){
      return false;
    }else return true;
  }

  function isPopUpToast1(){ 
    // 불필요한 태그 제거 후 body의 innerText의 length만 확인하는 방식
    // 의외로 효과 좋음

    let doc = document.documentElement.cloneNode(true);
  
    unneccesaryTags = ['script', 'style','head','footer','header','link','iframe','a','em','button','image','svg','video'];

    unneccesaryTags.forEach(el => {
      htmlTag = doc.getElementsByTagName(el);
      htmlList = Array.from(htmlTag);
      htmlList.forEach(element => element.remove());
    });

    let bodyText = doc.getElementsByTagName('body')[0].innerText;

    var regExp = /[\{\}\[\]\/,;:|\)*~`^\-+<>@\#$%&\\\=\(\'\"]/gi;

    bodyText = bodyText.replace(regExp,""); //특수문자 제거(? ! . 는 살려두고)
    bodyText = bodyText.replace(/(\s*)/g, ""); // 탭 엔터 제거

    if(bodyText.length > 3000){
      return true;
    }else return false;
  }

  function isPopUpToast2(){
    // 불필요한 태그 제거 후 body의 innerText에서 정상적인 문장들의 개수를 새어 본문의 존재를 확인하는 방식
    // 구글 검색창에서도 작동하는 문제가 있음, 문장의 개수를 조금 더 보수적으로 잡아볼까 고민중

    let doc = document.cloneNode(true);
  
    unneccesaryTags = ['script', 'style','head','footer','header','link','iframe','a','em','button','image','svg','video'];

    unneccesaryTags.forEach(el => {
      htmlTag = doc.getElementsByTagName(el);
      htmlList = Array.from(htmlTag);
      htmlList.forEach(element => element.remove());
    });

    let bodyText = doc.getElementsByTagName('body')[0].innerText;

    var regExp = /[\{\}\[\]\/,;:|\)*~`^\-+<>@\#$%&\\\=\(\'\"]/gi;

    bodyText = bodyText.replace(regExp,""); //특수문자 제거(? ! . 는 살려두고)
    bodyText = bodyText.replace(/(\t)/g, ""); // 탭 제거
  
    let bodyTextSplit = bodyText.split('\n');
    let sentencenum = 0;
  
    bodyTextSplit.forEach(element => {
      let lastElement = element.charAt(element.length - 1);
      let wordnum = element.split(' ').length;
      
      if((lastElement == '.' ||lastElement == '?' ||lastElement == '!' || element.length > 300) && wordnum > 5){
        let splitElement = element.split(/[.?!]/);

        splitElement.forEach(stc => {
          if(stc.split(' ').length > 5 && stc.split(' ').length < stc.length/2){
            sentencenum++;
          }
        })
      }
    });

    if(sentencenum > 40){
      return true;
    }else return false;
  }

  function isPopUpToast3(){ 
    //document를 pre order traversal하면서 텍스트 노드간의 거리를 확인, 거리들의 표준편차를 확인하여 본문의 유무를 확인하는 방식
    //가설 : 본문이 존재하는 페이지는  본문이 존재하지 않는 페이지보다 표준편차가 상대적으로 적게 잡힐 것이다
    //아직 하는중..... 어려워요.......

    const body = document.querySelector('body');
    let distance = 0;
    preOrder(body, distance);
  }

  function preOrder(distance){
    const node = document.querySelector('body');

    if(node.childElementCount > 0){
      const childList = Array.from(node.children);
      childList.forEach(el => preOrder(el))
    }else{
      let _tagName = node.tagName.toLowerCase;
      if(_tagName == 'div' || _tagName == 'p' || _tagName == 'span')
      if(node.innerText.split(' ').length > 5){
        console.log(node.innerText);
      }
    }
  }


  customElements.define('summarize-zip-alarm', SummarizeZipAlarm);
  customElements.define('summarize-zip', SummarizeZip);
  if(isPopUpToast2()){
    customElements.define('summarize-zip-toast', Toast);
  }
  
});

function temp(){
  unneccesaryTags = ['script', 'style','head','footer','header','link','iframe','a','em','button','image','svg','video'];

  unneccesaryTags.forEach(Element => {
  htmlTag = document.querySelectorAll(Element);
  htmlTag.forEach(Element => Element.remove());
  });


  let bodyText = document.body.innerText;

  var regExp = /[\{\}\[\]\/,;:|\)*~`^\-+<>@\#$%&\\\=\(\'\"]/gi;

  bodyText = bodyText.replace(regExp,""); //특수문자 제거(? ! . 는 살려두고)
  bodyText = bodyText.replace(/(\t)/g, ""); // 탭 제거

  let bodyTextSplit = bodyText.split('\n');
  let sentencenum = 0;

  bodyTextSplit.forEach(element => {
    let lastElement = element.charAt(element.length - 1);
    let wordnum = element.split(' ').length;
    
    if((lastElement == '.' ||lastElement == '?' ||lastElement == '!' || element.length > 300) && wordnum > 5){
      let splitElement = element.split(/[.?!]/);

      splitElement.forEach(stc => {
        if(stc.split(' ').length > 5){
          sentencenum++;
        }
      })
    }
  });
}

function temp2(){
  let list = [];
  function preOrder(node,number){

    if(node.childElementCount > 0){
      const childList = Array.from(node.children);
      childList.forEach(el => preOrder(el))
    }else{
      let _tagName = node.tagName.toLowerCase();
        if(_tagName == 'div' || _tagName == 'p' || _tagName == 'span'){
            let _text = node.innerText;
            var regExp = /[\{\}\[\]\/,;:|\)*~`^\-+<>@\#$%&\\\=\(\'\"]/gi;

            _text = _text.replace(regExp,""); //특수문자 제거(? ! . 는 살려두고)
            _text = _text.replace(/(\t)/g, ""); // 탭 제거

            if(_text.split(' ').length > 3){
                list.push(_text);
            }
        }
    }
  }

const body = document.querySelector('body');
preOrder(body,1);
list
}