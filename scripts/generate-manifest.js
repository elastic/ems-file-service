const Hjson = require("hjson");
const glob = require("glob");
const fs = require("fs");
const semver = require("semver");
const _ = require("lodash");

module.exports = generateManifest;

const manifestHostname = process.env.TARGET_HOST || "staging-dot-elastic-layer.appspot.com";

function generateManifest(version) {
  if (!version || !semver.valid(semver.coerce(version))) {
    return new Error("A valid version parameter must be defined");
  }
  const layers = [];
  glob.sync("sources/**/*.*json").forEach(source => {
    const f = fs.readFileSync(source, "utf8");
    const data = Hjson.parse(f);
    const manifestVersion = semver.coerce(version);
    if (semver.satisfies(manifestVersion, data.versions)) {
      switch (semver.major(manifestVersion)) {
        case 1:
          layers.push(manifestLayerV1(data));
          break;
        case 2:
          layers.push(manifestLayerV2(data));
          break;
      }
    }
  });
  const manifest = {
    layers: _.orderBy(layers, ["weight", "name"], ["desc", "asc"]),
  };
  return manifest;
}

function manifestLayerV1(data) {
  const manifestId = data.id;
  const layer = {
    attribution: data.attribution,
    weight: data.weight,
    name: data.humanReadableName,
    url: `https://${manifestHostname}/blob/${manifestId}?elastic_tile_service_tos=agree`,
    format: data.conform.type,
    fields: data.fieldMapping.map(fieldMap => ({
      name: fieldMap.dest,
      description: fieldMap.desc,
    })),
    created_at: data.createdAt,
    tags: [],
    id: manifestId,
  };
  return layer;
}

function manifestLayerV2(data) {
  const layer = manifestLayerV1(data);
  if (layer.format === "topojson") {
    layer.meta = {
      feature_collection_path: "data",
    };
  }
  return layer;
}
