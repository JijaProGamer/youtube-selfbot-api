import { Fingerprint } from "puppeteer-extra-plugin-fingerprinter";
import { Browser } from "puppeteer";

interface watcherContext {
    resolutions(): Promise<string[]>
    setResolution(quality: string): Promise<string[]>
    
    pause(): Promise<undefined>
    play(): Promise<undefined>

    seek(time: number): Promise<undefined>
    time(): Promise<number>
    duration(): Promise<number>

    like(): Promise<undefined>
    dislike(): Promise<undefined>

    comment(message: string): Promise<undefined>
    isAdPlaying(): Promise<any>
    skipAd(force: boolean): Promise<undefined>
}

interface googleContext {
    login(accountInfo: any, cookies: any[] | string): Promise<undefined>
    logout(): Promise<undefined>
}

interface studioContext {
    uploadSubtitles(video: string, title: string, options: any): Promise<undefined>
    uploadSubtitles(id: string, language: string, type: string, sub: string): Promise<undefined>
}

interface YoutubeSelfPage {
    videoInfo: videoInfo

    gotoVideo(method: string, id: string, options: any): Promise<watcherContext>
    setupGoogle(): Promise<googleContext>
    setupStudio(): Promise<studioContext>

    getCookies(): Promise<any[]>
    getFormattedCookies(): Promise<string>
    setCookies(cookies: any[]): Promise<undefined>
    clearCookies(): Promise<undefined>
}


interface YoutubeSelfbotBrowser extends Browser {
    clearStorage(): Promise
    newPage(): Promise<YoutubeSelfPage>
}

interface selfbotOptions {
    userDataDir: string
    dont_mute_audio: boolean
    no_visuals: boolean
    headless: boolean
    proxy: string
    timeout: number
    autoSkipAds: boolean
    fingerprint: Fingerprint
}

interface videoInfo {
    viewCount: number
    duration: number
    uploadDate: Date
    isShort: boolean
    isLive: boolean
    unlisted: boolean
    title: string
    url: string
    id: string
    format: {
        resolution: string
        quality: string
        fps: number
        size: number
        mbps: number
        mbpm: number
        width: number
        height: number
        aspect_ratio: number
    }
}

export class selfbot {
    connect(ws_url: string): Promise<YoutubeSelfbotBrowser>
    launch(): Promise<YoutubeSelfbotBrowser>
    getID(url: string): string | null
    getVideoInfo(id: string, proxy: string?, cookies: string?): videoInfo
    
    constructor(browserPath: string, opts: selfbotOptions, browser_args: string[], extensions: string[])
}