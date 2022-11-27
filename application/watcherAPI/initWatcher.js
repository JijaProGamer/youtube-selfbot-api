let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions.js")

/**
 * Initialises the video player, should be run only once per page
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
*/

function initWatcher(api, page) {
    return new Promise(async (resolve, reject) => {
        if (!api.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!api.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        api.data.emit(`debug`, `Started watch init`)
    
        //let playButton = await waitForSelector(page, `#movie_player > div.ytp-cued-thumbnail-overlay > button`)
        //await playButton.click()
    
        //await jiggleMouse(page, random(85, 200))
        //setInterval(() => {jiggleMouse(page, random(85, 200))}, 500)
    
        let videoElement = await waitForSelector(page, `video`)
        //await page.evaluate((e) => e.pause(), videoElement)

        api.data.emit(`debug`, `Sucesfully grabbed video element`)
        
        //await waitForSelector(page, "ytp-settings-button")
        await page.evaluate(() => {
            document.getElementsByClassName("ytp-settings-button")[0].click()
        })

        api.data.emit(`debug`, `Sucesfully stopped autoplay`)
    
        await clickSelector(page, `.ytp-right-controls > button:nth-child(1)`)
    
        //await waitForSelector(page, "ytp-panel-menu")

        await sleep(500)
        await page.evaluate(() => {
            document.getElementsByClassName("ytp-panel-menu")[0].lastChild.click()
        })
    
        await sleep(500)
    
        await page.evaluate(() => {
            let items = Array.from(document.getElementsByClassName("ytp-menuitem"))
    
            items[items.length - 2].click()
        })

        api.data.emit(`debug`, `Sucesfully changed resolution`)
    
        await sleep(100)
        //await page.evaluate((e) => e.play(), videoElement)

        await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                let interval = setInterval(() => {
                    let commentsBar = document.querySelector(`#placeholder-area`)
    
                    if(commentsBar){
                        resolve()
                        clearInterval(interval)
                        window.scroll(0, 0);
                    } else {
                        window.scrollBy(0, 300);
                    }
                }, 1000)
            })
        })

        api.data.emit(`debug`, `Started playing video`)

        resolve()
    })
}

module.exports = initWatcher