# Requirements Document

## Introduction

Haunted Chronicle is a local tool started with one command in any project. It turns the project into a living 3D village in the browser. Every file is a house with a citizen, and every folder is a district. A spec-driven curse (tasks in `.kiro/specs/*/tasks.md`), failing tests, and secrets in code change the village. Unfinished work makes a district dark. Sickness makes houses and districts glow red. The two are separate states. While the Phase is `cozy`, the Village conceals all of this and always looks happy; the real state is revealed all at once when the curse begins. When the project uses Vitest, the Tool runs the tests by itself after file changes. A rule-based Chronicler writes short gothic entries about real events, including births and deaths of files. An MCP server lets Kiro ask what is haunting the project and get real file paths and lines, and it starts the village when the village is not running. A hosted demo replays a recorded session for judges.

Scope is a solo hackathon build (Kiroween 2026). Requirements are ordered so the main loop works early: Scanner, then Village, then Sickness and Healing, then Chronicle and MCP, then Hosted Demo. Requirements 22 to 24 extend the earlier requirements with automatic test runs, single-village discovery, and births, deaths and tombstones.

Concealment applies to presentation only. The World_State, the MCP tools, and the Chronicle data always use the real state.

Out of scope: picture-in-picture, sound, AI-written Chronicle lines, accounts, any cloud backend.

Assumptions: the Test_Runner only supports Vitest. Tombstones live only in memory for one Tool session. In the Cozy_View the stats card shows only the Project name, File_Node count, and District count. Tombstones, Lanterns, and the Chronicle panel are hidden in the Cozy_View. The Chronicle panel lists only entries that occur at or after the JINX_Sequence; entries generated earlier are stored but not shown. Choosing the Cursed View_Mode before the curse previews the real state without changing the Phase.

## Glossary

