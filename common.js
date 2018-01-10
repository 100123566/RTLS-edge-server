var http = require('http');
var set = require('./config/settings.json');
var fs = require('fs');
//var led = require('./led');

var DEFAULT_URL = 'j-works.j-compia.com';
var DEFAULT_PORT = 80;
var DEFAULT_HEADERS = {
  "Content-Type" : "application/json",
  "Authorization-Type" : "token",
  "Authorization-Key" : "305b0aaa-7e65-4dc8-a559"
}

/**
 * Common
 * server 통신 시 공통으로 사용하는 코드
 */
class Common {

  get HOST() {
    return set.host || DEFAULT_URL
  }

  get PORT() {
    return set.port || DEFAULT_PORT;
  }

  get HEADERS() {
    return set.headers || DEFAULT_HEADERS;
  }

  /**
   * http 통신 부분
   * @param {Obeject} setting 
   */
  httpRequest(setting){

    var options = {
      host : this.HOST,
      port : this.PORT,
      path : setting.path,
      method : setting.method,
      headers : setting.headers || this.HEADERS
    }
    
    //http request callback function
    var callback = function(response){
    	
      var body = '';
//      response.on('error', (err) => { // 응답에 에러가 있으면
//        errlog.error(err);
//        setting.error(err);
//      });
      response.on('data', function(data) {
        body += data;
        
      }).on('end', function(){
//      console.log(JSON.parse(body));
      	
      	try{
      		if(JSON.parse(body).success == false){
        		errlog.error(body);
        		setting.error(body);
        		return;
        	}
      		
      		if(setting.callback){
            setting.callback(body);
          }
      	}catch(e){
      		errlog.error(e);
      		setting.error(body);
      	}
      });
    }// callback
    
    // http request
    var req = http.request(options, callback);
    
    // 5초가 지나면 서버통신에 실패한 것으로 간주하고 강제로 소켓을 닫아 에러 발생시킨다.
    req.on('socket', function(s) { 
    	s.setTimeout(5000, function() { 
    		errlog.error('\nConnection Timeout........');
    		s.destroy(); 
  		});
		});
    
    // request 과정에서 에러가 발생하면 setting에 포함된 error 함수를 호출한다.
    req.on('error', function(err){
//    	led(1);
      errlog.error('\n서버연결에 실패하였습니다. 다시 시도해주세요.\n');
      errlog.error(err.stack);
      setting.error(err);
    });
    
    // 서버에 데이터를 업로드하는 경우에만 사용
    if(setting.sendData){   
      req.write(setting.sendData);
    }
    
    req.end();
    
  }// httpRequest
}

module.exports = new Common();