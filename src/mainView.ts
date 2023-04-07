import * as vscode from "vscode";
import { findInWorkspace } from "./find";

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
      this.webViewPanel.webview.html = renderContent({});

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

function renderContent(content: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
    <style>
      * {
        border: 1px solid black;
        box-sizing: border-box;
      }
      .file-list {
        float: left;
        width: 50%;
        padding: 50px;
      }
      .file-content {
        float: right;
        width: 50%;
        padding: 50px;
      }
      .search-bar {
        width: 100%;
      }
      input[type="text"] {
        display: block;
        width: calc(100% - 24px); /*20px [ left & Right ] padding + 4px border [ left & Right ] */
        font-size: 18px;
        font-weight: 600;
        color: #4b00ff;
        padding: 10px;
        border: 2px solid #4b00ff;
    }
    </style>
</head>
<body onload="onBodyLoad()">
    <div class="search-bar">
      <input id="search-input" type="text" oninput="onSearchBarInput(this.value)"/>
    </div>
    <div>
      <div id="file-list" class="file-list">
        one<br/>
        two<br/>
        three<br/>
      </div>
      <div id="selected-file-content" class="file-content">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();

      function onBodyLoad() {
        document.getElementById("search-input").focus();
      }

      function onSearchBarInput(inputValue) {
        vscode.postMessage({
          type: 'find-input-change',
          input: inputValue,
        })
      }

      function handleFindResult(result) {
        const fileListElement = document.getElementById("file-list");
        const selectedFileContentElement = document.getElementById("selected-file-content");

        fileListElement.replaceChildren();
        selectedFileContentElement.replaceChildren();

        for (let key in result) {
          const resultFile = result[key];
          const element = document.createElement("p");
          element.innerHTML = resultFile.filePath;
          fileListElement.appendChild(element);
        }f
      }

      // message handler for events from the VSCode
      window.addEventListener('message', event => {
          const message = event.data;
          switch (message.type) {
              case 'find-result':
                  handleFindResult(message.result);
                  break;
          }
      });
    </script>
</body>
</html>`;
}
