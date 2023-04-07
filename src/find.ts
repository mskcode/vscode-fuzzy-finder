export type FuzzyFindResult = {
  filePath: string;
  content: string;
};

export const fuzzyFind = (input: string): FuzzyFindResult[] => {

  // run fzf or rg
  // https://stackoverflow.com/questions/43007267/how-to-run-a-system-command-from-vscode-extension
  //const files = vscode.workspace.findFiles('**/*.*', '**/node_modules/**').then()

  return [
    {
      filePath: "./dir/foo.ts",
      content: "Some random\ncontent",
    },
    {
      filePath: "./dir/bar.ts",
      content: "One\ntwo\nthree",
    },
    {
      filePath: "./dir/baz.ts",
      content: "Hello\nworld!",
    },
  ];
};
