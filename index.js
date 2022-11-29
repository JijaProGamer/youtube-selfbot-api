/**
 * youtube API using puppeteer
 * 
 * @returns {{browserAPI}, {watcherAPI}, {youtubeAPI}, {googleAPI}, {publicFunctions}}
 */

 function API() {
    this.browserAPI = {
        connectBrowser: require("./application/browserAPI/connectBrowser"),
        handleNewPage: require("./application/browserAPI/handleNewPage"),
    }

    this.watcherAPI = {
        pauseVideo: require("./application/watcherAPI/pauseVideo.js"),
        playVideo: require("./application/watcherAPI/playVideo"),
        likeVideo: require("./application/watcherAPI/likeVideo"),
        makeComment: require("./application/watcherAPI/makeComment"),
        initWatcher: require("./application/watcherAPI/initWatcher"),
        getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),
    }

    this.watcherAPI = {
        pauseVideo: require("./application/watcherAPI/pauseVideo.js"),
        playVideo: require("./application/watcherAPI/playVideo"),
        likeVideo: require("./application/watcherAPI/likeVideo"),
        makeComment: require("./application/watcherAPI/makeComment"),
        initWatcher: require("./application/watcherAPI/initWatcher"),
        getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),
    }

    this.googleAPI = {
        login: require("./application/googleAPI/loginGoogle"),
    }

    this.youtubeAPI = {
        getVideoMetadata: require("./application/youtubeAPI/getVideoMetadata"),
        handleSearchPage: require("./application/youtubeAPI/handleSearchPage"),
        uploadVideo: require("./application/youtubeAPI/uploadVideo"),
    }

    this.publicFunctions = require("./application/publicFunctions/everything")
}

module.exports = API