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
let API = require("youtube-selfbot-api");

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

let browserConnection = api.browserAPI.connectBrowser(API, chromePath, extraArguments)
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
let browser = await browserConnection.browser(api)

// Creates a new puppeteer page
// The second argument means if it should use no proxy for this page (Usefull for logging in)

let page = await api.browserAPI.handleNewPage(api, false)

// Logs into google, using some credentials
// Optional, but needed for publishing, commenting and liking
// Logged in accounts views are better for SEO than guest views

// Fails if password is invalid, browser got detected
// Or 2FA appears

await api.googleAPI.login(api, page, {
    email: "this_is_an_email@example.com",
    password: "This_Is_A_Password"
})

// Search for the video and click on it
// If you dont care about SEO you can just call page.goto(url, {waitUntil: "networkidle0"})
await api.videoAPI.handleSearchPage(api, page, videoId)

// Initialises the watcher
// You must call handleSearchPage or goto on the page before this
await api.watcherAPI.initWatcher(api, page)

// Creates a comment on the page
// You must call initWatcher before this
await api.watcherAPI.makeComment(api, page, commentText)

// Likes or removes a like on the page
// You must call initWatcher before this
await api.watcherAPI.likeVideo(api, page)
```