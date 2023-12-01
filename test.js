import selfbot from "./index.js"
import { readFileSync, writeFileSync } from "fs"

let opts = JSON.parse(readFileSync("./env.json"))
let cookies = JSON.parse(readFileSync("./cookies.json"))
let proxy = "direct://"

let used = 0;

async function run(){
    let bot = new selfbot({
        autoSkipAds: true, 
        timeout: 0,
        
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

    await browser.clearStorage()

    // normal test

    //let watcherContext = await page.gotoVideo("direct", "efpwEe6CvtI")
    //console.log(page.videoInfo)

    // livestream test

    let googleContext = await page.setupGoogle()
    await googleContext.login(opts, cookies)
    writeFileSync("./cookies.json", JSON.stringify(await page.getCookies()))

    let watcherContext = await page.gotoVideo("direct", "https://www.youtube.com/watch?v=NHFV0hyCgzA")

    console.log("done 1")

    await watcherContext.comment("This is so cool!!")

    console.log("done final")

    /*(setInterval(async () => {
        console.log(await watcherContext.time(), await watcherContext.duration(), await watcherContext.time() / await watcherContext.duration())

    }, 500)()*/
}

run()
//run()
//run()