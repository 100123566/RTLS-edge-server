var GPIO = require('onoff').Gpio,
	led = new GPIO(23, 'out');

var led_state = 0;
var defaultIv = 200;
var iv;

function Led(state) {
	
	switch(state){
	
	// 프로그램 실행
	case 0 :
		
		logger.info('Start Led On');
		ledIv(defaultIv);
		
		break;
	
	// 서버연결 에러
	case 1 :
		
		errlog.error('Server Error Led On');
		
		clearInterval(iv);
		
		ledIv(1000);
		
		
//		// 10초 후에 LED를 깜박이는게 중지됨
		st = setTimeout(function() {
			clearInterval(iv); // LED를 깜박이게 했던 인터벌을 제거
//			led.writeSync(0); // LED를 끈다.
			ledIv(defaultIv); // 정상 led 신호 다시 start
			// led.unexport(); // 사용했던 GPIO자원을 해제한다.
		}.bind(this), 10000);
		break;
		
	case 2 :
		clearInterval(iv);
		led.writeSync(0);
		break;
	}
}

function ledIv(s) {
	
	iv = setInterval(function() {

		// led가 연결된 GPIO의 핀값을 읽어와서
		led_state = led.readSync();

		// 해당값의 반전된 값을 다음 LED의 상태값으로 결정함
		// 결과적으로 LED가 깜박이게됨
		if (led_state == 0)
			led_state = 1;
		else
			led_state = 0;

		// led_state값을 gpio에 기록
		led.writeSync(led_state)
	}, s);		
}

module.exports = Led;