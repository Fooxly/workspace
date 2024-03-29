import * as vscode from 'vscode';
import { HiddenDecorationProvider } from './explorer/hidden-decoration-provider';
import { GlobalState, globalState, setGlobalState } from './state';
import { Toggle } from './statusbar/toggle';

var decorator: HiddenDecorationProvider;
var toggle: Toggle;

export function activate(context: vscode.ExtensionContext) {
	setGlobalState(new GlobalState());
	decorator = new HiddenDecorationProvider();
	toggle = new Toggle(context);
}

export function deactivate() {
	decorator?.destroy?.();
	toggle?.destroy?.();
	globalState?.destroy?.();
}
