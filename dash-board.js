var mqtt = require('mqtt');
var client;

var __count = 0;

class DashBoard {
	
	get anchors(){
		 if (!this._data)
	      this._data = [];
		
		return this._data;
	}
	
	putAnchors(data){
		this.anchors.push(data);
	}
	
	/**
	 * build Board Data
	 */
	buildBoardData (location) {
		
		var boardData = { "location": {
			x : location.x,
			y : location.y,
			z : location.z},
      "anchors": this.anchors.shift(),
      "speed" : location.speed
    } 
		return boardData;
	}
	
	
	/**
	 * MQTT Publish
	 */
	publish(location) {
		// if(__count++ % 3)
		// 	return;
		
		var sendData = this.buildBoardData(location);
		
	  client.publish('hatiolab-rtls', JSON.stringify({ // 'hatiolab-rtls': MQTT Subject
	    "f21a2f94a117": sendData
	  }),0,function(err){
			if(err)
				console.log(err);
			else
				console.log('Publish Success');
			
		});
	}
	
	/**
	 * MQTT Connect
	 */
	connect(location){
		if(!client) {
			client = mqtt.connect('ws://test.mosquitto.org', { port: 8080 });
			
			client.on('connect', function () {
				this.publish(location);
				console.log('MQTT Connected');
			}.bind(this));
		} else {
			this.publish(location)
		}
	}
}

module.exports = new DashBoard();