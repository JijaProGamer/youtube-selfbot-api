//import * as puppeteer from "puppeteer-extra"
import { generateFingerprint, createFingerprinterInterface } from "puppeteer-extra-plugin-fingerprinter"
let {default: puppeteer} = await import("puppeteer-extra")

let currentProxy

const StealthPlugin = createFingerprinterInterface({
    generator_style: "per_browser",

    fingerprint_generator: {
        webgl_vendor: (e) => true,
        webgl_renderer: (e) => true,
        userAgent: (e) => e.includes("Windows NT 10.0"),
        language: "en-US,en",
        viewport: (e) => e.width > 800 && e.width < 2000 && e.height > 800 && e.height < 1600,
        cpus: (e) => e >= 4,
        memory: (e) => e <= 32,
        compatibleMediaMimes: (e) => { return e.audio.includes("aac"), e.video["mp4"] && e.video.mp4.length > 0 },
        canvas: () => true,
        //proxy: () => currentProxy
    },
    requestInterceptor,
})

puppeteer.use(StealthPlugin)

import * as getVideoInfo from "./api/getVideoInfo.js"
import browserClass from "./api/browser.js"
import * as os from "os"

/*function generateYoutubeFingerprint(){
    return generateFingerprint({
        webgl_vendor: (e) => true,
        webgl_renderer: (e) => true,
        userAgent: (e) => e.includes("Windows NT 10.0"),
        language: "en-US,en",
        viewport: (e) => e.width > 800 && e.width < 2000 && e.height > 800 && e.height < 1600,
        cpus: (e) => e >= 4,
        memory: (e) => e <= 32,
        compatibleMediaMimes: (e) => { return e.audio.includes("aac"), e.video["mp4"] && e.video.mp4.length > 0 },
        canvas: () => true,
    })
}*/

async function requestInterceptor(page, request) {
    let bannedResourceTypes = ["image", "font", "other", "media"]
    let acceptedCookies = ["DEVICE_INFO", "VISITOR_INFO1_LIVE", "GPS"]

    let page_url = page.url()
    let url = request.url()
    let currentCookies = await page.cookies()
    let type = request.resourceType()
    let isLoggedIn = false

    for (let cookie of currentCookies) {
        if (acceptedCookies.includes(cookie.name)) {
            isLoggedIn = true
            break
        }
    }

    if (url.startsWith("data:image")) return "direct"
    if (url.includes("gstatic")) return "direct"

    if (!isLoggedIn && url.includes("googlevideo.com") && !page_url.includes("/shorts/")) return "abort"

    if (request.method() == "GET") {
        let isDocument = type == "document" || type == "script" || type == "manifest" || type == "stylesheet"

        if (bannedResourceTypes.includes(type)) return "abort"
        if (url.includes("fonts.")) return "abort"

        if (isDocument && type == "document") return "proxy"
        if (isDocument) return "direct"
    }

    return "proxy"
}

class selfbot {
    #opts = {}
    #extra = {}

    constructor(browserPath, opts = {}, args = [], extensions = []) {
        let exts = []

        for (let extension of extensions) {
            exts.push(`--load-extension=${extension}`, `--disable-extensions-except=${extension}`)
        }

        let proxy = opts.proxy

        if (proxy && proxy !== "direct://" && proxy !== "direct") {
            if (typeof proxy !== "string") {
                throw new Error("proxy must be a string")
            }

            try {
                let protocol = proxy.split("://")
                if (protocol[1]) {
                    proxy = protocol[1]
                    protocol = protocol.shift()
                } else {
                    proxy = protocol[0]
                    protocol = "http"
                }

                if (proxy.includes("@")) {
                    proxy = `${protocol}://${proxy}`
                } else {
                    let points = proxy.split(":")
                    if (points.length == 4) {
                        proxy = `${protocol}://${points[2]}:${points[3]}@${points[0]}:${points[1]}`
                    } else {
                        proxy = `${protocol}://${points[0]}:${points[1]}`
                    }
                }
            } catch (err) {
                throw new Error(err)
            }
        }

        this.#extra = {
            proxy: proxy || "direct",
            timeout: typeof opts.timeout == "number" ? opts.timeout : 30000,
            autoSkipAds: opts.autoSkipAds,
            fingerprint: opts.fingerprint
        }

