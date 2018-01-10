class ForkliftMapping {
    constructor(forklift_name, edge_id, tag_id, _rfid_reader_id) {
      this._forklift_name = forklift_name;
      this._edge_id = edge_id;
      this._tag_id = tag_id;
      this.__rfid_reader_id = _rfid_reader_id;
    }
  
    get forklift_name() {
      return this._forklift_name
    }

    get edge_id() {
      return this._edge_id
    }
    
    get tag_id() {
      return this._tag_id
    }

    get _rfid_reader_id(){
      return this.__rfid_reader_id
    }
  }
  
  module.exports = ForkliftMapping;