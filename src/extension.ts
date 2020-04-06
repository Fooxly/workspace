import * as vscode from 'vscode'
import Main from './Main'

var main: Main
export function activate(context: vscode.ExtensionContext) {
	main = new Main(context)
	vscode.workspace.onDidChangeConfiguration(e => {
		main.configUpdate(e)
	})
}

export function deactivate() {
	main.destroy()
}
