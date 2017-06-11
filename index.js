/*
  Copyright Jesús Pérez <jesusprubio@fsf.org>

  This code may only be used under the MIT license found at
  https://opensource.org/licenses/MIT.
*/

'use strict';

// const util = require('util');
// const EventEmitter = require('events').EventEmitter;

const cheerio = require('cheerio');
const rp = require('request-promise-native');

const utils = require('./lib/utils');
const version = require('./package.json').version;


const dbg = utils.dbg(__filename);
const uriBase = 'https://twitter.com/';


function getFollowers(username) {
  return new Promise((resolve, reject) => {
    const options = {
      uri: uriBase + username,
      transform: body => cheerio.load(body),
    };

    rp(options)
    .then((ch) => {
      try {
        const followers = parseInt(ch('.ProfileNav-value')[2].attribs['data-count'], 10);
        resolve(followers);
      } catch (err) { reject(err); }
    })
    .catch(err => reject(err));
  });
}


function parseSlide(content) {
  let data = '';
  let notes = '';
  let notesStarted = false;
  const res = {};

  const lines = utils.split(content, '\n');

  utils.each(lines, (line) => {
    if (line && utils.isString(line)) {
      if (line.match(/^Author:/g)) {
        res.author = line.slice(8).trim();
        dbg(`Author found: ${res.author}`);
      }

      if (notesStarted) {
        notes = `${notes}\n${line}`;
      } else if (line.match(/^Note(s)?:/g)) {
        dbg(`Note found: ${line}`);

        notesStarted = true;
        // "join" in case of: "Notes: whatever :otherthing""
        notes = `${notes}${line.split(':').slice(1).join(':').trim()}`;
      } else {
        data = `${data}\n${line}`;
      }
    }
  });

  if (data.length > 0) { res.data = data; }
  if (notes.length > 0) { res.notes = notes; }

  return res;
}


class Tnote {

  // "slides" is a string.
  // constructor(opts = {}) {
  constructor() {
    this.version = version;
    // Presentation position.
    this.index = 0;
  }


  start(slides) {
    dbg('Splitting the slides ..');
    this.slides = slides.split('\n---\n');

    if (!this.slides || !utils.isArray(this.slides) || utils.isEmpty(this.slides)) {
      throw new Error('Can\'t read the slides');
    }

    const cover = parseSlide(this.slides[0]);

    if (cover.author) { this.author = cover.author; }

    return cover;
  }


  metrics(authorPassed) {
    return new Promise((resolve, reject) => {
      dbg('Getting needed info for metrics ...');

      if (authorPassed) { this.author = authorPassed; }

      if (!this.author) {
        reject(new Error('Author not included or correctly parsed'));

        return;
      }

      getFollowers(this.author)
      .then((count) => {
        dbg(`\nfollowers count: ${count}`);
        if (!this.followers) {
          this.followers = count;
          resolve({ followers: count });
          return;
        }

        const rate = Math.round((count - this.followers) * (100 / this.followers));
        dbg(`Rate: ${rate}`);

        resolve({ followers: count, followersInit: this.followers, rate });
      })
      .catch(err => reject(new Error(`Getting the followers (init): ${err.message}`)));
    });
  }


  next() {
    dbg('Asked for next slide');

    if (this.slides[this.index + 1]) {
      this.index += 1;
      return parseSlide(this.slides[this.index]);
    }

    return null;
  }


  prev() {
    dbg('Prev for next slide');

    if (this.index > 0) {
      this.index -= 1;
      return parseSlide(this.slides[this.index]);
    }

    return null;
  }


  reset() {
    dbg('Presentation reset requested');

    this.index = 1;
    return parseSlide(this.slides[0]);
  }
}


// TODO: We will need this for the chat.
// util.inherits(Tnote, EventEmitter);


module.exports = Tnote;
