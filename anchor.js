class Anchor {
  constructor(name, x, y, z, space) {
    this._name = name;
    this._x = x;
    this._y = y;
    this._z = z;
    this._space = space;
  }

  get name() {
    return this._name
  }

  get x() {
    return this._x
  }

  set x(x) {
    this._x = x
  }

  get y() {
    return this._y
  }

  set y(y) {
    this._y = y
  }

  get z() {
    return this._z
  }

  set z(z) {
    this._z = z
  }

  get space() {
    return this._space
  }
  

  get distance() {
    return this._distance
  }

  set distance(distance) {
    this._distance = distance
  }
}

module.exports = Anchor;