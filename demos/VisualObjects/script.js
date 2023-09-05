webAudioXML.addEventListener("init", e => {
    webAudioXML.mute();
    
    document.querySelector("#playBtn").addEventListener("click", e => {
        webAudioXML.unmute(0.01);
    });
    document.querySelector("#stopBtn").addEventListener("click", e => {
        webAudioXML.mute(0.01);
    });
});