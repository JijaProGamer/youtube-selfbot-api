let watcher = require("./contexts/watcher.js")
let google = require("./contexts/google.js")
let studio = require("./contexts/studio.js")

const uuid = require("uuid")
const to = require("await-to-js").default
const ProxyAgent = require("proxy-agent-v2")
const ytdl = require("better-ytdl-core")

let methodFunctions = {
    search: require("./functions/search.js"),
    subscribers: require("./functions/subscribers.js"),
    suggestions: require("./functions/suggestions.js"),
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

module.exports = class {
    page = {}
    #extra = {}
    #browser = {}
    videoInfo = {}
    CDPSession = {}
    id = uuid.v4();
    cookies = ""
    __ignore_video_requests = true
    last_video_request = Date.now()

    constructor(page, extra, browser) {
        this.page = page
        this.#extra = extra
        this.#browser = browser
    }

    gotoVideo(method = "direct", id, options = {}) {
        return new Promise(async (resolve, reject) => {
            let info

            if (this.#extra.proxy == "direct://") {
                info = await ytdl.getInfo(id, {
                    requestOptions: {
                        headers: {
                            cookie: await this.getFormattedCookies()
                        }
                    }
                }).catch(reject)
            } else {
                let agent = new ProxyAgent(this.#extra.proxy)
                info = await ytdl.getInfo(id, {
                    requestOptions: {
                        agent,
                        headers: {
                            cookie: await this.getFormattedCookies(),
                        }
                    }
                }).catch(reject)
            }

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

            this.videoInfo = {
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
            }

            let methods = []

            if (typeof method == "string") {
                methods = [method]
            } else {
                let directIndex = method.indexOf("direct")
                if (directIndex > -1) {
                    method.splice(directIndex, 1)
                }

                method.push("direct")
                methods = method
            }

            let success = true
            let good = "direct";

            for (let method of methods) {
                switch (method) {
                    case "direct":
                        await this.page.goto(this.videoInfo.url).catch(reject)
                        break
                    case "search":
                        var [err, wasFound] = await to(methodFunctions.search(this, options))
                        success = !(err || !wasFound)

                        break;
                    case "suggestions":
                        var [err, wasFound] = await to(methodFunctions.suggestions(this, options))
                        success = !(err || !wasFound)

                        break;
                    case "subscribers":
                        var [err, wasFound] = await to(methodFunctions.subscribers(this, options))
                        success = !(err || !wasFound)

                        break;
                    default:
                        success = false
                        break;
                }

                if (success) {
                    good = method
                    break
                }

                success = true
            }

            this.#browser.emit("newVideoContext", this.id, good, id)

            let watcherContext = this.createWatcherContext()
            watcherContext.setup().then(() => {
                resolve(watcherContext)
            }).catch(reject)

        })
    }

    setupGoogle() {
        return new Promise(async (resolve, reject) => {
            let googleContext = this.createGoogleContext()
            await googleContext.setup().catch(reject)

            resolve(googleContext)
        })
    }

    setupStudio() {
        return new Promise(async (resolve, reject) => {
            let studioContext = this.createStudioContext()
            //await studioContext.setup().catch(reject)

            resolve(studioContext)
        })
    }

    createStudioContext() {
        let context = new studio(this.page, this, this.#extra, this.#browser)
        return context
    }

    createWatcherContext() {
        let context = new watcher(this.page, this, this.#extra, this.#browser)
        return context
    }

    createGoogleContext() {
        let context = new google(this.page, this, this.#extra, this.#browser)
        return context
    }

    close() {
        return new Promise(async (resolve, reject) => {
            this.page.close().catch(reject).then(resolve)
        })
    }

    getCookies() {
        return new Promise(async (resolve, reject) => {
            let raw_cookies_full = (await this.CDPSession.send('Network.getAllCookies').catch(reject)).cookies
            let raw_cookies = await this.page.cookies().catch(reject)
            let cookies = raw_cookies
            //let cookies = [...raw_cookies, ...raw_cookies_full]

            let result = []
            let blacklist = [
                "ACCOUNT_CHOOSER",
                "LSID"
            ]

            for (let cookie of cookies) {
                if (!blacklist.includes(cookie.name)) {
                    result.push(cookie)
                }
            }

            resolve(cookies)
        })
    }

    async getFormattedCookies(existing) {
        return new Promise(async (resolve, reject) => {
            let raw_cookies = existing || await this.getCookies().catch(reject)

            let cookies = ""

            for (let [index, cookie] of raw_cookies.entries()) {
                if (cookie.value && cookie.name && cookie.name.length > 0 && cookie.value !== "undefined") {
                    if (index < raw_cookies.length - 1) {
                        cookies += `${cookie.name}=${cookie.value}; `
                    } else {
                        cookies += `${cookie.name}=${cookie.value}`
                    }
                }
            }

            resolve(cookies)
        })
    }

    async setCookies(cookies) {
        return new Promise(async (resolve, reject) => {
            if (typeof cookies == "string") {
                try {
                    cookies = JSON.parse(cookies)
                } catch (err) {
                    cookies = cookies.split("; ")
                    let res = []

                    for (let cookie of cookies) {
                        let parts = cookie.split("=")
                        let name = parts.shift()
                        let value = parts.join("=")
                        res.push({
                            name,
                            value,
                            domain: ".google.com",
                            path: "/",
                            expires: Date.now() + 657000000,
                            size: name.length + value.length,

                            httpOnly: false,
                            secure: true,
                            sesion: false,
                            sameSite: "None",
                            sameParty: false,
                            sourceScheme: "Secure",
                            sourcePort: 443,
                        })
                    }

                    cookies = res
                }
            }


            this.cookies = await this.getFormattedCookies(cookies).catch(reject)
            await this.CDPSession.send("Network.setCookies", { cookies: cookies }).catch(reject)

            resolve()
        })
    }

    async clearCookies() {
        return new Promise(async (resolve, reject) => {
            await this.CDPSession.send('Network.clearBrowserCookies').catch(reject)
            resolve()
        })
    }
}