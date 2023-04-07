import * as vscode from "vscode";
import { MainView } from "./mainView";

const extensionId = "vscode-fuzzy-finder";

/**
 * Called when extension is activated; extension entrypoint so to speak.
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("vscode-fuzzy-find: activated");

  const registerCommand = (name: string, callback: (...args: any[]) => any) => {
    const command = vscode.commands.registerCommand(
      `${extensionId}.${name}`,
      callback
    );
    context.subscriptions.push(command);
  };

  registerCommand("find", () => {
    const view = MainView.instance(context);
    view.createAndShow();
  });
}

/**
 * Called when extension is deactivated.
 */
export function deactivate() {
  console.log("vscode-fuzzy-find: deactivated");
}
