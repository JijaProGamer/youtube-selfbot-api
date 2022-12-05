let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")

let getVideoMetadata = require("./getVideoMetadata")

/**
 * Opens search and navigates to video
 * 
 * @param {Object} page result of api.handleNewPage()
 * @param {String} path Video path
 * @param {String} name Video name
 * @param {String} visibility visible || private || unlisted
*/

let XPaths = {
    madeForKids: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[5]/ytkc-made-for-kids-select/div[4]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[1]`,
    showMoreAge: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[5]/button/h3`,
    showMore: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/div/ytcp-button/div`,
    eighteenPlus: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[5]/ytcp-age-restriction-select/div/div[3]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[1]`,
    includesPaidPromotion: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[1]/ytcp-checkbox-lit`,
    automaticChapters: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[4]/ytcp-form-checkbox/ytcp-checkbox-lit`,
    tags: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[5]/ytcp-form-input-container/div[1]/div/ytcp-free-text-chip-bar/ytcp-chip-bar/div/input`,
    category: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[10]/div[3]/ytcp-form-select/ytcp-select/ytcp-text-dropdown-trigger/ytcp-dropdown-trigger/div`,
    embeds: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[8]/div[4]/ytcp-form-checkbox/ytcp-checkbox-lit`,
    feed: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-advanced/div[8]/div[4]/ytcp-checkbox-lit`,
    thumbnail: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[3]/ytcp-thumbnails-compact-editor-old/div[3]/ytcp-thumbnails-compact-editor-uploader-old/div/button`,
    save: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-button`,
    schedule: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/tp-yt-paper-radio-button`,
    premiere: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/ytcp-visibility-scheduler/div[2]/ytcp-checkbox-lit`,
    date_input: `/html/body/ytcp-date-picker/tp-yt-paper-dialog/div/form/tp-yt-paper-input/tp-yt-paper-input-container/div[2]/div/iron-input/input`,
    date: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/ytcp-visibility-scheduler/div[1]/ytcp-datetime-picker/div/div[1]/ytcp-text-dropdown-trigger/ytcp-dropdown-trigger/div`,
    hour: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[3]/ytcp-visibility-scheduler/div[1]/ytcp-datetime-picker/div/div[2]/form/ytcp-form-input-container/div[1]/div/tp-yt-paper-input/tp-yt-paper-input-container/div[2]/div/iron-input/input`,
    visibility: {
        public: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[3]`,
        private: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[1]`,
        unlisted: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[2]/div[1]/ytcp-video-visibility-select/div[2]/tp-yt-paper-radio-group/tp-yt-paper-radio-button[2]`,
    },
    addSubtitles: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-video-elements/div[2]/ytcp-button`,
    addSubtitlesFile: `/html/body/ytve-captions-editor-modal/ytcp-dialog/tp-yt-paper-dialog/div[2]/div/ytve-editor/div[1]/div/ytve-captions-editor-options-panel/div[2]/div/ul/li[1]/ytcp-ve/a`,
    uploadSubtitles: `/html/body/ytve-captions-editor-upload-dialog/ytcp-dialog/tp-yt-paper-dialog/div[3]/div/ytcp-button[2]/div`,
    videoId: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-uploads-review/div[3]/ytcp-video-info/div/div[3]/div[1]/div[2]/span/a`,
    playlists: {
        playlists: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[1]/ytcp-ve/ytcp-video-metadata-editor/div/ytcp-video-metadata-editor-basics/div[4]/div[3]/div[1]/ytcp-video-metadata-playlists/ytcp-text-dropdown-trigger/ytcp-dropdown-trigger`,
        newPlaylist: `/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/ytcp-button[1]/div`,
        newPlaylistTitle: `/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/div[1]/ytcp-form-textarea/div/textarea`,
        createPlaylist: `/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[3]/ytcp-button[2]`,
        finishPlaylist: `/html/body/ytcp-playlist-dialog/tp-yt-paper-dialog/div[2]/ytcp-button[3]`,
    },
    videoStatus: `/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog/div/ytcp-animatable[2]/div/div[1]/ytcp-video-upload-progress/span`,

}

