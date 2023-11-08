import { Result } from "./result";
import { Ripgrep } from "./ripgrep";
import { enumerateSearchPaths } from "./workspace";

export type FindResultMatchRange = {
  start: number;
  end: number;
};

export type FindResultLine = {
  type: "context" | "match";
  lineNumber: number;
  content: string;
  matchRanges?: FindResultMatchRange[];
};

export type FindResultFile = {
  filePath: string;
  shortFilePath: string;
  lines: FindResultLine[];
};

export type FindResult = {
  [filePath: string]: FindResultFile;
};

export type FindResultHandler = (
  result: Result<FindResult | undefined>
) => void;

export const findInWorkspace = (
  input: string,
  onFindResult: FindResultHandler
) => {
  const searchPaths = enumerateSearchPaths();
  console.log(`findInWorkspace(): searchPaths=[${searchPaths.join(",")}]`);

  const ripgrep = Ripgrep.new();
  ripgrep.find(input, searchPaths, onFindResult);
};
