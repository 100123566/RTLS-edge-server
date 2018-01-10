class EdgeServer {
    constructor(edge_id, edge_name) {
      this._edge_id = edge_id;
      this._edge_name = edge_name;
    }
  
    get edge_id() {
      return this._edge_id
    }

    get edge_name() {
      return this._edge_name
    }
  }
  
  module.exports = EdgeServer;