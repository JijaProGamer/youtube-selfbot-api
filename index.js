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
        videoAPI: {
            getVideoMetadata: require("./application/videoAPI/getVideoMetadata"),
            handleSearchPage: require("./application/videoAPI/handleSearchPage"),
        },
        googleAPI: {
            login: require("./application/googleAPI/loginGoogle"),
            
        },
    }
}