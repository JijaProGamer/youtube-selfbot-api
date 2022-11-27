const useProxy = require('puppeteer-page-proxy');
const puppeteerAfp = require('puppeteer-afp');

/**
 * Connects to a browser, also creates one if no browserWSEndpoint is provided
 * @param {Object} api the api
 * @param {Boolean} noProxy if it should bypass the proxy for this page
*/

function handleNewPage(api, noProxy) {
    return new Promise(async (resolve, reject) => {
        if (!api.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!api.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        const page = puppeteerAfp(await api.browser.newPage())
        api.data.emit(`debug`, `Created a new page`)

        await page.evaluateOnNewDocument(() => {
            const newProto = navigator.__proto__
            delete newProto.webdriver
            navigator.__proto__ = newProto
        });

        await page.setRequestInterception(true)
        await page.setBypassCSP(true)

        const session = await page.target().createCDPSession();
        await session.send('Page.enable'); // Disable automatic view stopper
        await session.send('Page.setWebLifecycleState', { state: 'active' });
        //await session.send('Network.clearBrowserCookies');

        api.__client = session
        api.data.emit(`debug`, `Spoofed new page`)

        page.on('console', message => {
            if (message.type() === "error") {
                api.data.emit(`pageError`, message.text());
            } else if (message.type() === "warning") {
                api.data.emit(`pageWarning`, message.text());
            } else if (message.type() === "info") {
                api.data.emit(`pageInfo`, message.text());
            } else if (message.type() === "log") {
                api.data.emit(`pageMessage`, message.text());
            }
        }) // Monitor page information

        page.on('pageerror', message => api.data.emit(`pageError`, message.message)) // Oops, error

        let proxy = api.extra.proxyServer

        page.on('request', (request) => {
            if (api.extra.saveBandwith) { // Block useless media
                if (["image", "font", "other"].includes(request.resourceType())) return request.abort()

                if (request.resourceType() === "stylesheet") {
                    if (request.url().includes(`https://www.youtube.com/s/desktop/`)) return request.abort()
                    if (request.url().includes(`fonts.googleapis.com/css`)) return request.abort()
                }

                if (request.resourceType() === "media") {
                    return request.abort()
                }

                if (request.url().includes("/ads")) {
                    return request.abort()
                }
            }


            api.data.emit(`requestAccepted`, { url: request.url(), headers: request.headers() })

            if(!noProxy){
                if (proxy && proxy !== "direct://") {
                    useProxy(request, proxy)
                } else {
                    request.continue()
                }
            } else {
                request.continue()
            }
        })

        page.on('response', async (response) => { // Monitor responses and bandwith usage
            let headers = response.headers()

            api.data.emit(`requestHandled`, { 
                headers: response.headers(), 
                method: response.request().method(),
                ip: response.remoteAddress(),
                status: response.status(),
                url: response.url(), 
            })

            if (headers[`content-length`]) {
                api.data.emit("bandwithUsed", parseFloat(headers[`content-length`]))
            } else {
                response.buffer().then((buffer) => {
                    api.data.emit("bandwithUsed", buffer.length)
                }).catch(() => { })
            }
        })

        page.on('requestfailed', (request) => {
            api.data.emit(`requestFail`, { error: request.failure().errorText, url: request.url() })
        })

        resolve(page)
    })
}

module.exports = handleNewPage