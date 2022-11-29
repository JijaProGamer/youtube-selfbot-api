let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

/**
 * Makes a comment
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {String} text Text to comment
*/

function makeComment(page, text) {
    return new Promise(async (resolve, reject) => {
        if (!this.__loggedin) reject(new Error(`Please call api.loginGoogle first`))
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))
        if (!page.__wasInit) reject(new Error(`Please call api.initWatcher on this page first`))
        
        this.__data.emit(`debug`, `Started scrolling to comment`)

        await scrollUntilSelectorVisible(page, `#placeholder-area`)

        this.__data.emit(`debug`, `scrolled to comment`)

        await clickSelector(page, `#placeholder-area`)
        await typeSelector(page, `#contenteditable-root`, text)

        await page.evaluate(() => {
            window.scrollTo(0, 0);
        })

        await scrollUntilSelectorVisible(page, `#submit-button`)

        await clickSelector(page, `#submit-button`)

        await page.evaluate(() => {
            window.scrollTo(0, 0);
        })

        this.__data.emit(`debug`, `Sucesfully created comment`)

        resolve()
    })
}

module.exports = makeComment