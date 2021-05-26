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

const dataDir = 'test/fixtures/data';

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
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
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
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
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
            label: {
              de: 'Wikidata-Kennung',
              en: 'Wikidata identifier',
              zh: '维基数据标识符',
            },
          },
          {
            type: 'property',
            id: 'label_en',
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

tap('>=7.6 tests', t => {
  ['7.6', '7.7', '7.8', '7.9', '7.10'].forEach(version => {
    const catalogue = generateCatalogueManifest({
      version: `v${version}`,
      tileHostname: 'tiles.maps.elstc.co',
      vectorHostname: 'vector.maps.elastic.co',
    });
    t.false(catalogue, '7.6 catalogue should not exist');

    // It is not necessary to test different hostnames, since URLs in manifest are relative
    const vector = generateVectorManifest(sources, {
      version: `v${version}`,
      hostname: 'vector.maps.elastic.co',
      fieldInfo: fieldInfo,
      dataDir,
    });
    t.deepEquals(vector, getExpectedVector(version), 'v7.6 vector manifest');
  });
  t.end();
});
