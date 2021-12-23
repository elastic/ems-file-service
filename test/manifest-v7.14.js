/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const tap = require('tap').test;
const {
  generateCatalogueManifest,
  generateVectorManifest,
} = require('../scripts/generate-manifest');

const sources = require('./fixtures/valid-sources/sources.json');
const fieldInfo = require('./fixtures/fieldInfo.json');

function getExpectedVector(version) {
  return {
    version: version,
    layers: [
      {
        layer_id: 'gondor',
        created_at: '1200-02-28T17:13:39.288909',
        attribution: [
          {
            label: {
              en: 'The Silmarillion',
              fr: 'Le Silmarillion',
            },
            url: {
              en: 'https://en.wikipedia.org/wiki/The_Silmarillion',
              fr: 'https://fr.wikipedia.org/wiki/Le_Silmarillion',
            },
          },
          {
            label: {
              en: 'Elastic Maps Service',
            },
            url: {
              en: 'https://www.elastic.co/elastic-maps-service',
            },
          },
        ],
        formats: [
          {
            type: 'geojson',
            url: '/files/gondor_v3.geo.json',
            legacy_default: true,
          },
        ],
        fields: [
          {
            type: 'id',
            id: 'wikidata',
            regex: '^Q[1-9]\\d*',
            values: [
              "Q2261070",
              "Q2533118",
              "Q2271279",
              "Q2267079",
            ],
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
            alias: [ "(geo\\.){0,}region_name" ],
            label: {
              de: 'name (en)',
              en: 'name (en)',
              zh: '名称 (en)',
            },
          },
        ],
        legacy_ids: ['Gondor', 'Gondor Kingdoms'],
        layer_name: {
          en: 'Gondor Kingdoms',
          de: 'Gondor',
          zh: '魔多',
        },
      },
      {
        layer_id: 'rohan',
        created_at: '1200-02-28T17:13:39.456456',
        attribution: [
          {
            label: {
              en: 'The Silmarillion',
            },
          },
        ],
        formats: [
          {
            type: 'geojson',
            url: '/files/rohan_v2.geo.json',
            legacy_default: false,
          },
          {
            type: 'topojson',
            url: '/files/rohan_v2.topo.json',
            legacy_default: true,
            meta: {
              feature_collection_path: 'regions',
            },
          },
        ],
        fields: [
          {
            type: 'id',
            id: 'wikidata',
            regex: '^Q[1-9]\\d*',
            values: [
              "Q81908708",
              "Q81908913",
              "Q16585595",
              "Q81908582",
              "Q81907591",
              "Q81908441",
            ],
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
            alias: [ "(geo\\.){0,}region_name" ],
            label: {
              de: 'name (en)',
              en: 'name (en)',
              zh: '名称 (en)',
            },
          },
        ],
        legacy_ids: ['Rohan', 'Rohan Kingdoms'],
        layer_name: {
          en: 'Rohan Kingdoms',
          de: 'Rohan',
          zh: '洛汗',
        },
      },
      {
        layer_id: 'shire',
        created_at: '1532-12-25T18:45:32.389979',
        attribution: [
          {
            label: {
              en: 'The Silmarillion',
            },
          },
        ],
        formats: [
          {
            type: 'geojson',
            url: `/files/shire_v2.geo.json`,
            legacy_default: true,
          },
          {
            type: 'topojson',
            url: '/files/shire_v2.topo.json',
            legacy_default: false,
          },
        ],
        fields: [
          {
            type: 'id',
            id: 'wikidata',
            regex: '^Q[1-9]\\d*',
            values: [
              "Q82024809",
              "Q82025054",
              "Q82025065",
              "Q82025079",
            ],
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
            alias: [ "(geo\\.){0,}region_name" ],
            label: {
              de: 'name (en)',
              en: 'name (en)',
              zh: '名称 (en)',
            },
          },
          {
            type: 'property',
            id: 'label_ws',
            label: {
              de: 'name (ws)',
              en: 'name (ws)',
              zh: '名称 (ws)',
            },
          },
        ],
        legacy_ids: ['Shire', 'Shire regions', 'Shire Regions'],
        layer_name: {
          en: 'Shire regions',
          de: 'Auenland',
          zh: '夏爾',
        },
      },
    ],
  };
};

tap('>=7.14 tests', t => {
  ['7.14', '7.15', '7.16', '7.17'].forEach(version => {
    const catalogue = generateCatalogueManifest({
      version: `v${version}`,
      tileHostname: 'tiles.maps.elstc.co',
      vectorHostname: 'vector.maps.elastic.co',
    });
    t.notOk(catalogue, `v${version} catalogue should not exist`);

    // It is not necessary to test different hostnames, since URLs in manifest are relative
    const vector = generateVectorManifest(sources, {
      version: `v${version}`,
      hostname: 'vector.maps.elastic.co',
      fieldInfo: fieldInfo,
      dataDir: 'test/fixtures/data',
    });
    t.same(vector, getExpectedVector(version), `v${version} vector manifest`);
  });
  t.end();
});

tap('Check that unavailable manifest version fails', function(t) {
  t.throws(
    function() {
      generateVectorManifest(sources, {
        version: 'v9999.0',
        hostname: 'vector.maps.elastic.co',
        fieldInfo: fieldInfo,
      });
    },
    new Error('Unable to get a manifest for version 9999.0'),
    'throws assert error'
  );
  t.end();
});
