var GPIO = require('onoff').Gpio,
//    led = new GPIO(23, 'out'),
    button = new GPIO(18, 'in', 'both');
var exec = require('child_process').exec;
//var led = require('./led');
var wifi = 1;

function shutdown(callback){
//  exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); }); // os 리부팅
	exec('sudo service rtls-edge-server restart', function(error, stdout, stderr){ callback(stdout); }); // service 리부팅
//	led.writeSync(0);
//	led(2);
//	exec('sudo service rtls-edge-server stop', function(error, stdout, stderr){ if(error) console.log(err); callback(stdout); }); // service 종료
}
	
function light(err, state) {
  if (state == 1) {
//    led.writeSync(0);
    logger.info('ReStart Button Click');
    
//    if( wifi == 1){
//    	exec('sudo ifdown wlan0', function(error, stdout, stderr){ if(error) console.log(err); logger.info('wifi down') });
//    	
//    	wifi = 0;
//    }else if(wifi == 0){
//    	exec('sudo ifup wlan0', function(error, stdout, stderr){ if(error) console.log(err); logger.info('wifi up') });
//    	
//    	wifi = 1;
//    }
    
    // Reboot computer
    shutdown(function(output){
      logger.info(output);
    });
  }
  else {
//    led.writeSync(1);
    logger.info('Button off');
  }
}

function btnReady(){
	logger.info('Button ready');
	button.watch(light);
}

module.exports = btnReady;