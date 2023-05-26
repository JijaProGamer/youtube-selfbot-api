let selfbot = require("./index")

async function run(){
    let bot = new selfbot("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", {autoSkipAds: true})
    let browser = await bot.launch()
    let page = await browser.newPage()
    await page.gotoVideo("direct", "1f42c4nNzs4")
}

run()