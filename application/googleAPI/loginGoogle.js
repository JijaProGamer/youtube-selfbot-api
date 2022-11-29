let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions/everything")


/**
 * Logins into google account if not logged in already

* @param {Object} page result of api.handleNewPage()
 * @param {Object} accountInfo Account to log into
 * @param {Object} accountInfo.email Email to log into
 * @param {Object} accountInfo.password Password to use
*/

let emailXPath = `/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/div/div/ul/li/div[1]/div/div`
let loginFailXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div/div[2]/div/div[1]/div/form/span/div[1]/div[2]/div[2]/span`
let badBrowserXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div[2]/div[2]/div/div[1]/div/form/span/section/div/div/div/div[2]`
let comfirmIdentityXPath = `/html/body/div[1]/div[1]/div[2]/div/div[2]/div/div/div[1]/div/h1/span`

function loginGoogle(page, accountInfo) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started google login`)

        await goto(page, `https://myaccount.google.com/email`, 0)

        await Promise.race([
            waitForXPath(page, emailXPath),
            waitForSelector(page, `input[type="email"]`)
        ])

        let emailElement = (await page.$x(emailXPath))[0]
        let continueScript = true

        if(emailElement){
            let currentEmail = await page.evaluate((e) => e.innerHTML, emailElement)

            if(currentEmail === accountInfo.email){
                continueScript = false

                this.__data.emit(`debug`, `Sucessfully login into google account`)

                this.__loggedin = true
                this.__loginInfo = accountInfo
                resolve()
            } else {
                await page.__client.send('Network.clearBrowserCookies');
                await page.__client.send('Network.clearBrowserCache');

                await goto(page, `https://myaccount.google.com/email`, 0)
            }
        }

        if(continueScript){
            await typeSelector(page, `input[type="email"]`, accountInfo.email) // Fill username
            await clickSelector(page, "#identifierNext")

            await Promise.race([
                waitForSelector(page, `input[type="password"]`),
                waitForXPath(page, badBrowserXPath),
            ])

            let badBrowserElement = (await page.$x(badBrowserXPath))[0]

            if(badBrowserElement){
                let pageError = await page.evaluate((e) => e.innerHTML, badBrowserElement)
                this.__data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
    
                return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
            }
    
            await typeSelector(page, `input[type="password"]`, accountInfo.password) // Fill password
            await clickSelector(page, "#passwordNext")
    
            Promise.race([
                page.waitForNavigation({waitUntil: "networkidle0"}),
                waitForXPath(page, loginFailXPath),
                waitForXPath(page, comfirmIdentityXPath)
            ]).then(async (afterLogin) => {
                if(afterLogin.toString() === "JSHandle@node"){
                    let pageErrorElement = (await page.$x(loginFailXPath))[0]
                    let comfirmIdentityElement = (await page.$x(comfirmIdentityXPath))[0]
            
                    if(pageErrorElement){
                        let pageError = await page.evaluate((e) => e.innerHTML, pageErrorElement)
                        this.__data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
            
                        return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                    }
        
                    if(comfirmIdentityElement){
                        let pageError = await page.evaluate((e) => e.innerHTML, comfirmIdentityElement)
                        this.__data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
            
                        return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                    }
                } else {
                    this.__data.emit(`debug`, `Sucessfully login into google account`)

                    this.__loggedin = true
                    this.__loginInfo = accountInfo
                    resolve()
                }
            })
        }
    })
}

module.exports = loginGoogle