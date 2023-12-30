
let videoStates_shorts = ["PLAYING", "PAUSED", "FINISHED"]
let videoStates_normal = ["PLAYING", "PAUSED", "BUFFERING"]

videoStates_normal[-1] = "FINISHED"

let ACCEPTED_COOKIES = [
    "DEVICE_INFO",
    "VISITOR_INFO1_LIVE",
    "GPS",
    "SSID", "HSID"
]

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
                let isLoggedIn = false

                if (!currentCookies) return;
                for (let cookie of currentCookies) {
                    if (ACCEPTED_COOKIES.includes(cookie.name)) {
                        isLoggedIn = true
                        break
                    }
                }

                if (!isLoggedIn) {
                    let rejectCookies = await Promise.race([
                        this.#page.waitForSelector("#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:last-child > yt-button-shape > button"),
                        this.#parent.waitForXPath("/html/body/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/form[2]/div/div/button/div[1]"),
                    ]).catch(reject)
                    if (!rejectCookies) return;

                    await Promise.all([
                        this.#page.waitForNavigation({ waitUntil: "load" }),
                        rejectCookies.click(),
                    ]).catch(reject)
                }

                //if (!this.#parent.videoInfo.isLive) {
                await Promise.race([
                    this.#page.waitForSelector(`.YtSegmentedLikeDislikeButtonViewModelHost`),
                    this.#page.waitForSelector(`#segmented-buttons-wrapper`),
                    this.#page.waitForSelector(`ytd-segmented-like-dislike-button-renderer`),
                    this.#page.waitForSelector(`#comments-button`),
                ]).catch(reject)
                //}

                let isShort = !!(await this.#page.$("#comments-button").catch(reject)) && !this.#parent.videoInfo.isLive
                let playerSelector = isShort ? `#shorts-player` : `#movie_player`
                let videoStates = isShort ? videoStates_shorts : videoStates_normal
                let playerElement = await this.#page.waitForSelector(playerSelector).catch(reject)

                await this.#page.waitForSelector("video").catch(reject)

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
            this.#page.evaluate(() => {
                let video = Array.from(document.querySelectorAll("video")).pop()
                video.play()
            }).catch(reject).then(resolve)
        })
    }

    async seek(time) {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate((time) => {
                let video = Array.from(document.querySelectorAll("video")).pop()
                video.currentTime = time
            }, time).catch(reject).then(resolve)
        })
    }

    async time() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate(() => {
                let video = Array.from(document.querySelectorAll("video")).pop()
                return video.currentTime
            }).catch(reject).then(resolve)
        })
    }

    async duration() {
        return new Promise(async (resolve, reject) => {
            this.#page.evaluate(() => {
                let video = Array.from(document.querySelectorAll("video")).pop()
                return video.duration
            }).catch(reject).then(resolve)
        })
    }

    async like() {
        return new Promise(async (resolve, reject) => {
            let em = await Promise.race([
                this.#page.waitForSelector(`ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > segmented-like-dislike-button-view-model:nth-child(1) > yt-smartimation:nth-child(1) > div:nth-child(1) > div:nth-child(1) > like-button-view-model:nth-child(1) > toggle-button-view-model:nth-child(1) > button:nth-child(1) > yt-touch-feedback-shape:nth-child(3) > div:nth-child(1) > div:nth-child(2)`),
            ]).catch(reject)

            if (em) await em.click().catch(reject)

            resolve(!!em)
        })
    }

    async dislike() {
        return new Promise(async (resolve, reject) => {
            let em = await Promise.race([
                this.#page.waitForSelector(`ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > segmented-like-dislike-button-view-model:nth-child(1) > yt-smartimation:nth-child(1) > div:nth-child(1) > div:nth-child(1) > dislike-button-view-model:nth-child(2) > toggle-button-view-model:nth-child(1) > button:nth-child(1) > yt-touch-feedback-shape:nth-child(2) > div:nth-child(1) > div:nth-child(2)`),
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

                let skipped = false

                if (force) {
                    let videoAdFoundVideo = document.querySelector(`.html5-video-player.ad-showing video`)
                    if (videoAdFoundVideo) {
                        videoAdFoundVideo.currentTime = isNaN(videoAdFoundVideo.duration) ? 0 : videoAdFoundVideo.duration;
                    }
                }

                let adskipBtn = document.querySelector(`.ytp-ad-skip-button-container`)
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