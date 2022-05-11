window.addEventListener("load", e => {
    document.querySelector("waxml-xy-handle").addEventListener("input", e => {
        document.querySelector("#output").innerHTML = 
        `x: ${e.target.value[0]} <br />
        y: ${e.target.value[1]} <br />
        angle: ${e.target.value[2]} <br />
        radius: ${e.target.value[3]} <br />
        dragged: ${e.target.value[4]}`;
    });
});