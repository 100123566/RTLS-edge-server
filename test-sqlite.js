var sqlite3 = require("sqlite3").verbose();
var TransactionDatabase = require("sqlite3-transactions").TransactionDatabase;
var events = require('events');
var util = require('util');

class DB{
	
	/**
	 * Create Db
	 */
	createDb(callback) {
		var db = new TransactionDatabase(
			new sqlite3.Database(__dirname+'/data/test.sqlite3', function(err){
				if(err){
					errlog.error(err);
					return;				
				}

				this._db = db;

				if(callback){
					callback();
				}

//				this.emit('createDb');
			}.bind(this));
		);
	}// createDb
	
}

util.inherits(DB, events.EventEmitter);

module.exports = new DB();