

class OutputMonitor extends HTMLElement {

    constructor(){
        super();
        this.classList.add("waxml-output-monitor");

        this.table = document.createElement("table");
        this.appendChild(this.table);
    }

    log(m){
        let type = "info";
        let message;
        if(typeof m === "string"){
            // comma separated string (else array)
            message = m.split(",");
        } else if(m instanceof Array){
            message = m;
        } else if(m instanceof Object){
            message = m.data;
            if(typeof message === "string"){
                message = message.split(",");
            }
            type = m.type || type;
        }

        let tr = document.createElement("tr");
        tr.classList.add(type);
        if(!message){
            return;
        }
        message.forEach(val => {
            let td = document.createElement("td");
            if(typeof val == "string"){
                val = val.trim();
            }
            let floatVal = parseFloat(val);
            if(floatVal == val){
		        let decimals = Math.ceil(Math.max(0, 2 - Math.log(floatVal || 1)/Math.log(10)));
                val = floatVal.toFixed(decimals);
                td.classList.add("number");
            }
            td.innerHTML = val;
            tr.appendChild(td);
        });
        this.table.appendChild(tr);

        // auto scroll
        this.scrollTop = this.scrollHeight;
    }

    clear(){
        this.table.innerHTML = "";
    }
}

module.exports = OutputMonitor;