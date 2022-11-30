const { EventEmitter } = require("events");

const puppeteer = require("puppeteer-core")
const fs = require("fs")
const path = require("path")

//const plugin_stealth = require("puppeteer-extra-plugin-stealth")
//puppeteer.use(plugin_stealth)

let { sleep, random } = require("../publicFunctions/everything.js");
const randomUseragent = require('random-useragent');

let ignoredFlags = [
    '--allow-pre-commit-input',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-extensions-with-background-pages',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    //'--disable-extensions',
    '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
    '--disable-hang-monitor',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    //'--enable-automation',
    '--enable-blink-features=IdleDetection',
    '--enable-features=NetworkServiceInProcess2',
    '--export-tagged-pdf',
    '--force-color-profile=srgb',
    '--metrics-recording-only',
    //'--no-first-run',
    '--password-store=basic',
    '--use-mock-keychain',
    '--headless',
    '--hide-scrollbars',
    //'--mute-audio',
    //'about:blank'
]

let getRandomUserAgent = () => {
    return randomUseragent.getRandom(function (ua) {
        return ua.browserName === 'Chrome' 
            && ua.osName == "Windows"
            && ua.osVersion == 10
            && parseFloat(ua.browserMajor) > 55
    })
}

let randomDevice = () => {
    let deviceKeys = Object.keys(puppeteer.KnownDevices)
    let randomDevice = deviceKeys[random(0, deviceKeys.length)]

    return puppeteer.KnownDevices[randomDevice]
}

function attemptLaunch(launchArguments, tryNum = 0){
    return new Promise((resolve, reject) => {
        puppeteer.launch(launchArguments).then(resolve).catch((err) => {
            if(tryNum >= 2){
                reject(err)
            } else {
                attemptLaunch(browser, tryNum + 1)
                .then(resolve)
                .catch(reject)
            }
        })
    })
}

/**
 * Connects to a browser, also creates one if no browserWSEndpoint is provided
 * 
 * @param {string} executablePath Chrome binary file
 * @param {Object} extra Extra information for connecting to the browser
 * @param {string | undefined} extra.browserWSEndpoint WSEndpoint of detached browser, Browserless or other providers recommended
 * @param {string | undefined} extra.proxyServer IP of the proxy to connect to (Optional, but should be used)
 * @param {string | undefined} extra.userDataDir used for extra caching, anti bot detection and fast login (Optional, but recommended)
 * @param {boolean | undefined} extra.saveBandwith Bypass useless requests
 * @param {boolean | undefined} extra.headless Launch browser in headless mode?
 * @param {Array | undefined} extra.args Extra arguments to pass to chrome's launch arguments
 * 
 * @returns {Promise<Browser>, Event<data>} the browser generator promise and data logger
*/

function connectBrowser(executablePath, extra) {
    if (this.__handled) reject(new Error(`You can call api.connectBrowser only one time per API`))

    if (!extra) extra = {}

    let dataEvent = new EventEmitter()
    let extensionFolder = fs.readdirSync(path.join(__dirname, "../../extensions"))
        .map(value => value = path.join(__dirname, `../../extensions/${value}`))

    return {
        browser: () => new Promise((resolve, reject) => {
            this.__data = dataEvent
            this.__extra = extra

            let launchArguments = {
                headless: extra.headless || false,
                defaultViewport: null,
                ignoreDefaultArgs: ignoredFlags,
                args: [
                    `--start-maximized`,
                    `--mute-audio`,
                    `--always-authorize-plugins`,
                    '--proxy-bypass-list=*',
                    //`--proxy-server=${extra.proxyServer || "direct://"}`,
                    `--disable-web-security`, `--ignore-certificate-errors`,
                    //`--use-gl=egl`,
                ],
                //ignoreDefaultArgs: true,
                executablePath: executablePath,
                ignoreHTTPSErrors: true,
                browserWSEndpoint: extra.browserWSEndpoint,
                userDataDir: extra.userDataDir,
            }

            if (extra.args) launchArguments.args = [...launchArguments.args, ...extra.args]
            if (extra.userDataDir) launchArguments.args.push(`--user-data-dir=${extra.userDataDir}`)

            launchArguments.args.push(`--disable-extensions-except=${extensionFolder.join(",")}`)

            extensionFolder.forEach((extension) => {
                launchArguments.args.push(`--load-extension=${extension}`)
            })

            dataEvent.emit("debug", `Launching browser`)
            //dataEvent.emit("debug", `Launching browser with external arguments ${JSON.stringify(launchArguments)}`)

            this.__userAgent = getRandomUserAgent()
            this.__device = randomDevice()

            if (extra.browserWSEndpoint) { // If using a WSEndpoint directly connect to the browser
                puppeteer.connect(launchArguments).then(async (browser) => {
                    this.__handled = true
                    this.__launched = true
                    this.browser = browser

                    await sleep(2000)
                    dataEvent.emit("debug", "Browser connected sucessfully")
                    resolve(browser)
                }).catch((error) => {
                    this.__handled = true
                    this.__launched = false
                    dataEvent.emit("debug", `Browser failed to connect with error ${error}`)
                    reject(error)
                })
            } else { // Else launch a new browser
                attemptLaunch(launchArguments).then(async (browser) => {
                    this.__handled = true
                    this.__launched = true
                    this.browser = browser

                    await sleep(2000)
                    dataEvent.emit("debug", "Browser connected sucessfully")
                    resolve(browser)
                }).catch((error) => {
                    this.__handled = true
                    this.__launched = false

                    dataEvent.emit("debug", `Browser failed to connect with error ${error}`)
                    reject(error)
                })
            }
        }),
        data: dataEvent,
    }
}

module.exports = connectBrowser