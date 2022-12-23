let {uploadFileXPath, waitForXPath, clickXPath, typeXPath,
    uploadFileSelector, waitForSelector, clickSelector, typeSelector,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    waitForClassName,
    goto, jiggleMouse,
    confirmNavigation,
    sleep, random} = require("../publicFunctions/everything")

let getVideoMetadata = require("../youtubeAPI/getVideoMetadata")

/**
 * Initialises the video player, should be run only once per page
 *
 * @param {Object} page result of api.handleNewPage()
*/

function initWatcher(page) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started watch init`)

        let videoElement = await waitForSelector(page, `video`)
        await page.evaluate(async (e) => await e.play(), videoElement)
        await page.evaluate(async (e) => await e.pause(), videoElement)

        this.__data.emit(`debug`, `Sucesfully grabbed video element`)

        let isShort = !(await page.url()).includes("?v=")
        page.__isShort = isShort

        if(!isShort){
            await clickSelector(page, `#movie_player`)
            await waitForClassName(page, "ytp-settings-button")
    
            await page.evaluate((element) => {
                document.getElementsByClassName("ytp-settings-button")[0].click()
            })
    
    
            this.__data.emit(`debug`, `Sucesfully stopped autoplay`)
        
            await clickSelector(page, `.ytp-right-controls > button:nth-child(1)`)
    
            this.__data.emit(`debug`, `Sucesfully pressed the settings button`)
        
            await waitForClassName(page, "ytp-panel-menu")
    
            await page.evaluate(() => {
                document.getElementsByClassName("ytp-panel-menu")[0].lastChild.click()
            })
    
            this.__data.emit(`debug`, `Sucesfully pressed the settings button #2`)
        
            await waitForClassName(page, "ytp-menuitem")
    
            await page.evaluate(() => {
                let items = Array.from(document.getElementsByClassName("ytp-menuitem"))
        
                items[items.length - 2].click()
            })
    
            this.__data.emit(`debug`, `Sucesfully changed resolution`)
        }
    
        await sleep(100)
        await page.evaluate(async (e) => await e.play(), videoElement)

        this.__data.emit(`debug`, `Started playing video`)

        page.__wasInit = true
        resolve()
    })
}

module.exports = initWatcher