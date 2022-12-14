const waitForSelector = (page, selector, selectorNum = 0) => {
    return new Promise(async (resolve, reject) => {
        /*const firstElements = await page.$$(selector)
        if (firstElements[selectorNum]) {
            resolve(firstElements[selectorNum])
        } else {*/
            page.waitForSelector(selector, { visible: true }).then(async () => {
                const elements = await page.$$(selector)
                resolve(elements[selectorNum])
            }).catch(async (err) => {
                page.$$(selector).then((elements) => {
                    if (elements[selectorNum]) {
                        resolve(elements[selectorNum])
                    } else {
                        reject(err)
                    }
                }).catch(() => {
                    reject(err)
                })
            })
        //}
    })
}

const waitForClassName = (page, ClassName, selectorNum = 0) => {
    return new Promise(async (resolve, reject) => {
        page.evaluate((e) => {
            let {ClassName, selectorNum} = e

            function isInViewport(element) {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element)

                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth) &&
                    style.display !== "none"
                );
            }

            return new Promise((resolve, reject) => {
                let start = new Date() / 1000

                let interval = setInterval(() => {
                    let element = document.getElementsByClassName(ClassName)[selectorNum]

                    if(element && isInViewport(element)){                        
                        clearInterval(interval)
                        resolve()
                    } else {
                        if ((new Date() / 1000) - start > 5){
                            clearInterval(interval)
                            reject()
                        }
                    }
                }, 500)
            })
        }, {ClassName,selectorNum: selectorNum || 0})
        .then(() => {
            resolve()
        }).catch(reject)
    })
}

const waitForXPath = (page, xPath, selectorNum = 0) => {
    return new Promise(async (resolve, reject) => {
        /*const firstElements = await page.$x(xPath)
        if (firstElements[selectorNum]) {
            resolve(firstElements[selectorNum])
        } else {*/
            page.waitForXPath(xPath, { visible: true }).then(async () => {
                const elements = await page.$x(xPath)
                resolve(elements[selectorNum])
            }).catch(async (err) => {
                page.$x(xPath).then((elements) => {
                    if (elements[selectorNum]) {
                        resolve(elements[selectorNum])
                    } else {
                        reject(err)
                    }
                }).catch(() => {
                    reject(err)
                })
            })
        //}
    })
}

const clickSelector = async (page, selector, selectorNum) => {
    return new Promise((resolve, reject) => {
        waitForSelector(page, selector, selectorNum).then(async (element) => {
            element.click().then(resolve).catch(reject)
        }).catch(reject)
    })
}

const clickXPath = async (page, XPath) => {
    return new Promise((resolve, reject) => {
        waitForXPath(page, XPath).then(async (element) => {
            element.click().then(resolve).catch(reject)
        }).catch(reject)
    })
}

const typeXPath = async (page, XPath, text, selectorNum, typingSpeed = 25) => {
    return new Promise((resolve, reject) => {
        waitForXPath(page, XPath, selectorNum).then(async (element) => {
            element.focus().then(async () => {
                await page.keyboard.type(text, { delay: typingSpeed})

                resolve()
            }).catch(reject)
        }).catch(err => {
            reject(err)
        })
    })
}
const typeSelector = async (page, selector, text, selectorNum, typingSpeed = 25) => {
    return new Promise((resolve, reject) => {
        waitForSelector(page, selector, selectorNum).then(async (element) => {
            element.focus().then(async () => {
                await page.keyboard.type(text, { delay: typingSpeed})

                resolve()
            }).catch(reject)
        }).catch(err => {
            reject(err)
        })
    })
}


const goto = (page, website, tryNum = 0) => {
    return new Promise(async (resolve, reject) => {
        try {
            page.goto(website, { waitUntil: "networkidle0" }).then(() => {
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
            page.waitForNavigation({ timeout: 30 * 1000, waitUntil: "networkidle0" }).then(resolve).catch(resolve)
        } catch (err) {
            resolve(err)
        }
    })
}

const scrollUntilXPathVisible = (page, XPath, limitSeconds = 30) => {
    return new Promise(async (resolve, reject) => {
        page.evaluate((XPath, limit) => {
            function getElementByXpath(path) {
                return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }

            return new Promise((resolve, reject) => {
                window.scrollTo(0, 0);

                let start = new Date() / 1000

                let interval = setInterval(() => {
                    let current = new Date() / 1000
                    let element = getElementByXpath(XPath)

                    if (element) {
                        clearInterval(interval)
                        resolve(element)
                    } else {
                        window.scrollBy(0, 300);
                    }

                    if (current - start > limit) {
                        clearInterval(interval)
                        reject(new Error(`Too much time spent scrolling`))
                    }
                }, 500)
            })
        }, XPath, limitSeconds)
            .then(resolve)
            .catch(reject)
    })
}

const scrollUntilSelectorVisible = (page, Selector, limitSeconds = 30) => {
    return new Promise(async (resolve, reject) => {
        page.evaluate((selector, limit) => {
            return new Promise((resolve, reject) => {
                window.scrollTo(0, 0);

                let start = new Date() / 1000

                let interval = setInterval(() => {
                    let current = new Date() / 1000
                    let element = document.querySelector(selector)

                    if (element) {
                        clearInterval(interval)
                        resolve(element)
                    } else {
                        window.scrollBy(0, 300);
                    }

                    if (current - start > limit) {
                        clearInterval(interval)
                        reject(new Error(`Too much time spent scrolling`))
                    }
                }, 500)
            })
        }, Selector, limitSeconds)
            .then(resolve)
            .catch(reject)
    })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const random = (min, max) => min + Math.floor(Math.random() * (max - min));

module.exports = {
    uploadFileXPath, waitForXPath, clickXPath, typeXPath,
    uploadFileSelector, waitForSelector, clickSelector, typeSelector,
    scrollUntilXPathVisible, scrollUntilSelectorVisible,
    waitForClassName,
    goto, jiggleMouse,
    confirmNavigation,
    sleep, random
}