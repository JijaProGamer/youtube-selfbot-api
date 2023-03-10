const ProxyAgent = require("proxy-agent-v2")
const ytdl = require("better-ytdl-core")
const os = require("os")

//puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())
//puppeteer.use(StealthPlugin)

const browserClass = require("./browser.js");

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
let db = {}

let tempCache = {
    save: (url, data) => {
        db[url] = data
    },
    get: (url) => {
        return db[url]
    }
}

module.exports = class {
    #opts = {}
    #extra = {}

    constructor(browserPath, opts = {}, args = [], extensions = []) {
        let exts = []

        for (let extension of extensions) {
            exts.push(`--load-extension=${extension}`, `--disable-extensions-except=${extension}`)
        }

        let proxy = opts.proxy

        if (proxy && proxy !== "direct://") {
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
            proxy: proxy || "direct://",
            timeout: typeof opts.timeout == "number" ? opts.timeout : 30000,
            autoSkipAds: opts.autoSkipAds,
            cacheDB: opts.cacheDB || tempCache,
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

        if (exts.length < 0) browserArgs.push(`--disable-extensions`)
        if (opts.userDataDir) browserArgs.push(`--user-data-dir=${opts.userDataDir}`)
        if (!opts.dont_mute_audio) browserArgs.push(`--mute-audio`)
        if (opts.no_visuals) browserArgs.push(`--disable-gl-drawing-for-tests`);
        if (opts.headless) browserArgs.push("--headless=chrome")

        this.#opts = {
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
            const puppeteer = require("puppeteer-extra")
            const Fingerprinter = await import('puppeteer-extra-plugin-fingerprinter')
            const StealthPlugin = Fingerprinter.createFingerprinterInterface({
                generator_style: "per_browser",
                fingerprint_generator: {
                    webgl_vendor: (e) => true,
                    webgl_renderer: (e) => true,
                    userAgent: (e) => e.includes("Windows NT 10.0"),
                    language: "en-US,en",
                    //viewport: (e) => e.width > 800 && e.width < 2000 && e.height > 800 && e.height < 1600,
                    viewport: {height: 900, width: 1440},
                    cpus: (e) => e >= 32,
                    memory: (e) => e <= 64,
                    compatibleMediaMimes: (e) => {return e.audio.includes("aac"), e.video["mp4"] && e.video.mp4.length > 0},
                    canvas: {chance: 95, shift: 0},
                  },
                  staticFingerprint: this.#extra.fingerprint,
            })

            puppeteer.use(StealthPlugin)

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
            const puppeteer = require("puppeteer-extra")
            const Fingerprinter = await import('puppeteer-extra-plugin-fingerprinter')
            const StealthPlugin = Fingerprinter.createFingerprinterInterface({
                generator_style: "per_browser",
                proxy: this.#extra.proxy,
                proxy_priority: 10,
                fingerprint_generator: {
                    webgl_vendor: (e) => true,
                    webgl_renderer: (e) => true,
                    userAgent: (e) => e.includes("Windows NT 10.0"),
                    language: () => "en-US,en",
                    viewport: (e) => e.width > 800 && e.width < 2000 && e.height > 800 && e.height < 1600,
                    cpus: (e) => e >= 32,
                    memory: (e) => e <= 64,
                    compatibleMediaMimes: (e) => {return e.audio.includes("aac"), e.video["mp4"] && e.video.mp4.length > 0},
                    canvas: {chance: 95, shift: 0},
                  },
                  staticFingerprint: this.#extra.fingerprint,
            })

            StealthPlugin.enabledEvasions.delete('iframe.contentWindow');
            StealthPlugin.enabledEvasions.delete('navigator.plugins');

            puppeteer.use(StealthPlugin)

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
        return new Promise(async (resolve, reject) => {
            let info

            if (proxy == "direct://" || !proxy) {
                info = await ytdl.getInfo(id, {
                    requestOptions: {
                        headers: {
                            cookie: cookies || ""
                        }
                    }
                }).catch(reject)
            } else {
                let agent = new ProxyAgent(proxy)
                info = await ytdl.getInfo(id, {
                    requestOptions: {
                        agent,
                        headers: {
                            cookie: cookies || ""
                        }
                    }
                }).catch(reject)
            }

            if(!info) return;

            let vFormat = info.formats
                .filter((v) => v.width && v.height)
                .sort((a, b) => a.width - b.width)[0]
            let aFormat = info.formats
                .filter(v => !v.videoCodec)
                .sort((a, b) => a.averageBitrate - b.averageBitrate)[0]

            let aBPS = aFormat.averageBitrate || aFormat.bitrate
            let vBPS = vFormat.averageBitrate || vFormat.bitrate
            let duration = parseFloat(info.videoDetails.lengthSeconds)
            let rate = clamp(duration, 0, 60) / 10
            if (rate == 0) rate = 6

            let isLive = info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails.isLiveNow

            resolve({
                viewCount: parseInt(info.videoDetails.viewCount),
                duration: parseFloat(info.videoDetails.lengthSeconds) || Infinity,
                uploadDate: new Date(info.videoDetails.publishDate),
                isShort: (vFormat.width / vFormat.height) < 1,
                url: info.videoDetails.video_url,
                isLive: isLive,
                title: info.videoDetails.title,
                unlisted: info.videoDetails.isUnlisted,
                format: {
                    resolution: vFormat.qualityLabel,
                    quality: vFormat.quality || "tiny",
                    fps: vFormat.fps || 30,
                    size: (parseFloat(vFormat.contentLength) + parseFloat(aFormat.contentLength)) / 1e+6 || Infinity,
                    mbps: (vBPS + aBPS) / 1e+6 / 10 + 0.00183,
                    mbpm: (vBPS + aBPS) / 1e+6 * rate + 0.11,
                    width: vFormat.width || 256,
                    height: vFormat.height || 144,
                    aspect_ratio: (vFormat.width / vFormat.height) || 1.777777,
                },
                id: id,
            })
        })
    }
}