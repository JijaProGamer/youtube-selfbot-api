const { default: to } = require("await-to-js")

let ACCEPTED_COOKIES = [
    "DEVICE_INFO",
    "VISITOR_INFO1_LIVE",
    "GPS",
]

let filter_paths = {
    upload_date: {
        last_hour: `ytd-search-filter-group-renderer.style-scope:nth-child(1) > ytd-search-filter-renderer:nth-child(2) > a`,
        today: `ytd-search-filter-group-renderer.style-scope:nth-child(1) > ytd-search-filter-renderer:nth-child(4) > a`,
        this_week: `ytd-search-filter-group-renderer.style-scope:nth-child(1) > ytd-search-filter-renderer:nth-child(6) > a`,
        this_month: `ytd-search-filter-group-renderer.style-scope:nth-child(1) > ytd-search-filter-renderer:nth-child(8) > a`,
        this_year: `ytd-search-filter-group-renderer.style-scope:nth-child(1) > ytd-search-filter-renderer:nth-child(10) > a`,
    },
    type: {
        video: `ytd-search-filter-group-renderer.style-scope:nth-child(2) > ytd-search-filter-renderer:nth-child(2) > a`,
        channel: `ytd-search-filter-group-renderer.style-scope:nth-child(2) > ytd-search-filter-renderer:nth-child(4) > a`,
        playlist: `ytd-search-filter-group-renderer.style-scope:nth-child(2) > ytd-search-filter-renderer:nth-child(6) > a`,
        movie: `ytd-search-filter-group-renderer.style-scope:nth-child(2) > ytd-search-filter-renderer:nth-child(8) > a`,
    },
    duration: {
        under_4: `ytd-search-filter-group-renderer.style-scope:nth-child(3) > ytd-search-filter-renderer:nth-child(2) > a`,
        "4-20": `ytd-search-filter-group-renderer.style-scope:nth-child(3) > ytd-search-filter-renderer:nth-child(4) > a`,
        over_20: `ytd-search-filter-group-renderer.style-scope:nth-child(3) > ytd-search-filter-renderer:nth-child(6) > a`,
    },
    features: {
        live: `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(2) > a`,
        "4k": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(4) > a`,
        hd: `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(6) > a`,
        "subtitles/CC": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(8) > a`,
        "creative_commons": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(10) > a`,
        "360": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(12) > a`,
        "vr180": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(14) > a`,
        "3d": `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(16) > a`,
        hdr: `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(18) > a`,
        location: `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(20) > a`,
        purchased: `ytd-search-filter-group-renderer.style-scope:nth-child(4) > ytd-search-filter-renderer:nth-child(24) > a`,
    },
    sort_by: {
        relevance: `ytd-search-filter-group-renderer.style-scope:nth-child(5) > ytd-search-filter-renderer:nth-child(2) > a`,
        upload_date: `ytd-search-filter-group-renderer.style-scope:nth-child(5) > ytd-search-filter-renderer:nth-child(4) > a`,
        view_count: `ytd-search-filter-group-renderer.style-scope:nth-child(5) > ytd-search-filter-renderer:nth-child(5) > a`,
        rating: `ytd-search-filter-group-renderer.style-scope:nth-child(5) > ytd-search-filter-renderer:nth-child(6) > a`,
    },
}

let sleep = (ms) => new Promise(r => setTimeout(r, ms))

module.exports = (pageContainer, options) => {
    return new Promise(async (resolve, reject) => {
        try {
            let videoInfo = pageContainer.videoInfo

            let title = (options.title || videoInfo.title).split(" ").join("+")
            let scrollAmount = options.scroll || 10

            let page = pageContainer.page
            await page.goto(`https://www.youtube.com/results?search_query=${title}`, { waitUntil: "networkidle2" }).catch(reject)
            await page.waitForSelector(`#contents`).catch(reject)

            let found = await Promise.race([
                page.waitForSelector("ytd-video-renderer.style-scope"),
                page.waitForSelector(".promo-title"),
            ]).catch(reject)
            if (!found) return;

            if (await page.$(`.promo-title`).catch(reject)) {
                return reject("No video found for search")
            }

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

            if (options.filters) {
                for (let filterName in options.filters) {
                    await page.waitForSelector(`#contents`).catch(reject)
                    let found = await Promise.race([
                        page.waitForSelector("ytd-video-renderer.style-scope"),
                        page.waitForSelector(".promo-title"),
                    ]).catch(reject)
                    if (!found) return;

                    if (await page.$(`.promo-title`).catch(reject)) {
                        return reject("No video found for filter selection")
                    }

                    if (filterName !== "features") {
                        let filtersButton = await page.waitForSelector(`ytd-toggle-button-renderer.ytd-search-sub-menu-renderer`).catch(reject)
                        if (!filtersButton) return
                        await filtersButton.click().catch(reject)

                        let filter_path = filter_paths[filterName][options.filters[filterName]]
                        if(!filter_path) return reject(`${options.filters[filterName]} is not a valid option for ${filterName}`)

                        let filter_button = await page.waitForSelector(filter_path).catch(reject)
                        if (!filter_button) return

                        await Promise.all([
                            new Promise((resolve) => {
                                page.evaluate(() => {
                                    return new Promise((resolve, reject) => {
                                        let interval = setInterval(() => {
                                            let filterContainer = document.querySelectorAll("#collapse")[0]
                                            if (filterContainer && (filterContainer.ariaHidden == "true" || filterContainer.hidden)) {
                                                clearInterval(interval)
                                                resolve()

                                            }
                                        }, 1000)
                                    })
                                }).then(resolve).catch(reject)
                            }),
                            filter_button.click(),
                        ]).catch(reject)
                    } else {
                        for (let featureName of options.filters.features) {
                            await page.waitForSelector(`#contents`).catch(reject)
                            let found = await Promise.race([
                                page.waitForSelector("ytd-video-renderer.style-scope"),
                                page.waitForSelector(".promo-title"),
                            ]).catch(reject)
                            if (!found) return;

                            if (await page.$(`.promo-title`).catch(reject)) {
                                return reject("No video found for filter selection")
                            }

                            let filtersButton = await page.waitForSelector(`ytd-toggle-button-renderer.ytd-search-sub-menu-renderer`).catch(reject)
                            if (!filtersButton) return
                            await filtersButton.click().catch(reject)

                            let filter_path = filter_paths.features[featureName]
                            if(!filter_path) return reject(`${featureName} is not a valid option for features`)

                            let filter_button = await page.waitForSelector(filter_path, { visible: true }).catch(reject)
                            if (!filter_button) return

                            await Promise.all([
                                new Promise((resolve) => {
                                    page.evaluate(() => {
                                        return new Promise((resolve, reject) => {
                                            let interval = setInterval(() => {
                                                let filterContainer = document.querySelectorAll("#collapse")[0]
                                                if (filterContainer && (filterContainer.ariaHidden == "true" || filterContainer.hidden)) {
                                                    clearInterval(interval)
                                                    resolve()

                                                }
                                            }, 1000)
                                        })
                                    }).then(resolve).catch(reject)
                                }),
                                filter_button.click(),
                            ]).catch(reject)
                        }
                    }
                }
            }

            await page.waitForSelector(`#contents`).catch(reject)
            let foundPromo = await Promise.race([
                page.waitForSelector("ytd-video-renderer.style-scope"),
                page.waitForSelector(".promo-title"),
            ]).catch(reject)
            if (!foundPromo) return;

            if (await page.$(`.promo-title`).catch(reject)) {
                return reject("No video found for filter selection")
            }
            if (options.forceFind) {
                await Promise.all([
                    page.waitForNavigation(),
                    page.evaluate((videoInfo) => {
                        return new Promise((resolve, reject) => {
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
                            resolve()
                        })
                    }, videoInfo)
                ]).catch(reject)

                return resolve(true)
            }

            let videoFound = (await page.$x(`//a[contains(@href,"${videoInfo.id}")]`).catch(reject))[0]

            if (videoFound) {
                await Promise.all([
                    page.waitForNavigation(),
                    videoFound.click(),
                ]).catch(reject)

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
                    await Promise.all([
                        page.waitForNavigation(),
                        wasFound.click(),
                    ]).catch(reject)
                }

                resolve(!!wasFound)
            }
        } catch (err) {
            reject(new Error(err))
        }
    })
}