function API() {
    return {
        connectBrowser: require("./application/browserAPI/connectBrowser"),
        handleNewPage: require("./application/browserAPI/handleNewPage"),

        pauseVideo: require("./application/watcherAPI/pauseVideo.js"),
        playVideo: require("./application/watcherAPI/playVideo"),
        likeVideo: require("./application/watcherAPI/likeVideo"),
        dislikeVideo: require("./application/watcherAPI/dislikeVideo"),
        seek: require("./application/watcherAPI/seek"),

        makeComment: require("./application/watcherAPI/makeComment"),
        initWatcher: require("./application/watcherAPI/initWatcher"),
        getPlayerStatistics: require("./application/watcherAPI/getPlayerStatistics"),

        handleSubscriptionPage: require("./application/youtubeAPI/handleSubscriptionPage"),
        gotoVideo: require("./application/youtubeAPI/gotoVideo"),
        handleSearchPage: require("./application/youtubeAPI/handleSearchPage"),
        getVideoMetadata: require("./application/youtubeAPI/getVideoMetadata"),
        uploadVideo: require("./application/youtubeAPI/uploadVideo"),

        login: require("./application/googleAPI/loginGoogle"),
        logout: require("./application/googleAPI/logoutGoogle"),

        internal: require("./application/publicFunctions/everything"),
    }
}

module.exports = API