        let browserArgs = [...args, ...exts,
            //"--disable-accelerated-2d-canvas",
            "--no-sandbox",
            "--start-maximized",
            "--ignore-certificate-errors",
            "--disable-sync",

            '--allow-pre-commit-input',
            '--disable-background-networking',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-breakpad',
            '--disable-client-side-phishing-detection',
            '--disable-component-extensions-with-background-pages',
            '--disable-component-update',
            '--disable-default-apps',
            '--disable-dev-shm-usage',
            '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
            '--disable-hang-monitor',
            '--disable-ipc-flooding-protection',
            '--disable-popup-blocking',
            '--disable-prompt-on-repost',
            '--disable-renderer-backgrounding',
            '--disable-sync',
            //'--enable-automation',
            '--enable-blink-features=IdleDetection',
            '--enable-features=NetworkServiceInProcess2',
            '--export-tagged-pdf',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-first-run',
            '--password-store=basic',
            '--use-mock-keychain',
            '--hide-scrollbars',

            "--in-process-gpu",
            "--enable-low-res-tiling",
            "--enable-low-end-device-mode",
            "--disable-site-isolation-trials",
            "--renderer-process-limit=1"
        ]

        if (os.platform() !== "win32") {
            browserArgs.push(`--no-zygote`, `--disable-setuid-sandbox`);
            //browserArgs.push(`--single-process`);
        }

        //if(opts.cacheDir) browserArgs.push(`--disk-cache-dir=${opts.cacheDir}`)

       // if (exts.length < 0) browserArgs.push(`--disable-extensions`)
        if (opts.userDataDir) browserArgs.push(`--user-data-dir=${opts.userDataDir}`)
        if (!opts.dont_mute_audio) browserArgs.push(`--mute-audio`)
        if (opts.no_visuals) browserArgs.push(`--disable-gl-drawing-for-tests`);

        this.#opts = {
            headless: opts.headless ? true : false,
            executablePath: browserPath,
            timeout: this.#extra.timeout,
            ignoreHTTPSErrors: true,
            ignoreDefaultArgs: true,
            defaultViewport: null,
            args: browserArgs,
        }
    }

    launch() {
        return new Promise(async (resolve, reject) => {
            /*let fingerprint = this.#extra.fingerprint || generateYoutubeFingerprint()
            fingerprint.proxy = this.#extra.proxy

            const StealthPlugin = createFingerprinterInterface({
                staticFingerprint: fingerprint,
                requestInterceptor,
            })

            //StealthPlugin.enabledEvasions.delete('navigator.plugins');
            puppeteer.use(StealthPlugin)*/

            currentProxy = this.#extra.proxy

            puppeteer.launch(this.#opts)
                .then(async (browser) => {
                    let cs = new browserClass(browser, this.#opts, this.#extra)

                    cs.setup().then(() => {
                        resolve(cs)
                    }).catch(reject)
                }).catch(reject)
        })
    }

    connect(wsEndpoint) {
        return new Promise(async (resolve, reject) => {
            /*let fingerprint = this.#extra.fingerprint || generateYoutubeFingerprint()
            fingerprint.proxy = this.#extra.proxy

            const StealthPlugin = createFingerprinterInterface({
                generator_style: "per_browser",
                staticFingerprint: fingerprint,
                requestInterceptor
            })

            //StealthPlugin.enabledEvasions.delete('navigator.plugins');
            puppeteer.use(StealthPlugin)*/

            currentProxy = this.#extra.proxy

            puppeteer.connect({ ...this.#opts, browserWSEndpoint: wsEndpoint })
                .then((browser) => {
                    let cs = new browserClass(browser, this.#opts, this.#extra)
                    cs.setup().then(() => {
                        resolve(cs)
                    }).catch(reject)
                }).catch(reject)
        })
    }

    getID(url) {
        let regex = /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm
        let found = regex.exec(url)

        if (found && found.length > 1 && found[3]) {
            return found[3]
        } else {
            if (url.length >= 11 && url.length <= 12) {
                return url
            }
        }

        return
    }

    getVideoInfo(id, proxy, cookies) {
        return new Promise((resolve, reject) => {
            getVideoInfo(id, proxy, cookies)
            .then(resolve)
            .catch(reject)
        })
    }
}

export {selfbot}
export default selfbot;