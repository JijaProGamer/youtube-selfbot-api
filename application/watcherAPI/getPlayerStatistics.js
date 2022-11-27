let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions.js")

/**
 * Gets information about the video being played in the page
 * 
 * @param {Object} page result of api.handleNewPage()
 * 
 * @returns {Int<time>, Int<duration>, Int<percentWatched>}
*/

function getPlayerStatistics(page) {
    return new Promise(async (resolve, reject) => {
        let info = {}
        //this.data.emit(`debug`, `Started gathering player statistics`)

        let videoPlayer = await waitForSelector(page, `video`)
        let time = await page.evaluate((v) => v.currentTime, videoPlayer) // Get video's current play time
        let duration = await page.evaluate((v) => v.duration, videoPlayer) // get video's duration

        // Set information gathered into the result array
        info.time = Math.floor(time)
        info.duration = Math.floor(duration)
        info.percentWatched = (time * 100) / duration

        //this.data.emit(`debug`, `Sucesfully grabbed video information ${info}`)

        resolve(info)
    })
}

module.exports = getPlayerStatistics