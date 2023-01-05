const { EventEmitter } = require("events");

const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

//const plugin_stealth = require("puppeteer-extra-plugin-stealth")
//puppeteer.use(plugin_stealth)

//puppeteer.use(require('puppeteer-extra-plugin-timezone')())

let { sleep, random } = require("../publicFunctions/everything.js");

const randUserAgent = require("rand-user-agent");
const UAParser = require("ua-parser-js");

let ignoredFlags = [
  "--allow-pre-commit-input",
  //'--disable-background-networking',
  //'--disable-background-timer-throttling',
  //'--disable-backgrounding-occluded-windows',
  "--disable-breakpad",
  //'--disable-client-side-phishing-detection',
  "--disable-component-extensions-with-background-pages",
  "--disable-component-update",
  //'--disable-default-apps',
  //'--disable-dev-shm-usage',
  //'--disable-extensions',
  //'--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
  //'--disable-hang-monitor',
  //'--disable-ipc-flooding-protection',
  //'--disable-popup-blocking',
  //'--disable-prompt-on-repost',
  //'--disable-renderer-backgrounding',
  //'--disable-sync',
  //'--enable-automation',
  "--enable-blink-features=IdleDetection",
  "--enable-features=NetworkServiceInProcess2",
  "--export-tagged-pdf",
  "--force-color-profile=srgb",
  "--metrics-recording-only",
  //'--no-first-run',
  "--password-store=basic",
  //'--use-mock-keychain',
  "--headless",
  "--hide-scrollbars",
  //'--mute-audio',
  //'about:blank'
];

let getRandomUserAgent = () => {
  const agent = randUserAgent("desktop", "chrome", "windows").replace(
    "HeadlessChrome",
    `Chrome`
  );
  const parser = new UAParser(agent);
  let parserResults = parser.getResult();

  if (parseFloat(parserResults.browser.major) < 85) return getRandomUserAgent();
  if (parseFloat(parserResults.os.version) < 10) return getRandomUserAgent();

  return agent;
};

function randomDevice() {
  let deviceKeys = Object.keys(puppeteer.KnownDevices);
  let rDevice = deviceKeys[random(0, deviceKeys.length)];
  let device = puppeteer.KnownDevices[rDevice];

  if (device.viewport.height > 500 && device.viewport.isLandscape) {
    return device;
  } else {
    return randomDevice();
  }
}

function attemptLaunch(launchArguments, tryNum = 0) {
  return new Promise((resolve, reject) => {
    puppeteer
      .launch(launchArguments)
      .then(resolve)
      .catch((err) => {
        if (tryNum > 10) {
          reject(err);
        } else {
          attemptLaunch(launchArguments, tryNum + 1)
            .then(resolve)
            .catch(reject);
        }
      });
  });
}

/**
 * Connects to a browser, also creates one if no browserWSEndpoint is provided
 *
 * @param {string} executablePath Chrome binary file
 * @param {Object} extra Extra information for connecting to the browser
 * @param {string | undefined} extra.browserWSEndpoint WSEndpoint of detached browser, Browserless or other providers recommended
 * @param {string | undefined} extra.proxyServer IP of the proxy to connect to (Optional, but should be used)
 * @param {string | undefined} extra.userDataDir used for extra caching, anti bot detection and fast login (Optional, but recommended)
 * @param {boolean | undefined} extra.saveBandwith Bypass useless requests
 * @param {boolean | undefined} extra.headless Launch browser in headless mode?
 * @param {boolean | undefined} extra.cache If is should cache js and html files
 * @param {Object | undefined} extra.memoryStore Object with set and get functions for cache
 * @param {Array | undefined} extra.args Extra arguments to pass to chrome's launch arguments
 *
 * @returns {Promise<Browser>, Event<data>} the browser generator promise and data logger
 */

function connectBrowser(executablePath, extra) {
  if (this.__handled)
    reject(new Error(`You can call api.connectBrowser only one time per API`));

  if (!extra) extra = {};

  let dataEvent = new EventEmitter();
  let extensionFolder = fs
    .readdirSync(path.join(__dirname, "../../extensions"))
    .map(
      (value) => (value = path.join(__dirname, `../../extensions/${value}`))
    );

  return {
    browser: () =>
      new Promise((resolve, reject) => {
        this.__data = dataEvent;
        this.__extra = extra;

        let launchArguments = {
          headless: false,
          defaultViewport: null,
          devtools: false,
          ignoreDefaultArgs: ignoredFlags,
          args: [
            `--start-maximized`,
            `--mute-audio`,
            `--always-authorize-plugins`,
            "--proxy-bypass-list=*",
            `--disable-web-security`,
            `--ignore-certificate-errors`,
            `--disable-session-crashed-bubble`,

            "--disable-canvas-aa",
            "--disable-2d-canvas-clip-aa", 
            "--disable-dev-shm-usage",
            //"--use-gl=swiftshader",
            "--enable-webgl",
            "--hide-scrollbars",
            "--no-first-run",
            "--disable-infobars",
            "--disable-breakpad",

            //"--no-zygote",
            //"--no-sandbox",

            "--disable-setuid-sandbox",
            //`--use-gl=egl`,
          ],
          //ignoreDefaultArgs: true,
          executablePath: executablePath,
          ignoreHTTPSErrors: true,
          browserWSEndpoint: extra.browserWSEndpoint,
          userDataDir: extra.userDataDir,
        };

        if (extra.args)
          launchArguments.args = [...launchArguments.args, ...extra.args];
        if (extra.userDataDir)
          launchArguments.args.push(`--user-data-dir=${extra.userDataDir}`);
        if (extra.headless) launchArguments.args.push(`--headless=chrome`);
        if(extra.no_visuals) launchArguments.args.push(`--disable-gl-drawing-for-tests`);

        launchArguments.args.push(
          `--disable-extensions-except=${extensionFolder.join(",")}`
        );

        extensionFolder.forEach((extension) => {
          launchArguments.args.push(`--load-extension=${extension}`);
        });

        dataEvent.emit("debug", `Launching browser`);
        //dataEvent.emit("debug", `Launching browser with external arguments ${JSON.stringify(launchArguments)}`)

        this.__userAgent = getRandomUserAgent();
        this.__device = randomDevice();

        if (extra.browserWSEndpoint) {
          // If using a WSEndpoint directly connect to the browser
          puppeteer
            .connect(launchArguments)
            .then(async (browser) => {
              this.__handled = true;
              this.__launched = true;
              this.browser = browser;

              await sleep(3000);
              dataEvent.emit("debug", "Browser connected sucessfully");
              resolve(browser);
            })
            .catch((error) => {
              this.__handled = true;
              this.__launched = false;
              dataEvent.emit(
                "debug",
                `Browser failed to connect with error ${error}`
              );
              reject(error);
            });
        } else {
          // Else launch a new browser
          attemptLaunch(launchArguments)
            .then(async (browser) => {
              this.__handled = true;
              this.__launched = true;
              this.browser = browser;

              await sleep(3000);
              dataEvent.emit("debug", "Browser connected sucessfully");
              resolve(browser);
            })
            .catch((error) => {
              this.__handled = true;
              this.__launched = false;

              dataEvent.emit(
                "debug",
                `Browser failed to connect with error ${error}`
              );
              reject(error);
            });
        }
      }),
    data: dataEvent,
  };
}

module.exports = connectBrowser;
