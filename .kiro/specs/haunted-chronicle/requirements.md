# Requirements Document

## Introduction

Haunted Chronicle is a local tool started with one command in any project. It turns the project into a living 3D village in the browser. Every file is a house with a citizen, and every folder is a district. A spec-driven curse (tasks in `.kiro/specs/*/tasks.md`), failing tests, and secrets in code change the village. A rule-based Chronicler writes short gothic entries about real events. An MCP server lets Kiro ask what is haunting the project and get real file paths and lines. A hosted demo replays a recorded session for judges.

Scope is a solo hackathon build (Kiroween 2026). Requirements are ordered so the main loop works early: Scanner, then Village, then Sickness and Healing, then Chronicle and MCP, then Hosted Demo.

Out of scope: picture-in-picture, sound, AI-written Chronicle lines, accounts, any cloud backend.

## Glossary

- **Tool**: The local Node process started by one command. It contains the Scanner, World_Engine, Server, and MCP_Server.
- **Scanner**: The Tool component that watches project files and produces the project snapshot.
- **Snapshot**: The data describing files, folders, import edges, tasks, test results, and secret findings at one moment.
- **Project**: The directory in which the Tool is started.
- **File_Node**: One non-ignored file in the Project.
- **Import_Graph**: A directed graph where an edge A to B means File_Node A imports File_Node B.
- **World_Engine**: The pure component that turns a Snapshot into a World_State.
- **World_State**: The derived state of the village: citizens, districts, sickness, gravestones, lanterns, phase, and finished flag.
- **Citizen**: The resident of one house, representing one File_Node.
- **Citizen_Seed**: A 32-bit hash of the File_Node's project-relative path.
- **District**: A group of houses representing one folder.
- **Castle**: The central building that owns tasks mentioning no folder or file.
- **Village**: The 3D browser scene rendered from World_State.
- **Phase**: One of `cozy` (happy), `cursed`.
- **Task**: A checkbox line in a `.kiro/specs/*/tasks.md` file.
- **Task_Owner**: The District or Castle a Task belongs to.
- **Sick**: The state of a Citizen whose file has a failing test or imports a Sick file, directly or transitively.
- **Gravestone**: A marker in a house's yard showing a secret was found in that file.
- **Freed District**: A District with all its Tasks ticked, no failing tests, and no Sick Citizens.
- **Lantern**: A light placed on a Freed District.
- **Finished**: The World_State flag set only by the user's explicit declaration.
- **Chronicler**: The dark figure on a throne above the Castle who narrates events.
- **Chronicle**: The ordered list of Chronicle_Entries shown in the notebook panel.
- **Chronicle_Entry**: A text of at most 30 words plus one Evidence_Line.
- **Evidence_Line**: A monospace line under an entry naming a real file path, with a line number or detail when available.
- **Event**: A change between two World_States, such as a citizen becoming Sick or healed.
- **Hook**: A Kiro Prompt Submit hook that runs a shell command.
- **Prompt_Signal**: The message the Hook sends to the Tool when the user submits a prompt.
- **JINX_Sequence**: The flash, the word JINX, and the change to cursed Phase and the title Nevermerge.
- **MCP_Server**: The Model Context Protocol server inside the Tool, exposing tools and a prompt.
- **Recording**: A recorded sequence of timestamped Snapshots and signals from a real session.
- **Demo**: The hosted static build that replays a Recording.
- **Director_Mode**: A mode that plays planned camera shots.
- **Reduced_Motion**: A user setting that turns off flashing and fast motion.

## Requirements

### Requirement 1: Start the Tool with one command

**User Story:** As a developer, I want to start the tool with one command in any project, so that I can see my project as a village without setup.

#### Acceptance Criteria

1. WHEN the user runs the start command in a Project directory, THE Tool SHALL start a local web server and print its URL.
2. WHEN the start command completes startup, THE Tool SHALL serve the Village page at the printed URL.
3. THE Tool SHALL bind the web server to the loopback address only.
4. IF the default port is in use, THEN THE Tool SHALL select the next free port and print the selected URL.
5. THE Tool SHALL run without any network access to remote services.

### Requirement 2: Scan project files

**User Story:** As a developer, I want every file in my project discovered, so that each file becomes a citizen.

#### Acceptance Criteria

