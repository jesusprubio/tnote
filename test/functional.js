/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const test = require('tap').test; // eslint-disable-line import/no-extraneous-dependencies

const Tnote = require('..');
const pkgInfo = require('../package');

const show = new Tnote();

test('should return the package version', (assert) => {
  assert.plan(1);

  assert.deepEqual(show.version, pkgInfo.version);
});
