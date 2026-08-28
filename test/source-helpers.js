/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import fs from "node:fs";

import Ajv from "ajv";
import addFormats from "ajv-formats";

import { get } from "lodash-es";
import { test as tap } from "tap";

import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import Orientation from "jsts/org/locationtech/jts/algorithm/Orientation.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";
import IsSimpleOp from "jsts/org/locationtech/jts/operation/IsSimpleOp.js";

import constants from "../scripts/constants.js";

const schema = JSON.parse(fs.readFileSync("schema/source_schema.json", "utf8"));

const ajv = new Ajv();
addFormats(ajv);
export const validate = ajv.compile(schema);

const geoFileCache = new Map();

export function testSourceSchema(source) {
  const name = source.name;
  tap(`${name} schema must be valid`, (t) => {
    try {
      const valid = validate(source);
      t.ok(valid, `${name}: ${JSON.stringify(validate.errors)}`);
    } catch (err) {
      t.fail(`could not parse ${name} as JSON ${err}`);
    }
    t.end();
  });
}

export function testSourceFiles(source) {
  tap(`${source.name} formats (${source.versions})`, (t) => {
    for (const format of source.emsFormats) {
      t.ok(fs.existsSync(`./data/${format.file}`), `${source.name} filename fields must have a matching file in the data directory`);
      if (format.type === 'geojson') {
        validateGeoJSON(format.file, source.fieldMapping, t);
      } else if (format.type === 'topojson') {
        const topojson = fs.readFileSync(`./data/${format.file}`, 'utf8');
        validateObjectsMember(topojson, format, source.fieldMapping, t);
      }
    }
    t.end();
  });
}

function validateObjectsMember(topojson, format, fieldMap, t) {
  const fc = JSON.parse(topojson);
  const fcPath = get(format, "meta.feature_collection_path", "data");
  const fieldsNames = fieldMap.map(f => f.name).sort();
  t.ok(Object.prototype.hasOwnProperty.call(fc.objects, fcPath));
  t.type(fc.objects[fcPath], 'object');

  t.ok(Object.prototype.hasOwnProperty.call(fc.objects[fcPath], 'geometries'));
  const geoms = fc.objects[fcPath].geometries;
  t.ok(geoms.every(
    geom => Object.keys(geom.properties).every(
      p => fieldsNames.indexOf(p) > -1)
  ), 'All feature properties are in the field mapping');

  t.ok(fieldMap.filter(f => f.regex).every(f => {
    const re = new RegExp(f.regex);
    return fc.objects[fcPath].geometries.every(feat => {
      return re.test(feat.properties[f.name]);
    });
  }), 'All fields with regular expressions match feature properties');

  if (process.env.EMS_STRICT_TEST) {
    t.ok(geoms.every(
      geom => {
        const keys = Object.keys(geom.properties).sort();
        return keys.every((p, i) => p === fieldsNames[i]);
      }
    ), 'Feature properties and field mapping are strictly aligned');
  }
}

function validateGeoJSON(fileName, fieldMap, t) {
  let cached = geoFileCache.get(fileName);
  if (!cached) {
    const reader = new GeoJSONReader();
    const fc = reader.read(fs.readFileSync(`./data/${fileName}`, 'utf8'));
    cached = {
      fc,
      isSimple: fc.features.every((feat) => new IsSimpleOp(feat.geometry).isSimple()),
      isValid: fc.features.every((feat) => new IsValidOp(feat.geometry).isValid()),
    };
    geoFileCache.set(fileName, cached);
  }
  const { fc, isSimple, isValid } = cached;
  const fieldsNames = fieldMap.map((f) => f.name).sort();
  t.ok(isSimple, `All geometries from ${fileName} must be simple`);
  t.ok(isValid, `All geometries from ${fileName} must be valid`);

  t.ok(
    fc.features.every(
      feat => Object.keys(feat.properties).every(
        p => fieldsNames.indexOf(p) > -1)
    ), `All feature properties from ${fileName} are in the field mapping`);

  t.ok(fieldMap.filter(f => f.regex).every(f => {
    const re = new RegExp(f.regex);
    return fc.features.every(feat => {
      return re.test(feat.properties[f.name]);
    });
  }), `All fields with regular expressions from ${fileName} match feature properties`);

  if (process.env.EMS_STRICT_TEST) {
    t.ok(
      fc.features.every(
        feat => {
          const keys = Object.keys(feat.properties).sort();
          return keys.every((p, i) => p === fieldsNames[i]);
        }
      ), `Feature properties and field mapping from ${fileName} are strictly aligned`);

    t.ok(fieldMap.filter(f => f.type === 'id').every(f => {
      const values = new Set();
      return fc.features.every(feat => {
        const value = feat.properties[f.name];
        if (!values.has(value)) {
          values.add(value);
          return true;
        }
        return false;
      });
    }), `All id fields from ${fileName} have distinct values`);

    if (constants.GEOJSON_RFC7946 !== undefined) {
      const enforceRfc = constants.GEOJSON_RFC7946 === true;
      const getCoords = f => {
        const ring = f.geometry.getGeometryN(0).getExteriorRing();
        return ring._points._coordinates;
      };

      t.ok(
        fc.features.every(
          feat => Orientation.isCCW(getCoords(feat)) === enforceRfc
        ), `Features from ${fileName} ${enforceRfc ? 'enforce' : 'neglect'} RFC7946`);
    }
  }
}
