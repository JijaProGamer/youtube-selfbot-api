


import { plugin } from 'playwright-with-fingerprints'
import fs from 'fs'
import crypto from 'crypto'
import path from "path"

plugin.setServiceKey('')

async function saveFingerprint(fingerprint, folder) {    
    const hash = crypto.createHash('sha256').update(fingerprint).digest('hex')

    const filePath = path.join(folder, `${hash}.fp`)
    fs.writeFileSync(filePath, fingerprint)
}

async function loadFingerprint(hash, folder) {
    const filePath = path.join(folder, `${hash}.fp`)
    
    if (fs.existsSync(filePath)) {
        const fingerprint = fs.readFileSync(filePath, 'utf8');
        return fingerprint;
    }
    
    return null;
}

async function getFingerprint() {
    while (true) {
        try {
            const time1 = Date.now();
            
            const fingerprint = await plugin.fetch({
                tags: ['Microsoft Windows', 'Chrome'],
            });

            console.log((Date.now() - time1) / 1000, "fingerprint get");

            await saveFingerprint(fingerprint, path.join(import.meta.dirname, "./fingerprints"));
        } catch (error) {
            console.error("Error fetching fingerprint:", error);
            console.log("Retrying in 10 seconds...");
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

(async () => {
    await getFingerprint();
})();