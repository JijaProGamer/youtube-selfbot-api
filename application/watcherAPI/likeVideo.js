let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions.js")

/**
 * Gets information about the video being played in the page
 * 
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
*/

function likeVideo(api, page) {
    return new Promise(async (resolve, reject) => {
        api.data.emit(`debug`, `Started liking the video`)

        await clickSelector(page, `ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > ytd-segmented-like-dislike-button-renderer:nth-child(1) > div:nth-child(1) > ytd-toggle-button-renderer:nth-child(1) > yt-button-shape:nth-child(1) > button:nth-child(1)`)

        api.data.emit(`debug`, `Sucesfully liked the video`)

        resolve()
    })
}

module.exports = likeVideo