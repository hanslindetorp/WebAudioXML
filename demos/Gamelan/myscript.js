document.querySelectorAll(".clickArea").forEach((item, i) => {
    item.addEventListener("pointerdown", e => {
      webAudioXML.stop(".gamelan");
      webAudioXML.start("#" + e.target.id);
    });
});
