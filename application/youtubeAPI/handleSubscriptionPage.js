let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions/everything")

/**
 * Opens search and navigates to video
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {string} id The id of the video
*/

function handleSubscriptionPage(page, id) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started search init`)

        await goto(page, `https://www.youtube.com/feed/subscriptions`)
    
        await waitForSelector(page, `#contents`, 1)

        let videoFound = (await page.$x(`//a[contains(@href,"${id}")]`))[0]

        if(videoFound){
            this.__data.emit(`debug`, `Video found, clicking on it...`)

            await clickXPath(page, `//a[contains(@href,"${id}")]`)
        } else {
            this.__data.emit(`debug`, `No video found, going for direct play...`)

            await goto(page, `https://www.youtube.com/watch?v=${id}?feature=share`)
        }

        this.__data.emit(`debug`, `Finished search query`)
        await confirmNavigation(page)

        resolve()
    })
}

module.exports = handleSubscriptionPage