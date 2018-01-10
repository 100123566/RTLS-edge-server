var sqlite3 = require('sqlite3').verbose();
var events = require('events');
var util = require('util');

class DB{
	
	/**
	 * Create Db
	 */
	createDb(callback) {
		
		var db = new sqlite3.Database(__dirname+'/data/info.sqlite3', (err) => {
		
			if(err){				
				this.emit('createDb', err);
				return;				
			}

			this._db = db;

			if(typeof(callback) == 'function'){
				callback();
			}

			this.emit('createDb');
		});
	}// createDb
	
	
	/**
	 * Create Table If Not Exists
	 */
	createTable(table, data) {

		var columns, keys;
		
		keys = Object.keys(data);
		columns = Object.keys(data[keys[0]]);
		
		this._db.run("CREATE TABLE IF NOT EXISTS "+table+" (key TEXT)", () => {
			
			var count = 0;
				
			columns.forEach((column) => {
				
				var colCheck = false;
				
				// 테이블 컬럼 정보 검색
				this._db.each("pragma table_info('"+table+"')", function(err, rows){
					if(err){
						errlog.error(err);
					}
					
					if(rows.name == column){
						colCheck = true;
					}
					
				}, (err) => { // each complete function
				
					if(err){
						errlog.error(err);
					}
					
					// 기존에 같은 컬럼이 없을 경우
					if(!colCheck){
						this._db.run("ALTER TABLE "+table+" ADD COLUMN "+column+" TEXT",(err) => {
							if(err){
								errlog.error(err);
							}
							
							count += 1;
							
							if(count === columns.length){
								this.emit('createTable', table, data);
							}
							
						}); //run alter table	
					}else{
						count += 1;
						
						if(count === columns.length){
							this.emit('createTable', table, data);
						}
					}
				}); // each	
				
			}); // column foreach
		}); // run create table
	}// createTable
	
	
	/**
	 * Show Table Info
	 */
	showTableInfo(table){
			
		this._db.get("SELECT * FROM sqlite_master WHERE type='table'", (err, rows) => {
			if(err){
				errlog.error(err);
				return;
			}
  		logger.info(rows);
	  });
	}// showTableInfo
	
	
	/**
	 * Insert Data
	 */
	insertData(table, data) {

		var columns, keys;
		
		keys = Object.keys(data);
		columns = Object.keys(data[keys[0]]);
		
		var columnList =columns.toString();
		var count = 0;
		
		for(var key in data){
			
			var valueList = [];
			
			columns.forEach((column) => {
				valueList.push(data[key][column]);
			})
			valueList = valueList.join('","');
			
			this._db.run('INSERT INTO '+table+' ( key, '+columnList+') VALUES ("'+key+'","'+valueList+'")', (err) => {
				if(err){
					errlog.error(err);
				}
				
				count += 1;
				
				if(count === Object.keys(data).length){
					this.emit('insertData', table);
				}
				
			});
		}
	}// insertData
	
	
	/**
	 * Select Data
	 */
	selectData(table, key, callback) {
		
		this._db.get('SELECT * FROM '+table+' WHERE key = "'+key+'"', (err, rows) => {
	      // this.emit('selectData', rows);
				if(callback){
					callback(rows);
				}
	  });
	}// selectData
	
	
	/**
	 * Search Tag
	 */
	searchTag(mac){
		this._db.get('select tag._tag_name '+
			'from tag '+
			'inner join mapping on tag._tag_id = mapping._tag_id '+
			'inner join edge on mapping._edge_id = edge._edge_id '+
			'where edge._edge_name = "'+mac+'"', 
		(err, rows) => {
			this.emit('searchTag', err, mac, rows);
		});
	}// searchTag
	
	
	/**
	 * Select All Data
	 */
	selectAllData(table){
			
		this._db.all("SELECT * FROM "+table, (err, rows) => {
				if(err) console.log(err);
				// this.emit('selectAllData', rows);
				
				logger.info(rows);
		  });
	}// selectAllData
	
	/**
	 * Delete All Data
	 */
	deleteAllData(table, data){
		this._db.run("DELETE FROM "+table, (err) => {
			if(err){
				errlog.error(err);
				this.emit('deleteAllData', err, table, data);
			}else{
				this._db.get("select count(*) from "+table, (err, cnt) => {
					
					var count = cnt[Object.keys(cnt)[0]];
					
					if(count == 0){
						logger.info('Delete All Data complete');
						
						this.emit('deleteAllData', err, table, data);
					}else{
						
						err = 'Data Delete fail....';
						this.emit('deleteAllData', err, table, data);
					}
				}); // count
			}
		});
	}// deleteAllData
	
	/**
	 * Close DB
	 */
	closeDb(){
		logger.info('close db');
		this._db.close();
	}
}

util.inherits(DB, events.EventEmitter);

module.exports = new DB();