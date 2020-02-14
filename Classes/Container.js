


class Container {

	constructor(parent){
		this._parent = parent;
		this._children = [];
		
	}
	
	set children(objects){
		this._children = objects;
	}
	
	
	get children(){
		return this._children;
	}
	
	addChild(object){
		this._children.push(object);
	}
	
}


module.exports = Container;
