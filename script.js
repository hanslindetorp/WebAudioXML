webAudioXML.addEventListener("init", e => {
    webAudioXML.mute();
    
    document.querySelector("#playBtn").addEventListener("click", e => {
        webAudioXML.unmute();
    });
    document.querySelector("#stopBtn").addEventListener("click", e => {
        webAudioXML.mute();
    });
});