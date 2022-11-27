


console.log("background loaded...");
let securityUrls = [];
let backup = {
    SecurityUrls: [
        "https://imasdk.googleapis.com/js/core/*",
        "https://googleads.g.doubleclick.net/pagead/id",
        "*googleusercontent.com/proxy*",
        "*static.doubleclick.net/instream/ad_status*",
        "*el=adunit*"
    ],
    DirectBlockElements: [
        ".ytp-ad-image-overlay",
        ".ytp-ad-text-overlay",
        "ytd-rich-item-renderer ytd-display-ad-renderer",
        "ytd-player-legacy-desktop-watch-ads-renderer",
        ".style-scope ytd-item-section-renderer #ad-badge",
        "#player-ads",
        "ytd-promoted-sparkles-web-renderer",
        "ytd-search-pyv-renderer",
        "#masthead-ad",
        "ytd-carousel-ad-renderer",
        "ytd-promoted-sparkles-text-search-renderer"
    ],
    LoopAndBlockElements: [
        [
            ".test-class","test-text"
        ],
        [
            "ytd-item-section-renderer:nth-child(2)",
            `\nAd\n`
        ],
        [
            "ytd-item-section-renderer:nth-child(3)",
            `\nAd\n`
        ]
    ],
    ElementList: {
        videoAdFound: ".html5-video-player.ad-showing",
        adskipBtn: ".ytp-ad-skip-button-container",
        videoAdFoundVideo: ".html5-video-player.ad-showing video",
        reviewBtnStatus: "true",
        player: "#below"
    },
    SecuritySelectors: [
        ".ytp-ad-image-overlay",
        ".ytp-ad-text-overlay",
        ".ytp-ad-skip-button-container",
        "ytd-rich-item-renderer ytd-display-ad-renderer",
        "ytd-player-legacy-desktop-watch-ads-renderer",
        ".style-scope ytd-item-section-renderer",
        "#player-ads",
        "ytd-promoted-sparkles-web-renderer",
        "ytd-search-pyv-renderer",
        "#masthead-ad",
        ".html5-video-player.ad-showing",
        "true",
        "ytd-carousel-ad-renderer"
    ]
}

fetch("https://backend.ytadblock.com/yt/g/g")
    .then((e) => e.json())
    .then((e) => {
        console.log(e)  
            e && chrome.storage.sync.set({
                selectors: e
            });
    })
    .catch((e) => {
        if (e) {
            chrome.storage.sync.set({
                selectors: backup
            });
        }
    })

getRandomToken = () => {
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = "";
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    return hex;
};

preload = () => {
    chrome.runtime.onInstalled.addListener(function (details) {
        if (details.reason == "install") {
            // UserID is generated and saved
            chrome.storage.sync.set({
                userid: getRandomToken(),
                AdblockerForYoutube: !0,
                installedOn: Date.now(),
                flag: false
            });
            chrome.tabs.create({
                url: "https://bit.ly/ytadblockin"
            })
        } else if (details.reason == "update") {
            var thisVersion = chrome.runtime.getManifest().version;
        }
        if (chrome.runtime.setUninstallURL) {
            chrome.runtime.setUninstallURL("https://bit.ly/ytadblockui");
        }
    });
};

(main = () => {
    preload();
})();


