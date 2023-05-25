let selfbot = require("./index")
let bot = new selfbot("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", {autoSkipAds: true})

bot.launch().then(async (browser) => {
    let page = await browser.newPage()
    await page.gotoVideo("direct", "1f42c4nNzs4")

})