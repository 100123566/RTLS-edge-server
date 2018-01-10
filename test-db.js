var server = require('./index');
//var sqlite = require('./db');
var sqlite = require('./test-sqlite');

sqlite.on('createDb', function(){
	console.log("-----Create Db-----");
//	server.downEdgeServerInfo();
});

server.on('downLoad', function(table, data) {
	sqlite.createTable(table, data);
});

sqlite.on('createTable', function(table, data, columns){
	console.log("-------Create "+table+" Table-------");
	sqlite.deleteAllData(table, data);
});

sqlite.on('deleteAllData', function(table, data){
	
	sqlite.insertData(table, data);
});

sqlite.on('insertData', function(table){
	sqlite.selectAllData(table);
//	sqlite.closeDb();	
});

sqlite.on('selectAllData', function(rows){
	console.log(rows);
	sqlite.closeDb();
});

sqlite.createDb();

