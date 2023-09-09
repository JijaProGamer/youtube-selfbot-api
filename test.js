import selfbot from "./index.js"
import { readFileSync } from "fs"

let opts = JSON.parse(readFileSync("./env.json"))
let proxy = "direct://"

async function run(){
    let bot = new selfbot({autoSkipAds: true, proxy, headless: false})
    let browser = await bot.launch()
    let page = await browser.newPage()
    //let googleContext = await page.setupGoogle();
    //await googleContext.login(opts)

    let watcherContext = await page.gotoVideo("direct", "1f42c4nNzs4")
    //watcherContext.like()

    console.log("done")
}

run()
//run()
//run()