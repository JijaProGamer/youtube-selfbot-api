const useProxy = require('puppeteer-page-proxy');
const puppeteerAfp = require('puppeteer-afp');
const cacher = require("puppeteer-cacher");

/**
 * Creates a new page and adds a few bot bypasses
 * 
 * @param {Boolean} noProxy if it should bypass the proxy for this page
*/

function handleNewPage(noProxy) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        let browserPages = await this.browser.pages()

        for (let [index, page] of browserPages.entries()) {
            let url = await page.url()

            if (["ytadblock", "bit.ly"].some(e => url.includes(e))) {
                page.close()
            }
        }

        const page = puppeteerAfp(await this.browser.newPage())
        this.__data.emit(`debug`, `Created a new page`)

        await page.evaluateOnNewDocument(() => {
            const newProto = navigator.__proto__
            delete newProto.webdriver
            navigator.__proto__ = newProto
        });

        await page.setUserAgent(this.__userAgent)
        await page.setViewport(this.__device.viewport)

        await page.setRequestInterception(true)
        await page.setBypassCSP(true)

        const session = await page.target().createCDPSession();
        await session.send('Page.enable'); // Disable automatic view stopper
        await session.send('Page.setWebLifecycleState', { state: 'active' });
        //await session.send('Network.clearBrowserCookies');

        await page.setCacheEnabled(true);
        await session.send('Network.setCacheDisabled', { cacheDisabled: false });

        page.__client = session
        this.__data.emit(`debug`, `Spoofed new page`)

        page.on('console', message => {
            if (message.type() === "error") {
                this.__data.emit(`pageError`, message.text());
            } else if (message.type() === "warning") {
                this.__data.emit(`pageWarning`, message.text());
            } else if (message.type() === "info") {
                this.__data.emit(`pageInfo`, message.text());
            } else if (message.type() === "log") {
                this.__data.emit(`pageMessage`, message.text());
            }
        }) // Monitor page information

        page.on('pageerror', message => this.__data.emit(`pageError`, message.message)) // Oops, error

        let proxy = this.__extra.proxyServer
        let cache = new cacher(false)

        if (this.__extra.cache && this.__extra.memoryStore) {
            cache.changeMemory(this.__extra.memoryStore)
        }

        page.on('request', async (request) => {
            let type = request.resourceType()
            let url = request.url()

            if (this.__extra.saveBandwith) { // Block useless media
                if (["image", "font", "other"].includes(type)) return request.abort()

                if (type === "stylesheet") {
                    if (request.url().includes(`https://www.youtube.com/s/desktop/`)) return request.abort()
                    if (request.url().includes(`fonts.googleapis.com/css`)) return request.abort()
                }

                if (type === "media") {
                    return request.abort()
                }

                if (request.url().includes("/ads")) {
                    return request.abort()
                }
            }

            this.__data.emit(`requestAccepted`, { url: request.url(), headers: request.headers() })

            if (this.__extra.cache && (
                type == "document" ||
                type == "script" ||
                type == "manifest" ||
                url.includes(".json") ||
                url.includes("generate_204")
            )) {
                cache.get(request, (result, wasFound) => {
                    if (!wasFound) {
                        if (noProxy || proxy || proxy == "direct://") return request.continue();
                        return useProxy(request, proxy)
                    }

                    request.respond(result)
                })
            } else {
                if (noProxy || !proxy || proxy == "direct://") return request.continue();
                useProxy(request, proxy)
            }
        })

        page.on('response', async (response) => {
            if(response.fromCache()){
                return
            }

            let alreadyCached
            await new Promise(resolve => {
                cache.get(response.request(), (result, wasFound) => {
                    alreadyCached = result
                    resolve()
                })
            })

            let url = response.url()
            let type = response.request().resourceType()
            let headers = response.headers()

            if (this.__extra.cache && (
                type == "document" ||
                type == "script" ||
                type == "manifest" ||
                url.includes(".json") ||
                url.includes("generate_204")
            ) && (!alreadyCached || alreadyCached.expires > Date.now())) {
                cache.save(response)
            }

            this.__data.emit(`requestHandled`, {
                method: response.request().method(),
                ip: response.remoteAddress(),
                status: response.status(),
                url: response.url(),
            })

            if(!this.__extra.cache || !alreadyCached || alreadyCached.expires > Date.now()){
                if (headers[`content-length`]) {
                    this.__data.emit("bandwithUsed", parseFloat(headers[`content-length`]))
                } else {
                    response.buffer()
                        .then((buffer) => {
                            this.__data.emit("bandwithUsed", buffer.length)
                        })
                        .catch(() => { })
                }
            }
        })

        page.on('requestfailed', (request) => {
            this.__data.emit(`requestFail`, { error: request.failure().errorText, url: request.url() })
        })

        resolve(page)
    })
}

module.exports = handleNewPage