window.addEventListener("load", e=> {
    document.querySelectorAll("#sliders input").forEach((el, i) => {
        el.addEventListener("input", e=> {
            data = {};
            data.name = e.target.dataset.vehicle;
            data[e.target.dataset.parameter] = e.target.value;
            clientToServer(data);
            console.log(data.name, e.target.dataset.parameter, e.target.value);
        });
    });
});