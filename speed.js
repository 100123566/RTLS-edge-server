function Speed(p1, p2) {

	function imsub(a, b) {
		return a - b;
	}

	function pow(a) {
		return a * a;
	}

	var length_x = imsub(p2.x, p1.x);
	var length_y = imsub(p2.y, p1.y);

	var sum = pow(length_x) + pow(length_y);

	var s = Math.sqrt(sum) * 3600 * (1/100000);
	
	return s;
}

module.exports = Speed;