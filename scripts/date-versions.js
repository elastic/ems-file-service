/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

const semver = require("semver");
const constants = require("./constants");

module.exports = {
  formatDateToIso,
  checkDateVersion,
  coerceToDateSemver,
  coerceToSemVer,
};

/**
 * Converts a Date instance to the ISO8601
 *
 * @param {Date} date
 * @returns {String}
 */
function formatDateToIso(date) {
  if (!(date instanceof Date)) {
    throw new Error(
      'Invalid "date" argument. You must pass a date instance: ' +
        date.toString()
    );
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
* Checks a given string is the same after formatting to ISO8601

* @param {String} version
* @returns {Boolean}
*/
function checkDateVersion(version) {
  if (version === constants.LATEST_TAG) {
    return true;
  }

  const dateObj = new Date(Date.parse(version));
  return version === formatDateToIso(dateObj);
}

/**
 * @typedef {Object} DateSemver
 * @property {String} date - The Date Version
 * @property {String} semver - The Semantic Version
 */

/**
 * Returns the assigned Semantic Version of the stack
 * for a given date or "latest" tag.
 * @param {String} dateVersion
 * @returns {DateSemver}
 */
function coerceToDateSemver(dateVersion) {
  if (dateVersion == constants.LATEST_TAG) {
    return constants.DATE_VERSIONS.at(-1);
  }
  return constants.DATE_VERSIONS.find((el) => el.date == dateVersion);
}

/**
 * Converts a version string from a SemVer or Date into the
 * equivalent Semantic Version value
 *
 * @param {String} version
 * @returns {String}
 */
function coerceToSemVer(version) {
  const isDateVersion =
    !semver.valid(version) &&
    (version == constants.LATEST_TAG || checkDateVersion(version));

  // Check the version is in the constants or a valid SemVer
  if (!isDateVersion && !semver.valid(semver.coerce(version))) {
    throw new Error("A valid version parameter must be defined " + version);
  }

  return semver.coerce(
    isDateVersion ? coerceToDateSemver(version).semver : version
  );
}
