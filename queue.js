var Queue = require('node-persistent-queue');
var q = new Queue(__dirname+'/data/db.location');
var events = require('events');
var util = require('util');

class fileQueue {
	
	// Queue Open
	sqliteOpen(){
		
		this.q = q;
		
		q.on('open',() => {
			logger.info('Opening SQLite DB');
			this.emit('sqliteOpen');
		});
		
		q.on('start', () => {
			logger.info('----------Starting Queue!!----------');
		});
		
		q.on('add',(location) => {
			try{
				
				// 위치 정보를 확인한 후 콘솔에 출력
				if(location.job.x){
					logger.info('Queue Adding task: '+location.id+' x: '+location.job.x+' y: '+location.job.y+' z: '+location.job.z+' rfid: '+location.job.rfidId);
				}else{
					logger.info('Queue Adding task: '+location.id+' rfid: '+location.job.rfidId);
				}
				
			}catch(e){
				// 위치 정보를 가지고 있지 않을 때 error 처리
				errlog.error(e);
				errlog.error('Error Add location : ',location);
			}
		});
		
		// queue에서 빼낸 데이터
		q.on('next',(location) => {			
			try{
				logger.info('Queue Process task: ',location.id+' rfid : '+location.job.rfidId);
			}catch(e){
				errlog.error(e);	
				errlog.error('Error Process location : ',location);
			}finally{
				// queue에서 데이터가 빠져나오면 이벤트 발생
				this.emit('getLocation', location.job);
			}
		});
		
		q.on('empty',() => {
			logger.info('Queue is empty');
			logger.info('*****************************************');
		});
		
		q.on('stop',() => {
			logger.info(' ----------Stopping Queue.....----------');
		});
		
		q.open().catch(function(err) {
			errlog.error(err);
//			process.exit(1);
		});
	}
}

util.inherits(fileQueue, events.EventEmitter);

module.exports = new fileQueue;