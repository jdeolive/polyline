var polyshape = {};

var Key = {
  Point: '0',
  Line: '1',
  Polygon: '2',
  MultiPoint: '3',
  Circle: '4',
  Box: '5',
  ArgStart: '(',
  ArgEnd: ')',
  Seperator: ' '
};

/**
 * Polyshape reader.
 *
 * @param {string} input The encoded polyshape input.
 * @param {number} precision Number of decimal places used to encode input, defaults to 5.
 */
function Reader(input, precision) {
  this.input = input;
  this.index = 0;
  this.factor = Math.pow(10, precision || 5);
  this.lat = 0;
  this.lon = 0;
  this.coords = [];
  this.geoms = []
  this.type;
}

/**
 * Returns true if there is more character input.
 *
 * @return {boolean}
 */
Reader.prototype.hasMore = function() {
  return this.index < this.input.length;
}

/**
 * Peeks the current character and determines if it's data.
 *
 * @return {boolean}
 */
Reader.prototype.isData = function() {
  return this.index < this.input.length && 
    this.input.charCodeAt(this.index) >= 63;
}

/**
 * Peeks the current character and determines if it's an event.
 *
 * @return {boolean}
 */
Reader.prototype.isEvent = function() {
  return this.index < this.input.length && 
    this.input.charCodeAt(this.index) < 63;
}

/**
 * Peeks the current character.
 *
 * @return {string}
 */
Reader.prototype.peek = function() {
  return this.input.charAt(this.index);
}

/**
 * Reads the current character and advances to the next for a subsequent read.
 *
 * @return {string}
 */
Reader.prototype.read = function() {
  this.lat = this.lon = 0;
  return this.input.charAt(this.index++);
}

/**
 * Reads a latitude value from the next sequence of characters.
 *
 * @return {number}
 */
Reader.prototype.readLat = function() {
  this.lat += this.readInt();
  return this.lat / this.factor;
}

/**
 * Reads a longitude value from the next sequence of characters.
 *
 * @return {number}
 */
Reader.prototype.readLon = function() {
  this.lon += this.readInt();
  return this.lon / this.factor;
}

/**
 * Reads the raw int value from the next sequence of characters.
 *
 * @return {number}
 */
Reader.prototype.readInt = function() {
  var b = 0;
  var result = 1;
  var shift = 0;
  do {
    b = this.input.charCodeAt(this.index++) - 63 - 1;
    result += b << shift;
    shift += 5;
  } while (b >= 0x1f);
  return (result & 1) != 0 ? ~(result >> 1) : (result >> 1);
}

/**
 * Reads the next coordinate (lat/lon pair).
 *
 * @param {array} arr The array to read into.
 * @return {array} The array passed in.
 */
Reader.prototype.readCoord = function(arr) {
  arr.push(this.readLat());
  arr.push(this.readLon());
  return arr;
}

/**
 * Reads the next set of available coordinates.
 *
 * @param {array} arr The array to read into.
 * @return {array} The array passed in.
 */
Reader.prototype.readCoordinates = function(arr) {
  while (this.isData()) {
    arr.push(this.readCoord([]));
  }
  return arr;
}

/**
 * Reads a Point from the character buffer.
 */
Reader.prototype.readPoint = function() {
  if (this.type == 'Point') {
    // convert to multi point
    this.type = 'MultiPoint';
    this.coords = [this.coords];
  }
  else {
    this.initForNewGeometry('Point');
  }

  this.readCoord(this.coords);
}

/**
 * Reads a LineString from the character buffer.
 */
Reader.prototype.readLine = function() {
  if (this.type == 'LineString') {
    // convert to multi line string
    this.type = 'MultiLineString';
    this.coords = [this.coords];
    this.coords.push(this.readCoordinates([]));
  }
  else {
    this.initForNewGeometry('LineString');
    this.readCoordinates(this.coords);
  }
}

/**
 * Reads a Polygon from the character buffer.
 */
Reader.prototype.readPolygon = function() {
  var coords;

  if (this.type == 'Polygon') {
    this.type = 'MultiPolygon';
    this.coords = [this.coords];
    coords = [];
    this.coords.push(coords);
  }
  else {
    this.initForNewGeometry('Polygon');
    coords = this.coords;
  }

  coords.push(this.readCoordinates([]));
  while(this.isEvent() && this.peek()==Key.ArgStart) {
    this.read();
    coords.push(this.readCoordinates([]));
  }
}

/**
 * Reads a MultiPoint from the character buffer.
 */
Reader.prototype.readMultiPoint = function() {
  this.type = this.type || 'MultiPoint';
  this.readCoordinates(this.coords);
}

/**
 * Initializes state for reading a new geometry. If there is an existing geometry
 * it is pushed onto a list to be later merged into a collection.
 */
Reader.prototype.initForNewGeometry = function(type) {
  if (this.type != null) {
    this.geoms.push(this.geometry());
  }

  this.type = type;
  this.coords = [];
}

/**
 * Returns the current geometry as GeoJSON.
 */
Reader.prototype.geometry = function() {
  return {
    type: this.type || 'Geometry',
    coordinates: this.coords
  };
}

/**
 * Returns the final geometry as GeoJSON. Aggregates multiple geometries into
 * a collection if necessary. 
 */
Reader.prototype.finalGeometry = function() {
  if (this.geoms.length == 0) {
    return this.geometry();
  }
  else {
    this.geoms.push(this.geometry());
    return {
      type: 'GeometryCollection',
      geometries: this.geoms
    };
  }
}

/**
 * Decodes an encoded polyshape string into a GeoJSON geometry.
 *
 * @param {string} str Encoded polyshape string.
 *
 * @return {object} The decoded geometry as GeoJSON.
 */
polyshape.decode = function(str) {
  var key;
  var r = new Reader(str);
  while (r.hasMore()) {
    key = r.read();
    switch(key) {
      case Key.Point:
        r.readPoint();
        break;
      case Key.Line:
        r.readLine();
        break;
      case Key.Polygon:
        r.readPolygon();
        break;
      case Key.MultiPoint:
        r.readMultiPoint();
        break;
      case Key.Seperator:
        break;
      default:
        throw 'Unsupported key: ' + key;
    }
  }

  return r.finalGeometry();
}

if (typeof module === 'object' && module.exports) module.exports = polyshape;