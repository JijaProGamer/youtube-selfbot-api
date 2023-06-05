let sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function text(el) {
    return await el.evaluate(e => e.innerText.trim())
}

class googleContext {
    #page = {}
    #parent = {}
    #extra = {}
    currentAccount = {}
    #browser = {}

    constructor(page, parent, extra, browser) {
        this.#page = page
        this.#parent = parent
        this.#extra = extra
        this.#browser = browser
    }

    setup() {
        return new Promise(async (resolve) => {
            await this.#page.goto(`https://myaccount.google.com/email`)
            let el = await Promise.race([
                this.#page.waitForXPath(`/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/ul/li/div/div/div`),
                this.#page.waitForSelector(`#identifierId`),
            ])

            let emailBox = (await this.#page.$$(`#identifierId`))[0]
            let currentEmail

            if (!emailBox) {
                currentEmail = await text(el)
            }

            if (emailBox) {
                this.currentAccount = {
                    email: "",
                    password: "",
                    cookies: [],
                    formatted_cookies: "",
                    loggedIn: false,
                }
            } else {
                let currentCookies = await this.#parent.getCookies()

                this.currentAccount = {
                    email: currentEmail,
                    password: "",
                    cookies: currentCookies,
                    formatted_cookies: await this.#parent.getFormattedCookies(),
                    loggedIn: true,
                }
            }

            resolve(this.currentAccount)
        })
    }

    async login(accountInfo = {}, cookies) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.#page.goto(`https://myaccount.google.com/email`).catch(reject)
                let el = await Promise.race([
                    this.#page.waitForXPath(`/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/ul/li/div/div/div`),
                    this.#page.waitForSelector(`#identifierId`),
                ]).catch(reject)

                if (typeof cookies == "string" || typeof cookies == "object") {
                    await this.#parent.clearCookies().catch(reject)
                    await this.#parent.setCookies(cookies).catch(reject)
                    await this.#page.goto(`https://myaccount.google.com/email`).catch(reject)

                    el = await Promise.race([
                        this.#page.waitForXPath(`/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/ul/li/div/div/div`),
                        this.#page.waitForSelector(`#identifierId`),
                    ]).catch(reject)
                }

                let emailBox = (await this.#page.$$(`#identifierId`).catch(reject))[0]
                let currentEmail

                if (!emailBox) {
                    currentEmail = await text(el)
                }

                if (emailBox || currentEmail !== accountInfo.email) {
                    if (!accountInfo.email || !accountInfo.password) {
                        this.#browser.emit("loginFailed", this.#parent.id, {
                            header: "No account information given",
                            instructions: "Please provide both email and password for the account",
                        })

                        reject("No account information given")
                    }

                    if (currentEmail !== accountInfo.email && currentEmail && accountInfo.email && accountInfo.email.length > 1) {
                        await this.#parent.clearCookies().catch(reject)
                        await this.#page.goto(`https://myaccount.google.com/email`).catch(reject)
                        await this.#page.waitForSelector(`#identifierId`).catch(reject)
                    }

                    // email

                    await this.#page.click(`#identifierId`).catch(reject)
                    await sleep(1000)
                    await this.#page.type(`#identifierId`, accountInfo.email, { delay: 75 }).catch(reject)

                    // continue
                    await this.#page.waitForSelector(`#identifierNext`, { visible: true }).catch(reject)
                    await this.#page.click(`#identifierNext`).catch(reject)

                    await Promise.race([
                        this.#page.waitForXPath(`//*[@id="yDmH0d"]/c-wiz/div[2]/div[2]/div/div[1]/div/form/span/section/div/div/div/div[2]`),
                        this.#page.waitForSelector(`#password`),
                    ]).catch(reject)

                    let pel = await this.#page.$x(`//*[@id="yDmH0d"]/c-wiz/div[2]/div[2]/div/div[1]/div/form/span/section/div/div/div/div[2]`).catch(reject)
                    if (pel[0]) {
                        await sleep(500)

                        let hEl = await this.#page.$(`#headingText > span`).catch(reject)

                        let header = await text(hEl)
                        let instructions = await text(pel[0]).catch(reject)

                        this.#browser.emit("loginFailed", this.#parent.id, {
                            header,
                            instructions,
                        })

