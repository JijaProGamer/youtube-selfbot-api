let watcher = require("./contexts/watcher.js")
let google = require("./contexts/google.js")
let studio = require("./contexts/studio.js")

const uuid = require("uuid")
const to = require("await-to-js").default
const getVideoInfo = require("./getVideoInfo")

let methodFunctions = {
    search: require("./functions/search.js"),
    subscribers: require("./functions/subscribers.js"),
    suggestions: require("./functions/suggestions.js"),
}

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
            this.videoInfo = await getVideoInfo(id, this.#extra.proxy, await this.getFormattedCookies())

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