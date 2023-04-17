console.log("Mall HT2022. Version 1.2");
//iMus.debug = true;

window.addEventListener("load", e => {

    let transitionTime = 1000;

    // auto stop videos playing after `transitionTime` in current section
    // and remove any onended function
    document.querySelectorAll("a[href^='#']").forEach(el => {
        el.addEventListener("click", e => {
            let targetVideos = document.querySelectorAll(`${location.hash} video`);
            
            setTimeout(() => {
                targetVideos.forEach(video => {
                    video.pause();
                });
            }, transitionTime);   
        });
    });

    // play specified video at specified time and navigate to 
    // specified target onended
    document.querySelectorAll("a[data-video-play]").forEach(el => {
        let videoSelector="", pos=0, nextUrl="";
        let target = el.dataset.videoPlay.split(",");
        if(target.length >= 3){
            nextUrl = target.pop().trim();
        }
        if(target.length >= 2){
            pos = target.pop();
        }
        videoSelector = target.join(",");

        let videos = document.querySelectorAll(videoSelector);
        if(nextUrl){
                videos.forEach(video => {
                video.dataset.href = nextUrl;
            });
        }

        el.addEventListener("click", e => {
            videos.forEach(video => {
                video.pause();
                video.currentTime = pos;
                video.play();
            });
        });
    });

    // stop specified video directly
    document.querySelectorAll("a[data-video-stop]").forEach(el => {
        el.addEventListener("click", e => {
            document.querySelectorAll(e.target.dataset.videoStop).forEach(video => {
                video.pause();
            });
        });
    });

    let allVideos = document.querySelectorAll("video");
    if(allVideos.length){
        document.body.classList.add("video-loading");
    }
    let videosLoaded = 0;
    allVideos.forEach(el => {
        el.addEventListener("ended", e => {
            if(e.target.dataset.href){
                // auto start videos on target page if specified 
                location.href = e.target.dataset.href;
                document.querySelectorAll(`${e.target.dataset.href} video`).forEach(video => {
                    video.play();
                });
            }
        });
        el.addEventListener("loadeddata", e => {
            if(++videosLoaded == allVideos.length){
                document.body.classList.remove("video-loading");
            }
        });
    });

    
});