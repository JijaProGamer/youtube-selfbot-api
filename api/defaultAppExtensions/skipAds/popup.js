/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/constants/default-data/css-rules.ts
var adBlockingSelectorsFallback = [
    '#player-ads',
    '#merch-shelf',
    '#masthead-ad',
    '#offer-module',
    '.ytp-ad-button',
    'ytd-ad-slot-renderer',
    '.ytd-ad-slot-renderer',
    '.ytp-ad-progress-list',
    'ytd-companion-slot-renderer',
    '.ytd-companion-slot-renderer',
    '.ytd-in-feed-ad-layout-renderer',
    '.ytd-action-companion-ad-renderer',
    '.ytp-ad-player-overlay-flyout-cta',
    'ytd-promoted-sparkles-web-renderer',
    '.ad-showing > .html5-video-container',
    '.ytd-player-legacy-desktop-watch-ads-renderer',
    '.ytd-rich-item-renderer > ytd-ad-slot-renderer',
    'a[href^="https://www.googleadservices.com/pagead/aclk?"]',
    '#contents > ytd-rich-item-renderer:has(> #content > ytd-ad-slot-renderer)',
    'ytd-display-ad-renderer',
    '.ytd-carousel-ad-renderer',
    'ytd-compact-promoted-video-renderer',
    '.ytd-promoted-sparkles-text-search-renderer',
    '.masthead-ad-control',
    '#ad_creative_3',
    '#footer-ads',
    'ytd-promoted-video-renderer',
    '.ad-container',
    '.ad-div',
    '.video-ads',
    '.ytd-mealbar-promo-renderer',
    '.sparkles-light-cta',
    '#watch-channel-brand-div',
    '#watch7-sidebar-ads',
    '[target-id="engagement-panel-ads"]',
];

;// ./src/enums/extension-keys.enum.ts
var ExtensionsKeys;
(function (ExtensionsKeys) {
    ExtensionsKeys["InstalledAt"] = "installedAt";
    ExtensionsKeys["StorageVersion"] = "storageVersion";
    ExtensionsKeys["ExtensionVersion"] = "extensionVersion";
})(ExtensionsKeys || (ExtensionsKeys = {}));

;// ./src/enums/settings-keys.enum.ts
var SettingsKeys;
(function (SettingsKeys) {
    SettingsKeys["Ads"] = "ads";
    SettingsKeys["Annotations"] = "annotations";
    SettingsKeys["YoutubeAdRegex"] = "youtubeAdRegex";
    SettingsKeys["AdBlockingSelectors"] = "adBlockingSelectors";
    SettingsKeys["PopupConfig"] = "popupConfig";
    SettingsKeys["Scriptlets"] = "scriptlets";
    SettingsKeys["OldDailymotionAdBlockingSelectors"] = "dailymotionAdBlockingSelectors";
    SettingsKeys["OldDailymotionAdRegex"] = "dailymotionAdRegex";
    SettingsKeys["OldAdditionalBlockingEnabled"] = "isAdditionalBlockingEnabled";
})(SettingsKeys || (SettingsKeys = {}));

;// ./src/enums/actions.enum.ts
var ActionsEnum;
(function (ActionsEnum) {
    ActionsEnum["PageReady"] = "PAGE_READY";
    ActionsEnum["Ping"] = "PING";
})(ActionsEnum || (ActionsEnum = {}));

;// ./src/enums/popup-keys.enum.ts
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var PopupRestrictionKeysEnum;
(function (PopupRestrictionKeysEnum) {
    PopupRestrictionKeysEnum["ConfigurablePopupRestriction"] = "configurablePopupRestriction";
    PopupRestrictionKeysEnum["AntiAdblockPopupRestriction"] = "antiAdblockPopupRestriction";
    PopupRestrictionKeysEnum["PopupGeneralRestriction"] = "popupGeneralRestriction";
    PopupRestrictionKeysEnum["RatingPopupRestriction"] = "ratingDialogShown";
    PopupRestrictionKeysEnum["OldOtherStreamingPopupRestriction"] = "otherStreamingPopupRestriction";
    PopupRestrictionKeysEnum["OldUpdatePopupRestriction"] = "updatePopupRestriction";
})(PopupRestrictionKeysEnum || (PopupRestrictionKeysEnum = {}));
var PopupDontShowKeysEnum;
(function (PopupDontShowKeysEnum) {
    PopupDontShowKeysEnum["ConfigurablePopupDoNotShow"] = "configurablePopupDoNotShow";
    PopupDontShowKeysEnum["AntiAdblockPopupDoNotShow"] = "antiAdblockPopupDoNotShow";
    PopupDontShowKeysEnum["RateUsPopupDoNotShow"] = "rateUsPopupDoNotShow";
    PopupDontShowKeysEnum["OldOtherStreamingPopupDoNotShow"] = "otherStreamingPopupDoNotShow";
    PopupDontShowKeysEnum["OldUpdatePopupDoNotShow"] = "updatePopupDoNotShow";
})(PopupDontShowKeysEnum || (PopupDontShowKeysEnum = {}));
var PopupKeys = __assign(__assign({}, PopupRestrictionKeysEnum), PopupDontShowKeysEnum);
var PopupTypesEnum;
(function (PopupTypesEnum) {
    PopupTypesEnum["Windows"] = "windows";
    PopupTypesEnum["Mobile"] = "mobile";
    PopupTypesEnum["AntiAdblock"] = "anti-adblock";
    PopupTypesEnum["RateUs"] = "rate-us";
})(PopupTypesEnum || (PopupTypesEnum = {}));

