let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
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

        await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    let commentsBar = document.querySelector(`#placeholder-area`)

                    if (commentsBar) {
                        resolve()
                        clearInterval(interval)
                    } else {
                        window.scrollBy(0, 300);
                    }
                }, 1000)
            })
        })

        api.data.emit(`debug`, `scrolled to comment`)

        await clickSelector(page, `#placeholder-area`)
        await typeSelector(page, `#contenteditable-root`, text)
        await clickSelector(page, `#submit-button`)

        await page.evaluate(() => {
            window.scrollTo(0, 0);
        })

        api.data.emit(`debug`, `Sucesfully created comment`)

        resolve()
    })
}

module.exports = makeComment