const Hjson = require("hjson");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

module.exports = generateVectors;

function generateVectors() {
  return glob.sync("sources/**/*.*json").forEach(generateVectorFile);
}

function generateVectorFile(source) {
  const f = fs.readFileSync(source, "utf8");
  const data = Hjson.parse(f);
  mkdirp.sync("./dist/files");
  const src = (dest = data.filename);
  try {
    fs.copyFileSync(
      path.join("./data", src),
      path.join("./dist", "files", dest)
    );
  } catch (err) {
    return err;
  }
  if (data.versions === "1 - 2") {
    generateLegacyGeojson(data);
  }
  return;
}

function generateLegacyGeojson(data) {
  mkdirp.sync("./dist/blob");
  const src = data.filename;
  const environment =
    process.env.NODE_ENV === "production" ? "production" : "staging";
  const dest = typeof data.id === "object" ? data.id[environment] : id;
  try {
    fs.copyFileSync(
      path.join("./data", src),
      path.join("./dist", "blob", dest.toString())
    );
  } catch (err) {
    return err;
  }
  return;
}
