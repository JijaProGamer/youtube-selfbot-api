let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions.js")

let getVideoMetadata = require("../youtubeAPI/getVideoMetadata")

/**
 * Opens search and navigates to video
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
*/

function initWatcher(api, page, id) {
    return new Promise(async (resolve, reject) => {
        if (!api.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!api.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        api.data.emit(`debug`, `Started search init`)

        let videoMetadata = await getVideoMetadata(id)
        await goto(page, `https://www.youtube.com/results?search_query=${encodeURIComponent(videoMetadata.title)}`, 0)
    
        await waitForSelector(page, `#contents`, 1)

        let videosFound = await page.evaluate(() => {
            return new Promise(resolve => {
                function getXPathForElement(element) {
                    const idx = (sib, name) => sib 
                        ? idx(sib.previousElementSibling, name||sib.localName) + (sib.localName == name)
                        : 1;
                    const segs = elm => !elm || elm.nodeType !== 1 
                        ? ['']
                        : elm.id && document.getElementById(elm.id) === elm
                            ? [`id("${elm.id}")`]
                            : [...segs(elm.parentNode), `${elm.localName.toLowerCase()}[${idx(elm)}]`];
                    return segs(element).join('/');
                }

                let videos = document.querySelectorAll(`#contents`)[1].childNodes
                let result = []
    
                for(let video of Array.from(videos)){
                    try {
                        let videoMetadata = video.childNodes[1].childNodes[3] // 5
    
                        if(videoMetadata.childNodes.length > 2){
                            let videoName = videoMetadata.childNodes[1].childNodes[1].childNodes[1].childNodes[3].childNodes[3].innerHTML
                            let channelTitle = videoMetadata.childNodes[3].childNodes[3].childNodes[1].childNodes[1].childNodes[1].childNodes[0].innerHTML
                            let watchButton = video.childNodes[1].childNodes[1].childNodes[1]
        
                            result.push({
                                title: videoName,
                                channel: channelTitle,
                                button: getXPathForElement(watchButton),
                            })
                        }
                    } catch (err) {

                    }
                }

                resolve(result)
            })
        })

        api.data.emit(`debug`, `Videos found from search: ${JSON.stringify(videosFound)}`)

        let videoFound = videosFound.filter((video, index) => {
            return video.title == videoMetadata.title && video.channel == videoMetadata.author
        })[0]

        if(videoFound){
            api.data.emit(`debug`, `Video found, clicking on it...`)

            await clickXPath(page, videoFound.button)
        } else {
            api.data.emit(`debug`, `No video found, going for direct play...`)

            await goto(page, `https://www.youtube.com/watch?v=${id}`)
        }

        api.data.emit(`debug`, `Finished search query`)

        resolve()
    })
}

module.exports = initWatcher