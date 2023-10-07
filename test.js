import selfbot from "./index.js"
import { readFileSync } from "fs"

let opts = JSON.parse(readFileSync("./env.json"))
//let proxy = "direct://"
let proxy = "http://Bloxxy213:VictorESmeker_session-Dl4NjuTh_lifetime-3h_streaming-1@geo.iproyal.com:12321"

let used = 0;

async function run(){
    let bot = new selfbot({
        autoSkipAds: true, 
        
        proxy,
        headless: false,
    })

    let browser = await bot.launch()
    let page = await browser.newPage()
    //let googleContext = await page.setupGoogle();
    //await googleContext.login(opts)

    await page.clearCookies()

    browser.on("bandwith", (_, id, bandwidth) => {
        used += bandwidth

        //console.log(used / (1024 * 1024))
    })

    let watcherContext = await page.gotoVideo("suggestions", "1f42c4nNzs4", {forceFind: true})
    //console.log(page.videoInfo)
    //watcherContext.like()

    console.log("done")
}

run()
//run()
//run()