const ytdl = require('ytdl-core');

/**
 * Gets information about a video from an id
 * @param {String} id Id of the video
 * 
 * @returns {id, title, description, author, views, uploadDate, chapters}
*/

function getVideoMetadata(id) {
    return new Promise(async (resolve, reject) => {
        ytdl.getBasicInfo(`https://www.youtube.com/watch?v=${id}`).then((fullInfo) => {
            fullInfo = fullInfo.videoDetails
            
            let thumbnail = fullInfo.media && fullInfo.media.thumbnails && fullInfo.media.thumbnails[0] 
                            || fullInfo.thumbnails[0]
            
            let info = {
                id: id,
                title: fullInfo.title,
                description: fullInfo.description,
                duration: parseFloat(fullInfo.lengthSeconds) - 1,
                author: fullInfo.author.name,
                views: parseFloat(fullInfo.viewCount),
                uploadDate: fullInfo.uploadDate,
                chapters: fullInfo.chapters,
                isShort: thumbnail.height > thumbnail.width
            }
    
            resolve(info)
        }).catch((err) => {
            reject(new Error(`Error getting video metadata: ${err}`))
        })
    })
}

module.exports = getVideoMetadata