1. WHEN the Tool starts, THE Scanner SHALL produce a Snapshot listing every File_Node with its project-relative path.
2. THE Scanner SHALL exclude paths matched by the Project's `.gitignore`, the `.git` directory, and `node_modules`.
3. WHEN a file is created, changed, or deleted in the Project, THE Scanner SHALL publish an updated Snapshot within 1 second.
4. THE Scanner SHALL group File_Nodes into folders by their parent directory path.
5. IF a Project contains more than 300 File_Nodes, THEN THE Scanner SHALL include the first 300 in path-sorted order and report the count of omitted files in the Snapshot.
6. THE Scanner SHALL produce identical Snapshots for identical Project contents, regardless of file system listing order.

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
2. WHEN the World_Engine is given two equal Snapshots, THE World_Engine SHALL produce equal World_States.
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
8. THE Village SHALL show a stats card with the Project name, the File_Node count, the District count, and the Freed District count out of the total.
9. THE Village SHALL provide a Cozy and Cursed toggle that switches the visual Phase for viewing.

### Requirement 7: Cozy welcome

**User Story:** As a developer, I want a happy start, so that the curse feels dramatic.

#### Acceptance Criteria

1. WHEN the Village page loads in the `cozy` Phase, THE Village SHALL show the title "Welcome to <project name>" and a subtitle stating the File_Node count in the form "<N> files. <N> happy little lives."
2. WHILE the Phase is `cozy`, THE Village SHALL render bright colours, daylight, and happy Citizen faces.
3. WHILE the Phase is `cozy`, THE Village SHALL show a "Send first prompt" button with a note that real use sends the signal from Kiro.
4. WHEN the user clicks "Send first prompt", THE Tool SHALL handle the action as a Prompt_Signal.
5. WHILE the Phase is `cozy`, THE Village SHALL show a "Skip intro" button.
6. WHEN the user clicks "Skip intro", THE Village SHALL end the intro animation and show the Village without the title overlay.
7. WHEN the intro has ended, THE Village SHALL show a "Replay intro" button.
8. WHEN the user clicks "Replay intro", THE Village SHALL play the intro animation from the start.

### Requirement 8: Prompt hook and JINX

**User Story:** As a developer, I want the curse to begin when I send my first prompt to Kiro, so that the story starts in my real workflow.

#### Acceptance Criteria

1. THE Tool SHALL provide a Kiro Prompt Submit Hook definition that runs a shell command to send a Prompt_Signal to the Tool.
2. THE Hook command SHALL exit with status 0 in all cases, including when the Tool is not running.
3. THE Hook command SHALL complete within 2 seconds.
4. WHEN the Tool receives a Prompt_Signal while the Phase is `cozy`, THE World_Engine SHALL set the Phase to `cursed`.
5. WHEN the Phase changes from `cozy` to `cursed`, THE Village SHALL play the JINX_Sequence once.
6. WHILE the Phase is `cursed`, THE Village SHALL show the title "Nevermerge", night lighting, dark clouds, and red glowing for each District with unfinished Tasks.
7. WHEN the Tool receives a Prompt_Signal while the Phase is `cursed`, THE Tool SHALL leave the Phase unchanged and not replay the JINX_Sequence.
8. WHILE Reduced_Motion is enabled, THE Village SHALL replace the JINX_Sequence flash with a non-flashing fade to the `cursed` Phase.
9. WHEN the Tool restarts, THE Tool SHALL start in the `cozy` Phase.

### Requirement 9: Spec as curse

**User Story:** As a developer, I want my spec tasks to curse the village, so that unfinished work is visible.

#### Acceptance Criteria

1. WHEN a `.kiro/specs/*/tasks.md` file is scanned, THE Scanner SHALL extract each checkbox line as a Task with its text, ticked state, spec name, and line number.
2. WHEN a Task text mentions a folder path or file path that exists in the Snapshot, THE World_Engine SHALL assign the Task to the District of that folder or of that file's parent folder.
3. IF a Task text mentions no existing folder or file path, THEN THE World_Engine SHALL assign the Task to the Castle.
4. IF a Task text mentions paths in several Districts, THEN THE World_Engine SHALL assign the Task to each of those Districts.
5. WHILE a District has at least one unticked Task assigned, THE Village SHALL render that District dark.
6. WHILE the Castle has at least one unticked Task assigned, THE Village SHALL render the Castle with glowing red eyes.
7. THE World_Engine SHALL ignore mentions of paths that do not exist in the Snapshot.
8. WHEN a `tasks.md` file is changed, THE Scanner SHALL publish an updated Snapshot within 1 second.