- **Tool**: The local Node process started by one command. It contains the Scanner, World_Engine, Server, MCP_Server, Test_Runner, and Test_Scheduler.
- **Scanner**: The Tool component that watches project files and produces the project snapshot.
- **Snapshot**: The data describing files, folders, import edges, tasks, test results (including failure stack frames), and secret findings at one moment.
- **Project**: The directory in which the Tool is started.
- **File_Node**: One non-ignored file in the Project.
- **Import_Graph**: A directed graph where an edge A to B means File_Node A imports File_Node B.
- **World_Engine**: The pure component that turns a Snapshot and the session's Tombstone set into a World_State.
- **World_State**: The derived state of the village: citizens, districts, sickness, gravestones, tombstones, lanterns, phase, and finished flag.
- **Citizen**: The resident of one house, representing one File_Node.
- **Citizen_Seed**: A 32-bit hash of the File_Node's project-relative path.
- **District**: A group of houses representing one folder.
- **Castle**: The central building that owns tasks mentioning no folder or file.
- **Village**: The 3D browser scene rendered from World_State.
- **Phase**: One of `cozy` (happy), `cursed`. The Phase is part of World_State and changes only by a Prompt_Signal.
- **View_Mode**: The view the user chose with the Cozy and Cursed toggle, either Cozy or Cursed. It is a presentation setting and is not part of World_State. It equals the Phase on page load and is set to Cursed when the JINX_Sequence starts.
- **Cozy_View**: The visual model the Village derives from a World_State when the View_Mode is Cozy. It shows houses, Districts, happy Citizen faces, and daylight, and hides sickness, Gravestones, Dark District styling, red glow, dark Castle eyes, Tombstones, Lanterns, and the Chronicle panel.
- **Cursed_View**: The visual model the Village derives from a World_State when the View_Mode is Cursed. It shows the full World_State.
- **Reveal**: The change from the Cozy_View to the Cursed_View at the JINX_Sequence, showing the World_State at that moment.
- **Task**: A checkbox line in a `.kiro/specs/*/tasks.md` file.
- **Task_Owner**: The District or Castle a Task belongs to.
- **Test_File**: A File_Node named as the file of a failing test in the test report.
- **Stack_Frame**: One entry of a failure's stack trace, with a file path and a line number.
- **Sickness_Source**: A File_Node chosen as the origin of sickness for one failing test. It is the first Stack_Frame in the failure that lies inside the Project, outside `node_modules`, is not the Test_File, and names a File_Node in the Snapshot. If no such Stack_Frame exists, the Sickness_Sources of that failing test are the File_Nodes the Test_File imports directly (one hop, from the Test_File's own Import_Graph edges).
- **Sick**: The state of a Citizen whose file is a Sickness_Source, is a Test_File of a failing test, or imports a Sick file directly or transitively.
- **Sick District**: A District containing at least one Sick Citizen. The Village renders it glowing red.
- **Dark District**: A District with at least one unticked Task assigned. The Village renders it dark.
- **Gravestone**: A marker in a house's yard showing a secret was found in that file.
- **Tombstone**: A small marker the Village shows in the Cursed_View at the former tile of a deleted File_Node, for the rest of the Tool session. A Tombstone records the deleted path and tile. A Tombstone is not a Citizen and is not persisted across Tool restarts.
- **Freed District**: A District with all its Tasks ticked, no Sick Citizens, and no Gravestones.
- **Lantern**: A light placed on a Freed District.
- **Finished**: The World_State flag set only by the user's explicit declaration, and valid only while all Tasks are ticked, no Citizen is Sick, and no secret finding exists.
- **Chronicler**: The dark figure on a throne above the Castle who narrates events.
- **Chronicle**: The ordered list of Chronicle_Entries shown in the notebook panel.
- **Chronicle_Entry**: A text of at most 30 words plus one Evidence_Line.
- **Evidence_Line**: A monospace line under an entry naming a real file path, with a line number or detail when available.
- **Event**: A change between two World_States, such as a citizen becoming Sick, healed, born, or dead.
- **Hook**: A Kiro Prompt Submit hook that runs a shell command.
- **Prompt_Signal**: The message the Hook sends to the Tool when the user submits a prompt.
- **JINX_Sequence**: The flash, the word JINX, and the change to cursed Phase and the title Nevermerge.
- **MCP_Server**: The Model Context Protocol server inside the Tool, exposing tools and a prompt. It communicates over stdout, so it logs only to stderr.
- **Server_Info_File**: The file `.haunted/server.json` in the Project, holding the port and process id of the running village server.
- **Test_Runner**: The Tool component that runs the Vitest tests of the Project and writes `.haunted/test-results.json`.
- **Test_Scheduler**: The pure component that decides when the Test_Runner starts a run, with a 2-second debounce and no overlapping runs.
- **Recording**: A recorded sequence of timestamped Snapshots and signals from a real session.
- **Demo**: The hosted static build that replays a Recording.
- **Director_Mode**: A mode that plays planned camera shots.
- **Reduced_Motion**: A user setting that turns off flashing and fast motion.

## Requirements

### Requirement 1: Start the Tool with one command

**User Story:** As a developer, I want to start the tool with one command in any project, so that I can see my project as a village without setup.

#### Acceptance Criteria

1. WHEN the user runs the start command in a Project directory and no live village server exists for the Project, THE Tool SHALL start a local web server and print its URL.
2. WHEN the start command completes startup, THE Tool SHALL serve the Village page at the printed URL.
3. THE Tool SHALL bind the web server to the loopback address only.
4. IF the default port is in use, THEN THE Tool SHALL select the next free port and print the selected URL.
5. THE Tool SHALL run without any network access to remote services.
6. WHEN the user runs the start command in a Project directory and a live village server exists for the Project, THE Tool SHALL print the URL of that server and SHALL NOT start a second server (see Requirement 23).

### Requirement 2: Scan project files

**User Story:** As a developer, I want every file in my project discovered, so that each file becomes a citizen.

#### Acceptance Criteria

1. WHEN the Tool starts, THE Scanner SHALL produce a Snapshot listing every File_Node with its project-relative path.
2. THE Scanner SHALL exclude paths matched by the Project's `.gitignore`, the `.git` directory, `node_modules`, and the Tool's own `.haunted` directory.
3. WHEN a file is created, changed, or deleted in the Project, THE Scanner SHALL publish an updated Snapshot within 1 second.
4. THE Scanner SHALL group File_Nodes into folders by their parent directory path.
5. IF a Project contains more than 300 File_Nodes, THEN THE Scanner SHALL include the first 300 in path-sorted order and report the count of omitted files in the Snapshot.
6. THE Scanner SHALL produce identical Snapshots for identical Project contents, regardless of file system listing order.
7. THE Scanner SHALL NOT create Citizens, Tasks, or secret findings from files inside the `.haunted` directory.

### Requirement 3: Build the import graph

**User Story:** As a developer, I want imports between files known, so that sickness can spread along them.

#### Acceptance Criteria

1. WHEN a JavaScript or TypeScript File_Node is scanned, THE Scanner SHALL extract its static import and re-export specifiers using es-module-lexer.
2. WHEN an import specifier resolves to another File_Node in the Project, THE Scanner SHALL add an edge to the Import_Graph.
3. THE Scanner SHALL omit edges for specifiers that do not resolve to a File_Node in the Project.
4. IF a File_Node cannot be parsed, THEN THE Scanner SHALL add the File_Node with no outgoing edges and continue scanning.
5. THE Scanner SHALL store Import_Graph edges in path-sorted order.

### Requirement 4: Citizen identity from path hash

**User Story:** As a developer, I want the same file to always be the same citizen, so that I recognise my files.

#### Acceptance Criteria

1. THE World_Engine SHALL compute the Citizen_Seed of a File_Node as a deterministic 32-bit hash of its project-relative path.
2. THE World_Engine SHALL derive the Citizen's face, house model variant, house colour, and name from the Citizen_Seed only.
3. WHEN two File_Nodes have the same project-relative path, THE World_Engine SHALL assign them the same Citizen appearance and name, regardless of the Project they are in.
4. WHEN a file's content changes and its path does not, THE World_Engine SHALL keep the same Citizen appearance and name.
5. WHEN a file is renamed, THE World_Engine SHALL assign the Citizen appearance and name from the new path.

### Requirement 5: Deterministic village layout

**User Story:** As a developer, I want the same project to give the same village, so that the layout is learnable.

#### Acceptance Criteria

1. THE World_Engine SHALL compute the village layout (district positions, house positions, decoration positions) from the Snapshot's folder structure and Citizen_Seeds only.
2. WHEN the World_Engine is given two equal Snapshots and equal Tombstone sets, THE World_Engine SHALL produce equal World_States.
3. THE World_Engine SHALL place each File_Node's house inside the District of its parent folder.
4. THE World_Engine SHALL place no two houses on the same tile.
5. THE World_Engine SHALL place the Castle at the centre of the Village.
6. WHEN a file is added, THE World_Engine SHALL keep the positions of all existing houses unchanged unless their District has no free tile.

### Requirement 6: Render the village

**User Story:** As a developer, I want a living 3D village in my browser, so that my project is fun to watch.

#### Acceptance Criteria

1. WHEN the Village page loads, THE Village SHALL render a hex-tile island with one house per File_Node, loading models from `/models/kit.glb`.
2. THE Village SHALL render the houses of a District adjacent to each other and visually separate from other Districts.
3. THE Village SHALL show each Citizen's face as a sprite beside its house.
4. THE Village SHALL render with an ink-outline style.
5. WHEN a Snapshot with 300 File_Nodes is rendered, THE Village SHALL sustain at least 30 frames per second on a laptop with integrated graphics.
6. WHEN the user hovers or selects a house, THE Village SHALL show the file's project-relative path and Citizen name.
7. THE Village SHALL provide zoom in and zoom out buttons.
8. THE Village SHALL show a stats card with the Project name, the File_Node count, the District count, and, in the Cursed_View only, the Freed District count out of the total.
9. THE Village SHALL provide a Cozy and Cursed toggle that sets the View_Mode, and THE toggle SHALL NOT change the Phase or the World_State (see Requirements 7 and 8).

### Requirement 7: Cozy welcome

**User Story:** As a developer, I want a happy start, so that the curse feels dramatic.

#### Acceptance Criteria

1. WHEN the Village page loads in the `cozy` Phase, THE Village SHALL show the title "Welcome to <project name>" and a subtitle stating the File_Node count in the form "<N> files. <N> happy little lives."
2. WHILE the View_Mode is Cozy, THE Village SHALL render bright colours, daylight, and happy Citizen faces.
3. WHILE the Phase is `cozy`, THE Village SHALL show a "Send first prompt" button with a note that real use sends the signal from Kiro.
4. WHEN the user clicks "Send first prompt", THE Tool SHALL handle the action as a Prompt_Signal.
5. WHILE the Phase is `cozy`, THE Village SHALL show a "Skip intro" button.
6. WHEN the user clicks "Skip intro", THE Village SHALL end the intro animation and show the Village without the title overlay.
7. WHEN the intro has ended, THE Village SHALL show a "Replay intro" button.
8. WHEN the user clicks "Replay intro", THE Village SHALL play the intro animation from the start.
9. WHEN the intro screen is shown, THE Village SHALL display the line "For people building with AI agents who lose track of what the agent broke, what's unfinished and what's risky."
10. WHILE the View_Mode is Cozy, THE Village SHALL render every Citizen with a happy face and no red tint, whether or not the Citizen is Sick.
11. WHILE the View_Mode is Cozy, THE Village SHALL render no Gravestone, no Dark District styling, no red glow on any District, and no dark Castle or glowing white eyes, whether or not secret findings, unticked Tasks, or Sick Citizens exist.
12. WHILE the View_Mode is Cozy, THE Village SHALL render no Tombstone and no Lantern.
13. WHILE the View_Mode is Cozy, THE Village SHALL show a stats card with only the Project name, the File_Node count, and the District count.
14. WHILE the View_Mode is Cozy, THE Village SHALL NOT show the Chronicle panel or the Chronicler.
15. WHILE the View_Mode is Cozy, WHEN a Citizen changes from Sick to healthy, THE Village SHALL play no heal animation.
16. WHILE the View_Mode is Cozy, WHEN a file is created or deleted, THE Village SHALL add or remove the corresponding house like any other file change.
17. FOR ALL Snapshots, THE Cozy_View derived from the World_State of the Snapshot SHALL equal the Cozy_View derived from the World_State of a fully healthy Snapshot with the same File_Nodes and Import_Graph, regardless of test failures, secret findings, and Task states (concealment invariance).

### Requirement 8: Prompt hook and JINX

**User Story:** As a developer, I want the curse to begin when I send my first prompt to Kiro, so that the story starts in my real workflow.

#### Acceptance Criteria

1. THE Tool SHALL provide a Kiro Prompt Submit Hook definition that runs a shell command to send a Prompt_Signal to the Tool.
2. THE Hook command SHALL exit with status 0 in all cases, including when the Tool is not running.
3. THE Hook command SHALL complete within 2 seconds.
4. WHEN the Tool receives a Prompt_Signal while the Phase is `cozy`, THE World_Engine SHALL set the Phase to `cursed`.
5. WHEN the Phase changes from `cozy` to `cursed`, THE Village SHALL play the JINX_Sequence once.
6. WHILE the Phase is `cursed` and the View_Mode is Cursed, THE Village SHALL show the title "Nevermerge", night lighting, and dark clouds, and SHALL render each Dark District dark.
7. WHEN the Tool receives a Prompt_Signal while the Phase is `cursed`, THE Tool SHALL leave the Phase unchanged and not replay the JINX_Sequence.
8. WHILE Reduced_Motion is enabled, THE Village SHALL replace the JINX_Sequence flash with a non-flashing fade to the `cursed` Phase.
9. WHEN the Tool restarts, THE Tool SHALL start in the `cozy` Phase.
10. WHEN the JINX_Sequence plays, THE Village SHALL perform the Reveal by switching from the Cozy_View to the Cursed_View of the World_State at that moment, showing all sick houses and faces, Gravestones, Dark Districts, red glow, dark Castle eyes, and Tombstones at once.
11. THE Reveal SHALL NOT replay the history of events that occurred during the `cozy` Phase.
12. FOR ALL World_States, THE Cursed_View shown at the end of the Reveal SHALL equal the Cursed_View derived from that same World_State (reveal property).
13. WHILE Reduced_Motion is enabled, THE Village SHALL perform the Reveal as a non-flashing fade.
14. WHILE the Phase is `cozy` and the View_Mode is Cursed, THE Village SHALL show the Cursed_View of the real World_State as a preview, and THE Phase SHALL stay `cozy` with no JINX_Sequence played.
15. WHILE the Phase is `cursed` and the View_Mode is Cozy, THE Village SHALL show the Cozy_View.
16. WHILE the Phase is `cozy`, THE MCP_Server and the Chronicle data SHALL use the real World_State, unaffected by the View_Mode.

### Requirement 9: Spec as curse

**User Story:** As a developer, I want my spec tasks to darken the village, so that unfinished work is visible.

#### Acceptance Criteria

1. WHEN a `.kiro/specs/*/tasks.md` file is scanned, THE Scanner SHALL extract each checkbox line as a Task with its text, ticked state, spec name, and line number.
2. WHEN a Task text mentions a folder path or file path that exists in the Snapshot, THE World_Engine SHALL assign the Task to the District of that folder or of that file's parent folder.
3. IF a Task text mentions no existing folder or file path, THEN THE World_Engine SHALL assign the Task to the Castle.
4. IF a Task text mentions paths in several Districts, THEN THE World_Engine SHALL assign the Task to each of those Districts.
5. WHILE a District has at least one unticked Task assigned and the View_Mode is Cursed, THE Village SHALL render that District dark.
6. WHILE the Castle has at least one unticked Task assigned and the View_Mode is Cursed, THE Village SHALL render the Castle dark with glowing white eyes.
7. THE World_Engine SHALL ignore mentions of paths that do not exist in the Snapshot.
8. WHEN a `tasks.md` file is changed, THE Scanner SHALL publish an updated Snapshot within 1 second.
9. WHILE a District has no unticked Task assigned, THE Village SHALL NOT render that District dark because of Tasks.

### Requirement 10: Sickness origin and spread

**User Story:** As a developer, I want failing tests to make the real code that broke sick, so that I notice what the agent broke.

#### Acceptance Criteria

1. WHEN a Vitest JSON report file exists at `.haunted/test-results.json` in the Project, THE Scanner SHALL read each failing test's Test_File, failure message, and Stack_Frames (path and line number) into the Snapshot.
2. WHEN the test report file is created or changed, THE Scanner SHALL publish an updated Snapshot within 1 second.
3. WHEN a failing test has a Stack_Frame inside the Project, outside `node_modules`, that is not the Test_File, and names a File_Node in the Snapshot, THE World_Engine SHALL select the first such Stack_Frame in stack order as the Sickness_Source of that failing test.
4. WHILE a Stack_Frame names a path outside the Project, inside `node_modules`, the Test_File itself, or a path not in the Snapshot, THE World_Engine SHALL skip that Stack_Frame and consider the next Stack_Frame.
5. IF a failing test has no Stack_Frame that qualifies as a Sickness_Source, THEN THE World_Engine SHALL select as Sickness_Sources the File_Nodes that the Test_File imports directly, using one hop of the Test_File's own Import_Graph edges and no transitive imports.
6. THE World_Engine SHALL mark the Citizen of each Sickness_Source as Sick.
7. THE World_Engine SHALL mark the Citizen of each Test_File of a failing test as Sick.
8. WHEN a File_Node imports a Sick File_Node directly or transitively, THE World_Engine SHALL mark the importing Citizen as Sick.
9. THE World_Engine SHALL mark no Citizen as Sick unless its file is a Sickness_Source, is a Test_File of a failing test, or imports, directly or transitively, a Sick file.
10. WHEN the Import_Graph contains a cycle, THE World_Engine SHALL compute Sickness without non-termination.
11. THE World_Engine SHALL keep, for each failure, the file path and line number of the chosen Stack_Frame as the failure location; WHERE the Sickness_Sources come from the Test_File's imports, THE World_Engine SHALL use the Test_File path and the line number of the failing test.
12. WHILE a Citizen is Sick and the View_Mode is Cursed, THE Village SHALL render its house tinted red and its face with a sick expression.
13. WHILE a District is a Sick District and the View_Mode is Cursed, THE Village SHALL render that District glowing red.
14. WHILE a District has no Sick Citizen, THE Village SHALL NOT render that District glowing red.
15. IF the test report file is missing or is not valid JSON, THEN THE Scanner SHALL treat the Snapshot as having no test results and continue running.
16. IF a failing test names a Test_File that does not exist in the Snapshot, THEN THE Scanner SHALL discard that failure.

### Requirement 11: Secrets become gravestones

**User Story:** As a developer, I want secrets written in code flagged, so that I fix them before they leak.

#### Acceptance Criteria

1. WHEN a text File_Node contains a string matching a known secret pattern (API key, private key header, or token assignment), THE Scanner SHALL record a secret finding with the file path and line number.
2. THE Scanner SHALL omit the secret value from the Snapshot and store only the pattern name and line number.
3. WHEN a File_Node has a secret finding and the View_Mode is Cursed, THE Village SHALL render a Gravestone in that house's yard.
4. WHEN the secret is removed from the file, THE Scanner SHALL publish a Snapshot with no secret finding for that file, and THE Village SHALL remove the Gravestone.
5. THE Scanner SHALL skip binary files and files larger than 1 MB when searching for secrets.

### Requirement 12: Healing and freed districts

**User Story:** As a developer, I want fixed things to heal, so that progress feels real.

#### Acceptance Criteria

1. WHEN a File_Node is no longer a Sickness_Source, is no longer a Test_File of a failing test, and imports no Sick File_Node, THE World_Engine SHALL mark its Citizen as healthy.
2. WHEN a Citizen changes from Sick to healthy and the View_Mode is Cursed, THE Village SHALL play a heal animation on that Citizen's house.
3. WHEN a District has all Tasks ticked, no Sick Citizens, and no Gravestones, THE World_Engine SHALL mark the District as a Freed District.
4. WHILE a District is a Freed District and the View_Mode is Cursed, THE Village SHALL render Lanterns in that District with warm light.
5. WHEN a Freed District gains an unticked Task, a Sick Citizen, or a Gravestone, THE World_Engine SHALL remove its Freed status.
6. THE World_Engine SHALL compute the Freed District count as the number of Districts with Freed status, and THE stats card SHALL show that number.
7. WHILE Reduced_Motion is enabled, THE Village SHALL show the heal animation as a non-flashing colour transition.
8. WHEN a Sick District has no Sick Citizen left, THE Village SHALL stop rendering that District glowing red.
9. WHEN a Dark District has its last unticked Task ticked, THE Village SHALL stop rendering that District dark.

### Requirement 13: Only the user declares finished

**User Story:** As a developer, I want only myself to be able to declare the project finished, so that no agent can claim victory.

#### Acceptance Criteria

1. THE Village SHALL provide an "It is finished" button, enabled only WHILE every Task is ticked, no Citizen is Sick, no secret finding exists, and the Phase is `cursed`.
2. WHEN the user clicks the enabled "It is finished" button, THE World_Engine SHALL set the Finished flag.
3. WHEN the Finished flag is set, THE Village SHALL show the text "It is finished", light all Districts, and show the Chronicler's final entry.
4. THE World_Engine SHALL set the Finished flag only on a declaration from the Village page's button or from the MCP `declare_finished` tool when invoked with the user's confirmation.
5. IF a Snapshot change causes an unticked Task, a Sick Citizen, or a secret finding to appear after Finished is set, THEN THE World_Engine SHALL clear the Finished flag.
6. THE World_Engine SHALL leave the Finished flag unchanged by Snapshots, Prompt_Signals, test results, and Task changes that leave all Tasks ticked, no Citizen Sick, and no secret finding present.
7. WHEN the Finished flag is set, THE Village SHALL render no Dark District and no Sick District.

### Requirement 14: Chronicle entries

**User Story:** As a developer, I want a short gothic story of my project, so that I understand what happened at a glance.

#### Acceptance Criteria

1. WHEN an Event occurs, THE Chronicler SHALL generate a Chronicle_Entry from a rule-based template selected by the Event type.
2. THE Chronicler SHALL generate each entry text with at most 30 words.
3. THE Chronicler SHALL generate entry text containing no emoji characters.
4. THE Chronicler SHALL attach to each entry an Evidence_Line naming a file path that exists in the current Snapshot, or that existed in a Snapshot of this Tool session (as for a "citizen died" entry).
5. THE Chronicler SHALL generate entries from templates only, with no call to any AI model.
6. THE Chronicler SHALL select the template variant from the Event's file Citizen_Seed so identical Events produce identical entries.
7. WHEN several Events of the same type occur within a 3-second window, THE Chronicler SHALL group them into one entry that names one representative file and the count of the others, including "citizen born" and "citizen died" Events.
8. IF an Event has no file path that exists in the current Snapshot or existed in a Snapshot of this Tool session, THEN THE Chronicler SHALL generate no entry for that Event.
9. THE Chronicler SHALL generate entries for these Event types: first prompt, citizen became sick, sickness spread, citizen healed, secret found, secret removed, District freed, Task ticked, citizen born, citizen died, and finished.
10. THE Chronicler SHALL generate only entries that describe Events that occurred in the World_State history.
11. THE Chronicler SHALL generate no "citizen born" entries for the File_Nodes present in the initial scan.

### Requirement 15: Chronicle panel

**User Story:** As a developer, I want a notebook panel beside the world, so that I can read the story while I work.

#### Acceptance Criteria

1. WHILE the View_Mode is Cursed, THE Village page SHALL show a parchment-style panel titled "The Chronicle" beside the Village.
2. THE Chronicle panel SHALL list entries in order of occurrence with the newest entry first.
3. THE Chronicle panel SHALL show each entry's text in a handwritten-style font, followed by its Evidence_Line in a monospace font.
4. WHEN the user selects an entry, THE Village SHALL move the camera to the entry's house, or to the entry's Tombstone for a "citizen died" entry whose Tombstone exists.
5. WHEN a new entry is added, THE Chronicle panel SHALL show it without reloading the page.
6. THE Village SHALL show the Chronicler on a throne above the Castle WHILE the Phase is `cursed` and the View_Mode is Cursed.
7. WHILE the View_Mode is Cozy, THE Village SHALL NOT show the Chronicle panel.
8. THE Chronicle panel SHALL list only entries whose Event occurred at or after the start of the JINX_Sequence.
9. WHILE the Phase is `cozy`, THE Chronicler SHALL generate and store entries from the real World_State history, and THE Village SHALL NOT show them.

### Requirement 16: MCP server

**User Story:** As a developer, I want Kiro to ask what is haunting my project, so that Kiro can fix real problems.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose tools named `whats_haunting`, `world_status`, and `declare_finished`.
2. THE MCP_Server SHALL expose a prompt named `whats-haunting-my-world`.
3. WHEN `whats_haunting` is invoked, THE MCP_Server SHALL return the list of current problems, each with a file path, a line number when known, and a description.
4. THE MCP_Server SHALL return only problems derived from the current Snapshot: Sickness_Sources with their failure messages and locations, files that are Sick because they import Sick files, secret findings, and unticked Tasks.
5. WHEN `world_status` is invoked, THE MCP_Server SHALL return the Phase, File_Node count, District count, Freed District count, Sick Citizen count, unticked Task count, secret finding count, and Finished flag.
6. WHEN `declare_finished` is invoked, THE MCP_Server SHALL not set the Finished flag and SHALL return a message that only the user can declare it finished, unless the user has confirmed through the Village page.
7. WHEN the `whats-haunting-my-world` prompt is requested, THE MCP_Server SHALL return a prompt text instructing Kiro to call `whats_haunting` and fix the listed problems.
8. THE Tool SHALL provide an MCP configuration snippet for Kiro that starts the MCP_Server.
9. WHEN a problem is fixed and the Snapshot updates, THE MCP_Server SHALL omit that problem from the next `whats_haunting` result.
10. IF the Snapshot has no problems, THEN THE MCP_Server SHALL return an empty list from `whats_haunting`.
11. WHEN the MCP_Server starts, THE MCP_Server SHALL ensure that exactly one village server is running for the Project, as specified in Requirement 23.
12. WHILE the Phase is `cozy`, THE MCP_Server SHALL answer `whats_haunting` and `world_status` from the real World_State, including real Sickness_Sources, secret findings, and unticked Tasks, regardless of the View_Mode.

### Requirement 17: Director mode

**User Story:** As a video maker, I want planned camera shots, so that I can record a polished demo.

#### Acceptance Criteria

1. THE Village SHALL provide a Director_Mode toggle.
2. WHEN Director_Mode starts, THE Village SHALL play planned camera shots in sequence: wide establishing, castle, sick houses close-up, freed district, and finale.
3. WHILE Director_Mode is active, THE Village SHALL show letterbox bars.
4. WHILE Director_Mode is active, THE Village SHALL hide the zoom buttons and the Cozy and Cursed toggle.
5. WHEN the user presses Escape, THE Village SHALL exit Director_Mode and restore the previous camera.
6. WHILE Reduced_Motion is enabled, THE Village SHALL move between Director_Mode shots with cuts.
7. WHILE Director_Mode is active, THE Village SHALL render each shot in the view given by the current View_Mode.

### Requirement 18: Reduced motion

**User Story:** As a user sensitive to flashing, I want motion reduced, so that the app is safe to view.

#### Acceptance Criteria

1. THE Village SHALL provide a Reduced_Motion setting.
2. WHEN the browser reports a prefers-reduced-motion preference, THE Village SHALL enable Reduced_Motion on first load.
3. WHILE Reduced_Motion is enabled, THE Village SHALL show no full-screen flash and no element flashing more than 3 times per second.
4. THE Village SHALL persist the Reduced_Motion setting in browser local storage.

### Requirement 19: Hosted demo

**User Story:** As a judge, I want to try the project without installing, so that I can see the whole story.

#### Acceptance Criteria

1. THE Demo SHALL be a static build with no server component and no network calls other than loading its own assets.
2. THE Demo SHALL replay a Recording of a real session containing the cozy start, first prompt, a test failure, sickness spread, a fix, healing, a secret being added (the Gravestone appears) and then removed (the Gravestone disappears), the last Task ticked, and "It is finished".
3. WHEN the Demo loads, THE Demo SHALL start the replay at the cozy start.
4. THE Demo SHALL show play, pause, and restart controls for the replay.
5. THE Demo SHALL feed Recording Snapshots to the same World_Engine and Village used by the local Tool.
6. THE Demo SHALL contain only file paths, tasks, and test results that are in the Recording.
7. THE Demo SHALL show Skip intro, Replay intro, Director_Mode, and Reduced_Motion controls, and SHALL show the intro line "For people building with AI agents who lose track of what the agent broke, what's unfinished and what's risky."
8. THE Recording SHALL be a JSON file, and THE Recording writer and reader SHALL round-trip a Recording to an equal Recording.
9. THE Tool SHALL provide a command that records a live session into a Recording file.

### Requirement 20: Snapshot serialization

**User Story:** As a developer, I want Snapshots stored and loaded reliably, so that recordings and the demo are faithful.

#### Acceptance Criteria

1. THE Tool SHALL serialize a Snapshot to JSON with a Snapshot printer.
2. THE Tool SHALL parse JSON into a Snapshot with a Snapshot parser.
3. FOR ALL valid Snapshots, parsing then printing then parsing SHALL produce a Snapshot equal to the first parsed Snapshot (round-trip property).
4. IF the input JSON is not a valid Snapshot, THEN THE Snapshot parser SHALL return a descriptive error naming the invalid field.

### Requirement 21: Truthfulness of the world

**User Story:** As a developer, I want the world to never lie, so that I can trust it.

#### Acceptance Criteria

1. THE World_Engine SHALL produce only Citizens whose paths exist in the Snapshot.
2. THE World_Engine SHALL produce only Tasks, test failures, Sickness_Sources, and secret findings that exist in the Snapshot.
3. THE World_Engine SHALL produce only Districts whose folders exist in the Snapshot, plus the Castle.
4. WHEN a file is deleted, THE World_Engine SHALL remove its Citizen, Gravestone, and Sickness_Source status from the next World_State.
5. THE Village SHALL render only what the World_State contains.
6. THE World_Engine SHALL produce a Tombstone only for a path that was a File_Node in a Snapshot of this Tool session and is absent from the current Snapshot.
7. THE World_Engine SHALL treat a Tombstone as a marker and not as a Citizen, so that a Tombstone has no Sickness, no house, and no count in the File_Node count.
8. THE Chronicler SHALL name a deleted path in an Evidence_Line only for a "citizen died" entry whose path was a File_Node in a Snapshot of this Tool session.
9. THE Village MAY conceal World_State content in the Cozy_View as presentation only, and THE World_Engine SHALL compute the World_State without regard to the View_Mode.
10. WHILE the View_Mode is Cozy, THE Village SHALL render houses only for Citizens in the World_State.
11. THE MCP_Server SHALL NOT apply the View_Mode or the Phase to filter the problems it reports.

### Requirement 22: Automatic test runs

**User Story:** As a developer, I want the tool to run my Vitest tests whenever files change, so that sickness reflects the current code without a manual step.

#### Acceptance Criteria

1. THE Tool SHALL determine that the Project uses Vitest WHEN `vitest` appears in the `dependencies` or `devDependencies` of the Project's `package.json`, or a Vitest configuration file exists in the Project.
2. WHILE the Project uses Vitest, WHEN the Test_Scheduler observes a file change, THE Test_Scheduler SHALL start a test run 2 seconds after the last observed file change, with a tolerance of 250 milliseconds.
3. WHILE the Project uses Vitest, WHEN the Tool starts, THE Test_Scheduler SHALL schedule one initial test run as if a file change had occurred at startup.
4. THE Test_Scheduler SHALL ignore changes to files inside the `.haunted` directory.
5. WHEN a test run starts, THE Test_Runner SHALL run the Vitest tests of the Project and write the JSON report to `.haunted/test-results.json`.
6. WHILE a test run is in progress, THE Test_Scheduler SHALL NOT start another test run.
7. WHEN files change during a test run, THE Test_Scheduler SHALL schedule exactly one follow-up run that starts after the current run ends and no earlier than 2 seconds after the last file change.
8. THE Test_Runner SHALL write the report to a temporary file in `.haunted` and rename it to `.haunted/test-results.json` only when the run completes.
9. IF a test run crashes or runs longer than 120 seconds, THEN THE Test_Runner SHALL stop the run, discard its output, leave the existing `.haunted/test-results.json` unchanged, and the Tool SHALL continue running.
10. WHEN the user runs the tests and writes `.haunted/test-results.json` without the Tool, THE Scanner SHALL read the file as specified in Requirement 10.
11. IF the Project does not use Vitest, THEN THE Tool SHALL NOT run tests and SHALL read `.haunted/test-results.json` only when the file exists.

### Requirement 23: One village per project

**User Story:** As a developer, I want Kiro to open the village for me and never start a second one, so that I always see one consistent world.

#### Acceptance Criteria

1. WHEN the Tool server starts successfully, THE Tool SHALL write the Server_Info_File containing the port and process id, and THE Tool SHALL remove the Server_Info_File on a normal shutdown.
2. WHEN the MCP_Server or the Tool start command starts, THE starting component SHALL read the Server_Info_File and treat the recorded server as live only WHEN the recorded process is alive and the recorded port answers as the village server of this Project.
3. IF the recorded server is live, THEN THE starting component SHALL connect to or print the URL of that server and SHALL NOT start a second server.
4. IF the Server_Info_File is missing or the recorded server is not live, THEN THE starting component SHALL replace any stale Server_Info_File and start the village server.
5. WHEN the MCP_Server starts the village server, THE MCP_Server SHALL log the village URL to stderr.
6. THE MCP_Server SHALL write only MCP protocol messages to stdout.
7. WHEN the MCP_Server connects to a running village server, THE MCP_Server SHALL answer its tools from that server's current Snapshot and World_State.
8. WHEN two starting components start at the same moment for one Project, THE Tool SHALL ensure that exactly one village server runs, by creating the Server_Info_File with an exclusive atomic create.
9. THE Tool SHALL bind each village server to the loopback address only.

### Requirement 24: Births, deaths and tombstones

**User Story:** As a developer, I want new and deleted files to appear in the story and the village, so that I can see what the agent created and removed.

#### Acceptance Criteria

1. WHEN a path appears in a Snapshot that was absent from the previous Snapshot after the initial scan, THE World_Engine SHALL emit a "citizen born" Event for that path.
2. THE World_Engine SHALL emit no "citizen born" Event for paths present in the initial scan.
3. WHEN a path present in the previous Snapshot is absent from the new Snapshot because the file was deleted, THE World_Engine SHALL emit a "citizen died" Event for that path.
4. WHEN a "citizen died" Event occurs and the View_Mode is Cursed, THE Village SHALL show a Tombstone at the dead Citizen's former tile.
5. THE Village SHALL keep each Tombstone until the Tool restarts.
6. WHEN the Tool restarts, THE Tool SHALL start with no Tombstones.
7. THE World_Engine SHALL place no house on a tile occupied by a Tombstone.
8. WHEN a file with a Tombstone is created again at the same path, THE World_Engine SHALL remove the Tombstone and emit a "citizen born" Event for that path.
9. WHEN a file is renamed, THE World_Engine SHALL emit a "citizen died" Event for the old path and a "citizen born" Event for the new path.
10. THE World_Engine SHALL emit no "citizen born" or "citizen died" Event for a File_Node that enters or leaves the 300-file window of Requirement 2.5 without being created or deleted.

## Correctness Property Candidates

These are candidates for property-based tests using Vitest with fast-check. Each applies to pure logic over generated Snapshots.

| ID | Property | Pattern | Requirements |
| --- | --- | --- | --- |
| P1 | Determinism: for all Snapshots S and Tombstone sets T, `world(S, T)` equals `world(S, T)` and equals `world(shuffle(S), T)` | Idempotence / Invariant | 2.6, 5.1, 5.2 |
| P2 | Identity: for all paths p, `seed(p)` is a fixed 32-bit value, and appearance depends on `seed(p)` only. Equal paths give equal citizens across different Snapshots; content changes do not alter citizens | Invariant | 4.1 to 4.4 |
| P3 | Layout validity: no two houses share a tile, no house shares a tile with a Tombstone, every house lies inside its folder's District | Invariant | 5.3, 5.4, 24.7 |
| P4 | Layout stability: adding a file keeps existing houses in place | Metamorphic | 5.6 |
| P5 | Sickness origin and spread: for generated Import_Graphs, Test_Files, Stack_Frames, and failures, the Sick set equals a reference computed in two steps. Step 1 selects Sickness_Sources per failure (first qualifying in-Project Stack_Frame that is not in `node_modules`, is not the Test_File, and exists in the Snapshot; otherwise the Test_File's direct imports, one hop). Step 2 runs a BFS over reversed Import_Graph edges from the Sickness_Sources and the failing Test_Files. Generators include cycles, Test_Files importing sources, failures with no in-Project frame, and frames in `node_modules`, in the Test_File, or outside the Snapshot that must be ignored | Model-based / Invariant | 10.3 to 10.10 |
| P6 | Healing: removing all failures yields zero Sick Citizens and zero Sick Districts. Adding then removing a failure returns the original World_State | Round trip | 12.1, 12.8 |
| P7 | Truthfulness: every path, task, failure, Sickness_Source, and secret in World_State and in `whats_haunting` output exists in the Snapshot. The only exception is a Tombstone or "citizen died" Evidence_Line, whose path was in a Snapshot of this session; no Tombstone appears as a Citizen | Invariant | 16.4, 21.1 to 21.8 |
| P8 | Task assignment: a Task with no existing mention goes to the Castle, otherwise only to Districts of mentioned existing paths | Invariant | 9.2 to 9.4, 9.7 |
| P9 | Freed District: a District is freed iff all its Tasks are ticked, none of its Citizens is Sick, and none of its houses has a Gravestone | Invariant / Model-based | 12.3, 12.5 |
| P10 | Chronicle entry shape: for all Events, entry text has at most 30 words, contains no emoji, and its Evidence_Line names a path that exists in the Snapshot or existed in this session | Invariant | 14.2 to 14.4 |
| P11 | Chronicle determinism: equal Events give equal entries | Idempotence | 14.6 |
| P12 | Chronicle grouping: N same-type Events (including born and died) within 3 seconds produce one entry, and the file reference is one of the N files | Metamorphic | 14.7 |
| P13 | Finished gate: for all sequences of Snapshots, Prompt_Signals, and MCP calls without a user declaration, Finished stays false. After a declaration, Finished becomes false when a Task is unticked, a Citizen turns Sick, or a secret finding appears | Invariant (sequence) | 13.1 to 13.6, 16.6 |
| P14 | JINX once: for all sequences of Prompt_Signals, the Phase changes from `cozy` to `cursed` exactly once | Idempotence | 8.4, 8.7 |
| P15 | Snapshot round trip: `parse(print(parse(print(S))))` equals `parse(print(S))`, and equals S for valid S | Round trip | 20.3 |
| P16 | Recording round trip: `read(write(R))` equals R | Round trip | 19.8 |
| P17 | Invalid input: for generated invalid JSON, the parser returns an error and does not throw | Error conditions | 20.4, 10.15 |
| P18 | Secret redaction: for all files with generated secrets, the Snapshot contains no secret value | Invariant | 11.2 |
| P19 | Import extraction: generated modules with known import sets yield exactly the resolvable edges, in sorted order | Model-based | 3.2, 3.3, 3.5 |
| P20 | Dark and Sick are independent: for generated World_States in the Cursed_View, a District is dark iff it has an unticked Task, and glows red iff it has a Sick Citizen. All four combinations occur and none changes the other | Invariant | 9.5, 9.9, 10.13, 10.14, 12.8, 12.9 |
| P21 | Birth, death, tombstone consistency: for generated sequences of Snapshots, "born" Events are emitted only for paths new versus the previous Snapshot after the initial scan, "died" Events only for paths removed, initial-scan paths never produce births, and the Tombstone set equals the paths removed during the session and not currently present. Re-creating a path removes its Tombstone and records a birth. A rename gives one death and one birth | Invariant / Model-based | 24.1 to 24.9, 21.6 |
| P22 | Test scheduler model (fake timers): for generated sequences of file changes and run completions, never two runs run at once, at most one follow-up is pending, a run starts 2 seconds after the last change (or when the previous run ends, if later), and changes inside `.haunted` never schedule a run | Model-based | 22.2, 22.4, 22.6, 22.7 |
| P23 | One server per Project: for generated interleavings of start attempts (Tool start command and MCP_Server) with a fake process table and stale or missing Server_Info_Files, at most one live village server exists, and a stale file is replaced | Model-based | 1.6, 23.2 to 23.4, 23.8 |
| P24 | Concealment invariance: for all Snapshots S, `cozyView(world(S))` equals `cozyView(world(healthy(S)))`, where `healthy(S)` has the same files and imports with no failures, no secrets, and all Tasks ticked. The `whats_haunting` result for S in the cozy Phase still equals the result in the cursed Phase | Metamorphic / Invariant | 7.10 to 7.17, 16.12, 21.9 to 21.11 |
| P25 | Reveal equals state: for all World_States W, the view at the end of the Reveal equals `cursedView(W)`, and does not depend on the history of Snapshots that led to W. A Cozy_View never contains a Sick, Gravestone, Dark, red glow, Tombstone, or Lantern element | Invariant | 8.10 to 8.12, 7.10 to 7.12 |

Integration or example tests (not property tests) cover the hook command exit status and timing (8.2, 8.3), port selection (1.4), file watching latency (2.3), the frame rate on 300 files (6.5), the Demo's static build (19.1), the MCP tool registration (16.1, 16.2), Vitest detection (22.1), the 120-second timeout and crash handling of the Test_Runner (22.9), the atomic report rename (22.8), the Scanner ignoring `.haunted` (2.2, 2.7), the MCP_Server starting the village and logging the URL only to stderr with clean stdout (23.5, 23.6), reuse of a running village (23.3), replacement of a stale `.haunted/server.json` (23.4), the Tombstone clearing on restart (24.6), the intro line (7.9, 19.7), the Reveal fade with Reduced_Motion (8.13), the toggle preview leaving the Phase unchanged (8.14, 8.15), and the Recording containing a Gravestone that appears and then disappears (19.2).
