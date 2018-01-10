var RFID = require('./Alienrfid');
var server = require('./index');

var tagId;

setInterval(function(){
	
	if(tagId != RFID.getRfid()){
		console.log("태그 아이디가 변경되었습니다.");
		
		tagId = RFID.getRfid();
	}
	
}.bind(this), 300);

RFID.portOpen();
