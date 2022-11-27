let {
    uploadFileXPath, uploadFileSelector, clickSelector, clickXPath, goto,
    waitForSelector,waitForXPath, typeSelector, typeXPath, sleep,
    jiggleMouse, confirmNavigation, random} = require("../publicFunctions.js")


/**
 * Logins into google account if not logged in already
 * @param {Object} api the api
 * @param {Object} page result of api.handleNewPage()
 * @param {Object} accountInfo Account to log into
 * @param {Object} accountInfo.email Email to log into
 * @param {Object} accountInfo.password Password to use
*/

let emailXPath = `/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/div/div/ul/li/div[1]/div/div`
let loginFailXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div/div[2]/div/div[1]/div/form/span/div[1]/div[2]/div[2]/span`
let badBrowserXPath = `/html/body/div[1]/div[1]/div[2]/div/c-wiz/div[2]/div[2]/div/div[1]/div/form/span/section/div/div/div/div[2]`
let comfirmIdentityXPath = `/html/body/div[1]/div[1]/div[2]/div/div[2]/div/div/div[1]/div/h1/span`

function loginGoogle(api, page, accountInfo) {
    return new Promise(async (resolve, reject) => {
        if (!api.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!api.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        api.data.emit(`debug`, `Started google login`)

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

                api.data.emit(`debug`, `Sucessfully login into google account`)

                api.__loggedin = true
                api.__loginInfo = accountInfo
                resolve()
            } else {
                await api.__client.send('Network.clearBrowserCookies');
                await api.__client.send('Network.clearBrowserCache');

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
                api.data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
    
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
                        api.data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
            
                        return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                    }
        
                    if(comfirmIdentityElement){
                        let pageError = await page.evaluate((e) => e.innerHTML, comfirmIdentityElement)
                        api.data.emit(`debug`, `Failed to loggin into google account. Error: "${pageError}"`)
            
                        return reject(new Error(`Failed to loggin into google account. Error: "${pageError}"`))
                    }
                } else {
                    api.data.emit(`debug`, `Sucessfully login into google account`)

                    api.__loggedin = true
                    api.__loginInfo = accountInfo
                    resolve()
                }
            })
        }
    })
}

module.exports = loginGoogle