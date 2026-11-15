// Usage: node index.js <youtube-url-or-id> [--lang <code>]
// Prints video info and a timestamped transcript to stdout.

const PLAYER_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
const CLIENT = { clientName: 'ANDROID', clientVersion: '20.10.38' };
const PARAGRAPH_MS = 30_000;

function parseVideoId(input) {
  if (/^[\w-]{11}$/.test(input)) return input;
  let url;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.hostname === 'youtu.be') return url.pathname.slice(1, 12) || null;
  const v = url.searchParams.get('v');
  if (v) return v;
  const m = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/);
  return m ? m[1] : null;
}

function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${m}:${s}` : `${m}:${s}`;
}

// Prefer a manual track in the requested language, then auto-generated, then English, then anything.
function pickTrack(tracks, lang) {
  const inLang = (code) => tracks.filter((t) => t.languageCode === code || t.languageCode.startsWith(code + '-'));
  for (const code of [lang, 'en']) {
    const matches = inLang(code);
    const manual = matches.find((t) => t.kind !== 'asr');
    if (manual || matches[0]) return manual || matches[0];
  }
  return tracks.find((t) => t.kind !== 'asr') || tracks[0];
}

async function getTranscript(videoId, lang) {
  const res = await fetch(PLAYER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: { client: CLIENT }, videoId }),
  });
  if (!res.ok) throw new Error(`Player request failed: HTTP ${res.status}`);
  const player = await res.json();

  const status = player.playabilityStatus;
  if (status?.status !== 'OK') throw new Error(`Video unavailable: ${status?.reason || status?.status || 'unknown'}`);

  const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!tracks.length) throw new Error('This video has no captions.');
  const track = pickTrack(tracks, lang);

  const capRes = await fetch(track.baseUrl);
  if (!capRes.ok) throw new Error(`Caption request failed: HTTP ${capRes.status}`);
  const xml = await capRes.text();

  // Merge caption fragments into paragraphs of roughly PARAGRAPH_MS each.
  const paragraphs = [];
  for (const [, t, body] of xml.matchAll(/<p t="(\d+)"[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = decodeEntities(body.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const start = Number(t);
    const last = paragraphs.at(-1);
    if (last && start - last.start < PARAGRAPH_MS) last.text += ' ' + text;
    else paragraphs.push({ start, text });
  }
  if (!paragraphs.length) throw new Error('Caption track was empty.');
  const lines = paragraphs.map((p) => `[${formatTime(p.start)}] ${p.text}`);

  const d = player.videoDetails ?? {};
  return {
    title: d.title,
    channel: d.author,
    duration: formatTime(Number(d.lengthSeconds || 0) * 1000),
    language: `${track.languageCode}${track.kind === 'asr' ? ' (auto-generated)' : ''}`,
    lines,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const langIdx = args.indexOf('--lang');
  const lang = langIdx >= 0 ? args.splice(langIdx, 2)[1] : 'en';
  const videoId = args[0] && parseVideoId(args[0]);
  if (!videoId) {
    console.error('Usage: node index.js <youtube-url-or-id> [--lang <code>]');
    process.exit(1);
  }

  const t = await getTranscript(videoId, lang);
  console.log(`Title: ${t.title}\nChannel: ${t.channel}\nDuration: ${t.duration}\nCaptions: ${t.language}\nURL: https://www.youtube.com/watch?v=${videoId}\n`);
  console.log(t.lines.join('\n'));
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