### Requirement 10: Test results make citizens sick

**User Story:** As a developer, I want failing tests to show up on the file that fails, so that I notice what broke.

#### Acceptance Criteria

1. WHEN a Vitest JSON report file exists at `.haunted/test-results.json` in the Project, THE Scanner SHALL read the failing test files and failure messages with line numbers into the Snapshot.
2. WHEN the test report file is created or changed, THE Scanner SHALL publish an updated Snapshot within 1 second.
3. WHEN a File_Node has a failing test, THE World_Engine SHALL mark the File_Node's Citizen as Sick.
4. WHEN a File_Node imports a Sick File_Node directly or transitively, THE World_Engine SHALL mark the importing Citizen as Sick.
5. THE World_Engine SHALL mark no Citizen as Sick unless its file has a failing test or imports, directly or transitively, a file with a failing test.
6. WHEN the Import_Graph contains a cycle, THE World_Engine SHALL compute Sickness without non-termination.
7. WHILE a Citizen is Sick, THE Village SHALL render its house tinted red and its face with a sick expression.
8. IF the test report file is missing or is not valid JSON, THEN THE Scanner SHALL treat the Snapshot as having no test results and continue running.
9. IF a failing test names a file that does not exist in the Snapshot, THEN THE Scanner SHALL discard that failure.
10. THE Tool SHALL provide a command that runs the Project's Vitest tests and writes the report to `.haunted/test-results.json`.

### Requirement 11: Secrets become gravestones

**User Story:** As a developer, I want secrets written in code flagged, so that I fix them before they leak.

#### Acceptance Criteria

1. WHEN a text File_Node contains a string matching a known secret pattern (API key, private key header, or token assignment), THE Scanner SHALL record a secret finding with the file path and line number.
2. THE Scanner SHALL omit the secret value from the Snapshot and store only the pattern name and line number.
3. WHEN a File_Node has a secret finding, THE Village SHALL render a Gravestone in that house's yard.
4. WHEN the secret is removed from the file, THE Scanner SHALL publish a Snapshot with no secret finding for that file, and THE Village SHALL remove the Gravestone.
5. THE Scanner SHALL skip binary files and files larger than 1 MB when searching for secrets.

### Requirement 12: Healing and freed districts

**User Story:** As a developer, I want fixed things to heal, so that progress feels real.

#### Acceptance Criteria

1. WHEN a File_Node no longer has a failing test and imports no Sick File_Node, THE World_Engine SHALL mark its Citizen as healthy.
2. WHEN a Citizen changes from Sick to healthy, THE Village SHALL play a heal animation on that Citizen's house.
3. WHEN a District has all Tasks ticked, no failing tests, and no Sick Citizens, THE World_Engine SHALL mark the District as a Freed District.
4. WHILE a District is a Freed District, THE Village SHALL render Lanterns in that District with warm light.
5. WHEN a Freed District gains an unticked Task or a Sick Citizen, THE World_Engine SHALL remove its Freed status.
6. THE World_Engine SHALL compute the Freed District count as the number of Districts with Freed status, and THE stats card SHALL show that number.
7. WHILE Reduced_Motion is enabled, THE Village SHALL show the heal animation as a non-flashing colour transition.

### Requirement 13: Only the user declares finished

**User Story:** As a developer, I want only myself to be able to declare the project finished, so that no agent can claim victory.

#### Acceptance Criteria

1. THE Village SHALL provide an "It is finished" button, enabled only WHILE every Task is ticked, no Citizen is Sick, and the Phase is `cursed`.
2. WHEN the user clicks the enabled "It is finished" button, THE World_Engine SHALL set the Finished flag.
3. WHEN the Finished flag is set, THE Village SHALL show the text "It is finished", light all Districts, and show the Chronicler's final entry.
4. THE World_Engine SHALL set the Finished flag only on a declaration from the Village page's button or from the MCP `declare_finished` tool when invoked with the user's confirmation.
5. IF a Snapshot change causes an unticked Task or a Sick Citizen to appear after Finished is set, THEN THE World_Engine SHALL clear the Finished flag.
6. THE World_Engine SHALL leave the Finished flag unchanged by Snapshots, Prompt_Signals, test results, and Task changes that leave all Tasks ticked and no Citizen Sick.

### Requirement 14: Chronicle entries

**User Story:** As a developer, I want a short gothic story of my project, so that I understand what happened at a glance.

