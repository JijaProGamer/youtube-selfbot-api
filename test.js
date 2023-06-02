let selfbot = require("./index")
let opts = JSON.parse(require("fs").readFileSync("./env.json"))

async function run(){
    let bot = new selfbot("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", {autoSkipAds: true})
    let browser = await bot.launch()
    let page = await browser.newPage()
    let googleContext = await page.setupGoogle();
    await googleContext.login(opts)

    let watcherContext = await page.gotoVideo("direct", "1f42c4nNzs4")
    watcherContext.like()
}

run()