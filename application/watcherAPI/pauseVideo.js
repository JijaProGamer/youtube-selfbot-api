let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

/**
 * Pauses the video
 * 
 * @param {Object} page result of api.handleNewPage()
*/

function pauseVideo(page) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))
        if (!page.__wasInit) reject(new Error(`Please call api.initWatcher on this page first`))
        
        this.__data.emit(`debug`, `Pausing video...`)

        let videoElement = await waitForSelector(page, `video`)

        this.__data.emit(`debug`, `Got the video selector`)

        await page.evaluate((e) => e.pause(), videoElement)

        this.__data.emit(`debug`, `Sucessfully paused the video`)
        resolve()
    })
}

module.exports = pauseVideo