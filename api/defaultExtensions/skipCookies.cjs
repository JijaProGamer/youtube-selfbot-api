module.exports = {
    code: () => {
        setInterval(() => {
            let currentPageURL = document.location.href
            let k = document.querySelector(`.opened`)

            if(k && !(currentPageURL.includes("/watch?v=") || currentPageURL.includes("/shorts/"))){
                //k.remove()
                //document.querySelector(`#lightbox`).remove()
                
                /*let video = document.querySelector("video")
                if(video){
                    try {
                        video.play()
                    } catch (err){

                    }
                }*/
            }
        }, 500)
    },
    verify: () => true
}