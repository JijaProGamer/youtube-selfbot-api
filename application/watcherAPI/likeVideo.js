let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

/**
 * Likes the video
 * 
 * @param {Object} page result of api.handleNewPage()
*/

function likeVideo(page) {
    return new Promise(async (resolve, reject) => {
        if (!this.__loggedin) reject(new Error(`Please call api.loginGoogle first`))
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))
        if (!page.__wasInit) reject(new Error(`Please call api.initWatcher on this page first`))

        api.data.emit(`debug`, `Started liking the video`)

        await clickSelector(page, `ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > ytd-segmented-like-dislike-button-renderer:nth-child(1) > div:nth-child(1) > ytd-toggle-button-renderer:nth-child(1) > yt-button-shape:nth-child(1) > button:nth-child(1)`)

        api.data.emit(`debug`, `Sucesfully liked the video`)

        resolve()
    })
}

module.exports = likeVideo