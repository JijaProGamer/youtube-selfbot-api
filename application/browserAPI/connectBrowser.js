const { EventEmitter } = require("events"); 

const puppeteer = require("puppeteer-extra")
const fs = require("fs")
const path = require("path")

//const plugin_stealth = require("puppeteer-extra-plugin-stealth")
//puppeteer.use(plugin_stealth)

let { sleep } = require("../publicFunctions.js");

/**
 * Connects to a browser, also creates one if no browserWSEndpoint is provided
 * 
 * @param {Object} api
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

function connectBrowser(api, executablePath, extra) {
    let dataEvent = new EventEmitter()
    let extensionFolder = fs.readdirSync(path.join(__dirname, "../../extensions")).map(value => value = path.join(__dirname, `../../extensions/${value}`))
    
    return {
        browser: () => new Promise((resolve, reject) => {
            api.data = dataEvent
            api.extra = extra

            let launchArguments = {
                headless: extra.headless || false,
                defaultViewport: null,
                ignoreDefaultArgs: true,
                args: [
                    `--start-maximized`, 
                    `--mute-audio`,
                    `--always-authorize-plugins`,
                    '--proxy-bypass-list=*',
                    //`--proxy-server=${extra.proxyServer || "direct://"}`,
                    `--disable-web-security`, `--ignore-certificate-errors`,
                    `--use-gl=egl`,
                ],
                //ignoreDefaultArgs: true,
                executablePath: executablePath,
                ignoreHTTPSErrors: true,
                browserWSEndpoint: extra.browserWSEndpoint,
                userDataDir: extra.userDataDir,
            }

            if(extra.args) launchArguments.args = [...launchArguments.args, ...extra.args]
            if(extra.userDataDir) launchArguments.args.push(`--user-data-dir=${extra.userDataDir}`)


            launchArguments.args.push(`--disable-extensions-except=${extensionFolder.join(",")}`)
        
            extensionFolder.forEach((extension) => {
                launchArguments.args.push(`--load-extension=${extension}`)
            })

            dataEvent.emit("debug", `Launching browser`)
            //dataEvent.emit("debug", `Launching browser with external arguments ${JSON.stringify(launchArguments)}`)

            if(extra.browserWSEndpoint){ // If using a WSEndpoint directly connect to the browser
                puppeteer.connect(launchArguments).then((browser) => {
                    api.__handled = true
                    api.__launched = true
                    api.browser = browser
    
                    dataEvent.emit("debug", "Browser connected sucessfully")
                    resolve(browser)
                }).catch((error) => {
                    api.__handled = true
                    api.__launched = false
                    
                    dataEvent.emit("debug", `Browser failed to connect with error ${error}`)
                    reject(error)
                })
            } else { // Else launch a new browser
                puppeteer.launch(launchArguments).then(async (browser) => {
                    api.__handled = true
                    api.__launched = true
                    api.browser = browser
    
                    dataEvent.emit("debug", "Browser connecting...")

                    await sleep(2000)
                    let browserPages = await browser.pages()

                    for (let [index, page] of browserPages.entries()){
                        let url = await page.url()

                        if(["ytadblock", "bit.ly"].some(e => url.includes(e))){
                            page.close()
                        }
                    }

                    dataEvent.emit("debug", "Browser connected sucessfully")
                    resolve(browser)
                }).catch((error) => {
                    api.__handled = true
                    api.__launched = false
                    
                    dataEvent.emit("debug", `Browser failed to connect with error ${error}`)
                    reject(error)
                })
            }
        }),
        data: dataEvent,
    }
}

module.exports = connectBrowser