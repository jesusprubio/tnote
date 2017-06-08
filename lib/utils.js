/*
  Copyright Jesús Pérez <jesusprubio@gmail.com>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';


const path = require('path');

// Lodash as base.
const utils = require('lodash');
const debug = require('debug');
const promisify = require('es6-promisify');
const pMap = require('p-map');

const pkgName = require('../package.json').name;


function pathToTag(fullPath) {
  const res = path.basename(fullPath, '.js');

  if (!res || res === fullPath) {
    throw new Error('Not valid path');
  } else {
    return res;
  }
}


utils.pathToTag = pathToTag;

utils.dbg = fullPath => debug(`${pkgName}:${pathToTag(fullPath)}`);

utils.promise = { promisify, pMap };


module.exports = utils;
