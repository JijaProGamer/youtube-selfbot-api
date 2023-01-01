let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector, waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random } = require("../publicFunctions/everything")


/**
 * Logins into google account if not logged in already

* @param {Object} page result of api.handleNewPage()
 * @param {Object} accountInfo Account to log into
 * @param {Object} accountInfo.email Email to log into
 * @param {Object} accountInfo.password Password to use
 * @returns {Array} cookies Array of cookies to log in next time
*/

let emailXPath = `/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/div/div/ul/li/div[1]/div/div`
let loginFailXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div/div[2]/div/div[1]/div/form/span/div[1]/div[2]/div[2]/span`
let badBrowserXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div[2]/div[2]/div/div[1]/div/form/span/section/div/div/div/div[2]`
let comfirmIdentityXPath = `/html/body/div[1]/div[1]/div[2]/div/div[2]/div/div/div[1]/div/h1/span`
let identityXPath = `/html/body/div[1]/div[1]/div[2]/div/div[2]/div/div/div[2]/div/div[1]/div/form/span/section/div/div/span/figure/samp`

function loginGoogle(page, accountInfo, accountCookies) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started google login`)

        if (Array.isArray(accountCookies)) {
            await page.__client.send('Network.clearBrowserCookies');
            await page.__client.send('Network.clearBrowserCache');

            await page.setCookie(...accountCookies)
        }

        await goto(page, `https://myaccount.google.com/email`, 0)

        //await sleep(100000000)

        await Promise.race([
            waitForXPath(page, emailXPath),
            waitForSelector(page, `input[type="email"]`)
        ])

        let emailElement = (await page.$x(emailXPath))[0]
        let continueScript = true

        if (emailElement) {
            continueScript = false

            this.__data.emit(`debug`, `Sucessfully login into google account`)

            this.__loggedin = true
            this.__loginInfo = accountInfo

            resolve(await page.cookies())
        }

        if (continueScript) {
            await typeSelector(page, `input[type="email"]`, accountInfo.email) // Fill username
            await clickSelector(page, "#identifierNext")

            await Promise.race([
                waitForSelector(page, `input[type="password"]`),
                waitForXPath(page, badBrowserXPath),
            ])

            let badBrowserElement = (await page.$x(badBrowserXPath))[0]

            if (badBrowserElement) {
                let pageError = await page.evaluate((e) => e.innerHTML, badBrowserElement)
                this.__data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)

                return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
            }

            await typeSelector(page, `input[type="password"]`, accountInfo.password) // Fill password
            await clickSelector(page, "#passwordNext")

            Promise.race([
                page.waitForNavigation({ waitUntil: "networkidle0" }),
                waitForXPath(page, loginFailXPath),
                waitForXPath(page, comfirmIdentityXPath)
            ]).then(async (afterLogin) => {
                if (afterLogin && afterLogin.toString() === "JSHandle@node") {
                    let pageErrorElement = (await page.$x(loginFailXPath))[0]
                    let comfirmIdentityElement = (await page.$x(comfirmIdentityXPath))[0]

                    if (pageErrorElement) {
                        let pageError = await page.evaluate((e) => e.innerHTML, pageErrorElement)
                        this.__data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)

                        return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                    }

                    if (comfirmIdentityElement) {
                        let pageError = await page.evaluate((e) => e.innerHTML, comfirmIdentityElement)
                        let identityNum = await page.evaluate((e) => e.innerHTML, await waitForXPath(page, identityXPath))
                        this.__data.emit(`debug`, `Please confirm your identity: "${identityNum}"`)

                        let result = await Promise.race([
                            waitForXPath(page, emailXPath),
                            sleep(25 * 1000),
                        ])

                        if (result) {
                            this.__data.emit(`debug`, `Sucessfully login into google account`)

                            this.__loggedin = true
                            this.__loginInfo = accountInfo

                            resolve(await page.cookies())
                        } else {
                            return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                        }
                    }
                } else {
                    this.__data.emit(`debug`, `Sucessfully login into google account`)

                    this.__loggedin = true
                    this.__loginInfo = accountInfo

                    resolve(await page.cookies())
                }
            })
        }
    })
}

module.exports = loginGoogle