#### Acceptance Criteria

1. WHEN an Event occurs, THE Chronicler SHALL generate a Chronicle_Entry from a rule-based template selected by the Event type.
2. THE Chronicler SHALL generate each entry text with at most 30 words.
3. THE Chronicler SHALL generate entry text containing no emoji characters.
4. THE Chronicler SHALL attach to each entry an Evidence_Line naming a file path that exists in the current Snapshot or existed in the Snapshot of the Event.
5. THE Chronicler SHALL generate entries from templates only, with no call to any AI model.
6. THE Chronicler SHALL select the template variant from the Event's file Citizen_Seed so identical Events produce identical entries.
7. WHEN several Events of the same type occur within a 3-second window, THE Chronicler SHALL group them into one entry that names one representative file and the count of the others.
8. IF an Event has no existing file to reference, THEN THE Chronicler SHALL generate no entry for that Event.
9. THE Chronicler SHALL generate entries for these Event types: first prompt, citizen became sick, sickness spread, citizen healed, secret found, secret removed, District freed, Task ticked, and finished.
10. THE Chronicler SHALL generate only entries that describe Events that occurred in the World_State history.

### Requirement 15: Chronicle panel

**User Story:** As a developer, I want a notebook panel beside the world, so that I can read the story while I work.

#### Acceptance Criteria

1. THE Village page SHALL show a parchment-style panel titled "The Chronicle" beside the Village.
2. THE Chronicle panel SHALL list entries in order of occurrence with the newest entry first.
3. THE Chronicle panel SHALL show each entry's text in a handwritten-style font, followed by its Evidence_Line in a monospace font.
4. WHEN the user selects an entry, THE Village SHALL move the camera to the entry's house.
5. WHEN a new entry is added, THE Chronicle panel SHALL show it without reloading the page.
6. THE Village SHALL show the Chronicler on a throne above the Castle WHILE the Phase is `cursed`.

### Requirement 16: MCP server

**User Story:** As a developer, I want Kiro to ask what is haunting my project, so that Kiro can fix real problems.

#### Acceptance Criteria

1. THE MCP_Server SHALL expose tools named `whats_haunting`, `world_status`, and `declare_finished`.
2. THE MCP_Server SHALL expose a prompt named `whats-haunting-my-world`.
3. WHEN `whats_haunting` is invoked, THE MCP_Server SHALL return the list of current problems, each with a file path, a line number when known, and a description.
4. THE MCP_Server SHALL return only problems derived from the current Snapshot: failing tests, files that import Sick files, secret findings, and unticked Tasks.
5. WHEN `world_status` is invoked, THE MCP_Server SHALL return the Phase, File_Node count, District count, Freed District count, Sick Citizen count, unticked Task count, and Finished flag.
6. WHEN `declare_finished` is invoked, THE MCP_Server SHALL not set the Finished flag and SHALL return a message that only the user can declare it finished, unless the user has confirmed through the Village page.
7. WHEN the `whats-haunting-my-world` prompt is requested, THE MCP_Server SHALL return a prompt text instructing Kiro to call `whats_haunting` and fix the listed problems.
8. THE Tool SHALL provide an MCP configuration snippet for Kiro that starts the MCP_Server.
9. WHEN a problem is fixed and the Snapshot updates, THE MCP_Server SHALL omit that problem from the next `whats_haunting` result.
10. IF the Snapshot has no problems, THEN THE MCP_Server SHALL return an empty list from `whats_haunting`.

### Requirement 17: Director mode

**User Story:** As a video maker, I want planned camera shots, so that I can record a polished demo.

#### Acceptance Criteria

