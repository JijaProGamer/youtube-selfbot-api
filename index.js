function API() {
    return {
        connectBrowser: require("./application/browserAPI/connectBrowser"),
        handleNewPage: require("./application/browserAPI/handleNewPage"),
        pauseVideo: require("./application/watcherAPI/pauseVideo.js"),
        playVideo: require("./application/watcherAPI/playVideo"),
        likeVideo: require("./application/watcherAPI/likeVideo"),
        makeComment: require("./application/watcherAPI/makeComment"),
        initWatcher: require("./application/watcherAPI/initWatcher"),
        getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),
        getVideoMetadata: require("./application/youtubeAPI/getVideoMetadata"),
        handleSearchPage: require("./application/youtubeAPI/handleSearchPage"),
        uploadVideo: require("./application/youtubeAPI/uploadVideo"),
        login: require("./application/googleAPI/loginGoogle"),
        internal: require("./application/publicFunctions/everything"),
    }
}

module.exports = API