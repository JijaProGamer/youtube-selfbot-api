const fs = require("fs")
const path = require("path")
const child_process = require("child_process")

let testResults = {}
let tests = {}

let testDir = fs.readdirSync(path.join(__dirname, "/fast/"))

for (let file of testDir.values()){
    tests[file.split(".js")[0]] = true

    testResults[file.split(".js")[0]] = {
        finished: false,
        error: null,
    }
}

let interval = setInterval(() => {
    let finishedArray = {}
    let anyError
    let stillRunning = true

    for (let [index, value] of Object.entries(testResults)){
        finishedArray[index] = value.finished && "✔️  " || "[?]"
        if(value.error){
            finishedArray[index] = "❌ "
            anyError = {index, error: value.error}
        }

        if(!value.finished){
            stillRunning = false
        }
    }

    console.clear()
    console.table(finishedArray)

    if(anyError){
        console.log("\n\n❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n\n")
        console.log(`${anyError.index} failed with error ${anyError.error}`)
        clearInterval(interval)
    }

    if(stillRunning){
        console.log("\n\n ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ✔️  ")
        clearInterval(interval)
    }
}, 1000);

let parseJSON = (message) => {
    return new Promise((resolve, reject) => {
        try {
            let result = JSON.parse(message)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

(async () => {
    for (let [name, TestFunction] of Object.entries(testResults)){
        await new Promise((resolve, reject) => {
            let child = child_process.spawn("node", [path.join(__dirname, `/fast/${name}.js`)])

            child.stdout.on("data", (data) => {
                data = data.toString()

                parseJSON(data).then((result) => {
                    testResults[name].finished = true

                    resolve()
                }).catch((err) => {
                    testResults[name].error = err
                })
            })

            child.stderr.on("data", (data) => {
                testResults[name].error = data.toString()
            })
        })
    
    }
})()