;// ./src/enums/index.ts





;// ./src/constants/default-data/popup-config.ts

var DefaultPopupsConfig = {
    isAntiAdblockPopupEnabled: false,
    isRateUsPopupEnabled: false,
    configurablePopup: {
        type: PopupTypesEnum.Mobile,
        isEnabled: false,
        doNotShowAgainMinutes: 120,
    },
};

;// ./src/constants/default-data/regex-rules.ts
var youtubeAdRegexesFallback = [
    '(googleads.g.doubleclick.net)',
    '(=adunit&)',
    '(/pubads.)',
    '(/pubads_)',
    '(/api/ads/)',
    '(/googleads_)',
    '(innovid.com)',
    '(/pagead/lvz?)',
    '(/pagead/gen_)',
    '(doubleclick.com)',
    '(google.com/pagead/)',
    '(youtube.com/pagead/)',
    '(googlesyndication.com)',
    '(www.youtube.com/get_midroll_)',
];
var youtubeAnnotationsRegexes = (/* unused pure expression or super */ null && (['(annotations_invideo)']));

;// ./src/constants/scriptlets/sriptlets.ts
var scripletsSource = [
    {
        name: 'set-constant',
        args: ['ytInitialPlayerResponse.playerAds', 'undefined'],
    },
    {
        name: 'set-constant',
        args: ['ytInitialPlayerResponse.adSlots', 'undefined'],
    },
    {
        name: 'set-constant',
        args: ['ytInitialPlayerResponse.playerConfig.ssapConfig', 'undefined'],
    },
    {
        name: 'set-constant',
        args: ['ytInitialPlayerResponse.streamingData.serverAbrStreamingUrl', 'undefined'],
    },
    {
        name: 'set-constant',
        args: ['ytInitialPlayerResponse.adPlacements', 'undefined'],
    },
    {
        name: 'set-constant',
        args: ['playerResponse.adPlacements', 'undefined'],
    },
    {
        name: 'json-prune-xhr-response',
        args: [
            'playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots',
            '',
            '/playlist\\?list=|\\/player(?!.*(get_drm_license))|watch\\?[tv]=|get_watch\\?/',
        ],
    },
    {
        name: 'json-prune-xhr-response',
        args: [
            'playerResponse.adPlacements playerResponse.playerAds playerResponse.adSlots adPlacements playerAds adSlots',
            '',
            '/playlist\\?list=|player\\?|watch\\?[tv]=|get_watch\\?/',
        ],
    },
    {
        name: 'trusted-replace-fetch-response',
        args: ['/"adPlacements.*?([A-Z]"}|"}{2,4})}],/', '', 'player?'],
    },
    {
        name: 'trusted-replace-fetch-response',
        args: ['/"adSlots.*?}]}}],/', '', 'player?'],
    },
    {
        name: 'trusted-replace-fetch-response',
        args: ['/"adSlots.*?}}],"adBreakHeartbeatParams/', '"adBreakHeartbeatParams', 'player?'],
    },
];

;// ./src/constants/settings.ts
var _a;





var settings_Settings = (_a = {},
    _a[SettingsKeys.Ads] = true,
    _a[SettingsKeys.Annotations] = false,
    _a[SettingsKeys.YoutubeAdRegex] = youtubeAdRegexesFallback,
    _a[SettingsKeys.AdBlockingSelectors] = adBlockingSelectorsFallback,
    _a[SettingsKeys.PopupConfig] = DefaultPopupsConfig,
    _a[SettingsKeys.Scriptlets] = scripletsSource,
    _a);

