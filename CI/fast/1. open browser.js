const fs = require("fs")
const path = require("path")
const options = JSON.parse(fs.readFileSync(path.join(__dirname, "../options.json")));

(async () => {
    const API1 = new (require(path.join(__dirname, "../../index.js")))();
    let connection1 = await API1.connectBrowser(options.browserPath, {})
    let browser1 = await connection1.browser()

    await browser1.close()

    const API2 = new (require(path.join(__dirname, "../../index.js")))();
    let connection2 = await API2.connectBrowser(options.browserPath, {
        proxyServer: "direct://",
        saveBandwith: true,
    })

    let browser2 = await connection2.browser()

    await browser2.close()

    const API3 = new (require(path.join(__dirname, "../../index.js")))();
    let connection3 = await API3.connectBrowser(options.browserPath, {
        userDataDir: path.join(__dirname, "../temp/cache/ob1")
    })

    let browser3 = await connection3.browser()

    await browser3.close()

    console.log(JSON.stringify({finish: true}))
})()