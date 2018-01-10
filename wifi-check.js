var dns = require('dns');
var events = require('events');
var util = require('util');

// 연결상태의 연속성 확인을 위한 변수
var connect = false;

class Wifi {

	/**
	 * Check Wifi Connect
	 */
	wifiConnect(){
		dns.resolve('www.google.com', (err) => {

			// 연결되지 않음
			if (err) {
				// 연속적으로 연결되지 않은 상태일 때는 리턴
				if(!connect)
					return
				
				// 연결되어 있다가 연결이 끊겼을 때에만 이벤트 발생
				connect = false;
				this.emit('wifiDisConnected');
			}
			// 정상 연결
			else {
				if(connect)
					return
					
				connect = true;
				this.emit('wifiConnected');
			}
		})// dns
	};
	
	/**
	 * Wifi Check Interval
	 */
	wifiCheck(){
		
		// 1초 간격으로 wifi 연결상태 확인
		setInterval(()=>{
			this.wifiConnect();
		}, 1000);
	};
}

util.inherits(Wifi, events.EventEmitter);

module.exports = new Wifi();