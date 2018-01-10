var server = require('./index');
var getMacAddr = require('./get-macaddr');
var ble = require('./ble');
var estimate = require('./estimate');
var queue = require('./queue');
var wifi = require('./wifi-check');
var fs = require('fs');
var RFID = require('./Alienrfid');
var sqlite = require('./db');
var controlLocation = require('./location');
var rfidTagCheck = false; // rfid tag 유무 체크
var rfidIdCheck, lastLoc; // rfidIdCheck : rfid tag id 값의 변화를 체크, lastLoc : 마지막 위치값 저장 변수

// Queue Open
queue.on('sqliteOpen', function () {
	// wifi 체크 시작
	wifi.wifiCheck(); 
	// db 생성
	sqlite.createDb();
});

// Create Db
sqlite.on('createDb', function (err) {
	
	if(err){
		errlog.error(err);
		
		setTimeout(() => {
			sqlite.createDb();
		},10000);
		return;
	}
	
	logger.info("-----Create Db-----");

//	// 서버로부터 데이터 다운로드 시작
	server.downLoad();

	// For Test------------------------------
//	var distances = {
//		anchor01_name: 'aa01',
//		anchor02_name: 'aa02',
//		anchor03_name: 'aa03',
//		anchor04_name: 'aa04',
//		anchor05_name: 'aa05',
//		anchor01_distance: 800,
//		anchor02_distance: 800,
//		anchor03_distance: 800,
//		anchor04_distance: 800,
//		anchor05_distance: 800
//	};
//	
//	ble.emit('notification',distances);
//	
//	setInterval(function(){
//		ble.emit('notification',distances);
//	}, 1000);
	//---------------------------------------
//	
//	 ble.central();
});

// 데이터 다운 후 Table 생성
server.on('downLoad', function (table, data) {
	sqlite.createTable(table, data);
});

// 서버로부터 데이터 다운에 실패할 경우, 바로 ble 통신 시작
server.on('downLoadFailed', () => {
	ble.central();
});

// Table 생성 후 기존 데이터 모두 삭제
sqlite.on('createTable', function (table, data) {
	logger.info("--Create " + table + " Table Or Already table exist--");
	sqlite.deleteAllData(table, data);
});

// 데이터 삭제 후 새로운 데이터 삽입
sqlite.on('deleteAllData', function (err, table, data){
	if(err){
		errlog.error(err);
		
		setTimeout(()=>{
			sqlite.deleteAllData(table, data);
		},10000);
	}else{
		sqlite.insertData(table, data);
	}
});

// 데이터 다운로드 순서
// 에지서버 -> 맵핑정보 -> 태그정보 -> 앵커정보
sqlite.on('insertData', function (table) {
	logger.info("-------Insert " + table + " Data-------");
	
	switch (table) {
		case 'edge':
			server.downMappingInfo();
			break;
		case 'mapping':
			server.downTagInfo();
			break;
		case 'tag':
			server.downAnchorInfo();
			break;
		case 'anchor':
			server.emit('onDownLoad');
			break;
	}
});

// 데이터 다운로드 완료 후 에지서버 맥주소 얻어옴
server.on('onDownLoad', function () {

	// Get This Device Mac Address
	getMacAddr(function (getMac) {

		if(getMac){
			logger.info("**********************************");
			logger.info('This Device Mac Address : ' + getMac);

			// Search Tag Mac Address
			sqlite.searchTag(getMac);
		}
	});
});


// 에지서버 맥주소 얻어온 후 매핑되는 태그 맥주소 찾음
sqlite.on('searchTag', function (err, mac, rows) {
	
	if(err){
		errlog.error(err);
		
//		setTimeout(() => {
//			sqlite.searchTag(mac);
//		},10000);
		
		ble.central();
		return;
	}

	// 매핑되는 맥주소를 찾지 못했을 땐 기존 데이터를 이용하여 ble 시작
	if (!rows) {
		errlog.error('tag 정보를 찾을 수 없습니다.');
		
		ble.central();
		return;
	}
	
	var tagMac = rows._tag_name;

	logger.info('Tag Mac Address : ' + tagMac);
	logger.info("**********************************");
  
	// settings.json 파일 읽음
	fs.readFile(__dirname + '/config/settings.json', 'utf8', function (err, data) {

		if (err) {
			errlog.error(err);
			
			ble.central();
			return;
		}

		if (data) {
			// the data is passed to the callback in the second argument
			var addTagData = JSON.parse(data);
			addTagData.tag = tagMac;
			
			// 읽어온 settings.json 파일 데이터에 맥주소 추가하여 파일 새로 씀
			fs.writeFile(__dirname + '/config/settings.json', JSON.stringify(addTagData, null, '\t'), 'utf8', function (err) {
				
				if(err) {
					errlog.error(err);
					
					ble.central();
					return;
				}
				
				logger.info('Save This Device Mac Address');
				
				// ble Start
				ble.central(tagMac);				
			});
		}
		
	});// readFile
	//--------------------------------	
});


// Ble notification
// Ble 를 통해 거리데이터를 받아오면 3개의 앵커 선택
ble.on('notification', function (distances) {
	estimate.onBuildAnchor(distances);
});


// Build Anchor && Trilateration
// 앵커 정보 수집 후 삼변측량
estimate.on('onBuildAnchor', function (anchors) {
	estimate.doEstimate(anchors);
});


// Estimate
// 삼변측량을 통해 얻어진 최종 위치값을 queue에 추가
estimate.on('doEstimate', function (location) {
	
	var rfidId = RFID.getRfid();
	var availableLoc = controlLocation.addLocation(location, rfidId);
	
	// 리턴 받은 위치 데이터(rfidId 포함된)가 있으면 queue에 추가
	if(availableLoc){
		queue.q.add(availableLoc);
	}
	
});


// Get Queue
// queue에 add된 location 데이터를 추출함
queue.on('getLocation', function (location) {
//	console.log(typeof(location.rfidId));
	var upLoadLoc = controlLocation.getLocation(location);
	
	// 업로드 할 데이터가 있는지 체크
	if(upLoadLoc){
		
//		console.log('**********', upLoadLoc);
		server.uploadLocation(upLoadLoc);
	}else{
		queue.q.done();
	}
	
});


// Upload Location
server.on('uploadLocation', function () {
	// 전송 후 queue에서 제거
	queue.q.done();
});


// Upload Location Failed
server.on('uploadLocationFailed', function (location) {
	// 3초후 다시 전송 시도
	setTimeout(function () {
		server.uploadLocation(location);
	}, 3000);
});

// wifi 연결되었을 때 queue start
wifi.on('wifiConnected', function () {
	logger.info('///////  Wifi Connected!!  //////');
	queue.q.start();
});

// wifi 연결이 끊어졌을 때 queue stop
wifi.on('wifiDisConnected', function () {
	logger.info('/////  Wifi DisConnected!!  /////');
	queue.q.stop();
});

// queue Open
queue.sqliteOpen();
// Rfid PortOpen
RFID.portOpen();
