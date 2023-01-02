let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

/**
 * seeks to a second
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {Number} time the point to seek to
*/

function seek(page, time) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))
        if (!page.__wasInit) reject(new Error(`Please call api.initWatcher on this page first`))
        
        this.__data.emit(`debug`, `Seeking video...`)

        await waitForSelector(page, `video`)

        this.__data.emit(`debug`, `Got the video selector`)

        await page.evaluate((time) => document.getElementsByTagName("video")[0].currentTime = time, time)

        this.__data.emit(`debug`, `Sucessfully seeked the video`)
        resolve()
    })
}

module.exports = seek