let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions.js")

/**
 * Pauses the video
 * 
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
*/

function playVideo(api, page) {
    return new Promise(async (resolve, reject) => {
        let videoElement = await waitForSelector(page, `video`)
        await page.evaluate((e) => e.play(), videoElement)

        resolve()
    })
}

module.exports = playVideo