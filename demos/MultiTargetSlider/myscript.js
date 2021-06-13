window.addEventListener("load", e => {
    let marker = document.querySelector("#marker");
    let graph = document.querySelector("#graph");
    let slider1 = document.querySelector("#slider1");
    let rect = graph.getBoundingClientRect();
    let marginTop = 23;
    let marginRight = 3;
    marker.style.top = (rect.top + marginTop) + "px";
    marker.style.height = (rect.height - marginTop - 2) + "px";


    slider1.addEventListener("input", e => {
        marker.style.left = rect.left + (e.target.value * (rect.width - marginRight) / 100) + "px";
    });
});