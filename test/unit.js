/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const test = require('tap').test; // eslint-disable-line import/no-extraneous-dependencies

const method = require('../lib/utils').pathToTag;

// We can use this function here to get the name of this file
// because we're testing it.
test('should work with a valid file name', (assert) => {
  assert.plan(1);
  assert.equal('index', method('./a/b/c/index.js'));
});


test('should fail with an invalid file name', {}, (assert) => {
  const expectedErr = new RegExp('Not valid path');

  assert.plan(1);
  assert.throws(() => { method('a'); }, expectedErr);
});

// TODO: Add tests.
