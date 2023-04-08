import * as vscode from "vscode";
import { findInWorkspace } from "./find";
import mainViewHtml from "./mainView.html";

export class MainView {
  static onlyInstance: MainView | null = null;

  type: string;
  title: string;
  context: vscode.ExtensionContext;
  webViewPanel: vscode.WebviewPanel | null;

  constructor(context: vscode.ExtensionContext) {
    this.type = "find";
    this.title = "Fuzzy Finder";
    this.context = context;
    this.webViewPanel = null;
  }

  static new(context: vscode.ExtensionContext): MainView {
    const instance = new MainView(context);
    return instance;
  }

  public static instance(context: vscode.ExtensionContext): MainView {
    if (MainView.onlyInstance === null) {
      MainView.onlyInstance = MainView.new(context);
    }
    return MainView.onlyInstance;
  }

  public createAndShow() {
    if (this.webViewPanel === null) {
      // create a new webview panel (tab)
      console.log("creating new webview panel");
      this.webViewPanel = vscode.window.createWebviewPanel(
        this.type,
        this.title,
        vscode.ViewColumn.One, // Editor column to show the new webview panel in.
        {
          enableScripts: true,
        }
      );

      // on webview (tab) close
      this.webViewPanel.onDidDispose(
        () => {
          // user has closed the webview
          console.log("disposing webview");
          this.webViewPanel = null;
        },
        null,
        this.context.subscriptions
      );

      // set the webview content
      this.webViewPanel.webview.html = mainViewHtml;

      // message handler for webview messages
      this.webViewPanel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.type) {
            case "find-input-change":
              this.handleFindInputChangeMessage(message);
              break;

            case "file-list-selection-change":
              // TODO implement me
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );
    } else {
      // webview panel already exists so display it
      console.log("revealing existing webview panel");
      this.webViewPanel.reveal();
    }
  }

  handleFindInputChangeMessage(message: any) {
    try {
      findInWorkspace(message.input, (result, error) => {
        if (result) {
          this.postMessageToWebView({
            type: "find-result",
            result: result,
          });
        }
        if (error) {
          console.error(error);
        }
      });
    } catch (e: any) {
      // FIXME format error message
      console.error(e);
      vscode.window.showErrorMessage(JSON.stringify(e));
    }
  }

  postMessageToWebView(message: any) {
    if (this.webViewPanel !== null) {
      console.log("Posting message to WebView");
      this.webViewPanel.webview.postMessage(message);
    }
  }
}
