const { default: to } = require("await-to-js")

let ACCEPTED_COOKIES = [
    "DEVICE_INFO",
    "VISITOR_INFO1_LIVE",
    "GPS",
]

module.exports = (pageContainer, options) => {
    return new Promise(async (resolve, reject) => {
        try {
            let videoInfo = pageContainer.videoInfo
            let scrollAmount = options.scroll || 10

            let page = pageContainer.page
            await page.goto(`https://www.youtube.com/`, { waitUntil: "networkidle2" }).catch(reject)
            await page.waitForSelector(`#contents`).catch(reject)

            let currentCookies = await page.cookies().catch(reject)
            let isLoggedIn = false

            if (!currentCookies) return;
            for (let cookie of currentCookies) {
                if (ACCEPTED_COOKIES.includes(cookie.name)) {
                    isLoggedIn = true
                    break
                }
            }

            if (!isLoggedIn) {
                let rejectCookies = await Promise.race([
                    page.waitForSelector("#content > div.body.style-scope.ytd-consent-bump-v2-lightbox > div.eom-buttons.style-scope.ytd-consent-bump-v2-lightbox > div:nth-child(1) > ytd-button-renderer:last-child > yt-button-shape > button"),
                    page.waitForXPath("/html/body/c-wiz/div/div/div/div[2]/div[1]/div[3]/div[1]/form[1]/div/div/button/div[1]"),
                ]).catch(reject)
                if (!rejectCookies) return;

                await Promise.all([
                    page.waitForNavigation(),
                    rejectCookies.click(),
                ]).catch(reject)
            }

            if (options.forceFind) {
                await page.evaluate((videoInfo) => {
                    let urlFormat = videoInfo.isShort
                        ? "shorts/"
                        : "watch?v="

                    let finalURL = "https://www.youtube.com/" + urlFormat + videoInfo.id

                    let urlDocuments = document.querySelectorAll("a")
                    let chosen

                    for (let urlDocument of urlDocuments) {
                        let url = urlDocument.href
                        if (!(url.includes("?watch?v=") || url.includes("/shorts"))) {
                            urlDocument.href = finalURL
                            chosen = urlDocument

                            break
                        }
                    }

                    chosen.click()
                }, videoInfo).catch(reject)

                return
            }

            let videoFound = (await page.$x(`//a[contains(@href,"${videoInfo.id}")]`).catch(reject))[0]

            if (videoFound) {
                await videoFound.click().catch(reject)

                resolve(true)
            } else {
                let [err, wasFound] = await to(page.evaluate((data) => {
                    let { scrollAmount, id } = data

                    return new Promise((resolve, reject) => {
                        function getElementByXpath(path) {
                            return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                        }

                        let start = Date.now() / 1000
                        let interval = setInterval(() => {
                            let element = getElementByXpath(`//a[contains(@href,"${id}")]`)
                            if (element) {
                                clearInterval(interval)
                                return resolve(element)
                            }

                            if ((Date.now() / 1000) > start + scrollAmount) {
                                clearInterval(interval)
                                return resolve(false)
                            }

                            window.scrollBy(0, 800)
                        }, 600)
                    })
                }, { id: videoInfo.id, scrollAmount }))

                if (err) {
                    return reject(err)
                }

                if (wasFound) {
                    await wasFound.click().catch(reject)
                }

                resolve(wasFound)
            }
        } catch (err) {
            reject(new Error(err))
        }
    })
}