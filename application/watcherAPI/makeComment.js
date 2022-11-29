let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions.js")

/**
 * Gets information about the video being played in the page
 * 
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
 * @param {String} text Text to comment
*/

function makeComment(api, page, text) {
    return new Promise(async (resolve, reject) => {
        api.data.emit(`debug`, `Started scrolling to comment`)

        await scrollUntilSelectorVisible(page, `#placeholder-area`)

        api.data.emit(`debug`, `scrolled to comment`)

        await clickSelector(page, `#placeholder-area`)
        await typeSelector(page, `#contenteditable-root`, text)

        await scrollUntilSelectorVisible(page, `#submit-button`)

        await clickSelector(page, `#submit-button`)

        await page.evaluate(() => {
            window.scrollTo(0, 0);
        })

        api.data.emit(`debug`, `Sucesfully created comment`)

        resolve()
    })
}

module.exports = makeComment