var Serial = require('serialport');
var port = new Serial('/dev/ttyUSB0', { autoOpen:false, baudRate: 115200 });
var events = require('events');
var emitter = new events.EventEmitter();

var command_read = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x12, 0x00, 0x01, 0x01, 0xF4, 0xCE, 0x10, 0x03]);

// ↓↓↓↓↓↓↓ 신호세기 설정 ↓↓↓↓↓↓↓
//var config_command = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x09, 0x00, 0x05, 0x01, 0x31, 0x00, 0x01, 0x20, 0xC8, 0xFE, 0x10, 0x03]);
var config_command = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x09, 0x00, 0x05, 0x01, 0x31, 0x00, 0x01, 0x12, 0xDE, 0xEF, 0x10, 0x03]);
//var config_command_1 = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x09, 0x00, 0x05, 0x01, 0x31, 0x00, 0x01, 0x12, 0xDE, 0xEF, 0x10, 0x03]);
//var config_command_2 = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x05, 0x00, 0x00, 0x10, 0x03]);
//var config_command = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x01, 0x00, 0x02, 0x0B, 0x04, 0x00, 0x7D, 0x0C, 0x10, 0x03]);
//var config_command_1 = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x0A, 0x00, 0x04, 0x01, 0x41, 0x00, 0x01, 0xB7, 0xF4, 0x10, 0x03]);
//var config_command_2 = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x04, 0x00, 0x00, 0xEE, 0xF7, 0x10, 0x03]);
//var config_command_3 = new Uint8Array([0x10, 0x02, 0x02, 0x01, 0x02, 0x00, 0x01, 0x0B, 0x4E, 0x23, 0x10, 0x03]);

// packet 상태값 
const STARTX_FIRST = 1;
const STARTX_SECOND = 2;
const HEADER = 3;
const BODY = 4;
const CRC = 5;
const ENDX = 6;

// 데이터를 담는 배열
var response_header = [];
var response_body = [];
var response_crc = [];

var packet_status = STARTX_FIRST; // 최초 packet 상태는 startx
var body_length = 0; // body 데이터의 길이
var tag_id = null;
var writeCnt = 0; // write 한번 할 때마다 카운트
var iv; // 인터벌 변수
var onRead = false; // tag ig 유무 체크 변수

class RFID {
	
	constructor() {
		
//		this.onRead = false; // false : tag ID 이외의 신호, true: tag ID 신호
		
		// 포트 오픈이 필요할 때에 발생되는 이벤트리스너
		emitter.on('portOpen', () => {
			
			setTimeout(() => {
				this.portOpen();
			}, 5000);
			
		});
	}

	/**
	 * Get Rfid Tag Id
	 */
	getRfid(){	
		logger.info('RFID BODY : ', Buffer.from(response_body));
		
		if(!tag_id){
			logger.info('Rfid tag id not exist...');
		}else{
			logger.info('RFID TAG ID : ', tag_id);
		}
		
		return tag_id;
	}//getRfid
	
	
	/**
	 * Open Serial Port
	 */
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
			
			// 신호세기 설정
			port.write(config_command, (err) => {
				
				if(err){
					errlog.error(err.message);
				}	
			});
			
			// Write Count 0 으로 리셋
			writeCnt = 0;
			
			// Write 최초 실행
			port.write(command_read, (err) => {
				
				if(err){
					errlog.error(err.message);
				}
				
				writeCnt += 1;				
			});
			
			// Write Interval
			// 0.5초 간격으로 Write 실행
		  iv = setInterval(() => {
				port.write(command_read, (err) => {
					
					if(err){
						errlog.error(err.message);
					}
					
					// readable 이벤트 발생 시 writeCount가 0으로 리셋됨
					// readable 이벤트가 발생하지 않고 write만 할 경우 Count가 계속 올라가며
					// 이 경우 리더기의 전원이 켜지지 않은 것으로 보고 에러메세지 출력
					if(writeCnt > 3){
						
						errlog.error('Read Fail.... Try Turn On The Rfid Reader');
						errlog.error('Write Count : ', writeCnt);
						
						// write Count 가 100을 넘으면 포트를 닫고 다시 오픈
						if(writeCnt > 100){
							port.close();
						}
						
						// body 데이터와 tag id를 초기화
						response_body = [];
						tag_id = null;
					}
					
					writeCnt += 1;
				});
		  }, 500);
		});
	}//portOpen
	
}// class RFID()

