var trilateration = require('./trilateration');
var TriangleArea = require('./triangle-area');
var events = require('events');
var util = require('util');
var sqlite = require('./db');
var set = require('./config/settings.json');

class Estimate {

	/**
	 * build Anchor
	 * DB에서 앵커정보를 가져와 거리값 추가
	 */
	buildAnchor(name, distance, callback) {

		// DB에서 anchor 이름으로 select
		sqlite.selectData('anchor', name, (anchor) => {
			
			if(anchor){
				try{
					anchor._x = Number(anchor._x);
					anchor._y = Number(anchor._y);
					anchor._z = Number(anchor._z);
					anchor.distance = distance;
					
					if (typeof callback == 'function') {
						callback(anchor);
					}
					
				}catch(e){
					errlog.error(e);
					
					if (typeof callback == 'function') {
						callback();
					}
				}			
			}else{
				if (typeof callback == 'function') {
					callback();
				}
			}
		});
	}// buildAnchor
	
	
	/**
	 * Sort Anchors
	 * 앵커정보를 거리가 짧은 순으로 정렬
	 */
	sortAnchors(anchors){
		
		var sortedAnchors = anchors.sort(function (a, b) {
			return a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0;
		});
		
		// 정렬 후 앵커정보 수집 완료 이벤트 발생
		this.emit('onBuildAnchor', sortedAnchors);
	}// sortAnchors

	
	/**
	 * On Build Anchor
	 * 앵커 정보 수집
	 * @param {*} distances 
	 */
	onBuildAnchor(distances) {

		var anchors = [];
		var count = 0;

		logger.info('\n***************************************\n***************************************');
		logger.info('↓↓↓↓↓ Anchor Info Read From Tag ↓↓↓↓↓');
		
		// 총 5개의 거리값을 받아옴
		for (var i = 1; i <= 5; i++) {

			// 앵커 이름이 0000 으로 넘어올 경우 앵커 정보에 포함시키지 않는다.
			if (distances[`anchor0${i}_name`].substring(0, 2) !== 'aa') {

				count += 1;
				
				logger.info('Anchor Name 0000');
				
				// for문 5번 실행 후 이벤트 발생
				if (count === 5) {
					this.sortAnchors(anchors);
				}

			} else {

				var name = distances[`anchor0${i}_name`];
				var distance = distances[`anchor0${i}_distance`];
				
				// distances 정보 출력
				logger.info('Anchor Number : ', name.substring(2), ' Distances : ', distance);

				// DB에서 앵커정보 가져오는 함수 호출
				this.buildAnchor(name, distance, (anchor) => {

					count += 1;
					
					if (anchor){
						anchors.push(anchor);
					}

					// for문 5번 실행 후 이벤트 발생
					if (count === 5) {
						this.sortAnchors(anchors);
					}
					
				});
			}
		}//for
	}// onBuildAnchor
	
	
	/**
	 * Trilateration
	 * 삼변측량
	 */
	doTrilateration(anchors, callback) {

	// logger.info('# of anchors', anchors.length);
	
		// 삼변측량에 쓰일 엥커 정보 출력
		logger.info('↓↓↓↓↓  Trilateration Anchor Info  ↓↓↓↓↓');
		anchors.forEach(anchor => {
			if (anchor)
				logger.info('anchor name : ', anchor._name, ' x : ', anchor._x, ' y : ', anchor._y, ' z : ', anchor._z, ' distance : ', anchor.distance);
		});
	
		logger.info('......Do Trilateration');
	
		// 삼변측량
		var p1 = { x: anchors[0]._x, y: anchors[0]._y, z: anchors[0]._z, r: anchors[0].distance }
		var p2 = { x: anchors[1]._x, y: anchors[1]._y, z: anchors[1]._z, r: anchors[1].distance }
		var p3 = { x: anchors[2]._x, y: anchors[2]._y, z: anchors[2]._z, r: anchors[2].distance }
	
		// 삼변측량 
		var results = trilateration(p1, p2, p3);
	
		// 값이 null 일 경우 그대로 returns
		if (!results) {
			if (typeof (callback) === 'function')
				callback(results);
	
			return results;
		} else {
			
			var result = [];
			
			// 천장 높이 보다 낮은 z 값을 선택
			var minZ = Math.min(results[0].z, results[1].z);
			
			results.forEach((data) => {
				if(data.z == minZ ){
					result = data;
				}
			});
	
			// 소수점 이하 버리기
			for (var key in result) {
				result[key] = Math.floor(result[key]);
			}
	
			// 위치 계산 결과에 창고 아이디 추가
			result.storage = anchors[0]._space;
	
			if (typeof (callback) === 'function')
				callback(result);
	
			return result;
		}
	}// doTrilateration

	
	/**
	 * 가장 먼 앵커 추출
	 * @param {*} anchors 
	 */
	getFarAnchor(anchors, threeAnchors) {
		
		var distanceList = [];
		
		// 앵커 정보 중 거리만 추출
		threeAnchors.forEach(threeAnchor => {
				distanceList.push(threeAnchor.distance);
		});

		// 거리값 중 최대값을 구하고, 그에 해당하는 앵커의 인덱스를 반환
		var max = Math.max( ...distanceList );
		var maxAnchor = threeAnchors.slice(distanceList.indexOf(max), 1)[0];
		
		return anchors.indexOf(maxAnchor);
	}
	
