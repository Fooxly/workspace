import * as vscode from 'vscode';
import Hider from './hider';
import { getConfiguration } from './utils';
import { WorkspaceDecorationProvider } from './workspaceDecorationProvider';

var hider: Hider;
var decorator: WorkspaceDecorationProvider;
export function activate(ctx: vscode.ExtensionContext) {
	(async () => {
		await setup();
		hider = new Hider(ctx);
		decorator = new WorkspaceDecorationProvider();
	})();
}

export function deactivate() {
	hider?.destroy?.();
	decorator?.destroy?.();
}

async function setup () {
	vscode.workspace.onDidChangeConfiguration((ev: vscode.ConfigurationChangeEvent) => {
		updateConfigs();
	});

	vscode.workspace.onDidChangeWorkspaceFolders(() => {
		updateConfigs();
	});
	await updateConfigs();
}

async function updateConfigs () {
	if (!vscode.workspace.workspaceFolders) {
		return;
	}
	for (const folder of vscode.workspace.workspaceFolders) {
		await getConfiguration(folder, true);
	}

	if (hider) {
		hider.sync();
	}
	if (decorator) {
		decorator.sync();
	}
}
