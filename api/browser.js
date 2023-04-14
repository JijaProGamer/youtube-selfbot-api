const fs = require("fs")

const path = require("path")
const useProxy = require('puppeteer-page-proxy');

let bannedResourceTypes = ["image", "font", "other", "media"]

let pageClass = require("./page.js");
let extensions = fs.readdirSync(path.join(__dirname, "/defaultExtensions"))
    .map((v) => v = path.join(__dirname, "/defaultExtensions/", v))
    .map((v) => v = require(v))

let ACCEPTED_COOKIES = [
    "DEVICE_INFO",
    "VISITOR_INFO1_LIVE",
    "GPS",
]

function route(proxy, request) {
    if (proxy == "abort") {
        return request.abort()
    }

    if (proxy == "direct://") {
        return request.continue()
    }

    useProxy(request, proxy)
}

module.exports = class {
    #opts = {}
    #eventStore = {}
    #browser = {}
    #extra = {}
    ipInfo = {}
    setTimezone = false

    constructor(browser, opts, extra) {
        this.#browser = browser
        this.#opts = opts
        this.#extra = extra
    }

    async setup() {
        return new Promise(async (resolve, reject) => {
            let { page } = await this.newPage().catch(reject)
            await page.goto(`https://lumtest.com/myip.json`, { waitUntil: "networkidle0" }).catch(reject)
            let content = await page.evaluate(() => document.body.innerText).catch(reject)

            try {
                this.ipInfo = JSON.parse(content)
                await page.close().catch(reject)

                resolve()
            } catch (err) {
                await page.close().catch(reject)

                reject(err)
            }

            resolve()
        })
    }

    clearStorage() {
        return new Promise(async (resolve, reject) => {
            let page = await this.#browser.newPage().catch(reject)
            const client = await page.target().createCDPSession().catch(reject)

            await client.send('Network.clearBrowserCookies').catch(reject)

            await page.goto("https://www.youtube.com").catch(reject)
            await page.evaluate(() => localStorage.clear()).catch(reject)

            await page.close().catch(reject)

            resolve()
        })
    }

    async close() {
        return new Promise(async (resolve, reject) => {
            let browser = this.#browser
            let pages = await browser.pages().catch(reject)

            pages.map(async (page) => await page.close().catch(reject))
            await browser.close().catch(reject)

            resolve()
        })
    }

    on(name, event) {
        this.#eventStore[name] = event
    }

    emit() {
        let args = Object.values(arguments)

        let name = args.shift()
        let event = this.#eventStore[name]

        if (event) {
            event(...args)
        }
    }

    async newPage() {
        return new Promise(async (resolve, reject) => {
            try {
                let page = await this.#browser.newPage().catch(reject)
                let pgClass = new pageClass(page, this.#extra, this)
                pgClass.CDPSession = await page.target().createCDPSession().catch(reject)

                await page.setRequestInterception(true).catch(reject)
                await page.setBypassCSP(true).catch(reject)

                await pgClass.CDPSession.send("Page.enable").catch(reject)
                await pgClass.CDPSession.send("Page.setWebLifecycleState", { state: "active" }).catch(reject)

                page.setDefaultTimeout(this.#extra.timeout)
                page.setDefaultNavigationTimeout(this.#extra.timeout)

                for (let extension of extensions) {
                    if (await extension.verify(page, this.#extra)) {
                        await page.evaluateOnNewDocument(extension.code).catch(reject)
                    }
                }

                let usableProxy = this.#extra.proxy !== "direct://" && this.#extra.proxy || undefined

                page.on('request', async (request) => {
                    if (request.isInterceptResolutionHandled()) return

                    try {
                        let page_url = await page.url()
                        let url = await request.url()
                        let type = request.resourceType()

                        if (url.startsWith("data:image")) return request.continue()

                        if (url.includes("accounts.google.com"))
                            return route(usableProxy, request)

                        if (url.includes("gstatic"))
                            return route("direct://", request)

                        if (url.includes("generate_204"))
                            return route(usableProxy, request)

                        //return route(usableProxy, request)

                        /*if (url.includes("googlesyndication")) {
                            return request.abort()
                        }*/

                        let currentCookies = await page.cookies()
                        let isLoggedIn = false

                        for (let cookie of currentCookies) {
                            if (ACCEPTED_COOKIES.includes(cookie.name)) {
                                isLoggedIn = true
                                break
                            }
                        }

                        if (!isLoggedIn && url.includes("googlevideo.com") && !page_url.includes("/shorts/"))
                            return route("abort", request)

                        if (request.method() == "POST")
                            return route(usableProxy, request)

                        let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"
                        if (url.includes("ip=") || url.includes("myip"))
                            return route(usableProxy, request)

                        if (request.method() == "GET") {
                            if (bannedResourceTypes.includes(type))
                                return route("abort", request)
                            if (url.includes("fonts."))
                                return route("abort", request)

                            if (!url.includes(`pagead`) &&
                                !url.includes(`api`) &&
                                !url.includes("ip=")) {
                                let pResponse = await this.#extra.cacheDB.get(url)
                                if (pResponse) {
                                    if (pResponse.expires >= Date.now()) {
                                        return request.respond(pResponse)
                                    }
                                }
                            }

                            if (isDocument && type == "document") return route(usableProxy, request)
                            if (isDocument) return route("direct://", request)
                        }

                        route(usableProxy, request)
                    } catch (err) { console.log(err) }
                });

                page.on("response", async (res) => {
                    let req = res.request()
                    let page_url = await page.url()
                    let url = await req.url()

                    if (!res.fromCache()) {
                        let status = res.status()
                        let type = req.resourceType()
                        let headers = res.headers()

                        let isVideo = url.includes("googlevideo.com")

                        if (isVideo) {
                            if (pgClass.__onContinue) {
                                pgClass.__onContinue()
                                pgClass.__onContinue = undefined
                            }
                        }

                        if ((req.method() == "GET" || isVideo) && (status < 300 || status > 399)) {
                            let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"
                            let rType

                            if (isDocument) {
                                rType = "document"
                            } else if (isVideo) {
                                rType = "video"
                            } else {
                                rType = "api"
                            }

                            let buffer

                            try {
                                buffer = await res.buffer()
                            } catch (err) {

                            }

                            let length = parseInt(headers["content-length"]) || (buffer && Buffer.byteLength(buffer) || 0)
                            this.emit("bandwith", pgClass.id, rType, length)

                            if (isDocument && !page_url.includes("/signin/") && !url.includes("ip")) {
                                let cacheControl = headers["cache-control"]
                                let maxAge = cacheControl.split(" ")
                                    .filter(v => v.includes("max-age"))[0]

                                if (maxAge && buffer) {
                                    maxAge = parseFloat(maxAge.split("=")[1])

                                    if (maxAge > 0) {
                                        this.#extra.cacheDB.save(url, {
                                            status: res.status(),
                                            headers: headers,
                                            body: buffer,
                                            expires: Date.now() + maxAge
                                        })
                                    }
                                }
                            }
                        }
                    }
                })

                await page.evaluateOnNewDocument(() => {
                    let DateNow = Date.now()
                    let DateYear = DateNow + 31536000000
                    localStorage.setItem('yt-player-quality', `{\"data\":\"{\\\"quality\\\":144,\\\"previousQuality\\\":240}\",\"expiration\":${DateYear},\"creation\":${DateNow}}`);
                }).catch(reject)

                if (this.ipInfo.geo && this.ipInfo.geo.tz && !this.setTimezone) {
                    this.setTimezone = true
                    await page.emulateTimezone(this.ipInfo.geo.tz).catch(reject)
                }

                await page.setCacheEnabled(true).catch(reject)
                await pgClass.CDPSession.send("Network.setCacheDisabled", { cacheDisabled: false }).catch(reject)
                await page.setBypassCSP(true).catch(reject)

                /*let cookie = {
                    name: "CONSENT",
                    value: `PENDING+${random(50, 999)}`,
                    expires: Date.now() + 63072000000,
                }
        
                await page.setCookie(
                    {...cookie, domain: ".youtube.com"}, 
                    {...cookie, domain: ".google.com"},
                )*/

                resolve(pgClass)
            } catch (err) {
                reject(new Error(err))
            }
        })
    }
}
