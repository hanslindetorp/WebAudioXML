class InputBusses {

    constructor(ctx){
        this._ctx = ctx;
        this.busses = [];
    }

    addBus(selector, destinations){
        let bus = {selector: selector, input: new GainNode(this._ctx)};
        destinations.forEach(dest => bus.input.connect(dest));
        this.busses.push(bus);
        return bus;
    }

    getBus(selector, destinations){
        let bus = this.busses.filter(bus => selector == bus.selector).pop()
        if(bus){
            return bus;
        } else {
            return this.addBus(selector, destinations);
        }
    }

    disconnectAll(){
        this.busses.forEach(bus => bus.input.disconnect());
    }

    get all(){
        return this.busses;
    }
}

module.exports = InputBusses;