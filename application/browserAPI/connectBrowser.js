const { EventEmitter } = require("events");

const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const os = require("os")
const path = require("path");

let devices = JSON.parse(fs.readFileSync(path.join(__dirname, "../devices.json"), "utf-8"))

const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')

const stealthPlugin = require("puppeteer-extra-plugin-stealth")()
stealthPlugin.enabledEvasions.delete('iframe.contentWindow');
stealthPlugin.enabledEvasions.delete('navigator.plugins');

puppeteer.use(
  AdblockerPlugin({
    //interceptResolutionPriority: 5,
    blockTrackersAndAnnoyances: true,
    useCache: true,
  })
)

puppeteer.use(stealthPlugin);
puppeteer.use(require('puppeteer-extra-plugin-timezone').default())
puppeteer.use(require('puppeteer-extra-plugin-anonymize-ua')())

let { sleep, random } = require("../publicFunctions/everything.js");

let ignoredFlags = [
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

  '--enable-automation',
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-component-extensions-with-background-pages'
];

function randomDevice() {
  let deviceKeys = Object.keys(devices);
  let rDevice = deviceKeys[random(0, deviceKeys.length)];
  let device = devices[rDevice];

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
 * @param {boolean | undefined} extra.blockAds If is should block ads
 * @param {Object | undefined} extra.memoryStore Object with set and get functions for cache
 * @param {Array | undefined} extra.extensions Array of extensions to use
 * @param {Array | undefined} extra.args Extra arguments to pass to chrome's launch arguments
 *
 * @returns {Promise<Browser>, Event<data>} the browser generator promise and data logger
 */

function connectBrowser(executablePath, extra) {
  if (this.__handled)
    reject(new Error(`You can call api.connectBrowser only one time per API`));

  if (!extra) extra = {};

  let dataEvent = new EventEmitter();
  let extensionFolder = extra.extensions || []

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
            //`--disable-web-security`,
            `--ignore-certificate-errors`,
            `--disable-session-crashed-bubble`,

            "--disable-canvas-aa",
            "--disable-2d-canvas-clip-aa",
            "--disable-dev-shm-usage",
            "--enable-webgl",
            "--hide-scrollbars",
            "--no-first-run",
            "--disable-infobars",
            "--disable-breakpad",
          ],
          //ignoreDefaultArgs: true,
          executablePath: executablePath,
          ignoreHTTPSErrors: true,
          browserWSEndpoint: extra.browserWSEndpoint,
          userDataDir: extra.userDataDir,
        };

        if(os.platform() !== "win32"){
          launchArguments.args.push(`--no-zygote`, `--no-sandbox`, `--disable-setuid-sandbox`);
          launchArguments.args.push(`--single-process`);
        }

        if (extra.args)
          launchArguments.args = [...launchArguments.args, ...extra.args];
        if (extra.userDataDir)
          launchArguments.args.push(`--user-data-dir=${extra.userDataDir}`);
        if (extra.headless) launchArguments.args.push(`--headless=chrome`);
        if (extra.no_visuals) launchArguments.args.push(`--disable-gl-drawing-for-tests`);

        if (extensionFolder.length > 0) launchArguments.args.push(
          `--disable-extensions-except=${extensionFolder.join(",")}`
        );

        extensionFolder.forEach((extension) => {
          launchArguments.args.push(`--load-extension=${extension}`);
        });

        dataEvent.emit("debug", `Launching browser`);
        //dataEvent.emit("debug", `Launching browser with external arguments ${JSON.stringify(launchArguments)}`)

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
