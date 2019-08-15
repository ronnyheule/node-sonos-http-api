'use strict';
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const tryDownloadTTS = require('../helpers/try-download-tts');
const singlePlayerAnnouncement = require('../helpers/single-player-announcement');
const settings = require('../../settings');

let port;
let system;

function say(player, values) {

// rh: begin  
  // CPC: Previously default volume was set to either `settings.announceVolume` or 40 as a fallback.
  // Instead we should just use the current volume of the device if one wasn't explicitly provided.
  // let defaultVolume = settings.announceVolume || 40;
  let defaultVolume = player.state.volume;
// rh: end
  
  let text;
  try {
    text = decodeURIComponent(values[0]);
  } catch (err) {
    if (err instanceof URIError) {
      err.message = `The encoded phrase ${values[0]} could not be URI decoded. Make sure your url encoded values (%xx) are within valid ranges. xx should be hexadecimal representations`;
    }
    return Promise.reject(err);
  }
  let announceVolume;
  let language;

  if (/^\d+$/i.test(values[1])) {
    // first parameter is volume
    announceVolume = values[1];
    // language = 'en-gb';
  } else {
    language = values[1];

// rh: begin    
//    announceVolume = values[2] || settings.announceVolume || 40;
    announceVolume = values[2] || defaultVolume;
// rh: end
  }

  return tryDownloadTTS(text, language)
    .then((result) => {
      return singlePlayerAnnouncement(player, `http://${system.localEndpoint}:${port}${result.uri}`, announceVolume, result.duration);
    });
}

// rh: begin    
function saysong(player, values, current) {
  // CPC: Previously default volume was set to either `settings.announceVolume` or 40 as a fallback.
  // Instead we should just use the current volume of the device if one wasn't explicitly provided.
  // let defaultVolume = settings.announceVolume || 40;
  let defaultVolume = player.state.volume;

  let track = current ? player.state.currentTrack : player.state.nextTrack;
  let song = track.title;
  let artist = track.artist;
  let text;
  if (song && artist) {
    text = current ?
      `You're listening to... ${song}... by ${artist}` :
      `Coming up next... ${song}... by ${artist}`;
  } else {
    text = `There are no songs left to play`;
  }
  let announceVolume;
  let language;

  if (/^\d+$/i.test(values[0])) {
    // first parameter is volume
    announceVolume = values[0];
    // language = 'en-gb';
  } else {
    language = values[0];
    announceVolume = values[1] || defaultVolume;
  }

  return tryDownloadTTS(text, language)
    .then((result) => {
      return singlePlayerAnnouncement(player, `http://${system.localEndpoint}:${port}${result.uri}`, announceVolume, result.duration);
    });
}

function saycurrent(player, values) {
  return saysong(player, values, true);
}

function saynext(player, values) {
  return saysong(player, values, false);
}
// rh: end


// rh: begin    
module.exports = function (api) {
  port = api.getPort();
  api.registerAction('say', say);
  
  api.registerAction('saysong', saycurrent);
  api.registerAction('saynext', saynext);  
// rh: end
  
  system = api.discovery;
}
