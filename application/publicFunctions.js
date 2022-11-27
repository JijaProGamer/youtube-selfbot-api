const waitForSelector = (page, selector, selectorNum) => {
    selectorNum = selectorNum ? selectorNum : 0

    return new Promise(async (resolve, reject) => {
        try {
            page.waitForSelector(selector, { visible: true }).then(async () => {
                const elements = await page.$$(selector)
                resolve(elements[selectorNum])
            }).catch((err) => {
                reject(err)
            })
        } catch (e) {
            const elements = await page.$$(selector)
            if (elements[0]) {
                resolve(elements[selectorNum])
            } else {
                reject(err)
            }
        }
    })
}

const waitForXPath = (page, xPath) => {
    return new Promise(async (resolve, reject) => {
        try {
            page.waitForXPath(xPath, { visible: true }).then(async () => {
                const elements = await page.$x(xPath)
                resolve(elements[0])
            }).catch((err) => {
                reject(err)
            })
        } catch (e) {
            const elements = await page.$x(xPath)
            if (elements[0]) {
                resolve(elements[0])
            } else {
                reject(err)
            }
        }
    })
}

const clickSelector = async (page, selector, selectorNum) => {
    return new Promise((resolve, reject) => {
        waitForSelector(page, selector, selectorNum).then(async (element) => {
            await element.click()
            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}

const clickXPath = async (page, XPath) => {
    return new Promise((resolve, reject) => {        
        waitForXPath(page, XPath).then(async (element) => {
            await element.click()
            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}

const typeXPath = async (page, XPath, text) => {
    return new Promise((resolve, reject) => {
        waitForXPath(page, XPath).then(async (element) => {
            await element.focus()
            await page.keyboard.type(text, { delay: 25 })

            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}
const typeSelector = async (page, selector, text, selectorNum) => {
    return new Promise((resolve, reject) => {
        waitForSelector(page, selector, selectorNum).then(async (element) => {
            await element.focus()
            await page.keyboard.type(text, { delay: 25 })

            resolve()
        }).catch(err => {
            reject(err)
        })
    })
}


const goto = (page, website, tryNum) => {
    return new Promise(async (resolve, reject) => {
        try {
            page.goto(website, { waitUntil: "networkidle2" }).then(() => {
                resolve()
            }).catch(async (err) => {
                if (tryNum <= 3) {
                    await goto(page, website, tryNum + 1);
                    resolve()
                } else {
                    reject(`Too many goto tries | ${err}`)
                }
            })
        } catch (err) {
            if (tryNum <= 3) {
                await goto(page, website, tryNum + 1);
                resolve()
            } else {
                reject(`Too many goto tries | ${err}`)
            }
        }
    })
}

const uploadFileSelector = async (page, selector, file, selectorNum) => {
    const [fileChooser] = await Promise.all([
        page?.waitForFileChooser(),
        clickSelector(page, selector, selectorNum),
    ])

    await fileChooser?.accept([file])
}

const uploadFileXPath = async (page, XPath, file) => {
    const [fileChooser] = await Promise.all([
        page?.waitForFileChooser(),
        clickXPath(page, XPath),
    ])

    await fileChooser?.accept([file])
}

const jiggleMouse = async (page, position) => {
    await page.mouse.move(position, position)
    await sleep(1000)
    await page.mouse.move(position, position)
}

const confirmNavigation = (page) => {
    return new Promise(async (resolve, reject) => {
        try {
            page.goto(website, { timeout: 30 * 1000, waitUntil: "networkidle0" }).then(resolve).catch(resolve)
        } catch (err) {
            resolve(err)
        }
    })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const random = (min, max) => min + Math.floor(Math.random() * (max - min));

module.exports = {
    uploadFileXPath, waitForXPath, clickXPath, typeXPath,
    uploadFileSelector, waitForSelector, clickSelector, typeSelector,
    goto, jiggleMouse,
    confirmNavigation,
    sleep, random
}