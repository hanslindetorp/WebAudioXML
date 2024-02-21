
waxml.addEventListener("inited", () => {



  document.querySelector("navigation #playMusicBtn").addEventListener("click", e => {
    if(!iMusic.isPlaying()){
      iMusic.play();
    }
  });


  document.querySelector("navigation #playBtn").addEventListener("click", e => {
   
    document.querySelector("#helpBtn").style.display = "inline-block";
    document.querySelector("#playBtn").style.display = "none";
  });


  document.querySelector("navigation > #helpBtn").addEventListener("click", e => {
    document.querySelector("#playBtn").style.display = "inline-block";
    document.querySelector("#helpBtn").style.display = "none";
  });

  window.location = "#play";

});

