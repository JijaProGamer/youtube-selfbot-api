const fs = require("fs")
const path = require("path")
const options = JSON.parse(fs.readFileSync(path.join(__dirname, "../options.json")));

(async () => {
    const API1 = new (require(path.join(__dirname, "../../index.js")))();
    let connection1 = await API1.connectBrowser(options.browserPath, {})
    let browser1 = await connection1.browser()

    let page1 = await API1.handleNewPage()
    await page1.goto("http://www.google.com")

    await page1.close()
    await browser1.close()

    const API2 = new (require(path.join(__dirname, "../../index.js")))();
    let connection2 = await API2.connectBrowser(options.browserPath, {
        proxy: "direct://",
    })

    let browser2 = await connection2.browser()
    let page2 = await API2.handleNewPage(false)
    await page2.goto("http://www.youtube.com", {waitUntil: "networkidle0"})

    await page2.close()
    await browser2.close()
    console.log(JSON.stringify({finish: true}))
})()