//var r = new RFID();
//r.portOpen();

//function CCIT_Make_CRC(comm_buf, comm_length) { 
//	 
//    var  com_val, accum, i; 
// 
//    accum = 0x00; 
//
//    for  ( i = 0; i < comm_length; i++ ) {   
//    	com_val = accum >> 8 ^ comm_buf[i];   
//    	accum = accum << 8 ^ CCITT_CRC16Table[com_val];    
//    }
//    comm_buf[comm_length] = accum >> 8 & 0x00ff;    
//    comm_buf[comm_length + 1] = accum & 0x00ff; 
//}


var CCITT_CRC16Table = [
                      	0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50A5, 0x60C6, 0x70E7,    
                      	0x8108, 0x9129, 0xA14A, 0xB16B, 0xC18C, 0xD1AD, 0xE1CE, 0xF1EF,    
                      	0x1231, 0x0210, 0x3273, 0x2252, 0x52B5, 0x4294, 0x72F7, 0x62D6,    
                      	0x9339, 0x8318, 0xB37B, 0xA35A, 0xD3BD, 0xC39C, 0xF3FF, 0xE3DE,    
                      	0x2462, 0x3443, 0x0420, 0x1401, 0x64E6, 0x74C7, 0x44A4, 0x5485,    
                      	0xA56A, 0xB54B, 0x8528, 0x9509, 0xE5EE, 0xF5CF, 0xC5AC, 0xD58D,    
                      	0x3653, 0x2672, 0x1611, 0x0630, 0x76D7, 0x66F6, 0x5695, 0x46B4,    
                      	0xB75B, 0xA77A, 0x9719, 0x8738, 0xF7DF, 0xE7FE, 0xD79D, 0xC7BC,    
                      	0x48C4, 0x58E5, 0x6886, 0x78A7, 0x0840, 0x1861, 0x2802, 0x3823,    
                      	0xC9CC, 0xD9ED, 0xE98E, 0xF9AF, 0x8948, 0x9969, 0xA90A, 0xB92B,    
                      	0x5AF5, 0x4AD4, 0x7AB7, 0x6A96, 0x1A71, 0x0A50, 0x3A33, 0x2A12,    
                      	0xDBFD, 0xCBDC, 0xFBBF, 0xEB9E, 0x9B79, 0x8B58, 0xBB3B, 0xAB1A,    
                      	0x6CA6, 0x7C87, 0x4CE4, 0x5CC5, 0x2C22, 0x3C03, 0x0C60, 0x1C41,    
                      	0xEDAE, 0xFD8F, 0xCDEC, 0xDDCD, 0xAD2A, 0xBD0B, 0x8D68, 0x9D49,    
                      	0x7E97, 0x6EB6, 0x5ED5, 0x4EF4, 0x3E13, 0x2E32, 0x1E51, 0x0E70,    
                      	0xFF9F, 0xEFBE, 0xDFDD, 0xCFFC, 0xBF1B, 0xAF3A, 0x9F59, 0x8F78,    
                      	0x9188, 0x81A9, 0xB1CA, 0xA1EB, 0xD10C, 0xC12D, 0xF14E, 0xE16F,    
                      	0x1080, 0x00A1, 0x30C2, 0x20E3, 0x5004, 0x4025, 0x7046, 0x6067,    
                      	0x83B9, 0x9398, 0xA3FB, 0xB3DA, 0xC33D, 0xD31C, 0xE37F, 0xF35E,    
                      	0x02B1, 0x1290, 0x22F3, 0x32D2, 0x4235, 0x5214, 0x6277, 0x7256,    
                      	0xB5EA, 0xA5CB, 0x95A8, 0x8589, 0xF56E, 0xE54F, 0xD52C, 0xC50D,    
                      	0x34E2, 0x24C3, 0x14A0, 0x0481, 0x7466, 0x6447, 0x5424, 0x4405,    
                      	0xA7DB, 0xB7FA, 0x8799, 0x97B8, 0xE75F, 0xF77E, 0xC71D, 0xD73C,    
                      	0x26D3, 0x36F2, 0x0691, 0x16B0, 0x6657, 0x7676, 0x4615, 0x5634,    
                      	0xD94C, 0xC96D, 0xF90E, 0xE92F, 0x99C8, 0x89E9, 0xB98A, 0xA9AB,    
                      	0x5844, 0x4865, 0x7806, 0x6827, 0x18C0, 0x08E1, 0x3882, 0x28A3,    
                      	0xCB7D, 0xDB5C, 0xEB3F, 0xFB1E, 0x8BF9, 0x9BD8, 0xABBB, 0xBB9A,    
                      	0x4A75, 0x5A54, 0x6A37, 0x7A16, 0x0AF1, 0x1AD0, 0x2AB3, 0x3A92,    
                      	0xFD2E, 0xED0F, 0xDD6C, 0xCD4D, 0xBDAA, 0xAD8B, 0x9DE8, 0x8DC9,    
                      	0x7C26, 0x6C07, 0x5C64, 0x4C45, 0x3CA2, 0x2C83, 0x1CE0, 0x0CC1,    
                      	0xEF1F, 0xFF3E, 0xCF5D, 0xDF7C, 0xAF9B, 0xBFBA, 0x8FD9, 0x9FF8,    
                      	0x6E17, 0x7E36, 0x4E55, 0x5E74, 0x2E93, 0x3EB2, 0x0ED1, 0x1EF0 
                      ];

