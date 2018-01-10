var server = require('./index');
var queue = require('./queue');
var fs = require('fs');
var FormData = require('form-data');
var common = require('./common');

//var location = { xyz: 500+"-"+500+"-"+500, storage:"13374ab7-0096-404a-bdaf-a9572914ed2e", rfidId: "N" };
//var xyz = 500+"-"+500+"-"+500;
//var location = { xyz: xyz, storage:"228b9825-b757-4a79-8c75-f4db4d6e535c", rfidId: "N" };

//var location = { x: 500, y:500, z:500, rfidId: "N" };
//location = undefined;
//
//queue.on('sqliteOpen', function(){
//	queue.q.start();
//	queue.q.add(location);
//});
//
//queue.on('getLocation', function(){
//	queue.q.done();
//});
//
//queue.sqliteOpen();



//server.uploadLocation(location);
//server.downLoad();

var log = require('./config/log4js.json');

function uploadLogFile(){
	
	var file = fs.readFileSync(log.appenders.logFile.filename);
	
	var formData = new FormData();	
	formData.append('file', file, 'edge-server-log.txt');
	
	var headers = formData.getHeaders({"Authorization-Type" : "token", 
		 								"Authorization-Key" : "305b0aaa-7e65-4dc8-a559"});
	
	var sendData = formData._streams[0]+'\r\n'+formData._streams[1]+'\r\n'+formData._lastBoundary();
//console.log(sendData);
  // 서버로 전송
  common.httpRequest({
  	headers : headers,
    path: '/rest/upload/edge-server-logs',
    method: 'POST',
    sendData: sendData,
    callback: (body) => {
    	
    	body = JSON.parse(body);
    	console.log(body);
    	
      logger.info('Location UpLoad To RTLS Server Success!!');
      logger.info("*****************************************");
        
    },error: () => {
    	
    }
  });
}//uploadLocation

uploadLogFile();