                        return reject(header)
                    }

                    await sleep(500)

                    // password

                    let selector = await this.#page.waitForSelector(`#password`, { visible: true }).catch(reject)
                    await selector.click().catch(reject)
                    await sleep(1000)
                    await this.#page.type(`#password`, accountInfo.password, { delay: 75 }).catch(reject)

                    // continue

                    await this.#page.waitForSelector(`#passwordNext`, { visible: true }).catch(reject)
                    await this.#page.click(`#passwordNext`).catch(reject)

                    await Promise.race([
                        this.#page.waitForSelector(`div[jsname="bySMBb"]`),
                        this.#page.waitForSelector(`div[jsname="B34EJ"]`),
                        this.#page.waitForSelector(`[data-challengetype="12"]`),
                        this.#page.waitForXPath(`/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/ul/li/div/div/div`),
                        this.#page.waitForXPath(`//*[@id="yDmH0d"]/c-wiz/div/div[2]/div/div[1]/div/form/span/div[1]/div[2]/div[2]/span`),
                        this.#page.waitForXPath(`//*[@id="view_container"]/div/div/div[2]/div/div[1]/div/form/span/section/div/div/span/figure/samp`),
                    ]).catch(reject)

                    if(await this.#page.$(`[data-challengetype="12"]`)){
                        await Promise.all([
                            this.#page.waitForNavigation({waitUntil: "networkidle2"}),
                            this.#page.click(`[data-challengetype="12"]`)
                        ]);

                        await sleep(1500);
                        await this.#page.type(`#knowledge-preregistered-email-response`, accountInfo.recovery, { delay: 75 }).catch(reject)
                        await this.#page.click(`button`)
                        
                        await sleep(1000);
                    }

                    let pInc = await this.#page.$x(`//*[@id="yDmH0d"]/c-wiz/div/div[2]/div/div[1]/div/form/span/div[1]/div[2]/div[2]/span`).catch(reject)
                    let pInc2 = await this.#page.$$(`div[jsname="B34EJ"]`).catch(reject)
                    if (pInc[0] || pInc2[0]) {
                        await sleep(500)
                        let instructions = await text(pInc[0] || pInc2[0])

                        this.#browser.emit("loginFailed", this.#parent.id, {
                            header: "wrong password",
                            instructions,
                        })

                        return reject("wrong password")
                    }

                    let code = await this.#page.$x(`//*[@id="view_container"]/div/div/div[2]/div/div[1]/div/form/span/section/div/div/span/figure/samp`).catch(reject)

                    if (code[0]) {
                        await sleep(500)
                        code = parseInt(await text(code[0]))
                        let handling = false

                        await Promise.all([
                            new Promise(async (resolve, reject) => {
                                this.#browser.on("handlingCode", (isHandling) => {
                                    handling = true
                                    if (isHandling) {
                                        resolve()
                                    } else {
                                        reject()
                                    }
                                })

                                setTimeout(() => {
                                    if (!handling) {
                                        reject(`login code not being handled`)
                                    }
                                }, 5000)
                            }),

                            this.#browser.emit("loginCode", this.#parent.id, code)
                        ])

                        await new Promise((resolve, reject) => {
                            this.#browser.on("cancelCodeHandling", reject)
                            this.#browser.on("codeHandled", resolve)
                        })
                    }

                    if(await this.#page.$(`button[jsname="bySMBb"]`)){
                        await Promise.all([
                            this.#page.waitForNavigation({waitUntil: "networkidle2"}),
                            this.#page.click(`button[jsname="bySMBb"]`)
                        ])
                    }

                    if(await this.#page.$(`#yDmH0d > c-wiz > div > div > div > div.L5MEH.Bokche.ypEC4c > div.lq3Znf > div:nth-child(1) > button`)){
                        await Promise.all([
                            this.#page.waitForNavigation({waitUntil: "networkidle2"}),
                            this.#page.click(`#yDmH0d > c-wiz > div > div > div > div.L5MEH.Bokche.ypEC4c > div.lq3Znf > div:nth-child(1) > button`)
                        ])
                    }

                    await this.#page.waitForXPath(`/html/body/c-wiz/div/div[2]/div[2]/c-wiz/div/div[4]/article/div/div/ul/li/div/div/div`).catch(reject)

                    this.currentAccount = {
                        ...accountInfo,
                        cookies: await this.#parent.getCookies().catch(reject),
                        formatted_cookies: await this.#parent.getFormattedCookies().catch(reject),
                        loggedIn: true,
                    }

                    resolve(this.currentAccount)
                } else {
                    this.currentAccount = {
                        email: currentEmail,
                        password: "",
                        cookies: await this.#parent.getCookies().catch(reject),
                        formatted_cookies: await this.#parent.getFormattedCookies().catch(reject),
                        loggedIn: true,
                    }
                }

                resolve(this.currentAccount)
            } catch (err) {
                reject(new Error(err))
            }
        })
    }

    async logout() {
        await this.#parent.clearCookies().catch(reject)
        this.currentAccount = {
            email: "",
            password: "",
            cookies: [],
            formatted_cookies: "",
            loggedIn: false,
        }

        return this.currentAccount
    }
}

export default googleContext