/**
 * 사용해도 되는 유효한 데이터인지 체크
 * @returns {Boolean}
 */
function CCIT_Check_CRC() {
	
	var crc = 0;
	var length = response_header.length;
	
	for (var i = 0; i < length; i++ ) {
		var idx = (crc >> 8 ^ response_header[i]) & 0x00FF;   
		crc = crc << 8 ^ CCITT_CRC16Table[idx];
	} 
	
	length = response_body.length;
	
	for (var i = 0; i < length; i++ ) {   
		var idx = (crc >> 8 ^ response_body[i]) & 0x00FF;   
		crc = crc << 8 ^ CCITT_CRC16Table[idx];
	} 
	
	var crc_front = crc >> 8 & 0x00ff;     
	var crc_tail = crc & 0x00ff;
	
	if(crc_front == response_crc[0] && crc_tail == response_crc[1])
		return true;
	else
		return false
}//CCIT_Check_CRC


/**
 * packet의 status가 startx일 때 호출됨
 */
function read_startx() {

	// 1개의 packet만 읽음
  var packet = port.read(1);
  if(!packet)
		return;
//  console.log('packet', packet[0]);
  
  // packet의 상태가 startx_first 일때
  if(packet_status == STARTX_FIRST) {
  	// packet이 0X10 이면 packet의 status를 startx_second로 변경하고 다시 startx 함수를 호
		if(packet[0] == 0x10) {
			packet_status = STARTX_SECOND;
			read_startx();
		}else{
			read_startx();
		}
//		console.log('STARTX : ', packet);
	
	// packet의 상태가 startx_second 일때	
  } else { // STARTX_SECOND
		if(packet[0] == 0x02) {
			// 각 데이터를 담는 배열을 초기화
			response_body = [];
			response_header = [];
			response_crc = [];

//			console.log('STARTX : ', packet);

			// packet의 status를 header로 바꾸고 header함수 호출
 			packet_status = HEADER;
			read_header();
		// packet이 0X02이 아니면 packet의 상태를 다시 startx_first로 변경하고 startx 함수 호출
		}else{
			packet_status = STARTX_FIRST;
			read_startx();
		}
  }
}//read_startx


/**
 * packet의 status가 header일 때 호출됨
 */