function uploadVideo(page, path, name, visibility, extra) {
    if (!extra) extra = {}

    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started video upload`)

        await goto(page, `https://www.youtube.com/upload`, 0)
        await uploadFileSelector(page, `#select-files-button`, path)

        this.__data.emit(`debug`, `Successfully uploaded video file`)

        await waitForXPath(page, `//*[@id="textbox"]`, 0)
        await sleep(500)

        await typeXPath(page, `//*[@id="textbox"]`, name, 0)

        this.__data.emit(`debug`, `Successfully wrote title`)

        if (extra.description) {
            await typeXPath(page, `//*[@id="textbox"]`, extra.description, 1)
            this.__data.emit(`debug`, `Successfully wrote description`)
        }

        if (extra.thumbnail) {
            await uploadFileXPath(page, XPaths.thumbnail, extra.thumbnail)
            this.__data.emit(`debug`, `Successfully uploaded thumbnail`)
        }

        if (extra.playlists) {
            await clickXPath(page, XPaths.playlists.playlists)
            await sleep(500)

            let stillTodo = await page.evaluate((todo) => {
                return new Promise(async (resolve, reject) => {
                    let playlists = await new Promise(r => {
                        let start = new Date() / 1000

                        let interval = setInterval(() => {
                            let playlists = Array.from(document.querySelector(`#items`).childNodes)
                                .filter((v) => v.childNodes[0])
                                .map((v) => v.childNodes[0].childNodes[0].childNodes[1].childNodes[1])

                            if (playlists.length > 0) {
                                clearInterval(interval)
                                return r(playlists)
                            }

                            if ((new Date() / 1000) - start > 5) {
                                clearInterval(interval)
                                return r([])
                            }
                        }, 250)
                    })

                    let done = []

                    for (let [index, element] of playlists.entries()) {
                        if (todo.includes(element.innerHTML)) {
                            done.push(element.innerHTML)
                            element.click()
                        }
                    }

                    resolve(todo.filter(x => !done.includes(x)))
                })
            }, extra.playlists)

            for (let [index, playlistName] of stillTodo.entries()) {
                await clickXPath(page, XPaths.playlists.newPlaylist)
                await sleep(500)

                await typeXPath(page, XPaths.playlists.newPlaylistTitle, playlistName)
                await clickXPath(page, XPaths.playlists.createPlaylist)
                await sleep(500)
            }

            await clickXPath(page, XPaths.playlists.finishPlaylist)
        }

        let showMoreButton = (await page.$x(XPaths.showMore))[0]

        if (showMoreButton) {
            await page.evaluate((e) => e.click(), showMoreButton)
            await page.evaluate((e) => e.click(), (await page.$x(XPaths.showMoreAge))[0])
        }

        await sleep(1000)

        if (extra.eighteenPlus) {
            await clickXPath(page, XPaths.eighteenPlus)
        }

        if (extra.madeForKids) {
            await clickXPath(page, XPaths.madeForKids)
        }

        if (extra.includesPaidPromotion) {
            await clickXPath(page, XPaths.includesPaidPromotion)
        }

        if (extra.ignoreAutomaticChapters) {
            await clickXPath(page, XPaths.automaticChapters)
        }

        if (extra.tags && extra.tags.length > 0) {
            await typeXPath(page, XPaths.tags, extra.tags.join(",") + ",", 0)
        }

        if (extra.category) {
            await clickXPath(page, XPaths.category)
            await page.keyboard.type(extra.category, { delay: 25 })
            await page.keyboard.press("Enter")
        }

        if (extra.disableEmbedding) {
            await clickXPath(page, XPaths.embeds)
        }

        if (extra.dontPublishToFeed) {
            await clickXPath(page, XPaths.feed)
        }

        await clickSelector(page, `#next-button`)

        this.__data.emit(`debug`, `Successfully finished first page`)

        /*if(extra.subtitles){
            await clickXPath(page, XPaths.addSubtitles)
            await clickXPath(page, XPaths.addSubtitlesFile)
        }*/

        this.__data.emit(`debug`, `Successfully finished second page`)

        await clickSelector(page, `#next-button`)
        await clickSelector(page, `#next-button`)

        if (XPaths.visibility[visibility]) {
            await clickXPath(page, XPaths.save)

            await clickXPath(page, XPaths.visibility[visibility])
        } else {
            await clickXPath(page, XPaths.schedule)

            if (visibility.premiere) {
                await clickXPath(page, XPaths.premiere)
            }

            await clickXPath(page, XPaths.hour)
            for (let i = 0; i < 15; i++) {
                await page.keyboard.press('Backspace')
            }

            await typeXPath(page, XPaths.hour, visibility.hour)

            await clickXPath(page, XPaths.date)
            await clickXPath(page, XPaths.date_input)

            for (let i = 0; i < 15; i++) {
                await page.keyboard.press('Backspace')
            }

            await typeXPath(page, XPaths.date_input, visibility.date)
        }

        this.__data.emit(`debug`, `Successfully finished last page`)

        let videoUrlElement = await new Promise((resolve, reject) => {
            waitForXPath(page, XPaths.videoId).then((element) => {
                resolve(element)
            }).catch(async (err) => {
                let element = (await page.$x(XPaths.videoId))[0]
                if(element){
                    resolve(element)
                } else {
                    reject(err)
                }
            })
        })

        let videoUrl = await page.evaluate((e) => e.innerHTML, videoUrlElement)
        let videoId = videoUrl.split("/").pop()

        this.__data.emit(`debug`, `Video ID: ${videoId}`)

        if (extra.dontWaitForProcessing) {
            await clickSelector(page, `#done-button`)
            await sleep(5000)

            this.__data.emit(`debug`, `Finished uploading video`)

            resolve(videoId)
        } else {
            let status = await waitForXPath(page, XPaths.videoStatus)

            this.__data.emit(`debug`, `Started waiting for proccessing`)

            await new Promise((resolve, reject) => {
                let interval = setInterval(async () => {
                    let statusText = await page.evaluate((e) => e.innerHTML.toLowerCase().trim(), status)

                    this.__data.emit(`debug`, `Current proccessing status: ${statusText}`)
                    
                    if (
                        !statusText.includes("upload") &&
                        !statusText.includes("proccessing") && 
                        !statusText.includes("processing") && 
                        statusText.length > 3
                     ) {     
                        this.__data.emit(`debug`, `Finished proccessing with status: ${statusText}`)

                        resolve()
                        clearInterval(interval)
                    }
                }, 1000)
            })

            this.__data.emit(`debug`, `Finished waiting for proccessing`)

            await clickSelector(page, `#done-button`)
            await sleep(5000)

            this.__data.emit(`debug`, `Finished uploading video`)

            resolve(videoId)
        }
    })
}

module.exports = uploadVideo