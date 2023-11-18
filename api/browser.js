
import * as fs from "fs"
import * as path from "path"
import got from "got"

import { calculateRequestSize, calculateResponseSize } from 'puppeteer-bandwidth-calculator';
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";

import { ConnectFingerprinter, GenerateFingerprint } from "playwright-anti-fingerprinter";

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

const setAgent = (proxy) => {
    if (proxy.startsWith("socks")) {
        return {
            http: new SocksProxyAgent(proxy),
            https: new SocksProxyAgent(proxy)
        };
    }
    return {
        http: new HttpProxyAgent(proxy),
        https: new HttpsProxyAgent(proxy)
    };
};

function fingerprintGenerator() {
    return GenerateFingerprint("firefox", {
        webgl_vendor: (e) => e.includes("Google Inc."),
        webgl_renderer: (e) => true,
        language: (e) => e.includes("en"),
        userAgent: (e) => e.includes("Windows"),
        viewport: (e) => e.width > 1000 && e.height > 800 && e.width < 2000 && e.height < 2000,
        cpu: (e) => e <= 24 && e >= 4,
        memory: (e) => true,
        compatibleMediaMime: (e) => e.audio.includes("aac") && e.video["mp4"] && e.video.mp4.length > 0,
        canvas: (e) => true,
    })
}

let bannedResourceTypes = ["image", "font", "other", "media"]
async function shouldProxyRequest(page, request) {
    return 2;
    try {
        let acceptedCookies = ["DEVICE_INFO", "VISITOR_INFO1_LIVE", "GPS"]

        let page_url = page.url()
        let url = request.url()
        let currentCookies = await page.context().cookies()
        let type = request.resourceType()

        if (url.startsWith("data:image")) return 1
        if (url.includes("gstatic")) return 1

        let isLoggedIn = false

        for (let cookie of currentCookies) {
            if (acceptedCookies.includes(cookie.name)) {
                isLoggedIn = true
                break
            }
        }

        if (!isLoggedIn && url.includes("googlevideo.com") && !page_url.includes("/shorts/")) return 3

        if (request.method() == "GET") {
            let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"

            //if (bannedResourceTypes.includes(type)) return 3
            //if (url.includes("fonts.")) return 3

            if (isDocument && type == "document") return 2
            if (isDocument) return 1
        }

        return 2
    } catch (err) {
        console.error(err)
        return 3
    }
}

async function requestInterceptor(page, requestData, route) {
    let request = route.request()
    let shouldProxy = await shouldProxyRequest(page, request)

    switch (shouldProxy) {
        case 3:
            return "abort"
        case 2:
            return "proxy"
        case 1:
            return "direct"
    }
}

class YoutubeSelfbotBrowser {
    opts = {}
    eventStore = {}
    context = {}
    extra = {}
    ipInfo = {}
    #firstPageCreated = false

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
                url: "https://lumtest.com/myip.json",
                agent: this.extra.proxy ? setAgent(this.extra.proxy) : undefined
            }).then((result) => {
                this.ipInfo = JSON.parse(result.body)

                firefox.launchPersistentContext(this.extra.userDataDir, {
                    ...this.opts,

                    serviceWorkers: "block",
                    geolocation: {
                        latitude: this.ipInfo.geo.latitude,
                        longitude: this.ipInfo.geo.longitude,
                        //accuracy: Math.random() / 2 + 0.5
                    },
                    locale: countryLocaleMap.getLocaleByAlpha2(this.ipInfo.geo.country),
                    timezoneId: this.ipInfo.geo.tz
                }).then(async (context) => {
                    this.context = context

                    context.setDefaultTimeout(this.extra.timeout)
                    context.setDefaultNavigationTimeout(this.extra.timeout)

                    for (let extension of extensions) {
                        if (await extension.verify(this.extra)) {
                            await context.addInitScript(extension.code).catch(reject)
                        }
                    }

                    await context.addInitScript(() => {
                        let DateNow = Date.now()
                        let DateYear = DateNow + 31536000000
                        localStorage.setItem('yt-player-quality', `{\"data\":\"{\\\"quality\\\":144,\\\"previousQuality\\\":240}\",\"expiration\":${DateYear},\"creation\":${DateNow}}`);
                        localStorage.setItem('yt-player-volume', `{"data":"{\\"volume\\":0,\\"muted\\":false}","expiration":${DateYear},"creation":${DateNow}}`);
                    }).catch(reject)

                    resolve()
                }).catch(reject)
            }).catch(reject)
        })
    }

    clearStorage() {
        return new Promise(async (resolve, reject) => {
            try {
                const [page] = await Promise.all([
                    this.context.waitForEvent('page'),
                    (await this.context.pages())[0].evaluate(() => window.open('about:blank'))
                ]);
                await page.context().clearCookies();

                await page.goto("https://www.youtube.com");
                await page.evaluate(() => localStorage.clear());

                await page.close();

                resolve();
            } catch (err) {
                reject(err);
            }
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
                const [page] = await Promise.all([
                    this.context.waitForEvent('page'),
                    (await this.context.pages())[0].evaluate(() => window.open('about:blank'))
                ]);

                if (!this.#firstPageCreated) {
                    this.#firstPageCreated = true;
                    (await this.context.pages())[0].close()
                }

                let pgClass = new pageClass(page, this.extra, this)
                let fingerprint = this.extra.fingerprint || {
                    ...fingerprintGenerator(),
                    proxy: this.extra.proxy
                }

                await ConnectFingerprinter("firefox", page, {
                    fingerprint,
                    requestInterceptor
                })

                this.fingerprint = fingerprint

                page.on("response", async (res) => {
                    let req = res.request()

                    let isVideo = (await req.url()).includes("googlevideo.com")

                    if (isVideo) {
                        if (pgClass.__onContinue) {
                            pgClass.__onContinue()
                            pgClass.__onContinue = undefined
                        }
                    }

                    let shouldCalculateRequestSize = await shouldProxyRequest(page, req) == 2

                    if (shouldCalculateRequestSize) {
                        this.emit("bandwith", pgClass.id, "download", await calculateRequestSize(req))
                        this.emit("bandwith", pgClass.id, "upload", await calculateResponseSize(res))
                    }
                })

                resolve(pgClass)
            } catch (err) {
                reject(new Error(err))
            }
        })
    }
}

export default YoutubeSelfbotBrowser;