---
name: yt-summarizer
description: Summarize a YouTube video from its transcript. Use whenever the user sends a YouTube link or video ID, or asks what a YouTube video says, even if they don't say "summarize".
---

# yt-summarizer

When the user sends a YouTube link (or video ID), summarize the video:

1. Run `node <this skill's directory>/index.js <url>` (add `--lang <code>` for a non-English video). It prints the title, channel, duration, caption language and a transcript in paragraphs marked `[mm:ss]`. It has no dependencies and needs Node 18+.
2. Read the whole transcript, then write the summary in chat:
   - **TL;DR**: 1–2 sentences.
   - **Key points**: bullets, each with the `[mm:ss]` timestamp where it comes up.
   - **Takeaways**: conclusions, recommendations or action items, if the video has any.
   Fit the length to the video. If the user asks for a different format, use theirs.
3. If the captions are auto-generated, quietly correct obvious mis-transcriptions (names, technical terms) in the summary.

If the script fails (no captions, private or age-restricted video), tell the user the error; don't guess at the content.
