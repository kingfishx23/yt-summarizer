# yt-summarizer

A Claude Code skill (also usable by other agents the `skills` CLI supports) that summarizes a YouTube video from its transcript: a TL;DR, timestamped key points and takeaways. Paste a YouTube link and the agent does the rest.

The transcript fetcher, `skills/yt-summarizer/index.js`, has no dependencies and needs Node 18+.

## Install

```sh
npx skills add kingfishx23/yt-summarizer
```

Run the same command again to pull the latest version.

## Use the script on its own

```sh
node skills/yt-summarizer/index.js <youtube-url-or-id> [--lang <code>]
```

It prints the title, channel, duration, caption language and the transcript in paragraphs marked `[mm:ss]`.
