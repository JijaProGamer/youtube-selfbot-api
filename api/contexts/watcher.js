
let videoStates_shorts = ["PLAYING", "PAUSED", "FINISHED"]
let videoStates_normal = ["PLAYING", "PAUSED", "BUFFERING"]

videoStates_normal[-1] = "FINISHED"

function parseNumber(str) {
    const match = str.match(/^([\d.]+)([KMB]?)$/i);
    if (!match) return NaN;

    let [_, num, suffix] = match;
    num = parseFloat(num);

    switch (suffix.toUpperCase()) {
        case "K": return num * 1_000;
        case "M": return num * 1_000_000;
        case "B": return num * 1_000_000_000;
        default: return num;
    }
}

class watcherContext {
    #page = {}
    #parent = {}
    #extra = {}
    #browser = {}

    constructor(page, parent, extra, browser) {
        this.#page = page
        this.#parent = parent
        this.#extra = extra
        this.#browser = browser
    }

    setup() {
        return new Promise(async (resolve, reject) => {
            try {
                let currentCookies = await this.#browser.context.cookies().catch(reject)
                let isLoggedIn = currentCookies.some((v) => v.name == "SOCS")

                if (!isLoggedIn) {
                    /*let rejectCookies = await Promise.race([
                        this.#page.waitForSelector("#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:nth-child(1) > yt-button-shape > button"),
                        this.#page.waitForSelector("xpath=/xpath/html/body/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/form[2]/div/div/button/div[1]"),
                    ]).catch(reject)
                    if (!rejectCookies) return;

                    await Promise.all([
                        this.#page.waitForNavigation({ waitUntil: "load" }),
                        rejectCookies.click(),
                    ]).catch(reject)*/

                    let declineSelector = "#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:nth-child(1) > yt-button-shape > button"

                    let rejectCookies = await Promise.race([
                        this.#page.waitForSelector(declineSelector, {timeout: 10 * 1000}),
                        //page.waitForSelector("xpath=/xpath/html/body/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/form[2]/div/div/button/div[1]"),
                    ]).catch(() => {})
                    if (rejectCookies){
                        rejectCookies.click();
            
                        await this.#page.waitForSelector(declineSelector, { state: 'hidden' });
                    }
                }

                //if (!this.#parent.videoInfo.isLive) {
                await Promise.race([
                    this.#page.waitForSelector(`#segmented-buttons-wrapper`),
                    this.#page.waitForSelector(`ytd-segmented-like-dislike-button-renderer`),
                    this.#page.waitForSelector(`#comments-button`),
                    this.#page.waitForSelector(`.ytSegmentedLikeDislikeButtonViewModelHost`),
                    this.#page.waitForSelector(`#title`),
                ]).catch(reject)
                //}

                let isShort = !!(await this.#page.$("#comments-button").catch(reject)) && !this.#parent.videoInfo.isLive
                let playerSelector = isShort ? `#shorts-player` : `#movie_player`
                let videoStates = isShort ? videoStates_shorts : videoStates_normal
                let playerElement = await this.#page.waitForSelector(playerSelector).catch(reject)

                await Promise.race([
                    this.#page.waitForSelector(".html5-video-container > video"),
                    this.#page.waitForSelector("#shorts-player > div.html5-video-container > video")
                ]).catch(reject)

                this.#parent.videoInfo.isShort = isShort && !this.#parent.videoInfo.isLive
                this.#parent.last_video_request = Date.now()

                let lastState

                let videoStateChanged = (newState) => {
                    this.#browser.emit("videoStateChanged", lastState, videoStates[newState - 1])
                    lastState = videoStates[newState - 1]
                }

                const hasVideoStateChanged = await this.#page.evaluate(() => !!window.videoStateChanged);
                if (!hasVideoStateChanged) {
                    await this.#page.exposeFunction("videoStateChanged", videoStateChanged).catch(reject)
                } else {
                    await playerElement.evaluate(p => {
                        p.removeEventListener('onStateChange', videoStateChanged)
                    }).catch(reject)
                }

                await playerElement.evaluate(p => {
                    p.addEventListener('onStateChange', videoStateChanged)
                }).catch(reject)

                if (this.#parent.videoInfo.isLive) {
                    /*this.#page.evaluate(() => {
                        document.querySelector(".html5-endscreen").style.display
                    })*/

                    /*this.#page.evaluate(() => {
                        let interval = setInterval(async () => {
                            let video = document.querySelector("video")
                            let lastTime = await getLastTime()
    
                            if (video) {
                                if ((Date.now() - lastTime) > 10000) {
                                    clearInterval(interval)
                                    livestreamEnded()
                                }
                            }
    
                            /*let streamInfo = document.querySelector(`yt-formatted-string.ytd-watch-metadata:nth-child(1) > span:nth-child(3)`)
                            if(streamInfo){
                                let text = streamInfo.innerText
                                if(text.includes("Streamed live") && !text.includes("Started streaming")){
                                    clearInterval(interval)
                                    livestreamEnded(text)
                                }
                            }
                        }, 1000)
                    })*/
                }

                this.#parent.__onContinue = resolve
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async resolutions() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate(() => {
                return document.getElementById('movie_player').getAvailableQualityLevels()
            }).then(resolve).catch(reject)
        })
    }

    async setResolution(quality = "tiny") {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate((quality) => {
                document.getElementById('movie_player').setPlaybackQualityRange(quality)
            }, quality).catch(reject).then(resolve)
        })
    }

