const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const typeOnKeyboard = async (page, inputText) => {
    return new Promise(async (resolve, reject) => {
        for (let key of inputText.split('')) {
            await page.keyboard.sendCharacter(key).catch(reject)
            await sleep(25)
        }

        resolve()
    })
};

module.exports = class {
    #page = {}
    #parent = {}
    #extra = {}
    #browser = {}

    constructor(page, parent, extra, browser) {
        this.#page = page
        this.#parent = parent
        this.#extra = extra
        this.#browser = browser
    }

    upload(video, title, opts = {}) {
        opts = {
            description: "",
            privacy: "private",
            adultOnly: false,
            youtubeKids: false,
            paidPromotion: false,
            skipProcessing: false,
            premiere: false,
            language: "English",
            playlists: [],
            category: "Entertainment",
            scheduleDate: new Date(Date.now() + 86400000),
            tags: [],
            // thumbnail: 
            ...opts
        }

        title = title.substring(0, 99)
        opts.description = opts.description.substring(0, 4999)

        return new Promise(async (resolve, reject) => {
            try {
                await this.#page.goto(`https://www.youtube.com/upload`).catch(reject)
                await this.#page.waitForSelector(`#select-files-button`).catch(reject)

                let [fileChooser] = await Promise.all([
                    this.#page.waitForFileChooser(),
                    this.#page.click(`#select-files-button`)
                ]).catch(reject)

                await fileChooser.accept([video]).catch(reject)

                let titleBox = await this.#page.waitForSelector(`#title-textarea`).catch(reject)
                await titleBox.click({ clickCount: 3 })
                await typeOnKeyboard(this.#page, title).catch(reject)

                await this.#page.click(`#description-textarea`).catch(reject)
                await typeOnKeyboard(this.#page, opts.description).catch(reject)

                if (opts.thumbnail) {
                    await this.#page.waitForSelector(`button.ytcp-thumbnails-compact-editor-uploader-old`).catch(reject)

                    let [fileChooser] = await Promise.all([
                        this.#page.waitForFileChooser(),
                        this.#page.click(`button.ytcp-thumbnails-compact-editor-uploader-old`)
                    ]).catch(reject)

                    await fileChooser.accept([opts.thumbnail]).catch(reject)
                }

                let toggleButtons = await this.#page.$$(`#radioLabel > ytcp-ve`)

                if (opts.youtubeKids) {
                    await toggleButtons[0].click().catch(reject)
                } else {
                    await toggleButtons[1].click().catch(reject)
                }

                await this.#page.click(`#toggle-button`).catch(reject)
                await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[1]/ytcp-checkbox-lit/div[1]/div`).catch(reject)

                if (opts.paidPromotion) await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[1]/ytcp-checkbox-lit/div[1]/div`).catch(reject)

                if (opts.tags.length > 0) {
                    await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[4]/ytcp-form-input-container/div[1]/div/ytcp-free-text-chip-bar/ytcp-chip-bar/div/input`)
                    await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[4]/ytcp-form-input-container/div[1]/div/ytcp-free-text-chip-bar/ytcp-chip-bar/div/input`).catch(reject)
                    await sleep(500)

                    await typeOnKeyboard(this.#page, opts.tags.join(",") + ",").catch(reject)
                }

                if (opts.playlists.length > 0) {
                    await this.#page.click(`.use-placeholder`).catch(reject)
                    await Promise.race([
                        this.#page.waitForSelector(`ytcp-ve.ytcp-checkbox-group:nth-child(2)`, { visible: true }),
                        sleep(15 * 1000),
                    ]).catch(reject)

                    await sleep(500).catch(reject)

                    let remainingPlaylists = await this.#page.evaluate((playlists) => {
                        let remaining = playlists
                        let currentPlaylists = Array.from(document.querySelectorAll('[id^="checkbox-label"]'))

                        for (let el of currentPlaylists) {
                            let remIndex = remaining.indexOf(el.textContent)
                            if (remIndex >= 0) {
                                remaining.splice(remIndex, 1);
                                el.click()
                            }
                        }

                        return remaining
                    }, opts.playlists).catch(reject)

                    await sleep(500)

                    for (let playlist of remainingPlaylists) {
                        let newElement = await this.#page.waitForXPath(`/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/div/ytcp-button/div`).catch(reject)
                        await this.#page.evaluate(e => e.click(), newElement)

                        let newPlaylist = await Promise.race([
                            this.#page.waitForXPath(`/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/div/ytcp-text-menu/tp-yt-paper-dialog/tp-yt-paper-listbox/tp-yt-paper-item[1]/ytcp-ve/div/div/yt-formatted-string`),
                            this.#page.waitForXPath(`/html/body/ytcp-playlist-creation-dialog/ytcp-dialog/tp-yt-paper-dialog/div[2]/div/ytcp-playlist-metadata-editor/div/div[1]/ytcp-social-suggestions-textbox/ytcp-form-input-container/div[1]/div[2]/div/ytcp-social-suggestion-input/div`),
                        ]).catch(reject)

                        if (await this.#page.$x(`/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/div/ytcp-text-menu/tp-yt-paper-dialog/tp-yt-paper-listbox/tp-yt-paper-item[1]/ytcp-ve/div/div/yt-formatted-string`).catch(reject)) {
                            await this.#page.evaluate(e => e.click(), newPlaylist)
                        }

                        await sleep(500)

                        let titleButton = await this.#page.waitForXPath(`/html/body/ytcp-playlist-creation-dialog/ytcp-dialog/tp-yt-paper-dialog/div[2]/div/ytcp-playlist-metadata-editor/div/div[1]/ytcp-social-suggestions-textbox/ytcp-form-input-container/div[1]/div[2]/div/ytcp-social-suggestion-input/div`).catch(reject)
                        await titleButton.click().catch(reject)

                        await sleep(500)
                        await typeOnKeyboard(this.#page, playlist).catch(reject)

                        let createButton = await this.#page.waitForSelector(`#create-button > div`).catch(reject)
                        await createButton.click().catch(reject)

                        await this.#page.waitForSelector(`#dialog > div.action-buttons.style-scope.ytcp-playlist-dialog > ytcp-button.done-button.action-button.style-scope.ytcp-playlist-dialog`).catch(reject)
                    }

                    await this.#page.waitForSelector(`#dialog > div.action-buttons.style-scope.ytcp-playlist-dialog > ytcp-button.done-button.action-button.style-scope.ytcp-playlist-dialog`)
                    await this.#page.click(`#dialog > div.action-buttons.style-scope.ytcp-playlist-dialog > ytcp-button.done-button.action-button.style-scope.ytcp-playlist-dialog`).catch(reject)
                }

                await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[5]/div[3]/ytcp-form-language-input/ytcp-form-select/ytcp-select/ytcp-text-dropdown-trigger`).catch(reject)
                await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[5]/div[3]/ytcp-form-language-input/ytcp-form-select/ytcp-select/ytcp-text-dropdown-trigger`).catch(reject)

                const langButton = await this.#page.waitForXPath(`//*[starts-with(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"), '${opts.language.toLowerCase()}')]`, { timeout: 5000 }).catch(reject)

                if (!langButton) return reject(new Error(`Invalid language`))
                await this.#page.evaluate((el) => el.click(), langButton)

                let categoryFrame = (await this.#page.$(`#category > :nth-child(1) > :nth-child(1)`).catch(reject))

                if (categoryFrame) {
                    await categoryFrame.click().catch(reject)
                    const categoryButton = await this.#page.waitForXPath(`//*[starts-with(translate(text(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz"), '${opts.category.toLowerCase()}')]`, { timeout: 5000 }).catch(reject)

                    if (!categoryButton) return reject(new Error(`Invalid category`))
                    await this.#page.evaluate((el) => el.click(), categoryButton)
                }

                for (let i = 0; i < 3; i++) {
                    let nextButton = await this.#page.waitForSelector(`#next-button`, { visible: true })
                    await nextButton.click().catch(reject)

                    await sleep(1000)
                }

                await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[3]/div[1]`).catch(reject)

                if (opts.privacy == "schedule") {
                    if (opts.scheduleDate < Date.now()) {
                        reject("invalid schedule date")
                    }

                    let dateString = opts.scheduleDate.toString().split(" ")
                    let hour = dateString[4].split(":")

                    let scheduleDate = `${dateString[1]} ${dateString[2]}, ${dateString[3]}`
                    let sheduleHour = `${hour[0]}:${hour[1]}`

                    await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/tp-yt-paper-radio-button/div[1]`).catch(reject)

                    await sleep(500)

                    let datePicker = await this.#page.waitForSelector(`#datepicker-trigger > ytcp-dropdown-trigger > div`)
                    await datePicker.click().catch(reject)

                    await sleep(500)

                    let dateElement = await this.#page.waitForXPath(`/html/body/ytcp-date-picker/tp-yt-paper-dialog/div/form/tp-yt-paper-input/tp-yt-paper-input-container/div[2]/div/iron-input/input`).catch(reject)
                    await dateElement.click({ clickCount: 3 }).catch(reject)
                    await typeOnKeyboard(this.#page, scheduleDate).catch(reject)
                    await this.#page.keyboard.press("Enter").catch(reject)

                    await sleep(500)

                    let hourElement = await this.#page.waitForSelector(`#input-1 > input`).catch(reject)
                    await hourElement.click({ clickCount: 4 }).catch(reject)

                    await typeOnKeyboard(this.#page, sheduleHour).catch(reject)
                    await this.#page.keyboard.press("Enter").catch(reject)

                    if (opts.premiere) {
                        await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/ytcp-visibility-scheduler/div[2]/ytcp-checkbox-lit/div[1]/div`).catch(reject)
                    }
                } else {
                    switch (opts.privacy) {
                        case "public":
                            await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[3]/div[1]`).catch(reject)

                            if (opts.premiere) {
                                await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/div[2]/ytcp-checkbox-lit/div[1]/div`).catch(reject)
                                await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/div[2]/ytcp-checkbox-lit/div[1]/div`).catch(reject)
                            }
                            break;
                        case "private":
                            await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[1]/div[1]`).catch(reject)
                            break;
                        case "unlisted":
                            await this.#page.click(`xpath//html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[2]/div[1]`).catch(reject)
                            break;
                    }
                }

                let idElement = await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[3]/ytcp-video-info/div/div[2]/div[1]/div[2]/span/a`, { visible: true }).catch(reject)
                let id = await idElement.evaluate(e => e.textContent.split("/").pop().trim()).catch(reject)

                if (opts.skipProcessing) {
                    let finishButton = await this.#page.waitForSelector(`#done-button`).catch(reject)
                    await finishButton.click().catch(reject)

                    await sleep(7500)
                    resolve(id)
                } else {
                    await this.#page.waitForXPath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[2]/div/div[1]/ytcp-video-upload-progress/span`).catch(reject)

                    await this.#page.evaluate(() => {
                        return new Promise((resolve, reject) => {
                            function getElementByXpath(path) {
                                return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                            }

                            let interval = setInterval(() => {
                                let element = getElementByXpath(`/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[2]/div/div[1]/ytcp-video-upload-progress/span`)
                                if (element) {
                                    let text = element.innerText.toLowerCase()
                                    let conditions = [
                                        //text.includes("checks complete") || text.includes("complete"),
                                        !text.includes("check") || text.includes("complete"),
                                        !text.includes("upload"),
                                        !text.includes("processing"),
                                        !text.includes("proccessing"),
                                        text.length > 3
                                    ]

                                    if (conditions.every(v => v)) {
                                        clearInterval(interval)
                                        resolve()
                                    }
                                }
                            }, 1000)
                        })
                    }).catch(reject)

                    let finishButton = await this.#page.waitForSelector(`#done-button`).catch(reject)
                    await finishButton.click().catch(reject)

                    await sleep(7500)
                    resolve(id)
                }
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async uploadSubtitles(id, language, type, sub) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.#page.goto(`https://studio.youtube.com/video/${id}/translations`).catch(reject)
                console.log(1)

                await Promise.race([
                    await this.#page.waitForSelector(`#query-input`),
                    await this.#page.waitForSelector(`#error-message`, { visible: true }),
                ]).catch(reject)

                console.log(2)
                if (this.#page.$(`#query-input`)) {
                    let addButton = await this.#page.waitForSelector(`#add-translations-button`).catch(reject)
                    await addButton.click().catch(reject)

                    await this.#page.waitForSelector(`#text-item-0 > ytcp-ve:nth-child(1) > div:nth-child(3)`, { visible: true }).catch(reject)
                    await typeOnKeyboard(this.#page, language).catch(reject)

                    await this.#page.keyboard.press("Enter").catch(reject)

                    switch (type) {
                        case "file":
                            break
                        case "text":
                            break
                    }
                } else {
                    reject(`Invalid id`)
                }
            } catch (err) {
                reject(new Error(err))
            }
        })
    }
}