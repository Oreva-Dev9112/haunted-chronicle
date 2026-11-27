export interface FileNode {
  path: string;
}

export interface ImportEdge {
  from: string;
  to: string;
}

export interface TaskRecord {
  specName: string;
  line: number;
  text: string;
  done: boolean;
}

export interface StackFrame {
  path: string;
  line: number;
}

export interface TestFailure {
  testFile: string;
  message: string;
  stackFrames: StackFrame[];
}

export interface SecretFinding {
  path: string;
  line: number;
  pattern: string;
}

export interface Snapshot {
  projectName: string;
  files: FileNode[];
  omittedFileCount: number;
  importEdges: ImportEdge[];
  tasks: TaskRecord[];
  testFailures: TestFailure[];
  secretFindings: SecretFinding[];
}
