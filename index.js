var simplify = require('simplify-js');

/**
 * Takes a {@link LineString} or {@link Polygon} and returns a simplified version. Internally uses [simplify-js](http://mourner.github.io/simplify-js/) to perform simplification.
 *
 * @module turf/simplify
 * @category transformation
 * @param {Feature<(LineString|Polygon|MultiLineString|MultiPolygon)>|<GeometryCollection>} feature feature to be simplified
 * @param {Number} tolerance simplification tolerance
 * @param {Boolean} highQuality whether or not to spend more time to create
 * a higher-quality simplification with a different algorithm
 * @return {Feature<(LineString|Polygon)>} a simplified feature
 * @example
  * var feature = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Polygon",
 *     "coordinates": [[
 *       [-70.603637, -33.399918],
 *       [-70.614624, -33.395332],
 *       [-70.639343, -33.392466],
 *       [-70.659942, -33.394759],
 *       [-70.683975, -33.404504],
 *       [-70.697021, -33.419406],
 *       [-70.701141, -33.434306],
 *       [-70.700454, -33.446339],
 *       [-70.694274, -33.458369],
 *       [-70.682601, -33.465816],
 *       [-70.668869, -33.472117],
 *       [-70.646209, -33.473835],
 *       [-70.624923, -33.472117],
 *       [-70.609817, -33.468107],
 *       [-70.595397, -33.458369],
 *       [-70.587158, -33.442901],
 *       [-70.587158, -33.426283],
 *       [-70.590591, -33.414248],
 *       [-70.594711, -33.406224],
 *       [-70.603637, -33.399918]
 *     ]]
 *   }
 * };

 * var tolerance = 0.01;
 *
 * var simplified = turf.simplify(
 *  feature, tolerance, false);
 *
 * //=feature
 *
 * //=simplified
 */
module.exports = function(feature, tolerance, highQuality) {
  var simplified;
  if (feature.type === 'Feature') {
    simplified = simplifyHelper(feature, tolerance, highQuality);

    return simpleFeature(simplified, feature.properties);
  } else if (feature.type === 'FeatureCollection') {
    feature.features = feature.features.map(function (f) {
      simplified = simplifyHelper(f);

      return simpleFeature(simplified, f.properties);
    });

    return feature;
  } else if (feature.type === 'GeometryCollection') {
    feature.geometries.map(function (g) {
      simplified = simplifyHelper({
        type: 'Feature',
        geometry: g
      });

      return simplified; // GeometryCollection shouldn't have properties
    });
  } else {
    return feature;
  }
};

function simplifyHelper (feature, tolerance, highQuality) {
  if(feature.geometry.type === 'LineString') {
    var line = {
      type: 'LineString',
      coordinates: simplifyLine(feature.geometry.coordinates, tolerance, highQuality)
    };

    return line;
  } else if(feature.geometry.type === 'MultiLineString') {
    var multiline = {
      type: 'MultiLineString',
      coordinates: []
    };
    // simplify each of the lines in the MultiLineString
    feature.geometry.coordinates.forEach(function(lines) {
      multiline.coordinates.push(simplifyLine(lines, tolerance, highQuality));
    });

    return multiline;
  } else if(feature.geometry.type === 'Polygon') {
    var poly = {
      type: 'Polygon',
      coordinates: simplifyPolygon(feature.geometry.coordinates)
    };

    return poly;
  } else if(feature.geometry.type === 'MultiPolygon') {
    var multipoly = {
      type: 'MultiPolygon',
      coordinates: []
    };
    // simplify each set of rings in the MultiPolygon
    feature.geometry.coordinates.forEach(function(rings) {
      multipoly.coordinates.push(simplifyPolygon(rings, tolerance, highQuality));
    });

    return multipoly;
  } else {
    // unsupported geometry type supplied
    return feature;
  }
}

function simpleFeature (geom, properties) {
  return {
    type: 'Feature',
    geometry: geom,
    properties: properties
  };
}

function simplifyLine (coordinates, tolerance, highQuality) {
  var simplifiedCoordinates = [];
  var pts = coordinates.map(function(coord) {
    return {x: coord[0], y: coord[1]};
  });
  simplifiedCoordinates = simplify(pts, tolerance, highQuality).map(function(coords) {
    return [coords.x, coords.y];
  });

  return simplifiedCoordinates;
}

function simplifyPolygon (coordinates, tolerance, highQuality) {
  var simplifiedCoordinates = [];
  coordinates.forEach(function(ring) {
    var pts = ring.map(function(coord) {
      return {x: coord[0], y: coord[1]};
    });
    var simpleRing = simplify(pts, tolerance, highQuality).map(function(coords) {
      return [coords.x, coords.y];
    });
    for (var i = 0; i < 4; i++) {
      if (!simpleRing[i]) simpleRing.push(simpleRing[0]);
    }
    if (
      (simpleRing[simpleRing.length-1][0] !== simpleRing[0][0]) ||
      (simpleRing[simpleRing.length-1][1] !== simpleRing[0][1])) {
      simpleRing.push(simpleRing[0]);
    }
    simplifiedCoordinates.push(simpleRing);
  });
  return simplifiedCoordinates;
}
