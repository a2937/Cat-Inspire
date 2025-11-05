import * as vscode from 'vscode';
import { builtInCats, getCats } from './catController';
import { StatusBarAlignment, StatusBarItem, TextDocument, window } from 'vscode';

const settings = vscode.workspace.getConfiguration("catInspire");
const apiKey = settings.catApiKey as string; 
const catWordMilestone = settings.wordsTillNextPicture as number; 
const validLanguages = settings.validLanguages as string[]; 

export function activate(context: vscode.ExtensionContext) {

	
	context.subscriptions.push(
		vscode.commands.registerCommand("catInspire.start", () => {
			CatInspirePanel.createOrShow(context.extensionUri);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(CatInspirePanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				CatInspirePanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
    // Enable javascript in the webview
    enableScripts: true,
    // And restrict the webview to only loading content from our extension's `media` directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
  };
}

/**
 * Manages cat coding webview panels
 */
class CatInspirePanel {
  private _statusBarItem!: StatusBarItem;

  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: CatInspirePanel | undefined;

  public static readonly viewType = "CatInspire";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private lastWordCount = 0;
  private catsURLs: string[] = builtInCats;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (CatInspirePanel.currentPanel) {
      CatInspirePanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      CatInspirePanel.viewType,
      "Cat Inspire",
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
    );

    CatInspirePanel.currentPanel = new CatInspirePanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    CatInspirePanel.currentPanel = new CatInspirePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this.fetchCats();
		const webview = this._panel.webview;
		// Set the webview's initial html content
		this._startForCat(webview);
	

		this._update();


    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    window.onDidChangeTextEditorSelection(this._update, this);
    window.onDidChangeActiveTextEditor(this._update, this);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  private fetchCats() {
    getCats(apiKey).then((cats) => {
      this.catsURLs = cats;
    });
  }

  public dispose() {
    CatInspirePanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    const editor = window.activeTextEditor;
    // Create as needed
    if (!this._statusBarItem) {
      this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
    }
    if (!editor) {
      return;
    }
    const doc = editor.document;
    // Only update status if an MD file
    if (validLanguages.includes(doc.languageId.trim())) {
      const wordCount = this._getWordCount(doc);
      if (
        wordCount % catWordMilestone === 0
        && this.lastWordCount !== wordCount) {
        this._updateForCat(webview);
      }
      this._statusBarItem.text =
        wordCount !== 1 ? `$(pencil) ${wordCount} Words` : "$(pencil) 1 Word";
      const wordsLeft =
        catWordMilestone - (this.lastWordCount % catWordMilestone);
      this._panel.webview.postMessage({
        command: "updateWordCount",
        wordsTillUpdate: wordsLeft,
			});
      this._statusBarItem.show();
      this.lastWordCount = wordCount; 
    } else {
      this._statusBarItem.hide();
    }
  }

  public _getWordCount(doc: TextDocument): number {
    let docContent = doc.getText();

    // Parse out unwanted whitespace so the split is accurate
    docContent = docContent.replace(/(< ([^>]+)<)/g, "").replace(/\s+/g, " ");
    docContent = docContent.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    let wordCount = 0;
    if (docContent != "") {
      wordCount = docContent.split(" ").length;
    }

    return wordCount;
  }

	private _startForCat(webview: vscode.Webview)
	{
		this._panel.title = "CatInspire";
  if (this.catsURLs.length < 10) {
    this.fetchCats();
  }
  const catIndex = Math.floor(Math.random() * this.catsURLs.length);
		this._panel.webview.html = this._getHtmlForWebview(
			webview,
			this.catsURLs[catIndex]
		);
	}

  private _updateForCat(webview: vscode.Webview) {
    this._panel.title = "CatInspire";
		const catIndex = Math.floor(Math.random() * this.catsURLs.length);
		webview.postMessage({
      command: "newPicture",
      newUrl: this.catsURLs[catIndex],
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview, catGifPath: string) {
    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "main.js"
    );

    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Local path to css styles
    const styleResetPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "reset.css"
    );
    const stylesPathMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "vscode.css"
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(styleResetPath);
    const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Cat Inspire</title>
			</head>
			<body>
				<h1 id="words-remaining">10 Words till next picture</h1>
				<img id="cat-gif" src="${catGifPath}" width="95%" height="95%" />
			
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
