var rfidTagCheck = false; // rfid tag 유무 체크
var rfidIdCheck, lastLoc; // rfidIdCheck : rfid tag id 값의 변화를 체크, lastLoc : 마지막 위치값 저장 변수

class ControlLocation {
	
	addLocation(location, rfidId) {
		
		// 위치 정보 없을 때
		if (!location) {
			logger.info('Location null....');
			logger.info('*****************************************');
			
			// rfid tag id 없을 때
			if(!rfidId){
				
				rfidId = 'N';
				
				// 바로 전에도 rfid tag id가 없었으면 queue에 추가하지 않고 리턴
				if(!rfidTagCheck){
					return null;
				// 바로 전에 rfid tag id가 있었으면 위치 정보에 rfid tag 정보를 추가하여 queue에 추가
				}else{
					// 현재 rfid tag id가 없는 상태이므로 false
					rfidTagCheck = false;
					
					// 위치 정보는 초기화하고 rfidId 값만 저장
					location = {};
					location.rfidId = rfidId;
					
					return location;
				}
			// rfid tag id가 있으나 위치 정보가 없으므로 queue에 추가하지 않는다.
			}else{
				rfidTagCheck = true;
				return null;
			}
				
		// 위치 정보가 있을 때
		} else {
			
			logger.info('<< Location  =>  x : ', location.x, ' y : ', location.y, ' z : ', location.z, ' >>');
			
			// rfid tag id 없을 때
			if (!rfidId) {
				
				rfidId = 'N';
				
				// 바로 전에도 rfid tag id가 없었으면 queue에 추가하지 않고 리턴
				if(!rfidTagCheck){
					return null;
				// 바로 전에 rfid tag id가 있었으면 위치 정보에 rfid tag 정보를 추가하여 queue에 추가
				}else{
					rfidTagCheck = false;
				}
			// rfid tag id가 있을 때, 위치 정보에 rfid tag 정보를 추가하여 queue에 추가
			}else{
				rfidTagCheck = true;
			}
			
			// 위치정보에 rfid tag id 값 추가
			location.rfidId = rfidId;
			
			// 음수값으로 나오면 0으로 설정
			if(location.x < 0){
				location.x = 0;
			}
			// 음수값으로 나오면 0으로 설정
			if(location.y < 0){
				location.y = 0;
			}
			// 음수값으로 나오면 0으로 설정
			if(location.z < 0){
				location.z = 0;
			}
			
			return location;
		}	
	} // addLocation
	
	getLocation(location) {
		
		// rfid id 값 체크
		if(location.rfidId){
			// rfidId 값이 바뀌었을 때 ( ex) tag id가 9에서 'N'으로 바뀌었을 때 )
			if(rfidIdCheck !== location.rfidId){
					
				logger.info('Rfid Tag Changed..!!!');
				
				// rfid 변화 체크하는 변수에 현재 rfid tag id 값 저장
				rfidIdCheck = location.rfidId;
				
				// 마지막 위치 있는지 확인 ( 이전에 tag id가 없었을 경우 마지막 위치가 존재하지 않는다 )
				if(lastLoc){
					
					var upLoadLoc = lastLoc;
					
					// tag id가 있을 때에만 마지막 위치를 변수에 저장
					if(location.rfidId === 'N'){
						lastLoc = '';
					}else{
						lastLoc = location;
					}
					
					// 서버로 전송할 데이터
					return upLoadLoc;
					
				}else{
					// 마지막 위치가 없으면 서버로 전송하지 않는다.
					return null;
				}
			
		  // rfid tag id 값이 변하지 않았을 땐 서버 전송없이 queue에서 제거
			}else{
				
				// tag id가 있을 때에만 마지막 위치를 변수에 저장
				if(rfidIdCheck === 'N'){
					lastLoc = '';
				}else{
					lastLoc = location;
				}
				return null;
			}
			
		// rfid tag id 가 제대로 저장되지 않았을 경우 서버로 전송하지 못함
		}else{
			errlog.error('Rfid Tag Id is not exist in Location Data....');
			return null;
		}
	} // getLocation
}

module.exports = new ControlLocation();