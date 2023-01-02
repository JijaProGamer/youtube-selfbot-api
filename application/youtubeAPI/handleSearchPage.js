let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

let getVideoMetadata = require("./getVideoMetadata")

/**
 * Opens search and navigates to video
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {string} id The id of the video
*/

function handleSearchPage(page, id) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started search init`)

        let videoMetadata = await getVideoMetadata(id)
        await goto(page, `https://www.youtube.com/results?search_query=${encodeURIComponent(videoMetadata.title)}`)

        await waitForSelector(page, `#contents`, 1)

        let videoFound = (await page.$x(`//a[contains(@href,"${id}")]`))[0]

        if (videoFound) {
            this.__data.emit(`debug`, `Video found, clicking on it...`)

            await clickXPath(page, `//a[contains(@href,"${id}")]`)
        } else {
            let found = await page.evaluate((id) => {
                let start = new Date() / 1000
                function getElementByXpath(path) {
                    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }

                return new Promise(resolve => {
                    let interval = setInterval(() => {
                        let element = getElementByXpath(`//a[contains(@href,"${id}")]`)
                        if(element){
                            clearInterval(interval)
                            return resolve(true)
                        }

                        if((new Date() / 1000) > start + 15){
                            clearInterval(interval)
                            return resolve(false)
                        }

                        window.scrollBy(0, 800)
                    }, 1500)
                })
            }, id)

            if(found){
                this.__data.emit(`debug`, `Video found, clicking on it...`)

                await clickXPath(page, `//a[contains(@href,"${id}")]`)
            } else {
                this.__data.emit(`debug`, `No video found, going for direct play...`)

                await goto(page, `https://www.youtube.com/watch?v=${id}?feature=share`)
            }
        }

        this.__data.emit(`debug`, `Finished search query`)

        resolve()
    })
}

module.exports = handleSearchPage