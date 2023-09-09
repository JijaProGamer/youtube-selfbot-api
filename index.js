import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

import getVideoInfo from "./api/getVideoInfo.js"
import browserClass from "./api/browser.js"

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

    constructor(opts = {}) {
        if (opts.proxy && opts.proxy !== "direct://" && opts.proxy !== "direct") {
            if (typeof opts.proxy !== "string") {
                throw new Error("proxy must be a string")
            }

            try {
                let protocol = opts.proxy.split("://")
                if (protocol[1]) {
                    opts.proxy = protocol[1]
                    protocol = protocol.shift()
                } else {
                    opts.proxy = protocol[0]
                    protocol = "http"
                }

                if (opts.proxy.includes("@")) {
                    opts.proxy = `${protocol}://${opts.proxy}`
                } else {
                    let points = opts.proxy.split(":")
                    if (points.length == 4) {
                        opts.proxy = `${protocol}://${points[2]}:${points[3]}@${points[0]}:${points[1]}`
                    } else {
                        opts.proxy = `${protocol}://${points[0]}:${points[1]}`
                    }
                }
            } catch (err) {
                throw new Error(err)
            }
        }

        if (!opts.userDataDir || !fs.existsSync(opts.userDataDir)) {
            const timestamp = Date.now()
            const randomString = crypto.randomBytes(4).toString('hex')
            const tempFolderName = `temp_${timestamp}_${randomString}`

            const tempDir = os.tmpdir()
            const tempFolderPath = path.join(tempDir, tempFolderName)
            opts.userDataDir = tempFolderPath

            try {
                fs.mkdirSync(tempFolderPath);
            } catch (err) {
                throw new Error(`Error creating temporary folder: ${err}`);
            }
        }

        this.#extra = {
            proxy: opts.proxy || "direct",
            timeout: typeof opts.timeout == "number" ? opts.timeout : 30000,
            autoSkipAds: opts.autoSkipAds,
            fingerprint: opts.fingerprint,
            userDataDir: opts.userDataDir
        }

        this.#opts = {
            headless: opts.headless,
            timeout: this.#extra.timeout,
            viewport: null
        }
    }

    launch() {
        return new Promise(async (resolve, reject) => {

                    let cs = new browserClass(this.#opts, this.#extra)

                    cs.setup().then(() => {
                        resolve(cs)
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

export { selfbot }
export default selfbot;