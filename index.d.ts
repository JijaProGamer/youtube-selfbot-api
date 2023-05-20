import { Fingerprint } from "puppeteer-extra-plugin-fingerprinter";


interface Browser {

}

interface selfbotOptions {
    userDataDir: string,
    dont_mute_audio: boolean,
    no_visuals: boolean,
    headless: boolean,
    proxy: string,
    timeout: number,
    autoSkipAds: boolean,
    fingerprint: Fingerprint,
}

export class selfbot {
    connect(ws_url: string): Promise<Browser>;
    launch(): Promise<Browser>;
    getID(url: string): string | null;
    
    constructor(browserPath: string, opts: selfbotOptions, browser_args: string[], extensions: string[]);
}