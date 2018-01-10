/**
 * 삼각형 면적 구하는 함수
 * @param anchors
 * @returns
 */
function TriangleArea(anchors){

	// x와 y값만으로 면적 계산
	var p1 = { x: anchors[0]._x, y: anchors[0]._y}
	var p2 = { x: anchors[1]._x, y: anchors[1]._y}
	var p3 = { x: anchors[2]._x, y: anchors[2]._y}
	
	function cal(a, b, c){
		return a*(b-c);
	}

	var a = cal(p1.x, p2.y, p3.y);
	var b = cal(p2.x, p3.y, p1.y);
	var c = cal(p3.x, p1.y, p2.y);

	var result = Math.abs((a+b+c)/2);

	return result;
}

module.exports = TriangleArea;