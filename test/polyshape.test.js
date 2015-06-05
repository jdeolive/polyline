var expect = require('chai').expect;
var polyshape = require('../polyshape.js');

describe('polyshape', function() {
  var point = {
    type: 'Point',
    coordinates: [100.1, 0.1]
  };
  var line = {
    type: 'LineString',
    coordinates: [[100.1, 0.1], [101.1,1.1]]
  }
  var polygon = {
    type: 'Polygon',
    coordinates: [[[100.1, 0.1], [101.1, 0.1], [101.1, 1.1], [100.1, 1.1], [100.1, 0.1]]]
  }
  var polygonWithRings = {
    type: 'Polygon',
    coordinates: [
      [[100.1, 0.1], [101.1, 0.1], [101.1, 1.1], [100.1, 1.1], [100.1, 0.1]],
      [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
    ]
  }
  var multiPoint = {
    type: 'MultiPoint',
    coordinates: [[100.1, 0.1], [101.1, 1.1]]
  }
  var multiLine = {
    type: 'MultiLineString',
    coordinates: [
      [[100.1, 0.1], [101.1, 1.1]],
      [[102.1, 2.1], [103.1, 3.1]]
    ]
  }

  var multiPolygon = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [[102.1, 2.1], [103.1, 2.1], [103.1, 3.1], [102.1, 3.1], [102.1, 2.1]]
      ],
      [
        [[100.1, 0.1], [101.1, 0.1], [101.1, 1.1], [100.1, 1.1], [100.1, 0.1]],
        [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
      ]
    ]
  }

  var collection = {
    type: 'GeometryCollection',
    geometries: [{
      type: 'Point',
      coordinates: [100.1, 0.1]
    }, {
      type: 'LineString',
      coordinates: [[100.1, 0.1], [101.1,1.1]]
    }, {
      type: 'Polygon',
      coordinates: [[[100.1, 0.1], [101.1, 0.1], [101.1, 1.1], [100.1, 1.1], [100.1, 0.1]]]
    }]
  }

  describe('decode', function() {

    it('decodes a point', function() {
      expect(polyshape.decode('0_x}aR_pR')).to.deep.equal(point);
    });

    it('decodes a line', function() {
      expect(polyshape.decode('1_x}aR_pR_ibE_ibE')).to.deep.equal(line);
    });

    it('decodes a polygon', function() {
      expect(polyshape.decode('2_x}aR_pR_ibE??_ibE~hbE??~hbE')).to.deep.equal(polygon);
    });

    it('decodes a polygon with inner rings', function() {
      expect(polyshape.decode('2_x}aR_pR_ibE??_ibE~hbE??~hbE(_iqbR_af@_etB??_etB~dtB??~dtB'))
        .to.deep.equal(polygonWithRings);
    });

    it('decodes a multi point', function() {
      expect(polyshape.decode('3_x}aR_pR_ibE_ibE')).to.deep.equal(multiPoint);
    });

    it('decodes a multi line', function() {
      expect(polyshape.decode('1_x}aR_pR_ibE_ibE 1_ldnR_dyK_ibE_ibE')).to.deep.equal(multiLine);
    });

    it('decodes a multi polygon', function() {
      expect(polyshape.decode('2_ldnR_dyK_ibE??_ibE~hbE??~hbE 2_x}aR_pR_ibE??_ibE~hbE??~hbE(_iqbR_af@_etB??_etB~dtB??~dtB')).to.deep.equal(multiPolygon);
    });

    it('decodes a geometry collection', function() {
      expect(polyshape.decode('0_x}aR_pR 1_x}aR_pR_ibE_ibE 2_x}aR_pR_ibE??_ibE~hbE??~hbE')).to.deep.equal(collection);
    });
  });

});