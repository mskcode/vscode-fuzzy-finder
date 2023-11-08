import * as fs from "fs";
import * as vscode from "vscode"; // https://code.visualstudio.com/api/references/vscode-api

/**
 * Enumarates the possible search paths that should be included in the find
 * operation. VSCode might not have a workspace open in which case all openened
 * files are enumerated.
 */
export function enumerateSearchPaths(): string[] {
  // return ["/home/samuli/dev/mskcode/vscode-fuzzy-finder"];
  const workspacePaths = enumerateOpenWorkspacePaths();
  return workspacePaths.length > 0 ? workspacePaths : enumerateOpenFilePaths();
}

function enumerateOpenWorkspacePaths(): string[] {
  const maybeWorkspaceFolders = vscode.workspace.workspaceFolders;
  if (maybeWorkspaceFolders) {
    return maybeWorkspaceFolders
      .map((folder) => folder.uri.fsPath)
      .filter((path) => fs.existsSync(path));
  }
  return [];
}

function enumerateOpenFilePaths(): string[] {
  const textDocuments = vscode.workspace.textDocuments;
  return textDocuments
    .map((document) => document.uri.fsPath)
    .filter((path) => path.startsWith("/"));
}
