import { Result } from "./result";
import { Ripgrep } from "./ripgrep";

export type FindResultHandler = (result: Result<FindResult>) => void;

export const findInWorkspace = (
  input: string,
  onFindResult: FindResultHandler
) => {
  const ripgrep = Ripgrep.new();
  const searchPaths = resolveSearchPaths();
  ripgrep.find(input, searchPaths, onFindResult);
};

const resolveSearchPaths = (): string[] => {
  return ["/home/samuli/dev/mskcode/vscode-fuzzy-finder"];
  /* const paths = vscode.workspace.workspaceFolders?.map(
    (folder) => folder.uri.path
  );
  if (!paths) {
    throw Error("Could not resolve workspace path");
  }
  return paths[0]; */
};

export type FindResultLine = {
  type: "context" | "match";
  lineNumber: number;
  content: string;
};

export type FindResultFile = {
  filePath: string;
  lines: FindResultLine[];
};

export type FindResult = {
  [filePath: string]: FindResultFile;
};