    async pause() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate(() => {
                let video = Array.from(document.querySelectorAll("video")).pop()
                video.pause()
            }).catch(reject).then(resolve)
        })
    }

    async play() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate((isShorts) => {
                let video = isShorts ? document.querySelector("#shorts-player > div.html5-video-container > video") : document.querySelector(".html5-video-container > video")
                video.play()
            }, this.#parent.videoInfo.isShort).catch(reject).then(resolve)
        })
    }

    async seek(time) {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate(([time, isShorts]) => {
                let video = isShorts ? document.querySelector("#shorts-player > div.html5-video-container > video") : document.querySelector(".html5-video-container > video")
                video.currentTime = time
            }, [time, this.#parent.videoInfo.isShort]).catch(reject).then(resolve)
        })
    }

    async time() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate((isShorts) => {
                let video = isShorts ? document.querySelector("#shorts-player > div.html5-video-container > video") : document.querySelector(".html5-video-container > video")
                return video.currentTime
            }, this.#parent.videoInfo.isShort).catch(reject).then(resolve)
        })
    }

    async duration() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate((isShorts) => {
                let video = isShorts ? document.querySelector("#shorts-player > div.html5-video-container > video") : document.querySelector(".html5-video-container > video")
                return video.duration
            }, this.#parent.videoInfo.isShort).catch(reject).then(resolve)
        })
    }

    async like() {
        return new Promise(async (resolve, reject) => {
            let em = await Promise.race([
                this.#page.waitForSelector(`#top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div.smartimation__content > div > like-button-view-model > toggle-button-view-model > button-view-model > button`),
            ]).catch(reject)

            if (em) await em.click().catch(reject)

            resolve(!!em)
        })
    }

    async dislike() {
        return new Promise(async (resolve, reject) => {
            let em = await Promise.race([
                this.#page.waitForSelector(`#top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div.smartimation__content > div > dislike-button-view-model > toggle-button-view-model > button-view-model > button`),
            ]).catch(reject)

            if (em) await em.click().catch(reject)

            resolve(!!em)
        })
    }

    async subscribe() {
        return new Promise(async (resolve, reject) => {
            let em = await Promise.race([
                this.#page.waitForSelector(`#subscribe-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill`),
            ]).catch(reject)

            if (em) await em.click().catch(reject)

            resolve(!!em)
        })
    }

    async areCommentsLocked() {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(false)
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async reply(text, container) {
        return new Promise(async (resolve, reject) => {
            const reply_first_button = await container.$(
                'ytd-comment-view-model > #body > #main > #action-buttons > #toolbar > #reply-button-end > yt-button-shape > button'
            ).catch(reject)
            await reply_first_button.click()


            const textRootSelector = 'ytd-comment-view-model > #body > #main > #action-buttons > #reply-dialog > ytd-comment-reply-dialog-renderer > #commentbox > #thumbnail-input-row > #main > #creation-box > tp-yt-paper-input-container > .input-wrapper > #labelAndInputContainer .ytd-commentbox > .ytd-commentbox > .ytd-commentbox > .ytd-commentbox > #contenteditable-root';
            await this.#page.waitForSelector(textRootSelector, { state: 'attached' });
            const textRoot = await container.$(textRootSelector).catch(reject);

            await textRoot.scrollIntoViewIfNeeded()
            await textRoot.waitForElementState('visible')
            await textRoot.type(text, { delay: 100 })


            const reply_button = await container.$(
                'ytd-comment-view-model > #body > #main > #action-buttons > #reply-dialog > ytd-comment-reply-dialog-renderer > #commentbox > #thumbnail-input-row > #main > #footer > #buttons > #submit-button > yt-button-shape > button'
            ).catch(reject)
            await reply_button.click()
        })
    }

    async listComments(num, timeout){
        return new Promise(async (resolve, reject) => {
            try {
                const viewport = await this.#page.viewportSize()
                const x = viewport.width / 2
                const y = viewport.height * 0.9
            
                const started = Date.now()
                while(true){
                    let loadedComments = await this.#getLoadedComments()
                    
                    if(loadedComments.length >= num){
                        await this.#page.mouse.wheel(0, -5000000)
                        return resolve(loadedComments.slice(0, num))
                    }

                    if (Date.now() - started >= timeout) {
                        await this.#page.mouse.wheel(0, -5000000)
                        return resolve(loadedComments)
                    }

                    await this.#page.mouse.move(x, y);
                    await this.#page.waitForTimeout(500);
                    await this.#page.mouse.wheel(0, 5000);
                }
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async #getLoadedComments(){
        return new Promise(async (resolve, reject) => {
            try {
                const commentContainers = await this.#page.$$('#comments > ytd-item-section-renderer > #contents > ytd-comment-thread-renderer');

                let comments = [];

                for (const container of commentContainers) {
                    const commentText = await container.$$eval(
                        'ytd-comment-view-model > #body > #main > #expander > #content > #content-text > span',
                        spans => spans.map(span => span.innerText.trim()).join(' ')
                    ).catch(reject);

                    const author = await container.$eval(
                        'ytd-comment-view-model > #body > #main > #header > #header-author > h3 > a > span',
                        span => span.innerText.trim()
                    ).catch(reject);

                    const likes = await container.$eval(
                        'ytd-comment-view-model > #body > #main > #action-buttons > #toolbar > #vote-count-middle',
                        span => span.innerText.trim()
                    ).catch(reject);

                    const replies = await container.$eval(
                        '#replies > ytd-comment-replies-renderer > #expander > .expander-header > .more-button > ytd-button-renderer > yt-button-shape > button > .yt-spec-button-shape-next__button-text-content > span',
                        span => span.innerText.trim()
                    ).catch(() => '0');

                    comments.push({ 
                        text: commentText, 
                        author: author, 
                        likes: parseNumber(likes), 
                        replies: parseInt(replies), 
                        container: container,
                    });
                }

                resolve(comments)
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async comment(message) {
        return new Promise(async (resolve, reject) => {
            if(await this.areCommentsLocked().catch(reject)){
                return reject(new Error("Unable to make comment because video has comments locked."))
            }

            try {
                if (this.#parent.videoInfo.isShort) {
                    let comments = await this.#page.waitForSelector(`div:nth-child(3) > ytd-reel-player-overlay-renderer:nth-child(1) > div:nth-child(2) > div:nth-child(4) > ytd-button-renderer:nth-child(1) > yt-button-shape:nth-child(1) > label:nth-child(1) > button:nth-child(1)`).catch(reject)
                    await comments.click().catch(reject)

                    let em = await this.#page.waitForSelector(`#placeholder-area`).catch(reject)
                    await em.click().catch(reject)

                    await this.#page.keyboard.type(message, 25).catch(reject)

                    let submit = await this.#page.waitForSelector(`#submit-button`).catch(reject)
                    await submit.click().catch(reject)

                    let background = await this.#page.waitForSelector(`#visibility-button > ytd-button-renderer > yt-button-shape > button`).catch(reject)
                    await background.click().catch(reject)
                } else if (this.#parent.videoInfo.isLive) {
                    let chatFrame = this.#page.frames().find(f => f.url().includes("live_chat"))
                    if (!chatFrame) {
                        reject(new Error("Unable to find livestream chat"))
                    }

                    let em = await chatFrame.waitForSelector(`yt-live-chat-text-input-field-renderer.style-scope`).catch(reject)
                    await em.click().catch(reject)

                    await this.#page.keyboard.type(message, 25).catch(reject)

                    let submit = await chatFrame.waitForSelector(`#message-buttons > #send-button > yt-button-renderer > yt-button-shape > button`).catch(reject)
                    await submit.click().catch(reject)
                } else {
                    let em = await this.#page.waitForSelector(`#placeholder-area`).catch(reject)
                    await em.click().catch(reject)

                    await this.#page.keyboard.type(message, 25).catch(reject)

                    let submit = await this.#page.waitForSelector(`#submit-button`).catch(reject)
                    await submit.click().catch(reject)
                }

                resolve()
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async isAdPlaying() {
        return new Promise(async (resolve, reject) => {
            await this.#page.evaluate(() => {
                let DirectBlockElements = [
                    ".ytp-ad-image-overlay",
                    ".ytp-ad-text-overlay",
                    "ytd-rich-item-renderer ytd-display-ad-renderer",
                    "ytd-player-legacy-desktop-watch-ads-renderer",
                    ".style-scope ytd-item-section-renderer #ad-badge",
                    "#player-ads",
                    "ytd-promoted-sparkles-web-renderer",
                    "ytd-search-pyv-renderer",
                    "#masthead-ad",
                    "ytd-carousel-ad-renderer",
                    "ytd-promoted-sparkles-text-search-renderer"
                ];

                let LoopAndBlockElements = [
                    [
                        ".test-class", "test-text"
                    ],
                    [
                        "ytd-item-section-renderer:nth-child(2)", `\nAd\n`
                    ],
                    [
                        "ytd-item-section-renderer:nth-child(3)", `\nAd\n`
                    ]
                ]

                let found

                let videoAdFoundVideo = document.querySelector(`.html5-video-player.ad-showing video`)
                if (videoAdFoundVideo) {
                    let video = document.querySelector("video")
                    let adskipBtn = Array.from(document.querySelectorAll(`[id^="ad-text:"]`))
                    adskipBtn = adskipBtn[adskipBtn.length - 2]
                    if (adskipBtn) {
                        let adTime = parseInt(adskipBtn.innerText)

                        if (adskipBtn.style.display !== "none") {
                            return {
                                type: "video",
                                currentTime: video.currentTime,
                                duration: video.duration || 0,
                                canSkip: false,
                                skipIn: adTime
                            }
                        } else {
                            return {
                                type: "video",
                                duration: video.duration || 0,
                                canSkip: true,
                            }
                        }
                    }
                }
                

                for (let i = 0; i < DirectBlockElements.length; i++) {
                    let currentElementToBlock = document.querySelector(DirectBlockElements[i]);
                    if (currentElementToBlock && currentElementToBlock.style.display !== "none") {
                        found = "small"
                    }
                }

                for (let i = 0; i < LoopAndBlockElements.length; i++) {
                    let currentLoopAndBlockElements = document.querySelector(LoopAndBlockElements[i][0])

                    let textToSearch = LoopAndBlockElements[i][1];
                    if (currentLoopAndBlockElements && currentLoopAndBlockElements.style.display !== "none") {
                        if (currentLoopAndBlockElements.innerText.includes(textToSearch)) {
                            found = "small"
                        }
                    }
                }

                return { type: found }
            }).catch(reject).then(resolve)
        })
    }

    async skipAd(force) {
        return new Promise(async (resolve, reject) => {
            return await this.#page.evaluate((force) => {
                let DirectBlockElements = [
                    ".ytp-ad-image-overlay",
                    ".ytp-ad-text-overlay",
                    "ytd-rich-item-renderer ytd-display-ad-renderer",
                    "ytd-player-legacy-desktop-watch-ads-renderer",
                    ".style-scope ytd-item-section-renderer #ad-badge",
                    "#player-ads",
                    "ytd-promoted-sparkles-web-renderer",
                    "ytd-search-pyv-renderer",
                    "#masthead-ad",
                    "ytd-carousel-ad-renderer",
                    "ytd-promoted-sparkles-text-search-renderer",
                ];

                let LoopAndBlockElements = [
                    [
                        ".test-class", "test-text"
                    ],
                    [
                        "ytd-item-section-renderer:nth-child(2)", `\nAd\n`
                    ],
                    [
                        "ytd-item-section-renderer:nth-child(3)", `\nAd\n`
                    ]
                ]

                let skipped = false

                if (force) {
                    let videoAdFoundVideo = document.querySelector(`.html5-video-player.ad-showing video`)
                    if (videoAdFoundVideo) {
                        videoAdFoundVideo.currentTime = isNaN(videoAdFoundVideo.duration) ? 0 : videoAdFoundVideo.duration;
                    }
                }

                let adskipBtn = document.querySelector(`.ytp-ad-skip-button-container`) || document.querySelector(".ytp-skip-ad-button") || document.querySelector(".ytp-skip-ad-button-modern.ytp-button") || document.querySelector(`.ytp-ad-skip-button-text`)
                if (adskipBtn) {
                    adskipBtn.click()
                    skipped = true
                } else {
                    for (let i = 0; i < DirectBlockElements.length; i++) {
                        let currentElementToBlock = document.querySelector(DirectBlockElements[i]);
                        if (currentElementToBlock && currentElementToBlock.style.display != "none") {
                            currentElementToBlock.style.display = "none"
                            skipped = true
                        }
                    }

                    for (let i = 0; i < LoopAndBlockElements.length; i++) {
                        let currentLoopAndBlockElements = document.querySelector(LoopAndBlockElements[i][0])

                        if (currentLoopAndBlockElements && currentLoopAndBlockElements.style.display != "none") {
                            if (currentLoopAndBlockElements.innerText.includes(LoopAndBlockElements[i][1])) {
                                currentLoopAndBlockElements.style.display = "none";
                                skipped = true
                            }
                        }
                    }
                }

                return skipped
            }, force).catch(reject).then(resolve)
        })
    }
}

export default watcherContext;