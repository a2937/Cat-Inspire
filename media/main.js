// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () 
{
  const vscode = acquireVsCodeApi();

	const oldState = /** @type {{ wordsRemaining: number} | undefined} */ (vscode.getState());
	let wordsRemaining = (oldState && oldState.wordsRemaining) || 10;
	const counter = /** @type {HTMLElement} */ (document.getElementById('words-remaining'));
	const gifPic = /** @type {HTMLImageElement} */ (document.getElementById('cat-gif'));

	counter.textContent = wordsRemaining !== 1 ? `${wordsRemaining} Words till next picture` : "1 Word till next picture";
	// Handle messages sent from the extension to the webview
	window.addEventListener('message', event =>
	{
		const message = event.data; // The json data that the extension sent
		counter.textContent = JSON.stringify(message);
		switch (message.command) {
			case 'updateWordCount':
				
				const wordsRemaining  = message.wordsTillUpdate; 
				vscode.setState({ wordsRemaining: wordsRemaining });
				const formattedText = wordsRemaining !== 1 ? `${wordsRemaining} Words till next picture` : "1 Word till next picture";
				counter.textContent = formattedText;
			
				break;
			case 'newPicture':
				gifPic.src = message.newUrl; 
				break; 
		}
	});	
}());
