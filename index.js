/**
 * Gets information about the video being played in the page
 * 
 * @returns {{browserAPI}, {watcherAPI}, {videoAPI}, {googleAPI}}
 */

module.exports = () => {
    return {
        browserAPI: {
            connectBrowser: require("./application/browserAPI/connectBrowser"),
            handleNewPage: require("./application/browserAPI/handleNewPage"),
        },
        watcherAPI: {
            likeVideo: require("./application/watcherAPI/likeVideo"),
            makeComment: require("./application/watcherAPI/makeComment"),
            initWatcher: require("./application/watcherAPI/initWatcher"),
            getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),
        },
        googleAPI: {
            login: require("./application/googleAPI/loginGoogle"), 
        },
        youtubeAPI: {
            getVideoMetadata: require("./application/youtubeAPI/getVideoMetadata"),
            handleSearchPage: require("./application/youtubeAPI/handleSearchPage"),
            uploadVideo: require("./application/youtubeAPI/uploadVideo"),
        },
        publicFunctions: require("./application/publicFunctions")
    }
}