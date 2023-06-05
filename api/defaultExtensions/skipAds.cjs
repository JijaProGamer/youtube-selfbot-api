module.exports = {
    code: () => {
        let DirectBlockElements = [
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
        ];
        
        let LoopAndBlockElements = [
            [
                ".test-class", "test-text"
            ],
            [
                "ytd-item-section-renderer:nth-child(2)", `\nAd\n`
            ],
            [
                "ytd-item-section-renderer:nth-child(3)", `\nAd\n`
            ]
        ]

        setInterval(() => {
            for (let i = 0; i < DirectBlockElements.length; i++) {
                let currentElementToBlock = document.querySelector(DirectBlockElements[i]);
                if(currentElementToBlock && currentElementToBlock.style.display !== "none"){
                    currentElementToBlock.style.display = "none"
                }
            }

            for (let i = 0; i < LoopAndBlockElements.length; i++) {
                let currentLoopAndBlockElements = document.querySelector(LoopAndBlockElements[i][0])

                if (currentLoopAndBlockElements && currentLoopAndBlockElements.style.display  !== "none") {
                    if (currentLoopAndBlockElements.innerText.includes(LoopAndBlockElements[i][1])) {
                        currentLoopAndBlockElements.style.display = "none";
                    }
                }
            }

            let videoAdFound = document.querySelector(`.html5-video-player.ad-showing`)

            if (videoAdFound) {
                let adskipBtn = document.querySelector(`.ytp-ad-skip-button-container`)
                if (adskipBtn) {
                    adskipBtn.click()
                } else {
                    let videoAdFoundVideo = document.querySelector(`.html5-video-player.ad-showing video`)
                    if (videoAdFoundVideo) {
                        videoAdFoundVideo.currentTime = isNaN(videoAdFoundVideo.duration) ? 0 : videoAdFoundVideo.duration;
                    }
                }
            }
        }, 500);
    },
    verify: (page, extra) => extra.autoSkipAds
}