var Serial = require('serialport');
var port = new Serial('/dev/ttyUSB0', { autoOpen:false, baudRate: 115200 });
var events = require('events');
var emitter = new events.EventEmitter();

//var TagConfig = 'TagStreamAddress=serial1\r\nTagStreamMode=on\r\nAutoMode=on\r\nRFLevel=200\r\n';
//var TagConfig = 't\r\n';
var TagConfig = 'RFLevel=210\r\nTagListFormat=Custom\r\nTagListCustomFormat=!%i\r\n';
//var TagStreamAddress = 'RFLevel=300\r\nt\r\n';
//var TagListCustomFormat = ;
var getTagList = 'get TagList\r\n';
var save = 'Save\r\n';

var tag_id = null;
var st = 0;
var count = 0;
var iv;
var writeCnt = 0; 
var timeout;

class RFID {	

	constructor() {		
		//this.onRead = false; // false : tag ID 이외의 신호, true: tag ID 신호		
		// 포트 오픈이 필요할 때에 발생되는 이벤트리스너
		emitter.on('portOpen', () => {
			
			setTimeout(() => {
				this.portOpen();
			}, 5000);
			
		});
	}
	
	getRfid(){	
		//logger.info('Tag : ', TagID);
		
		if(tag_id == null){
			logger.info('Rfid tag id not exist...');
		}	
		else{
			logger.info('RFID TAG ID : ', tag_id);	
		}
	
		return tag_id;
	}
	
	portOpen() {
		
		//*******Serial port open
		port.open( (err) => {
			
			// 에러 발생으로 포트를 오픈하지 못했을 때 포트오픈 다시 시도
			if(err) {
				errlog.error(err.message);
				emitter.emit('portOpen');
				return;
			}
			
			logger.info('serial port open!');	
			
//			port.write(save);
			
			// Write Interval
			// 0.5초 간격으로 Write 실행
			
//			timeout = setTimeout(() => {
//				port.write(TagConfig);
//				console.log('=====================');
//			}, 40000);
			iv = setInterval(() => {
				port.write(getTagList, (err) => {
						
					if(err){
						errlog.error(err.message);
					}
						
					// readable 이벤트 발생 시 writeCount가 0으로 리셋됨
					// readable 이벤트가 발생하지 않고 write만 할 경우 Count가 계속 올라가며
					// 이 경우 리더기의 전원이 켜지지 않은 것으로 보고 에러메세지 출력
					if(writeCnt > 3){							
						errlog.error('Read Fail.... Try Turn On The Rfid Reader');
						errlog.error('Write Count : ', writeCnt);						
						// write Count 가 120을 넘으면 포트를 닫고 다시 오픈
						if(writeCnt > 120){
							port.close();
						}						
						// body 데이터와 tag id를 초기화
						tag_id = null;
					}				
					writeCnt += 1;
				});
			}, 300);
		});
	}
}

function readConfig(){
	
	var packet = port.read(1);
	if(!packet){			
		return;
	}

	if(packet.toString() == '>'){
		count += 1;
		if(count == 2){
			st = 1;
			readTag();
			return;
		}
	}
	
	readConfig();
}

function CheckTag(){
	
	var packet = port.read(7);
	if(!packet){
		return;
	}
	
	tag_id = null;
	
	st = 0;
	getTagBody();
	
}

function getTagID(){
	
	var packet = port.read(30);
	if(!packet){
		return;
	}
	
	tag_id = packet.toString();
	
	st = 0;
	getTagBody();
}

function getTagBody(){
	
	var packet = port.read(1);
	if(!packet){
		return;
	}
	
	if(packet.toString() == '!'){
		count++;
		if(count == 3){
			st = 1;
			getTagID();			
			count = 0;
		}
		else{
			getTagBody()
		}	
	}
	
	else if(packet.toString() == '('){
		st = 2;
		CheckTag();
	}
	
	else{
		getTagBody();
	}
}

port.on('readable', () => {
	
	writeCnt = 0;
	
	if(st == 1){
		getTagID();
	}else if(st == 2){
		CheckTag();
	}else{
		getTagBody();
	}
});

port.on('close', (err) => {
	if(err){
		errlog.error(err);
		
		// 오류 발생했지만 포트가 닫힌 것이 확인될 때
		if(err.disconnected === true){
			logger.info('serial port close...');
			
			tag_id = null;
			emitter.emit('portOpen');
			clearInterval(iv); // write 인터벌 제거
		}
	}else{
		logger.info('serial port close...');
		
		tag_id = null;
		emitter.emit('portOpen');
		clearInterval(iv); // write 인터벌 제거
	}
});//on close

module.exports = new RFID();