;// ./src/helpers/storage.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};

var setToChromeStorage = function (key, value) {
    return new Promise(function (resolve, reject) {
        var _a;
        chrome.storage.local.set((_a = {}, _a[key] = value, _a), function () {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};
var getFromChromeStorage = function (key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get([key], function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve(result[key]);
        });
    });
};
var setMultipleToChromeStorage = function (data) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.set(data, function () {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};
var getMultipleFromChromeStorage = function (keys) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get(keys, function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve(result);
        });
    });
};
var removeFromChromeStorage = function (key) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.remove(key, function () {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};
var setToStorageAndSettings = function (fieldName, value) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, setToChromeStorage(fieldName, value)];
            case 1:
                _a.sent();
                Settings[fieldName] = value;
                return [2];
        }
    });
}); };
var setMultiplyToStorageAndSettings = function (settings) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, setMultipleToChromeStorage(settings)];
            case 1:
                _a.sent();
                Object.assign(Settings, settings);
                return [2];
        }
    });
}); };

;// ./src/popup/helpers/bind-checkbox.ts
var __values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};

function bindCheckboxes() {
    var e_1, _a;
    var settingsForms = document.querySelectorAll('.setting');
    var _loop_1 = function (form) {
        var input = form.querySelector('input');
        if (!input)
            return { value: void 0 };
        var name_1 = input.name;
        getFromChromeStorage(name_1).then(function (data) {
            if (typeof data !== 'boolean')
                return;
            input.checked = data;
        });
        form.addEventListener('change', function () { return setToChromeStorage(name_1, input.checked); }, false);
    };
    try {
        for (var settingsForms_1 = __values(settingsForms), settingsForms_1_1 = settingsForms_1.next(); !settingsForms_1_1.done; settingsForms_1_1 = settingsForms_1.next()) {
            var form = settingsForms_1_1.value;
            var state_1 = _loop_1(form);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (settingsForms_1_1 && !settingsForms_1_1.done && (_a = settingsForms_1.return)) _a.call(settingsForms_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}

;// ./src/constants/extension-data.ts
var EXTENSION_VERSION = chrome.runtime.getManifest().version;
var EXTENSION_ID = chrome.runtime.id;
var CHROME_STORE_LINK = "https://chromewebstore.google.com/detail/".concat(EXTENSION_ID);

;// ./src/popup/helpers/init-rate-button.ts

function initRateButton() {
    var teaser = document.querySelector('.teaser');
    if (!teaser)
        return;
    teaser.href = "".concat(CHROME_STORE_LINK, "/reviews");
}

;// ./src/popup/helpers/translate-html.ts
var translate_html_values = (undefined && undefined.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
function translateHTML(popup, dataKey) {
    var e_1, _a;
    if (dataKey === void 0) { dataKey = 'message'; }
    var dataMessageElements = popup.querySelectorAll('[data-message]');
    try {
        for (var dataMessageElements_1 = translate_html_values(dataMessageElements), dataMessageElements_1_1 = dataMessageElements_1.next(); !dataMessageElements_1_1.done; dataMessageElements_1_1 = dataMessageElements_1.next()) {
            var element = dataMessageElements_1_1.value;
            if (element.dataset && element.dataset[dataKey]) {
                element.innerHTML = chrome.i18n.getMessage(element.dataset[dataKey]);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (dataMessageElements_1_1 && !dataMessageElements_1_1.done && (_a = dataMessageElements_1.return)) _a.call(dataMessageElements_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
}

;// ./src/helpers/dom.ts
var dom_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var dom_generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
function domReady(callback) {
    if (document.readyState === 'complete') {
        callback();
        return;
    }
    window.addEventListener('load', callback, false);
}
var waitForElement = function (selector) { return dom_awaiter(void 0, void 0, void 0, function () {
    return dom_generator(this, function (_a) {
        return [2, new Promise(function (resolve) {
                var observedElement = document.querySelector(selector);
                if (observedElement)
                    return resolve(observedElement);
                var observer = new MutationObserver(function () {
                    var observedElement = document.querySelector(selector);
                    if (observedElement) {
                        observer.disconnect();
                        resolve(observedElement);
                    }
                });
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                });
            })];
    });
}); };

;// ./src/popup/index.ts




domReady(function () {
    translateHTML(document.body);
    bindCheckboxes();
    initRateButton();
});

/******/ })()
;