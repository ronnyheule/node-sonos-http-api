'use strict';

function getSpotifyMetadata(uri, serviceType) {
  return `<DIDL-Lite xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:upnp="urn:schemas-upnp-org:metadata-1-0/upnp/"
        xmlns:r="urn:schemas-rinconnetworks-com:metadata-1-0/" xmlns="urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/">
        <item id="00030020${uri}" restricted="true"><upnp:class>object.item.audioItem.musicTrack</upnp:class>
        <desc id="cdudn" nameSpace="urn:schemas-rinconnetworks-com:metadata-1-0/">SA_RINCON${serviceType}_X_#Svc${serviceType}-0-Token</desc></item></DIDL-Lite>`;
}

function spotify(player, values) {
  const action = values[0];
  const spotifyUri = values[1];
  const encodedSpotifyUri = encodeURIComponent(spotifyUri);
  const sid = player.system.getServiceId('Spotify');

  let uri;

  //check if current uri is either a track or a playlist/album
  if (spotifyUri.startsWith('spotify:track:')) {
    uri = `x-sonos-spotify:${encodedSpotifyUri}?sid=${sid}&flags=32&sn=1`;
  } else {
    uri = `x-rincon-cpcontainer:0006206c${encodedSpotifyUri}`;
  }

  var metadata = getSpotifyMetadata(encodedSpotifyUri, player.system.getServiceType('Spotify'));

  if (action == 'queue') {

// rh: begin    
    //    return player.coordinator.addURIToQueue(uri, metadata);
    
    return player.coordinator.addURIToQueue(uri, metadata)
      .then(() => player.coordinator.play());
// rh: end    
    
  } else if (action == 'now') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    let promise = Promise.resolve();
    if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
      promise = promise.then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`));
    }

    return promise.then(() => {
      return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo)
        .then((addToQueueStatus) => player.coordinator.trackSeek(addToQueueStatus.firsttracknumberenqueued))
        .then(() => player.coordinator.play());
    });

  } else if (action == 'next') {
    var nextTrackNo = player.coordinator.state.trackNo + 1;
    return player.coordinator.addURIToQueue(uri, metadata, true, nextTrackNo);
    
// rh: begin
  } else if (action == 'clearqueueandplaysong') {
    let promise = Promise.resolve();
    if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
      promise = promise.then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`));
    }
    return promise
        .then(() => player.coordinator.clearQueue())
        .then(() => player.coordinator.addURIToQueue(uri, metadata))
        .then(() => player.coordinator.play());

  } else if (action == 'clearqueueandplayalbum') {
    // TODO: Figure out how to determine album for this song
    let promise = Promise.resolve();
    if (player.coordinator.avTransportUri.startsWith('x-rincon-queue') === false) {
      promise = promise.then(() => player.coordinator.setAVTransport(`x-rincon-queue:${player.coordinator.uuid}#0`));
    }
    return promise
        .then(() => player.coordinator.clearQueue())
        .then(() => player.coordinator.addURIToQueue(uri, metadata))
        .then(() => player.coordinator.play());
// rh: end    
  }
}

module.exports = function (api) {
  api.registerAction('spotify', spotify);
}
