#!/usr/bin/env node

/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const fs = require('fs');
const path = require('path');

const tnote = require('..');


/* eslint-disable no-console */
console.log('Version:');
console.log(tnote.version);
/* eslint-enable no-console */

tnote.start(fs.readFileSync(path.resolve(__dirname, 'demo.md'), { encoding: 'utf8' }));
