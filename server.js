var Anchor = require('./anchor');
var Mapping = require('./forklift-mapping');
var EdgeServer = require('./edge-server');
var common = require('./common.js');
var Tag = require('./tag');
var http = require('http');
var events = require('events');
var util = require('util');
var sqlite = require('./db');
var set = require('./config/settings.json');

class RTLSServer {
  
  /**
   * RTSL 서버, 대시보드로 위치 데이터 전송
   */
  uploadLocation(location){
	    
  		// 좌표값, 창고아이디, rfid id값 추출
	    var xyz = location.x + '-' + location.y + '-' + location.z;
	    var storage = location.storage;
        var rfidId = location.rfidId;
     
	    // 서버로 전송
	    common.httpRequest({
	      path: '/rest/rtls_rfid_positions',
	      method: 'POST',
	      sendData: JSON.stringify({
 	      	"rfid_id": rfidId,
	        "description": "CI_RFID_000_TEST",
	        "rtls_storage_id": JSON.parse(storage).id,
	        "rlts_storage" : storage,
	        "installation_area": "A구역",
	        "position_data": xyz
	      }),
	      callback: (body) => {
	      	
//	      	body = JSON.parse(body);
	      	
          logger.info('Location UpLoad To RTLS Server Success!!');
          logger.info("*****************************************");
          
          this.emit('uploadLocation');
            
	      },error: () => {
	      	this.emit('uploadLocationFailed', location);
	      }
      });
  }//uploadLocation
  
  /**
	 * Download Anchors Infomation from RTLS Server
	 */
  downAnchorInfo() {

    common.httpRequest({
      path: '/rest/rtls_anchors?limit='+set.anchorLimit,
      method: 'GET',
      callback: (body) => {
        body = JSON.parse(body);
        
        var anchors = {};

        // storage received anchor data
        for (var i = 0; i < body.total; i++) {
        
          
          var anchorData = body.items[i];

          var name = anchorData.name;
          var position = anchorData.position_data.split('-'); // "x-y-z" 형태에서  "[x, y, z]" 형태로 변환
          var space = anchorData.rtls_storage;
          
          // name을 key로 하여 오브젝트에 담기
          anchors[name] = new Anchor(name, position[0], position[1], position[2], space);
          
        } // for(...)
        
        logger.info('Anchor Info DownLoad Success');
        // 'anchor' : 테이블 이름, anchors : 앵커 데이터
        this.emit('downLoad', 'anchor', anchors);

      },error: () => {
      	
      	// 10초후 다시 다운로드 시도
//      	setTimeout(() => {
//      		this.downAnchorInfo();
//      	},10000);
      	
      	this.emit('downLoadFailed');
      }
    }); 
  }//downAnchorInfo

  /**
	 * Download Tag Mapping Information from RTLS Server
	 */
  downTagInfo() {

    common.httpRequest({
      path: '/rest/rtls_tags',
      method: 'GET',
      callback: (body) => {

        var tags = {};

        body = JSON.parse(body);
        // console.log('tagBody : ',body);
        // storage received anchor data
        for (var i = 0; i < body.total; i++) {

          var tagData = body.items[i];

          var id = tagData.id;
          var name = tagData.name;

          // tag id 값을 키로 하여 오브젝트에 담기
          tags[id] = new Tag(id, name);

        } // for(...)
        
        logger.info('Tag Info DownLoad Success');
        // 'tag' : 테이블 이름, tags : 태그 데이터
        this.emit('downLoad', 'tag', tags);

      },error: () => {
      	
      	// 10초후 다시 다운로드 시도
//      	setTimeout(() => {
//      		this.downTagInfo();
//      	},10000);
      	
      	this.emit('downLoadFailed');
      }
    }); 
  }// downTagInfo

  
  /**
	 * Download Forklift Mapping Information from RTLS Server
	 */
  downMappingInfo() {

    common.httpRequest({
      path: '/rest/rtls_fork_lifts',
      method: 'GET',
      callback: (body) => {

        var mappings = {};

        body = JSON.parse(body);
        // logger.info(body);
        // storage received anchor data
        for (var i = 0; i < body.total; i++) {

          var mappingData = body.items[i];

          var name = mappingData.name;
          var edge_id = mappingData.rtls_edge_server_id;
          var tag_id = mappingData.rtls_tag_id;
          var rfid_reader_id = mappingData.rtls_rfid_reader_id;

          mappings[edge_id] = new Mapping(name, edge_id, tag_id, rfid_reader_id);

        } // for(...)
        
        logger.info('Mapping Info DownLoad Success');
        // 'mapping' : 테이블 이름, mappings : 매핑 데이터
        this.emit('downLoad', 'mapping', mappings);
        
      },error: () => {
      	
      	// 10초후 다시 다운로드 시도
//      	setTimeout( () => {
//      		this.downMappingInfo();
//      	},10000);
      	
      	this.emit('downLoadFailed');
      }
    }); 
  }//downMappingInfo

  
  /**
	 * Download EdgeServer Mapping Information from RTLS Server
	 */
  downEdgeServerInfo() {

    common.httpRequest({
      path: '/rest/rtls_edge_servers',
      method: 'GET',
      callback: (body) => {

        var edge_servers = {};

        body = JSON.parse(body);
        // console.log('edgeServerBody : ',body);
        
        // download edgeserver data
        for (var i = 0; i < body.total; i++) {

          var edgeServerData = body.items[i];

          var id = edgeServerData.id;
          var name = edgeServerData.name;

          edge_servers[name] = new EdgeServer(id, name);

        } // for(...)
        
        logger.info("**********************************");
        logger.info("DownLoad Started");
        logger.info('Edge Server Info DownLoad Success');

        // 'edge' : 테이블 이름, edge_servers : 에지서버 데이터
        this.emit('downLoad', 'edge', edge_servers);

      },error: () =>{
      	
      	// 10초후 다시 다운로드 시도
//      	setTimeout(()=>{
//      		this.downEdgeServerInfo();
//      	},10000);
      	
      	this.emit('downLoadFailed');
      }
    }); 
  }// downEdgeServerInfo

  
  /**
   * DownLoad Start
   */
  downLoad(){
    this.downEdgeServerInfo();
  }
}

util.inherits(RTLSServer, events.EventEmitter);

module.exports = RTLSServer;