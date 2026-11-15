# agent-skills

Personal skills for Claude Code (and other agents the `skills` CLI supports).

| Skill | What it does |
|---|---|
| [yt-summarizer](skills/yt-summarizer/SKILL.md) | Summarizes a YouTube video from its transcript. Needs Node 18+. |

## Install on a computer

```sh
npx skills add kingfishx23/agent-skills
```

Run the same command again to pull the latest version.

## Add a skill

Create `skills/<name>/SKILL.md` (with `name` and `description` frontmatter) plus any scripts it uses, commit and push. Other computers pick it up the next time they run `npx skills add`.
