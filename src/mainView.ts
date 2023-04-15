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
          const messageHandlerMap: { [key: string]: (message: any) => void } = {
            "find-input-change": this.handleFindInputChangeMessage.bind(this),
            "file-selected": this.handleFileSelectedMessage.bind(this),
            "close-extension-view":
              this.handleCloseExtensionViewMessage.bind(this),
          };

          const messageHandler = messageHandlerMap[message.type];
          messageHandler(message);
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

  public close() {
    if (this.webViewPanel) {
      this.webViewPanel.dispose();
    }
  }

  handleFindInputChangeMessage(message: any) {
    findInWorkspace(message.input, (result) => {
      result.match({
        ok: (value) => {
          this.postMessageToWebView({
            type: "find-result",
            result: value,
          });
        },
        error: (error) => {
          // FIXME maybe some better error handling
          console.error(error);
        },
      });
    });
  }

  handleFileSelectedMessage(message: any) {
    const filePath: string = message.path;
    console.log(`Selected file path: ${filePath}`);

    // open (or make visible) selected file
    vscode.workspace.openTextDocument(filePath).then((document) => {
      vscode.window.showTextDocument(document);
    });

    this.close();
  }

  handleCloseExtensionViewMessage(message: any) {
    this.close();
  }

  postMessageToWebView(message: any) {
    if (this.webViewPanel !== null) {
      console.log("Posting message to WebView");
      this.webViewPanel.webview.postMessage(message);
    }
  }
}
