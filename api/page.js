import { dirname } from 'path';
import { createRequire } from 'module';

import { fileURLToPath } from 'url';

let __dirname = dirname(fileURLToPath(import.meta.url));
let require = createRequire(import.meta.url);


import watcher from "./contexts/watcher.js"
import google from "./contexts/google.js"
import studio from "./contexts/studio.js"

import * as path from "path"
import * as uuid from "uuid"
import { to } from "await-to-js";
import getVideoInfo from "./getVideoInfo.js"

let methodFunctions = {
    search: require(path.join(__dirname, "/functions/search.cjs")),
    subscribers: require(path.join(__dirname, "/functions/subscribers.cjs")),
    suggestions: require(path.join(__dirname, "/functions/suggestions.cjs")),
}

class YoutubeSelfbotPage {
    page = {}
    extra = {}
    browser = {}
    videoInfo = {}
    CDPSession = null
    id = uuid.v4();
    cookies = ""
    __ignore_video_requests = true
    last_video_request = Date.now()

    constructor(page, extra, browser) {
        this.page = page
        this.extra = extra
        this.browser = browser
    }

    $() { return this.page.$(...arguments) }
    $eval() { return this.page.$eval(...arguments) }
    $$() { return this.page.$$(...arguments) }
    $$eval() { return this.page.$$eval(...arguments) }
    $x() { return this.page.$x(...arguments) }
    addScriptTag() { return this.page.addScriptTag(...arguments) }
    addStyleTag() { return this.page.addStyleTag(...arguments) }
    authenticate() { return this.page.authenticate(...arguments) }
    bringToFront() { return this.page.bringToFront(...arguments) }
    browser() { return this.page.browser(...arguments) }
    browserContext() { return this.page.browserContext(...arguments) }
    click() { return this.page.click(...arguments) }
    close() { return this.page.close(...arguments) }
    content() { return this.page.content(...arguments) }
    createPDFStream() { return this.page.createPDFStream(...arguments) }
    emulate() { return this.page.emulate(...arguments) }
    emulateCPUThrottling() { return this.page.emulateCPUThrottling(...arguments) }
    emulateIdleState() { return this.page.emulateIdleState(...arguments) }
    emulateMediaType() { return this.page.emulateMediaType(...arguments) }
    emulateNetworkConditions() { return this.page.emulateNetworkConditions(...arguments) }
    emulateTimezone() { return this.page.emulateTimezone(...arguments) }
    emulateVisionDeficiency() { return this.page.emulateVisionDeficiency(...arguments) }
    evaluateHandle() { return this.page.evaluateHandle(...arguments) }
    evaluate() { return this.page.evaluate(...arguments) }
    evaluateOnNewDocument() { return this.page.evaluateOnNewDocument(...arguments) }
    exposeFunction() { return this.page.exposeFunction(...arguments) }
    focus() { return this.page.focus(...arguments) }
    frames() { return this.page.frames(...arguments) }
    getDefaultTimeout() { return this.page.getDefaultTimeout(...arguments) }
    goBack() { return this.page.goBack(...arguments) }
    goForward() { return this.page.goForward(...arguments) }
    goto() { return this.page.goto(...arguments) }
    hover() { return this.page.hover(...arguments) }
    isClosed() { return this.page.isClosed(...arguments) }
    isDragInterceptionEnabled() { return this.page.isDragInterceptionEnabled(...arguments) }
    isJavaScriptEnabled() { return this.page.isJavaScriptEnabled(...arguments) }
    isServiceWorkerBypassed() { return this.page.isServiceWorkerBypassed(...arguments) }
    mainFrame() { return this.page.mainFrame(...arguments) }
    metrics() { return this.page.metrics(...arguments) }
    off() { return this.page.off(...arguments) }
    on() { return this.page.on(...arguments) }
    once() { return this.page.once(...arguments) }
    pdf() { return this.page.pdf(...arguments) }
    queryObjects() { return this.page.queryObjects(...arguments) }
    reload() { return this.page.reload(...arguments) }
    removeScriptToEvaluateOnNewDocument() { return this.page.removeScriptToEvaluateOnNewDocument(...arguments) }
    screenshot() { return this.page.screenshot(...arguments) }
    select() { return this.page.select(...arguments) }
    setBypassServiceWorker() { return this.page.setBypassServiceWorker(...arguments) }
    setContent() { return this.page.setContent(...arguments) }
    setDragInterception() { return this.page.setDragInterception(...arguments) }
    setExtraHTTPHeaders() { return this.page.setExtraHTTPHeaders(...arguments) }
    setJavaScriptEnabled() { return this.page.setJavaScriptEnabled(...arguments) }
    setOfflineMode() { return this.page.setOfflineMode(...arguments) }
    tap() { return this.page.tap(...arguments) }
    target() { return this.page.target(...arguments) }
    title() { return this.page.title(...arguments) }
    url() { return this.page.url(...arguments) }
    viewport() { return this.page.viewport(...arguments) }
    waitForDevicePrompt() { return this.page.waitForDevicePrompt(...arguments) }
    waitForFileChooser() { return this.page.waitForFileChooser(...arguments) }
    waitForFrame() { return this.page.waitForFrame(...arguments) }
    waitForFunction() { return this.page.waitForFunction(...arguments) }
    waitForNetworkIdle() { return this.page.waitForNetworkIdle(...arguments) }
    waitForNavigation() { return this.page.waitForNavigation(...arguments) }
    waitForRequest() { return this.page.waitForRequest(...arguments) }
    waitForResponse() { return this.page.waitForResponse(...arguments) }
    waitForSelector() { return this.page.waitForSelector(...arguments) }
    waitForTimeout() { return this.page.waitForTimeout(...arguments) }
    waitForXPath() { return this.page.waitForXPath(...arguments) }
    workers() { return this.page.workers(...arguments) }

    createCDPSession() {
        return new Promise(async (resolve, reject) => {
            this.CDPSession = await this.page.target().createCDPSession().catch(reject)

            resolve()
        })
    }

    gotoVideo(method = "direct", id, options = {}) {
        return new Promise(async (resolve, reject) => {
            this.videoInfo = await getVideoInfo(id, this.extra.proxy, await this.getFormattedCookies())

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

            this.browser.emit("newVideoContext", this.id, good, id)

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
        let context = new studio(this.page, this, this.extra, this.browser)
        return context
    }

    createWatcherContext() {
        let context = new watcher(this.page, this, this.extra, this.browser)
        return context
    }

    createGoogleContext() {
        let context = new google(this.page, this, this.extra, this.browser)
        return context
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

export default YoutubeSelfbotPage;