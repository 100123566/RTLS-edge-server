class Tag {
    constructor(tag_id, tag_name) {
      this._tag_id = tag_id;
      this._tag_name = tag_name;
    }
  
    get tag_id() {
      return this._tag_id
    }

    get tag_name() {
      return this._tag_name
    }
  }
  
  module.exports = Tag;