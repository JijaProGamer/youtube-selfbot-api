import selfbot from "./index.js"
import { readFileSync } from "fs"

let opts = JSON.parse(readFileSync("./env.json"))
let proxy = "direct://"

async function run(){
    let bot = new selfbot("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", {autoSkipAds: true, proxy, headless: true})
    let browser = await bot.launch()
    let page = await browser.newPage()
    //let googleContext = await page.setupGoogle();
    //await googleContext.login(opts)

    let watcherContext = await page.gotoVideo("search", "1f42c4nNzs4")
    //watcherContext.like()
}

run()
//run()
//run()