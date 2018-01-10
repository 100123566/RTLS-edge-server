var Server = require('./server');
//var btnReady = require('./reboot');
//var led = require('./led');

const log4js = require('log4js');

log4js.configure(__dirname + '/config/log4js.json');
global.logger = log4js.getLogger();
global.errlog = log4js.getLogger('error');

//led(0);
//btnReady();

module.exports = new Server();