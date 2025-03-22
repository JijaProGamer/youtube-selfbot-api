import { dirname } from 'path';
import { createRequire } from 'module';

import { ConnectFingerprinter } from "playwright-anti-fingerprinter";

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
    $x(a, b) { return this.page.$$(`xpath=${a}`,b) }
    addScriptTag() { return this.page.addScriptTag(...arguments) }
    addStyleTag() { return this.page.addStyleTag(...arguments) }
    authenticate() { return this.page.authenticate(...arguments) }
    bringToFront() { return this.page.bringToFront(...arguments) }
    browserContext() { return this.browser.context }
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
    waitForXPath(arg) { return this.page.waitForSelector(`xpath=${arg}`) }
    workers() { return this.page.workers(...arguments) }

    async initPage(){
        await this.page.unroute("**/**")

        let evasionsIgnored = []

        //if(this.extra.ignorePluginsStealth){
            evasionsIgnored.push("plugins")
        //}

        await ConnectFingerprinter("firefox", this.page, {
            fingerprint: this.browser.fingerprint,
            requestInterceptor
        }, evasionsIgnored)
    }

    gotoVideo(method = "direct", id, options = {}) {
        return new Promise(async (resolve, reject) => {
            this.videoInfo = await getVideoInfo(id, this.extra.proxy, await this.getCookies())

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
                        await this.page.goto(this.videoInfo.url, { referer: options.referer }).catch(reject)
                        break
                    case "search":
                        var [err, wasFound] = await to(methodFunctions.search(this, options))
                        success = !(err || !wasFound)

                        if(!success){
                            console.error(`Error navigating to video using "search": ${err}`)
                        }
                        break;
                    case "suggestions":
                        var [err, wasFound] = await to(methodFunctions.suggestions(this, options))
                        success = !(err || !wasFound)

                        if(!success){
                            console.error(`Error navigating to video using "suggestions": ${err}`)
                        }
                        break;
                    case "subscribers":
                        var [err, wasFound] = await to(methodFunctions.subscribers(this, options))
                        success = !(err || !wasFound)

                        if(!success){
                            console.error(`Error navigating to video using "subscribers": ${err}`)
                        }
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
            watcherContext.setup().then(async () => {
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
            let cookies = await this.browser.context.cookies().catch(reject)

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
                            domain: ".youtube.com",
                            path: "/",
                            expires: (Date.now() + 31556952000) / 1000,

                            httpOnly: false,
                            secure: true,
                            sesion: false,
                            sameSite: "None",
                        })

                        res.push({
                            name,
                            value,
                            domain: ".google.com",
                            path: "/",
                            expires: (Date.now() + 31556952000) / 1000,

                            httpOnly: false,
                            secure: true,
                            sesion: false,
                            sameSite: "None",
                        })
                    }

                    cookies = res
                }
            } 

            const currentDate = new Date()

            cookies = cookies.map(obj => {
                return {
                    ...obj,
                    expires: Math.round(obj.expirationDate || obj.expires || (new Date(currentDate.setFullYear(currentDate.getFullYear() + 1))) / 1000),
                    sameSite: ['Strict', 'Lax', 'None'].includes(obj.sameSite) ? obj.sameSite : 'Lax'
                };
            });

            this.cookies = await this.getFormattedCookies(cookies).catch(reject)
            await this.browser.context.addCookies(cookies).catch(reject)

            resolve()
        })
    }

    async clearCookies() {
        return new Promise(async (resolve, reject) => {
            await this.browser.context.clearCookies().catch(reject)
            resolve()
        })
    }
}

export default YoutubeSelfbotPage;