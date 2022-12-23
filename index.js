function API() {
    return {
        connectBrowser: require("./application/browserAPI/connectBrowser"),
        handleNewPage: require("./application/browserAPI/handleNewPage"),

        pauseVideo: require("./application/watcherAPI/pauseVideo.js"),
        playVideo: require("./application/watcherAPI/playVideo"),
        likeVideo: require("./application/watcherAPI/likeVideo"),
        dislikeVideo: require("./application/watcherAPI/dislikeVideo"),

        makeComment: require("./application/watcherAPI/makeComment"),
        initWatcher: require("./application/watcherAPI/initWatcher"),
        getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),

        handleSubscriptionPage: require("./application/youtubeAPI/handleSubscriptionPage"),
        handleSearchPage: require("./application/youtubeAPI/handleSearchPage"),
        getVideoMetadata: require("./application/youtubeAPI/getVideoMetadata"),
        uploadVideo: require("./application/youtubeAPI/uploadVideo"),

        login: require("./application/googleAPI/loginGoogle"),

        internal: require("./application/publicFunctions/everything"),
    }
}

module.exports = API