import ProxyAgent from "proxy-agent-v2"
import ytdl from "ytdl-core"

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function getVideoInfo(id, proxy, cookies) {
    return new Promise(async (resolve, reject) => {
        try {
            let info

            if (proxy == "direct://" || !proxy || proxy == "direct") {
                info = await ytdl.getBasicInfo(id, {
                    requestOptions: {
                        headers: {
                            cookie: cookies || ""
                        }
                    }
                })
            } else {
                let agent = new ProxyAgent(proxy)
                info = await ytdl.getBasicInfo(id, {
                    requestOptions: {
                        agent,
                        headers: {
                            cookie: cookies || ""
                        }
                    }
                })
            }

            let vFormat = info.formats
                .filter((v) => v.width && v.height)
                .sort((a, b) => a.width - b.width)[0]
            let aFormat = info.formats
                .filter(v => !v.videoCodec)
                .sort((a, b) => a.averageBitrate - b.averageBitrate)[0]

            let aBPS = aFormat.averageBitrate || aFormat.bitrate
            let vBPS = vFormat.averageBitrate || vFormat.bitrate
            let duration = parseFloat(info.videoDetails.lengthSeconds)
            let rate = clamp(duration, 0, 60) / 10
            if (rate == 0) rate = 6

            let isLive = info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails.isLiveNow

            resolve({
                viewCount: parseInt(info.videoDetails.viewCount),
                duration: parseFloat(info.videoDetails.lengthSeconds) || Infinity,
                uploadDate: new Date(info.videoDetails.publishDate),
                isShort: (vFormat.width / vFormat.height) < 1,
                url: info.videoDetails.video_url,
                isLive: isLive,
                title: info.videoDetails.title,
                unlisted: info.videoDetails.isUnlisted,
                format: {
                    resolution: vFormat.qualityLabel,
                    quality: vFormat.quality || "tiny",
                    fps: vFormat.fps || 30,
                    size: (parseFloat(vFormat.contentLength) + parseFloat(aFormat.contentLength)) / 1e+6 || Infinity,
                    mbps: ((vBPS + aBPS) / 1e+6 / 10 + 0.00183) * 1.25,
                    mbpm: ((vBPS + aBPS) / 1e+6 * rate + 0.11) * 1.25,
                    width: vFormat.width || 256,
                    height: vFormat.height || 144,
                    aspect_ratio: (vFormat.width / vFormat.height) || 1.777777,
                },
                id: id,
            })
        } catch (err) {
            reject(err)
        }
    })
}

export default getVideoInfo