	/**
	 * get Three Distances
	 * 거리가 가까운 3개의 앵커 선택
	 */
	getThreeAnchors(anchors, callback) {
		
		// 앵커가 2개 초과하면 while문 실행
		while (anchors.length > 2) {
	
			var threeAnchors = [];
	
			// 가까운 순으로 앵커가 정렬되어 있으므로 0번째부터 2번째 앵커까지 변수에 담는다.
			for (var i = 0; i < 3; i++) {
				threeAnchors.push(anchors[i]);
			}			
			
			// 얻어진 3개의 앵커로 삼각형 면적 계산
			if (this.confirm(threeAnchors)) {
				
				// 삼변측량
				var result = this.doTrilateration(threeAnchors);
				
				// 삼변측량의 결과를 얻었을 때 이벤트 발생시키고 while문 빠져나간다.
				if(result){
	
					// callback 함수가 있는 경우 callback 함수 실행
					if (typeof (callback) === 'function')
						callback(threeAnchors);
					
					this.emit('doEstimate', result);
					break;
					
				// 삼변측량의 결과가 null로 얻어졌을 때
				}else{
				
					logger.info('Location null....');
					
					// 앵커 3개 중 거리가 가장 먼 앵커 하나를 제거하고 다시 while문 실행
					var farAnchorIndex = this.getFarAnchor(anchors,threeAnchors);
					anchors.splice(farAnchorIndex, 1);
				}
			
			// 삼각형 면적이 나오지 않았을 때
			} else {
				
				// 앵커 3개 중 거리가 가장 먼 앵커 하나를 제거하고 다시 while문 실행
				var farAnchorIndex = this.getFarAnchor(anchors,threeAnchors);
				anchors.splice(farAnchorIndex, 1);
			}
		}// while
		
		// 앵커가 3개 이상 남아있지 않으면
		if(anchors.length < 3){
			
			logger.info('The Number of Anchors is Small.......');

			if (typeof (callback) === 'function')
				callback();
			
			// 위치 값이 null로 됨
			this.emit('doEstimate', null);
		}
		
	}// getThreeAnchors
		

	/**
	 * 삼각형 면적을 구하여 계산 가능한지 판단
	 */
	confirm(anchors) {

		// 앵커 갯수가 3개 이하일 때 false로 리턴
		if (anchors.length < 3) {
			errlog.error('The Number of Anchors is Small.......');
			return false;

		// 앵커 끼리 이루는 삼각형의 면적이 5000 이하일 때 false로 리턴
		} else if (TriangleArea(anchors) < set.triangle) {
			errlog.error('Cannot Estimated, Triangle area not exists');
			return false;

		// 앵커 끼리 이루는 삼각형의 면적인 5000 이상일 때 true로 리턴
		} else {
			return true;
		}
	}

	/**
	 * 수집된 앵커 정보를 가지고 측위
	 */
	doEstimate(anchors) {

		// 앵커 갯수가 3개가 안될경우 위치값은 null이 됨
		if (anchors.length < 3) {

			errlog.error('The Number of Anchors is Small.......');
			this.emit('doEstimate', null);

		// 앵커 개수가 3개 이상일 경우, 가까운 거리 순으로 앵커 3개를 선택
		} else if (anchors.length >= 3) {

			this.getThreeAnchors(anchors);

		// 앵커 개수가 3개일 경우, 면적을 가지고 있는지 확인 후 삼변측량
		} else {
			if (this.confirm(anchors)){
				
				var trilaterationResult = this.doTrilateration(anchors);
				
				this.emit('doEstimate', trilaterationResult);
				
			}else{
				return;
			}
		}// 앵커 개수
	}
}

util.inherits(Estimate, events.EventEmitter);

module.exports = new Estimate();