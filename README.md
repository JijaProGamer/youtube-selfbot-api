<p align="center">
    <img alt="ViewCount" src="https://komarev.com/ghpvc/?username=JijaProGamer&color=green">
    <img alt="OS" src="https://img.shields.io/badge/OS-Windows%20/%20Linux-success">
</p>

# Youtube selfbot API

## Introduction

Youtube selfbot api is an open source API based on puppeteer to
watch, like, comment, publish, search videos.

### Youtube selfbot API Features

- You can watch videos, with a extended API to see current time, total video duration, automatically save bandwith
- You can like and comment on videos (Must be logged in)
- Search for videos to increase SEO
- Proxy support (+ proxy authorization support)

### Installation methods

1.  Clone this repo and require /youtube-selfbot-api/index.js
2.  npm install youtube-selfbot-api and require it

### Technologies used

- [Puppeteer] this is a simple API to interact with chromium-based browsers
- [ytdl-core] API to get video statistics from youtube without a key

### Authors

- [Bloxxy](https://github.com/JijaProGamer)

### License

This project is available for use under the MIT License.

### API

```javascript
let api = new (require("youtube-selfbot-api"))();

/* API: The API we just require'd
 chromePath: Path to chrome (example: /usr/bin/google-chrome on some linux variants)
 extraArguments: {
    // WSEndpoint of detached browser, Browserless or other providers recommended
    browserWSEndpoint: "ws:localhost:50127",

    // IP of proxy used (optional, but recommended)
    proxyServer: "localhost:8080",

    // where to save chrome profile (Used for caching / saving logged in state)
    userDataDir: "/path/to/userDataDir",

    // Save bandwith by cancelling useless requests (No reason to put false)
    saveBandwith: true,

    // Use headless mode (You may get detected by google)
    headless: false,

    // Extra args to pass to 
    args: ["--no-zygote"]
}
*/

let browserConnection = api.connectBrowser(chromePath, extraArguments)
let data = browserConnection.data

// Used for debugging, to see where your application fails and when
data.on("debug", debugInfo => {
    console.log(debugInfo)
})

// Used for debugging, when an error happens on the youtube page
data.on("pageError", err => {
    console.log(err)
})

// Used for debugging, when a warning happens on the youtube page
data.on("pageWarning", warning => {
    console.log(warning)
})

// Used for debugging, when a log happens on the youtube page
data.on("pageMessage", warning => {
    console.log(warning)
})

// Used for debugging, when a request gets accepted on the youtube page
data.on("requestAccepted", request => {
    console.log(request.url)
    console.log(request.headers)
})

// Used for debugging, when a request gets handled and gets a response on the youtube page
data.on("requestHandled", request => {
    console.log(request.url)
    console.log(request.headers)
    console.log(request.method)
    console.log(request.remoteAddress) // IP and port of the server connected to
    console.log(request.status) // Status code
})

// Used for debugging, when puppeteer tries to make a request but it fails

data.on("requestFailed", request => {
    console.log(request.url)
    console.log(request.error) // error text
})

data.on("bandwithUsed", bits => {
    console.log(bits)
})

// Creates and returns the browser
let browser = await browserConnection.browser()

// Creates a new puppeteer page
// The second argument means if it should use no proxy for this page (Usefull for logging in)

let page = await api.handleNewPage(false)

// Logs into google, using some credentials
// Optional, but needed for publishing, commenting and liking
// Logged in accounts views are better for SEO than guest views

// Fails if password is invalid, browser got detected
// Or 2FA appears

await api.login(page, {
    email: "this_is_an_email@example.com",
    password: "This_Is_A_Password"
})

// Initialises the watcher
// You must call handleSearchPage or goto on the page before this
// Errors if video is a short
await api.initWatcher(page)

// Creates a comment on the page
// You must call initWatcher before this
await api.makeComment(page, commentText)

// Likes or removes a like on the page
// You must call initWatcher before this
await api.likeVideo(page)

// Dislikes or removes a like on the page
// You must call initWatcher before this
await api.dislikeVideo(page)

// pauses the video on a page
// You must call initWatcher before this
await api.pauseVideo(page)

// continues the video on a page
// You must call initWatcher before this
await api.playVideo(page)

// Gets current statistics about a watcher
// You must call initWatcher before this
let statistics = await api.getPlayerStatistics(page)

console.log(statistics.time) // current time of playback
console.log(statistics.duration) // video duration
console.log(statistics.percentWatched) // Current percent watched of video

// Search for the video and click on it
// If you dont care about SEO you can just call page.goto(url, {waitUntil: "networkidle0"})
await api.handleSearchPage(page, videoId)

// Search for the video in the subscribers feed and click on it
// If you dont care about SEO you can just call page.goto(url, {waitUntil: "networkidle0"})
// Must be logged in or it errors
await api.handleSearchPage(page, videoId)

// Gets information about a video using its id
await api.getVideoMetadata(videoId)

console.log(statistics.id) // Video id
console.log(statistics.duration) // video duration
console.log(statistics.views) // video views
console.log(statistics.uploadDate) // video upload date
console.log(statistics.chapters) // video chapters array
console.log(statistics.author) // name of the author of the video
console.log(statistics.title) // video title
console.log(statistics.description) // video description

// Uploads a video
privacy = "public" || "private" || "unlisted"
privacy = {
    premiere: true, // Optional, if the video should be a premiere
    hour: "12:00 PM", // PM / AM, hour:minutes format 
    date: "12/30/2022" // month/day/year format
}

let id = await api.uploadVideo(page, `/path/to/video`, `video title`, privacy, 
{ // All of these are optional
 // Tags dont work on shorts

    description: "video description",
    thumbnail: "/path/to/thumbnail",
    playlists: ["playlist1", "playlist2", ...],
    eighteenPlus: true, // If the video is 18+
    madeForKids: true, // If the video is made for kids (eighteenPlus must be false or it will error)
    includesPaidPromotion: true, // If the video includes a paid promotion
    ignoreAutomaticChapters: true, // If youtube should not generate automatic chapters
    tags: ["tag1", "tag2", ...],
    category: "gaming", // Video category
    disableEmbedding: true, // if websites should not be able to embed this video
    dontPublishToFeed: true, // Dont publish to subscribers feed
    
    // If it should not wait for proccessing (Otherwise it waits for at least SD proccessing)
    dontWaitForProcessing: true, 
})

console.log(id) // Video id
```