webAudioXML.addEventListener("inited", e => {
  let stat = webAudioXML.statistics;
  let str = "<h2>Elements:</h2><table>";

  Object.keys(stat.elementCount).forEach(key => {
    str += `<tr><td>${key}</td><td>${stat.elementCount[key]}</td></tr>`;
  });
  str += "</table>";

  str += "<h2>Follow mappings:</h2><table>";
  Object.keys(stat.followCount).forEach(key => {
    str += `<tr><td>${key}</td><td>${stat.followCount[key]}</td></tr>`;
  });
  str += "</table>";

  document.querySelector("#output").innerHTML = str;
});
