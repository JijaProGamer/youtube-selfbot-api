const fs = require("fs")
const path = require("path")

let pageClass = require("./page.js");
const puppeeer = require("puppeteer");
let extensions = fs.readdirSync(path.join(__dirname, "/defaultExtensions"))
    .map((v) => v = path.join(__dirname, "/defaultExtensions/", v))
    .map((v) => v = require(v))


module.exports = class YoutubeSelfbotBrowser {
    opts = {}
    eventStore = {}
    internal_browser = {}
    extra = {}
    ipInfo = {}
    setTimezone = false

    constructor(browser, opts, extra) {        
        this.internal_browser = browser
        this.opts = opts
        this.extra = extra
    }

    browserContexts(){ return this.internal_browser.browserContexts(...arguments) }
    createIncognitoBrowserContext(){ return this.internal_browser.createIncognitoBrowserContext(...arguments) }
    defaultBrowserContext(){ return this.internal_browser.defaultBrowserContext(...arguments) }
    disconnect(){ return this.internal_browser.disconnect(...arguments) }
    isConnected(){ return this.internal_browser.isConnected(...arguments) }
    pages(){ return this.internal_browser.browserContexts(...arguments) }
    process(){ return this.internal_browser.process(...arguments) }
    target(){ return this.internal_browser.target(...arguments) }
    targets(){ return this.internal_browser.targets(...arguments) }
    userAgent(){ return this.internal_browser.userAgent(...arguments) }
    version(){ return this.internal_browser.version(...arguments) }
    waitForTarget(){ return this.internal_browser.waitForTarget(...arguments) }
    wsEndpoint(){ return this.internal_browser.wsEndpoint(...arguments) }

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
            let page = await this.internal_browser.newPage().catch(reject)
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
            let browser = this.internal_browser
            let pages = await browser.pages().catch(reject)

            pages.map(async (page) => await page.close().catch(reject))
            await browser.close().catch(reject)

            resolve()
        })
    }

    on(name, event) {
        this.eventStore[name] = event
    }

    emit() {
        let args = Object.values(arguments)

        let name = args.shift()
        let event = this.eventStore[name]

        if (event) {
            event(...args)
        }
    }

    async newPage() {
        return new Promise(async (resolve, reject) => {
            try {
                let page = await this.internal_browser.newPage().catch(reject)
                let pgClass = new pageClass(page, this.extra, this)
                await pgClass.createCDPSession()

                await page.setBypassCSP(true).catch(reject)

                await pgClass.CDPSession.send("Page.enable").catch(reject)
                await pgClass.CDPSession.send("Page.setWebLifecycleState", { state: "active" }).catch(reject)

                await page.setDefaultTimeout(this.extra.timeout)
                await page.setDefaultNavigationTimeout(this.extra.timeout)

                for (let extension of extensions) {
                    if (await extension.verify(page, this.extra)) {
                        await page.evaluateOnNewDocument(extension.code).catch(reject)
                    }
                }

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
                            length += JSON.stringify(headers).length
                            length += `CONNECT ${url}:443`.length

                            this.emit("bandwith", pgClass.id, rType, length)
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

                resolve(pgClass)
            } catch (err) {
                console.log(err)
                reject(new Error(err))
            }
        })
    }
}
