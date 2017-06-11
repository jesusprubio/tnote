#!/usr/bin/env node

/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const fs = require('fs');
const path = require('path');

const Tnote = require('..');

const show = new Tnote();

/* eslint-disable no-console */
console.log('Version:');
console.log(show.version);

const cover = show.start(fs.readFileSync(path.resolve(__dirname, 'demo.md'), { encoding: 'utf8' }));

console.log('\nCover:');
console.log(cover);

console.log('\nMetrics:');
show.metrics()
.then((metrics) => {
  console.log(metrics);

  const next = show.next();
  if (next) {
    console.log('\nNext:');
    console.log(next);
  } else {
    console.log('Presentation ended');
  }

  const prev = show.prev();
  console.log('\nPrev:');
  console.log(prev);

  console.log('\nMetrics (end):');
  show.metrics()
  .then(metricsEnd => console.log(metricsEnd))
  .catch(err => console.log(err));
})
.catch(err => console.log(err));
/* eslint-enable no-console */
