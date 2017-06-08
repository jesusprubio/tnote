/*
  Copyright Jesús Pérez <jesusprubio@gmail.com>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

const clc = require('cli-color');
const prettyjson = require('prettyjson');
const emoji = require('node-emoji');


/* eslint-disable no-console */
module.exports.title = str => console.log(clc.bold.xterm(202)(str));

module.exports.regular = str => console.log(str);

module.exports.bold = str => console.log(clc.bold(str));

module.exports.info = str => console.log(clc.xterm(55)(str));

module.exports.json = json => console.log(prettyjson.render(json));

module.exports.error = (str, err) => {
  console.log(`${emoji.get('poop')} ${clc.red(str)}`);
  if (err && err.stack) { console.log(clc.red(err.stack)); }
};

module.exports.time = label => console.time(clc.xterm(63)(label));

module.exports.timeEnd = label => console.timeEnd(clc.xterm(63)(label));
/* eslint-enable no-console */

module.exports.emoji = label => emoji.get(label);

module.exports.moveUp = () => {
  process.stdout.write(clc.move.up(1));
  process.stdout.write(clc.erase.line);
};

module.exports.clear = () => process.stdout.write(clc.reset);
