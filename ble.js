//var noble = require('noble');
var estimate = require('./estimate');
var events = require('events');
var util = require('util');
// config 파일에서 tag 정보 가져옴
var DEFAULT_MAC_ADDR = require('./config/settings.json').tag;

const RMS_SERVICE_UUID = 'd06d789c6d5e4547a0341226343734fa';
const SPACE_CHARACTER_UUID = 'd06d789f6d5e4547a0341226343734fa';

const TLS_SERVICE_UUID = '8e9389009bef70a3964998e506d52af9';
const DISTANCES_CHARACTER_UUID = '8e9389019bef70a3964998e506d52af9';

class Ble{
	
	/**
	 * discovery
	 */
	central(MAC_ADDR){
	
		// Start Noble
		var noble = require('noble');
		// 매개변수 MAC_ADDR 이 있는지 확인하고 없을 경우 config 파일에서 정보 가져옴
		this._MAC_ADDR = MAC_ADDR || DEFAULT_MAC_ADDR;
		
		// ble power 상태가 변하면 스캔 제어
	  noble.on('stateChange', function(state) {
	    if (state === 'poweredOn') {
	      noble.startScanning();
	      logger.info('Ble Started....!');
	    }else{
	    	noble.stopScanning();
	    	errlog.error('ble power off.....');
	    }
	  });
		
	  
	  // Ble On Scan Start
		noble.on('scanStart',function(){
			logger.info('scanning...');
		});
		
		
		// Ble On Discover
		noble.on('discover', (peripheral) => {
//			console.log(peripheral.address);
			
		  if (peripheral.address !== this._MAC_ADDR) {
		    return;
		  }

		  logger.info('Found Tag MACADDR', peripheral.address);
		  
		  
		  // Ble On Stop Scan
		  // Scan이 중단되면 ble connect
		  noble.on('scanStop', function () {
		    logger.info('on -> scanStop');
		    peripheral.connect();
		  });
		  
		  
		  // Peripheral On Disconnect
		  // ble가 disconnect 될 경우 5초후 다시 연결 시도
		  peripheral.on('disconnect', function(){
		  	errlog.error('Ble Disconnect.....');
		  	
		  	setTimeout(function(){
		  		peripheral.connect();
		  		logger.info('Ble ReConnect.....!!');
		  	}, 5000);
		  })

		  
		  // Peripheral On Connect
		  peripheral.on('connect', function (error) {
		  	// var lastTime = new Date();
		  	
		    if (error) {
		      errlog.error(error);
		      
		      // connect 실패 시 10초 후 다시 시도
		      setTimeout(function(){
		      	peripheral.connect();
		      }, 10000);
		      
		      return;
		    }
		    
		    logger.info('connected to peripheral: ' + peripheral.uuid);		 
		    
		    // Peripheral Discover Services
		    peripheral.discoverServices([TLS_SERVICE_UUID]);
		    
		  });// connect
		
		  
			// Peripheral Discover Services
	    peripheral.on('servicesDiscover', (services) => {
	
	      var rmsService = services[0];
	      
	      if(!rmsService){
	      	errlog.error('Cannot Find Ble Service.......');
	      	
	      	// Peripheral Discover Services
			    peripheral.discoverServices([TLS_SERVICE_UUID]);
	    
	      	return;
	      }
	
	      logger.info('discovered TLS service' + services);
      
	      
	      // Service Discover Characteristics
        rmsService.discoverCharacteristics([DISTANCES_CHARACTER_UUID]);

        
      	// Service Discover Characteristics
	      rmsService.on('characteristicsDiscover', (characteristics) => {
	        var distancesCharacteristic = characteristics[0];
	        
	        // Characteristic discovery에 실패했을 때 다시 시도
	        if(!distancesCharacteristic){
	        	errlog.error('Cannot Find Ble Characteristics.......');
	        	
	        	// Service Discover Characteristics
	          rmsService.discoverCharacteristics([DISTANCES_CHARACTER_UUID]);
	          
	          return;
	        }
	        
	        logger.info('discovered distances characteristic' + distancesCharacteristic);
	
	        // Characteristics On Data
	        distancesCharacteristic.on('data', (data, isNotification) => {
	        	
	          // var currTime = new Date();
	
	          // if(currTime - lastTime < 1000)
	          // return;
	        	
	        	// 데이터가 없으면 리턴
	        	if(!data){
	        		return;
	        	}
	        	
//	           var distances = {
//	             anchor01_name: String('0000' + data.readUInt16LE(0).toString(16)).slice(-4),
//	             anchor02_name: String('0000' + data.readUInt16LE(2).toString(16)).slice(-4),
//	             anchor03_name: String('0000' + data.readUInt16LE(4).toString(16)).slice(-4),
//	             anchor04_name: String('0000' + data.readUInt16LE(6).toString(16)).slice(-4),
//	             anchor05_name: String('0000' + data.readUInt16LE(8).toString(16)).slice(-4),
//	             anchor01_distance: data.readUInt16LE(10),
//	             anchor02_distance: data.readUInt16LE(12),
//	             anchor03_distance: data.readUInt16LE(14),
//	             anchor04_distance: data.readUInt16LE(16),
//	             anchor05_distance: data.readUInt16LE(18)
//	           };
	           
	        	 // 데이터 변환
	           var distances = {
		             anchor01_name: String(data.readUInt8(1).toString(16))+('0000'+data.readUInt8(0)).slice(-2),
		             anchor02_name: String(data.readUInt8(3).toString(16))+('0000'+data.readUInt8(2)).slice(-2),
		             anchor03_name: String(data.readUInt8(5).toString(16))+('0000'+data.readUInt8(4)).slice(-2),
		             anchor04_name: String(data.readUInt8(7).toString(16))+('0000'+data.readUInt8(6)).slice(-2),
		             anchor05_name: String(data.readUInt8(9).toString(16))+('0000'+data.readUInt8(8)).slice(-2),
		             anchor01_distance: data.readUInt16LE(10),
		             anchor02_distance: data.readUInt16LE(12),
		             anchor03_distance: data.readUInt16LE(14),
		             anchor04_distance: data.readUInt16LE(16),
		             anchor05_distance: data.readUInt16LE(18)
		           };
	           
	           logger.info('distances :\n',distances);
	
	          // lastTime = new Date();
	           
	          // 거리값 전달
	          this.emit('notification',distances);
	        });// data
	
	        
	        // Characteristic Subscribe
	        distancesCharacteristic.subscribe(function (error) {
	          logger.info('distances notification on');
	        });// distance
	        
	      });// discover characteristics
	    });// discover services
	    
		  // Ble Scan Stop
	    // 태그를 찾으면 scan 중단
		  noble.stopScanning();
		  
		}); // discover
	}// central
}// Ble

util.inherits(Ble, events.EventEmitter);

module.exports = new Ble();