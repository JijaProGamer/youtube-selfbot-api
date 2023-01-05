let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

let getVideoMetadata = require("./getVideoMetadata")

/**
 * Directly goes to the video page
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {string} id The id of the video
*/

function handleSearchPage(page, id) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started going to the video`)

        await goto(page, `https://www.youtube.com/watch?v=${id}`)

        this.__data.emit(`debug`, `Finished going to the video`)

        resolve()
    })
}

module.exports = handleSearchPage