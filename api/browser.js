
import * as fs from "fs"
import * as path from "path"

import { plugin } from 'playwright-with-fingerprints';

import { calculateRequestSize, calculateResponseSize } from 'puppeteer-bandwidth-calculator';

import pageClass from "./page.js"

import { dirname } from 'path';
import { createRequire } from 'module';

import { fileURLToPath } from 'url';

let __dirname = dirname(fileURLToPath(import.meta.url));
let require = createRequire(import.meta.url);

let extensions = fs.readdirSync(path.join(__dirname, "/defaultExtensions"))
    .filter((v) => v.endsWith(".cjs"))
    .map((v) => v = path.join(__dirname, "/defaultExtensions/", v))
    .map((v) => v = require(v))

let extensionsApps = fs.readdirSync(path.join(__dirname, "/defaultAppExtensions"))
    .filter((v) => v.endsWith(".cjs"))
    .map((v) => v = path.join(__dirname, "/defaultAppExtensions/", v))
    .map((v) => v = require(v))


async function loadFingerprint(hash, folder) {
    const filePath = path.join(folder, `${hash}.fp`)
    
    if (fs.existsSync(filePath)) {
        const fingerprint = fs.readFileSync(filePath, 'utf8');
        return fingerprint;
    }
    
    return null;
}

async function getRandomFingerprint(folder) {
    const files = fs.readdirSync(folder);
    const jsonFiles = files.filter(file => file.endsWith('.fp'));

    const randomIndex = Math.floor(Math.random() * jsonFiles.length);
    const randomFingerprintHash = jsonFiles[randomIndex].replace('.fp', '');
    return loadFingerprint(randomFingerprintHash, folder);
}


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
    addCookies() { return this.context.addCookies(...arguments) }

    async setup() {
        return new Promise(async (resolve, reject) => {
            let fingerprint = await getRandomFingerprint(path.join(import.meta.dirname, "../fingerprints"))

            const userPrefs = [];

            if(this.extra.muteAudio){
                userPrefs.push("--mute-audio")
            }


            const extensionsUsing = []

            for (let extension of extensionsApps) {
                if (await extension.verify(this.extra)) {
                    extensionsUsing.push(path.join(path.join(__dirname, "/defaultAppExtensions/", await extension.extension_path())))
                }
            }

            if (extensionsUsing.length > 0){
                const extensionsString = extensionsUsing.join(",")
                userPrefs.push(`--disable-extensions-except=${extensionsString}`)
                userPrefs.push(`--load-extension=${extensionsString}`)
            }


            plugin.useProxy(this.extra.proxy, {
                changeBrowserLanguage: true,
                changeGeolocation: true,
                changeWebRTC: "replace", // or "enable"
                changeTimezone: true,
                enableQUIC: false // Most proxies dont support UDP
            })
            plugin.useFingerprint(fingerprint, {
                safeElementSize: true,
            });

            const browser = await plugin.launchPersistentContext(this.opts.userDataDir, {
                ...this.opts,
                //serviceWorkers: "block",
                //bypassCSP: true,
                args: userPrefs
            });

            this.browser = browser
            this.context = browser

            this.context.setDefaultTimeout(this.extra.timeout)
            this.context.setDefaultNavigationTimeout(this.extra.timeout)

            //await (await this.context.newPage()).goto("about:blank") // making initial page

            for (let extension of extensions) {
                if (await extension.verify(this.extra)) {
                    await this.context.addInitScript(extension.code).catch(reject)
                }
            }

            let DateNow = Date.now()

            let audioVolume = Math.sqrt(Math.random());
            if(audioVolume < 0.2){
                audioVolume = 0;
            }

            await this.context.addInitScript(([extra, DateNow, audioVolume]) => {
                let DateYear = DateNow + 31536000000

                audioVolume = Math.round(audioVolume * 100 / 5) * 5;

                localStorage.setItem('yt-player-quality', `{\"data\":\"{\\\"quality\\\":144,\\\"previousQuality\\\":240}\",\"expiration\":${DateYear},\"creation\":${DateNow}}`);
                localStorage.setItem('yt-player-volume', `{\"data\":\"{\\\"volume\\\":${audioVolume},\\\"muted\\\":${audioVolume == 0}}\",\"expiration\":${DateYear},\"creation\":${DateNow}}`)

                if(extra.useAV1){
                    localStorage.setItem('yt-player-av1-pref', `8192`);
                }
            }, [this.extra, DateNow, audioVolume]).catch(reject)

            resolve()
        })
    }

    clearStorage() {
        return new Promise(async (resolve, reject) => {
            try {
                const [page] = await Promise.all([
                    this.context.waitForEvent('page'),
                    (await this.context.pages())[0].evaluate(() => window.open('about:blank'))
                ]);
                //const page = await this.context.newPage()

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
        const [page] = await Promise.all([
            this.context.waitForEvent('page'),
            (await this.context.pages())[0].evaluate(() => window.open('about:blank'))
        ]);

        //const page = await this.context.newPage()

        if (!this.#firstPageCreated) {
            this.#firstPageCreated = true;
            (await this.context.pages())[0].close()
        }

        let pgClass = new pageClass(page, this.extra, this)
        await pgClass.initPage()

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

        return pgClass
    }
}

export default YoutubeSelfbotBrowser;