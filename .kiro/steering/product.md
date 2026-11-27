# Product: Haunted Chronicle

> Note: This file is based on the spec (`.kiro/specs/haunted-chronicle/requirements.md` and `design.md`), not only on the code written so far. It will be refreshed at the end of the project.

## What it is

Haunted Chronicle is a local tool, started with one command in any project, that turns the project into a 3D village in the browser. Every file is a house with a citizen. Every folder is a district. A central castle owns tasks that name no folder or file.

The village shows the project's real state:

- Unticked tasks in `.kiro/specs/*/tasks.md` make a district dark. Tasks that mention no existing path darken the castle.
- Failing Vitest tests make the failing code sick, and sickness spreads to every file that imports a sick file. Sick houses and districts glow red. Dark and sick are separate states.
- Secrets found in code appear as gravestones in the file's yard.
- Fixed problems heal. A district with all tasks ticked, no sick citizens, and no gravestones is freed and gets lanterns.
- New files are births and deleted files are deaths. A deleted file leaves a tombstone for the rest of the session.
- A rule-based Chronicler (templates only, no AI model) writes short gothic entries (30 words or fewer, no emoji) about real events. Each entry has an evidence line naming a real file.

An MCP server lets Kiro ask what is haunting the project (`whats_haunting`, `world_status`, `declare_finished`) and get real file paths and line numbers. A hosted demo replays a recorded session for people who have not installed the tool.

## Who it is for

The intro line shown on the intro screen (requirement 7.9) and in the demo (19.7), word for word:

> For people building with AI agents who lose track of what the agent broke, what's unfinished and what's risky.

## The story: cozy to cursed

- The village starts in the `cozy` phase: daylight, bright colours, happy faces, welcome title "Welcome to <project name>". It conceals all problems and always looks happy.
- The first prompt the user sends to Kiro (a Kiro Prompt Submit hook calls the tool) triggers the JINX sequence once: a flash, the word JINX, and the change to the `cursed` phase with the title "Nevermerge", night lighting, and dark clouds. The Reveal shows the real state all at once, without replaying earlier history.
- The phase changes only on a prompt signal, only once, and resets to `cozy` when the tool restarts.
- The Cozy and Cursed toggle is a presentation choice (View_Mode). It never changes the phase or the world state. Choosing Cursed before the curse previews the real state.
- The story ends only when the user declares it finished (see below).
- Reduced motion replaces flashes and fast motion with fades and cuts.

## Rule: only the user declares the project finished

- The "It is finished" button is enabled only while every task is ticked, no citizen is sick, no secret finding exists, and the phase is `cursed`.
- Only the user can set the finished flag, by clicking that button on the village page. The request needs a per-server token and a same-origin check.
- The MCP `declare_finished` tool never sets the flag. It returns a message that only the user can declare it finished, or that the user already did.
- If an unticked task, sick citizen, or secret appears after the declaration, the flag clears.
- No agent, snapshot, test result, or prompt signal can claim victory.

## Rule: the world never lies

- The village renders only what the world state contains, and the world state contains only what exists in the project snapshot: citizens for real files, districts for real folders, real tasks, real failures, real secrets.
- The one exception is a tombstone or "citizen died" entry, whose path really existed earlier in the same session. A tombstone is a marker, not a citizen.
- Concealment in the Cozy view is presentation only. The world engine ignores View_Mode, and the MCP server and the Chronicle data always use the real state, never filtered by phase or view.
- Secret values are never stored. Only the pattern name, file, and line are kept.
- If the tool cannot reach the village server, MCP tools report an error instead of answering from cached or locally computed data.

## Out of scope

Picture-in-picture, sound, AI-written Chronicle lines, accounts, any cloud backend. The tool runs locally, binds to loopback only, and makes no network calls to remote services. Only Vitest is supported for automatic test runs.
