var getmac = require('getmac');
var fs = require('fs');

function getMacAddr(callback) {
	
	var getmacCallback = function (err, macAddr) {
		
		if (err) {
			errlog.error(err);
			
			setTimeout(() => {
				getmac.getMac(getmacCallback);
			},5000);
			
			return;
		}
		
		if(macAddr){
		// 소문자로 변환
			// '-'를 ':'로 변환
			macAddr = macAddr.toLowerCase().replace(/-/g, ':');
			
			if (typeof callback === 'function') {
				callback(macAddr);
			}
		}
	};

	getmac.getMac(getmacCallback);
}

module.exports = getMacAddr;
