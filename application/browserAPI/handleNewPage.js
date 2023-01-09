const useProxy = require("puppeteer-page-proxy");
const puppeteerAfp = require("puppeteer-afp");
const cacher = require("puppeteer-cacher");
const ghost = require("ghost-cursor");

/**
 * Creates a new page and adds a few bot bypasses
 *
 * @param {Boolean} noProxy if it should bypass the proxy for this page
 */

function handleNewPage(noProxy) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) 
            reject(new Error(`Please call api.connectBrowser first`));
        
        if (!this.__launched) 
            reject(new Error(`api.connectBrowser was called, but failed doing so`));
        

        let browserPages = await this.browser.pages();

        for (let [index, page] of browserPages.entries()) {
            let url = await page.url();

            if (["ytadblock", "bit.ly"].some((e) => url.includes(e))) {
                page.close();
            }
        }

        const page = puppeteerAfp(await this.browser.newPage());
        page.__cursor = ghost.createCursor(page);

        this.__data.emit(`debug`, `Created a new page`);

        if (this.__extra.blockAds) {
            await page.evaluateOnNewDocument(() => {
                let selectors = {
                    SecurityUrls: [
                        "https://imasdk.googleapis.com/js/core/*",
                        "https://googleads.g.doubleclick.net/pagead/id",
                        "*googleusercontent.com/proxy*",
                        "*static.doubleclick.net/instream/ad_status*",
                        "*el=adunit*"
                    ],
                    DirectBlockElements: [
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
                    ],
                    LoopAndBlockElements: [
                        [
                            ".test-class", "test-text"
                        ],
                        [
                            "ytd-item-section-renderer:nth-child(2)", `\nAd\n`
                        ],
                        [
                            "ytd-item-section-renderer:nth-child(3)", `\nAd\n`
                        ]
                    ],
                    ElementList: {
                        videoAdFound: ".html5-video-player.ad-showing",
                        adskipBtn: ".ytp-ad-skip-button-container",
                        videoAdFoundVideo: ".html5-video-player.ad-showing video",
                        reviewBtnStatus: "true",
                        player: "#below"
                    },
                    SecuritySelectors: [
                        ".ytp-ad-image-overlay",
                        ".ytp-ad-text-overlay",
                        ".ytp-ad-skip-button-container",
                        "ytd-rich-item-renderer ytd-display-ad-renderer",
                        "ytd-player-legacy-desktop-watch-ads-renderer",
                        ".style-scope ytd-item-section-renderer",
                        "#player-ads",
                        "ytd-promoted-sparkles-web-renderer",
                        "ytd-search-pyv-renderer",
                        "#masthead-ad",
                        ".html5-video-player.ad-showing",
                        "true",
                        "ytd-carousel-ad-renderer"
                    ]
                }

                setInterval(() => {
                    let DirectBlockElements = selectors.DirectBlockElements;
                    for (let i = 0; i < DirectBlockElements.length; i++) {
                        let currentElementToBlock = document.querySelector(`${
                            DirectBlockElements[i]
                        }`);
                        currentElementToBlock && currentElementToBlock.getAttribute("display") != "none" && (currentElementToBlock.style.display = "none")
                    }

                    let LoopAndBlockElements = selectors.LoopAndBlockElements;
                    for (let i = 0; i < LoopAndBlockElements.length; i++) {
                        let currentLoopAndBlockElements = document.querySelector(`${
                            LoopAndBlockElements[i][0]
                        }`);
                        let textToSearch = LoopAndBlockElements[i][1];
                        if (currentLoopAndBlockElements && currentLoopAndBlockElements.getAttribute("display") != "none") {
                            if (currentLoopAndBlockElements.innerText.includes(textToSearch)) {
                                currentLoopAndBlockElements.style.display = "none";
                            }
                        }
                    }

                    let videoAdFound = document.querySelector(`${
                        selectors.ElementList.videoAdFound
                    }`)

                    if (videoAdFound) {
                        let adskipBtn = document.querySelector(`${
                            selectors.ElementList.adskipBtn
                        }`)
                        if (adskipBtn) {
                            adskipBtn.click()
                        } else {
                            let videoAdFoundVideo = document.querySelector(`${
                                selectors.ElementList.videoAdFoundVideo
                            }`)
                            if (videoAdFoundVideo) {
                                videoAdFoundVideo.currentTime = isNaN(videoAdFoundVideo.duration) ? 0 : videoAdFoundVideo.duration;
                            }
                        }
                    }
                }, 500);
            });
        }

        //await page.setViewport(this.__device.viewport);

        await page.setRequestInterception(true);
        await page.setBypassCSP(true);

        const session = await page.target().createCDPSession();
        await session.send("Page.enable"); // Disable automatic view stopper
        await session.send("Page.setWebLifecycleState", {state: "active"});
        // await session.send('Network.clearBrowserCookies');

        await page.setCacheEnabled(true);
        await session.send("Network.setCacheDisabled", {cacheDisabled: false});

        page.__client = session;
        this.__data.emit(`debug`, `Spoofed new page`);

        page.on("console", (message) => {
            if (message.type() === "error") {
                this.__data.emit(`pageError`, message.text());
            } else if (message.type() === "warning") {
                this.__data.emit(`pageWarning`, message.text());
            } else if (message.type() === "info") {
                this.__data.emit(`pageInfo`, message.text());
            } else if (message.type() === "log") {
                this.__data.emit(`pageMessage`, message.text());
            }
        }); // Monitor page information

        page.on("pageerror", (message) => this.__data.emit(`pageError`, message.message)); // Oops, error

        let proxy = this.__extra.proxyServer;
        let cache = new cacher(false);

        if (this.__extra.cache && this.__extra.memoryStore) {
            cache.changeMemory(this.__extra.memoryStore);
        }

        page.on("request", async (request) => {
            if (request.isInterceptResolutionHandled()) 
                return;
            

            let type = request.resourceType();
            let url = request.url();

            if (this.__extra.saveBandwith) { // Block useless media
                if ([
                    "image", "font", "other" /*"stylesheet"*/
                ].includes(type)) 
                    return request.abort();
                

                if (type === "media") {
                    if (url.includes("/audio")) 
                        return request.abort();
                    
                }
            }

            this.__data.emit(`requestAccepted`, {
                url: request.url(),
                headers: request.headers()
            });

            if (this.__extra.cache && request.method() == "GET" && (type == "document" || type == "script" || type == "manifest" || url.includes(".json") || url.includes("generate_204"))) {
                cache.get(request, (result, wasFound) => {
                    if (!wasFound) {
                        if (noProxy || ! proxy || proxy == "direct://") 
                            return request.continue();
                        
                        return useProxy(request, proxy);
                    }

                    request.respond(result);
                });
            } else {
                if (noProxy || ! proxy || proxy == "direct://") 
                    return request.continue();
                
                useProxy(request, proxy);
            }
        });

        page.on("response", async (response) => {
            if (response.fromCache()) {
                return;
            }

            let alreadyCached;
            await new Promise((resolve) => {
                cache.get(response.request(), (result, wasFound) => {
                    alreadyCached = result;
                    resolve();
                });
            });

            let url = response.url();
            let type = response.request().resourceType();
            let headers = response.headers();

            if (this.__extra.cache && (type == "document" || type == "script" || type == "manifest" || url.includes(".json") || url.includes("generate_204")) && (! alreadyCached || alreadyCached.expires > Date.now())) {
                if (response.request().method() == "GET") {
                    cache.save(response);
                }
            }

            this.__data.emit(`requestHandled`, {
                method: response.request().method(),
                ip: response.remoteAddress(),
                status: response.status(),
                url: response.url()
            });

            if (!this.__extra.cache || ! alreadyCached || alreadyCached.expires > Date.now()) {
                response.buffer().then((buffer) => {
                    this.__data.emit("bandwithUsed", {
                        bandwith: buffer.length,
                        request: response.request(),
                        response: response,
                        isVideo: url.includes("googlevideo.com"),
                        isAPI: url.includes("/api/") || url.includes("youtubei")
                    });
                }).catch(() => {});
            }
        });

        page.on("requestfailed", (request) => {
            this.__data.emit(`requestFail`, {
                error: request.failure().errorText,
                url: request.url()
            });
        });

        resolve(page);
    });
}

module.exports = handleNewPage;
