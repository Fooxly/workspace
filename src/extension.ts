import * as vscode from 'vscode'
import Hider from './hider'

var hider: Hider
export function activate(ctx: vscode.ExtensionContext) {
	hider = new Hider(ctx)
}

export function deactivate() {
	hider.destroy()
}