function read_header() {

	writeCnt = 0;
	
	// 5개의 packet을 읽음
  var packet = port.read(5);
  if(!packet)
		return;
  
  // packet을 배열에 담아서 body 길이를 추출
	response_header.push(...packet);
 	body_length = (response_header[3] << 8) + response_header[4];     

//	console.log('HEADER : ', packet, body_length);

 	//packet의 status를 body로 바꾸고 body함수 호출
 	packet_status = BODY; 
	read_body();
}//read_header

/**
 * packet의 status가 body일 때 호출됨
 */
function read_body() {
	
	writeCnt = 0;

	// header를 통해 얻은 body의 길이만큼 읽음
  var packet = port.read(body_length);
  if(!packet)
		return;
  
  // packet을 배열에 담음
  response_body.push(...packet);

  // escape 체크 변수
  // body에 0X10이 두번 연속으로 오면 escape로 보고 하나를 제거한다.
  var escape_count = 0;
  var escaped = false;

  for(var i = 0;i < response_body.length;i++) {
  	// body에 0X10이 나왔을 때
  	if(response_body[i] == 0x10) {
  		// escaped가 true일 때, 즉 0x10이 두번 연속으로 나왔을 때
			if(escaped) {
				// body 배열에서 해당 데이터를 제거함
				response_body.splice(i, 1);
				i--;
				escape_count++;
				escaped = false;
//				console.log('---------ESCAPED---------------\n');
			} else {
				escaped = true;
			}
		} else {
			escaped = false;
		}
	}
  
  // escape가 한번이상 발생했을 때, 발생한 횟수만큼 packet을 추가로 읽음
  if(escape_count > 0) {
		body_length = escape_count;
		read_body();
	} else {
		
//		console.log('BODY : ', Buffer.from(response_body));
		
		// packet의 status를 crc로 바꾸고 crc함수 호출
 		packet_status = CRC; 
		read_crc();
	}
}//read_body


/**
 * packet의 status가 CRC일 때 호출됨
 */
function read_crc() {
	
	writeCnt = 0;

  var packet = port.read(2);
  if(!packet)
		return;

  response_crc.push(...packet);
//  console.log('CRC : ', packet);

  // CRC 체크 결과를 받아옴
	var checked = CCIT_Check_CRC();

	// CRC 체크가 true로 넘어왔을 때 tag id 값 부여
	if(checked){

		// <Buffer 0d, 01>
		// body 데이터의 길이가 2이면 한번의 write 완료 신호로 간주
		if(response_body.length == 2){ 
	  	
			// 완료 신호만 두번 연속으로 오면 tag id값을 읽지 않은 것으로 보고 tag id를 null로 설정
	  	if(!onRead){
	  		tag_id = null;
	  	}else if(onRead){
	  		onRead = false;
			}
	  
	  // body 데이터의 길이가 6 초과이면 tag id를 담은 데이터로 보고 tag id값 추출
	  }else if(response_body.length >  6){	 
	  	tag_id = response_body[response_body.length-1];
	  	onRead = true;
	  }
	}
	
	//packet의 status를 endx로 바꾸고 endx함수 호출
 	packet_status = ENDX; 
	read_endx();
}// read_crc


/**
 * packet의 status가 endx일 때 호출됨
 */
function read_endx() {
	
	writeCnt = 0;

  var packet = port.read(2);
  if(!packet){
  	return;
  }
  
//	console.log('ENDX : ', packet);
  
  //packet의 status를 startx로 바꾸고 startx함수 호출
  packet_status = STARTX_FIRST; 
 	read_startx();
}// read_endx 


//function config() {
//	var packet = port.read(11);
//	if(!packet)
//		return;
//	
//	console.log(packet);
//}

// *******Readable
port.on('readable', () => {	
	
	writeCnt = 0;
	 
  switch(packet_status) {
	case STARTX_FIRST:
	case STARTX_SECOND:
		read_startx();
		break;
	case HEADER:
		read_header();
		break;
	case BODY:
		read_body();
		break;
	case CRC:
		read_crc();
		break;
	case ENDX:
		read_endx();
		break;
  }
}); //on readable


// *******Port Close
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