1. THE Village SHALL provide a Director_Mode toggle.
2. WHEN Director_Mode starts, THE Village SHALL play planned camera shots in sequence: wide establishing, castle, sick houses close-up, freed district, and finale.
3. WHILE Director_Mode is active, THE Village SHALL show letterbox bars.
4. WHILE Director_Mode is active, THE Village SHALL hide the zoom buttons and the Cozy and Cursed toggle.
5. WHEN the user presses Escape, THE Village SHALL exit Director_Mode and restore the previous camera.
6. WHILE Reduced_Motion is enabled, THE Village SHALL move between Director_Mode shots with cuts.

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
2. THE Demo SHALL replay a Recording of a real session containing the cozy start, first prompt, a test failure, sickness spread, a fix, healing, the last Task ticked, and "It is finished".
3. WHEN the Demo loads, THE Demo SHALL start the replay at the cozy start.
4. THE Demo SHALL show play, pause, and restart controls for the replay.
5. THE Demo SHALL feed Recording Snapshots to the same World_Engine and Village used by the local Tool.
6. THE Demo SHALL contain only file paths, tasks, and test results that are in the Recording.
7. THE Demo SHALL show Skip intro, Replay intro, Director_Mode, and Reduced_Motion controls.
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
2. THE World_Engine SHALL produce only Tasks, test failures, and secret findings that exist in the Snapshot.
3. THE World_Engine SHALL produce only Districts whose folders exist in the Snapshot, plus the Castle.
4. WHEN a file is deleted, THE World_Engine SHALL remove its Citizen, Gravestone, and Sickness source from the next World_State.
5. THE Village SHALL render only what the World_State contains.

## Correctness Property Candidates

These are candidates for property-based tests using Vitest with fast-check. Each applies to pure logic over generated Snapshots.

| ID | Property | Pattern | Requirements |
| --- | --- | --- | --- |
| P1 | Determinism: for all Snapshots S, `world(S)` equals `world(S)` and equals `world(shuffle(S))` | Idempotence / Invariant | 2.6, 5.1, 5.2 |
| P2 | Identity: for all paths p, `seed(p)` is a fixed 32-bit value, and appearance depends on `seed(p)` only. Equal paths give equal citizens across different Snapshots; content changes do not alter citizens | Invariant | 4.1 to 4.4 |
| P3 | Layout validity: no two houses share a tile, every house lies inside its folder's District | Invariant | 5.3, 5.4 |
| P4 | Layout stability: adding a file keeps existing houses in place | Metamorphic | 5.6 |
| P5 | Sickness soundness and completeness: a Citizen is Sick if and only if its file fails or reaches a failing file through the Import_Graph, including graphs with cycles | Invariant / Model-based (compare with a simple BFS reference) | 10.3 to 10.6 |
| P6 | Healing: removing all failures yields zero Sick Citizens. Adding then removing a failure returns the original World_State | Round trip | 12.1 |
| P7 | Truthfulness: every path, task, failure, and secret in World_State and in `whats_haunting` output exists in the Snapshot | Invariant | 16.4, 21.1 to 21.5 |
| P8 | Task assignment: a Task with no existing mention goes to the Castle, otherwise only to Districts of mentioned existing paths | Invariant | 9.2 to 9.4, 9.7 |
| P9 | Freed District: a District is freed iff all its Tasks are ticked and none of its Citizens is Sick | Invariant / Model-based | 12.3, 12.5 |
| P10 | Chronicle entry shape: for all Events, entry text has at most 30 words, contains no emoji, and its Evidence_Line names a real file | Invariant | 14.2 to 14.4 |
| P11 | Chronicle determinism: equal Events give equal entries | Idempotence | 14.6 |
| P12 | Chronicle grouping: N same-type Events within 3 seconds produce one entry, and the file reference is one of the N files | Metamorphic | 14.7 |
| P13 | Finished gate: for all sequences of Snapshots, Prompt_Signals, and MCP calls without a user declaration, Finished stays false. After a declaration, Finished becomes false when a Task is unticked or a Citizen turns Sick | Invariant (sequence) | 13.2 to 13.6, 16.6 |
| P14 | JINX once: for all sequences of Prompt_Signals, the Phase changes from `cozy` to `cursed` exactly once | Idempotence | 8.4, 8.7 |
| P15 | Snapshot round trip: `parse(print(parse(print(S))))` equals `parse(print(S))`, and equals S for valid S | Round trip | 20.3 |
| P16 | Recording round trip: `read(write(R))` equals R | Round trip | 19.8 |
| P17 | Invalid input: for generated invalid JSON, the parser returns an error and does not throw | Error conditions | 20.4, 10.8 |
| P18 | Secret redaction: for all files with generated secrets, the Snapshot contains no secret value | Invariant | 11.2 |
| P19 | Import extraction: generated modules with known import sets yield exactly the resolvable edges, in sorted order | Model-based | 3.2, 3.3, 3.5 |

Integration or example tests (not property tests) cover the hook command exit status and timing (8.2, 8.3), port selection (1.4), file watching latency (2.3), the frame rate on 300 files (6.5), the Demo's static build (19.1), and the MCP tool registration (16.1, 16.2).
