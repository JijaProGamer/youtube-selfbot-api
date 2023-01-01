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
*/

function loginGoogle(page) {
    return new Promise(async (resolve, reject) => {
        if (!this.__handled) reject(new Error(`Please call api.connectBrowser first`))
        if (!this.__launched) reject(new Error(`api.connectBrowser was called, but failed doing so`))

        this.__data.emit(`debug`, `Started google logout`)

        await page.__client.send('Network.clearBrowserCookies');
        await page.__client.send('Network.clearBrowserCache');

        this.__data.emit(`debug`, `Sucessfully cleared cookies`)

        await goto(page, `https://myaccount.google.com/email`, 0)

        this.__data.emit(`debug`, `Sucessfully logged out`)

        this.__loggedin = false
        this.__loginInfo = undefined
    })
}

module.exports = loginGoogle