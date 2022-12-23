let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

/**
 * Dislikes the video
 * 
 * @param {Object} page result of api.handleNewPage()
*/

function dislikeVideo(page) {
    return new Promise(async (resolve, reject) => {
        if (!this.__loggedin) reject(new Error(`Please call api.loginGoogle first`))
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))
        if (!page.__wasInit) reject(new Error(`Please call api.initWatcher on this page first`))

        this.__data.emit(`debug`, `Started disliking the video`)

        if(page.__isShort){
            await clickSelector(page, `#dislike-button > yt-button-shape > label`)
        } else {
            await clickSelector(page, `ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1) > ytd-segmented-like-dislike-button-renderer:nth-child(1) > div:nth-child(2) > ytd-toggle-button-renderer:nth-child(1) > yt-button-shape:nth-child(1) > button:nth-child(1)`)
        }

        this.__data.emit(`debug`, `Sucesfully disliked the video`)

        resolve()
    })
}

module.exports = dislikeVideo