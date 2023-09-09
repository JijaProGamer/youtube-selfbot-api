
import * as fs from "fs"
import * as path from "path"
import got from "got"

import pageClass from "./page.js"
import { firefox } from "playwright"
import countryLocaleMap from 'country-locale-map';

import { dirname } from 'path';
import { createRequire } from 'module';

import { fileURLToPath } from 'url';

let __dirname = dirname(fileURLToPath(import.meta.url));
let require = createRequire(import.meta.url);

let extensions = fs.readdirSync(path.join(__dirname, "/defaultExtensions"))
    .map((v) => v = path.join(__dirname, "/defaultExtensions/", v))
    .map((v) => v = require(v))

class YoutubeSelfbotBrowser {
    opts = {}
    eventStore = {}
    context = {}
    extra = {}
    ipInfo = {}

    constructor(opts, extra) {
        this.opts = opts
        this.extra = extra
    }

    isConnected() { return this.context.isConnected(...arguments) }
    pages() { return this.context.browserContexts(...arguments) }
    process() { return this.context.process(...arguments) }
    target() { return this.context.target(...arguments) }
    targets() { return this.context.targets(...arguments) }
    userAgent() { return this.context.userAgent(...arguments) }
    version() { return this.context.version(...arguments) }
    waitForTarget() { return this.context.waitForTarget(...arguments) }
    wsEndpoint() { return this.context.wsEndpoint(...arguments) }
    close() { return this.context.close(...arguments) }

    async setup() {
        return new Promise(async (resolve, reject) => {
            got({
                url: "https://lumtest.com/myip.json"
            }).then((result) => {
                this.ipInfo = JSON.parse(result.body)

                firefox.launchPersistentContext(this.extra.userDataDir, {
                    ...this.opts,
                    geolocation: {
                        latitude: this.ipInfo.geo.latitude,
                        longitude: this.ipInfo.geo.longitude,
                        accuracy: Math.random() / 2 + 0.5
                    },
                    locale: countryLocaleMap.getLocaleByAlpha2(this.ipInfo.geo.country),
                    timezoneId: this.ipInfo.geo.tz
                }).then(async (context) => {
                    this.context = context
                    await this.context.setDefaultTimeout(this.extra.timeout)
                    await this.context.setDefaultNavigationTimeout(this.extra.timeout)

                    for (let extension of extensions) {
                        if (await extension.verify(this.extra)) {
                            await this.context.addInitScript(extension.code).catch(reject)
                        }
                    }

                    await this.context.addInitScript(() => {
                        let DateNow = Date.now()
                        let DateYear = DateNow + 31536000000
                        localStorage.setItem('yt-player-quality', `{\"data\":\"{\\\"quality\\\":144,\\\"previousQuality\\\":240}\",\"expiration\":${DateYear},\"creation\":${DateNow}}`);
                    }).catch(reject)

                    resolve()
                }).catch(reject)
            }).catch(reject)
        })
    }

    clearStorage() {
        return new Promise(async (resolve, reject) => {
            let page = await this.context.newPage().catch(reject)

            await page.clearCookies().catch(reject)

            await page.goto("https://www.youtube.com").catch(reject)
            await page.evaluate(() => localStorage.clear()).catch(reject)

            await page.close().catch(reject)

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
                const [ page ] = await Promise.all([
                    this.context.waitForEvent('page'),
                    (await this.context.pages())[0].evaluate(() => window.open('about:blank'))
                ]);

                let pgClass = new pageClass(page, this.extra, this)

                /*page.on("response", async (res) => {
                    let req = res.request()
                    let page_url = await page.url()
                    let url = await req.url()

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
                })*/

                resolve(pgClass)
            } catch (err) {
                console.log(err)
                reject(new Error(err))
            }
        })
    }
}

export default YoutubeSelfbotBrowser;