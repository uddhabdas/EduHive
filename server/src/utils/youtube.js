const axios = require('axios');

function getApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('YOUTUBE_API_KEY not set');
  return key;
}

async function fetchPlaylistMeta(playlistId) {
  const key = getApiKey();
  const url = 'https://www.googleapis.com/youtube/v3/playlists';
  const params = { part: 'snippet', id: playlistId, key };
  const { data } = await axios.get(url, { params });
  const item = data.items && data.items[0];
  if (!item) throw new Error('Playlist not found');
  const sn = item.snippet || {};
  return {
    title: sn.title || 'Untitled',
    description: sn.description || '',
    thumbnailUrl:
      (sn.thumbnails && (sn.thumbnails.maxres?.url || sn.thumbnails.high?.url || sn.thumbnails.medium?.url || sn.thumbnails.default?.url)) || '',
  };
}

async function fetchPlaylistItems(playlistId) {
  const key = getApiKey();
  const url = 'https://www.googleapis.com/youtube/v3/playlistItems';
  let nextPageToken = undefined;
  const items = [];
  do {
    const params = {
      part: 'snippet',
      maxResults: 50,
      playlistId,
      key,
      pageToken: nextPageToken,
    };
    const { data } = await axios.get(url, { params });
    (data.items || []).forEach((it) => {
      const sn = it.snippet || {};
      const vid = sn.resourceId?.videoId;
      if (vid) {
        items.push({
          videoId: vid,
          title: sn.title || 'Untitled',
          position: typeof sn.position === 'number' ? sn.position : items.length,
        });
      }
    });
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);
  return items;
}

module.exports = { fetchPlaylistMeta, fetchPlaylistItems };
