
let currentUrl = window.location.href;
let selectors = [];
let localFlag = false;
let container = document.createElement("div");
container.setAttribute("class", "ytblocker");
container.style.cssText = `
    display: flex;
    justify-content: end;
    align-items: center;
    margin: 5px 0px;
`;
let notes = document.createElement("p");
notes.innerText = chrome.i18n.getMessage("appTitle");
notes.setAttribute("class", "notes");
notes.style.cssText = `
    font-size: 12px;
    font-weight: 500;
    color: #444444;
`;
let rateus = document.createElement("button");
rateus.setAttribute("class", "rateus");
rateus.innerText = "Rate us";
rateus.style.cssText = `
    margin-left: 5px;
    border: none;
    outline: none;
    background: #cc0000;
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: 0px 0px 3px 0px grey;
`;
rateus.addEventListener("click", () => {
    // rateus.innerText = "Copied ✅";
    // setTimeout(() => {
    //     rateus.innerText = "Share";
    // }, 1000);
    // navigator.clipboard.writeText("https://chrome.google.com/webstore/detail/adblock-for-youtube/meeigimblnoededboeggpdknokefoece");
    window.open("https://chrome.google.com/webstore/detail/autoskip-for-youtube/hmbnhhcgiecenbbkgdoaoafjpeaboine/reviews")
});

let closeBtn = document.createElement("p");
closeBtn.setAttribute("class", "close-share-btn");
closeBtn.innerText = "❌";
closeBtn.style.cssText = `
    margin: 0px 9px;
    font-size: 7px;
    cursor: pointer;
`;

closeBtn.addEventListener("click", () => {
    chrome.storage.sync.set({ flag: true });
    localFlag = true;
    container.remove();
})
container.appendChild(notes);
container.appendChild(rateus);
container.appendChild(closeBtn);

chrome.storage.sync.get(null, (e) => {
    // console.log(e);
    let flag = e.flag;
    if (flag) {
        localFlag = true;
    }
    (selectors = e.selectors),
    // console.log(selectors)
        currentUrl.includes("youtube.com") &&
        setInterval(() => {

            let DirectBlockElements = selectors.DirectBlockElements;
            for(let i = 0; i < DirectBlockElements.length; i++){
                let currentElementToBlock = document.querySelector(`${DirectBlockElements[i]}`);
                currentElementToBlock && currentElementToBlock.getAttribute("display") != "none" && (currentElementToBlock.style.display = "none")
            }

            let LoopAndBlockElements = selectors.LoopAndBlockElements;
            for(let i = 0; i < LoopAndBlockElements.length; i++){
                let currentLoopAndBlockElements = document.querySelector(`${LoopAndBlockElements[i][0]}`);
                let textToSearch = LoopAndBlockElements[i][1];
                if(currentLoopAndBlockElements && currentLoopAndBlockElements.getAttribute("display") != "none"){
                    if(currentLoopAndBlockElements.innerText.includes(textToSearch)){
                        currentLoopAndBlockElements.style.display = "none";
                    }
                }
            }

            let reviewBtnStatus = selectors.ElementList.reviewBtnStatus;
            if (reviewBtnStatus == "true" && !flag && !localFlag) {
                if (!document.querySelector(".ytblocker")) {
                    let player = document.querySelector(`${selectors.ElementList.player}`);
                    if (player) {
                        player.prepend(container);
                    }
                }
            }

            // Skip ads
            let videoAdFound = document.querySelector(`${selectors.ElementList.videoAdFound}`)

            if(videoAdFound){
                let adskipBtn = document.querySelector(`${selectors.ElementList.adskipBtn}`)
                if(adskipBtn){
                    adskipBtn.click()
                }else{
                    let videoAdFoundVideo = document.querySelector(`${selectors.ElementList.videoAdFoundVideo}`)
                    if(videoAdFoundVideo){
                        videoAdFoundVideo.currentTime = isNaN(videoAdFoundVideo.duration) ? 0 : videoAdFoundVideo.duration;
                    }
                }
            }
        }, 500);
});
