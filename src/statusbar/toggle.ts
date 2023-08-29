import { Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, ThemeColor, Uri, commands, l10n, window, workspace } from 'vscode';
import { globalState } from '../state';
import { isHidden, localizePath } from '../utils/files-finder';
import { getWorkspaceConfig } from '../utils/config';

export class Toggle {
    // the status bar item that switches `isHidden` on or off
    private switch?: StatusBarItem;
    private context: ExtensionContext;

    private listeners: Set<() => void> = new Set<() => void>();
    private commands: Disposable[] = [];

    constructor(context: ExtensionContext) {
        this.context = context;

        this.listeners.add(globalState.on('change', (props) => {
            // We don't want to reSync the decoration provider if it is not needed
            if (!props?.attributes.includes('excludePatterns') && !props?.attributes.includes('inFocusMode')) {
                return;
            }
            this.syncSwitch();
        }));

        this.registerCommands();
        this.recreateSwitch();

        workspace.onDidChangeConfiguration((event) => {
            if (
                !event.affectsConfiguration('workspace.statusbarPriority') &&
                !event.affectsConfiguration('workspace.disableCounter') &&
                !event.affectsConfiguration('workspace.alwaysShowToggle') &&
                !event.affectsConfiguration('workspace.statusbar.buttonVisible')
            ) {
                return;
            }
            this.recreateSwitch();
        });
    }

    // Create the instance of the switch which we will hide / show later
    private recreateSwitch() {
        this.switch?.dispose?.();

        this.switch = window.createStatusBarItem(
            StatusBarAlignment.Right,
            workspace.getConfiguration('workspace').get('statusbarPriority', 0)
        );
        this.switch.command = 'workspace.toggleFocus';
        this.context.subscriptions.push(this.switch);
        this.syncSwitch();
    }

    // Update the theming and text of the switch based on the current state
    private syncSwitch() {
        // We don't want to show the button in windows which do not support workspaces
        if (!globalState.workspaces.length || !this.switch) {
            return;
        }
        const workspaceConfig = workspace.getConfiguration('workspace');
        const inFocusMode = globalState.isAnyWorkspaceInFocusMode();
        let activePatterns = 0;
        for (const folder of globalState.workspaces) {
            const state = globalState.getWorkspaceState(folder);
            if (!state) {
                continue;
            }
            activePatterns += state.excludePatterns.length;
        }
        // Set the theming
        this.switch.text = `$(archive)${!workspaceConfig.get('disableCounter', false) ? ` ${activePatterns}` : ''}`;
        this.switch.tooltip = inFocusMode ? l10n.t('Show hidden entries') : l10n.t('Enable focus mode');
        this.switch.color = inFocusMode ? undefined : new ThemeColor('workspace.statusbar.buttonVisible');

        if (!activePatterns && !workspaceConfig.get('alwaysShowToggle', true)) {
            this.switch.hide();
        } else {
            this.switch.show();
        }
    }

    // Register the commands which we will use to toggle the files / folders
    private registerCommands() {
        this.commands.forEach((cmd) => cmd.dispose());
        this.commands = [];

        this.commands.push(commands.registerCommand('workspace.toggleFile', (_, files) => {
            if (!files?.length) {
                window.showWarningMessage(l10n.t('You need to select at least one file'));
                return;
            }
            this.toggleItems(files);
        }));

        this.commands.push(commands.registerCommand('workspace.toggleFolder', (_, folders) => {
            if (!folders?.length) {
                window.showWarningMessage(l10n.t('You need to select at least one folder'));
                return;
            }
            this.toggleItems(folders);
        }));

        this.commands.push(commands.registerCommand('workspace.toggleFocus', this.toggleFocus.bind(this)));
        this.commands.push(commands.registerCommand('workspace.enableFocus', this.toggleFocus.bind(this)));
        this.commands.push(commands.registerCommand('workspace.disableFocus', this.toggleFocus.bind(this)));

        this.context.subscriptions.push(...this.commands);
    }

    private toggleItems(uris: Uri[]) {
        const inFocusMode = globalState.isAnyWorkspaceInFocusMode();
        const workspaceConfigs: Record<string, Record<string, boolean>> = {};

        // Keep track of which files are hidden by which pattern so we can show a message later
        const filesHiddenByPattern: Record<string, Record<string, string>> = {};

        // Add all the given files to the designated workspace config
        for (const file of uris) {
            const { workspace: folder, localPath } = localizePath(file);
            if (!folder) {
                continue;
            }

            if (folder.uri.fsPath === file.fsPath) {
                window.showWarningMessage(l10n.t('You cannot hide the root folder'));
                continue;
            }

            if (!workspaceConfigs[folder.uri.fsPath]) {
                // Fill in the workspace config with the existing entries
                workspaceConfigs[folder.uri.fsPath] = getWorkspaceConfig(folder);
            }

            let shouldAdd = true;

            // If the file / folder is already there, we need to remove it
            if (workspaceConfigs[folder.uri.fsPath][localPath] !== undefined) {
                delete workspaceConfigs[folder.uri.fsPath][localPath];
                shouldAdd = false;
                continue;
            }

            for (const pattern of Object.keys(workspaceConfigs[folder.uri.fsPath])) {
                const { hidden } = isHidden(folder, file, pattern);
                if (!hidden) {
                    continue;
                }
                if (!filesHiddenByPattern[folder.uri.fsPath]) {
                    filesHiddenByPattern[folder.uri.fsPath] = {};
                }
                filesHiddenByPattern[folder.uri.fsPath][file.fsPath] = pattern;
                shouldAdd = false;
                // We don't need to check the other patterns
                break;
            }

            if (shouldAdd) {
                workspaceConfigs[folder.uri.fsPath][localPath] = inFocusMode;
            }
        }

        if (Object.keys(filesHiddenByPattern).length) {
            this.composeErrorMessage(filesHiddenByPattern);
        }

        for (const folder of Object.keys(workspaceConfigs)) {
            workspace.getConfiguration('files', Uri.file(folder)).update('exclude', workspaceConfigs[folder]);
        }
    }

    private toggleFocus() {
        if (!globalState.workspaces.length) {
            window.showErrorMessage(l10n.t('The Fooxly Workspace extension can only be used within a workspace'));
            return;
        }

        const focusMode = globalState.isAnyWorkspaceInFocusMode();
        for (const folder of globalState.workspaces) {
            const state = globalState.getWorkspaceState(folder);
            if (!state) {
                continue;
            }
            // Update the files.exclude setting
            const config = getWorkspaceConfig(folder);
            for (const key of Object.keys(config)) {
                config[key] = !focusMode;
            }
            workspace.getConfiguration('files', folder).update('exclude', config);
            // Finally update the hidden state to the new value
            state.inFocusMode = !focusMode;
        }
    }

    private async composeErrorMessage(filesHiddenByPattern: Record<string, Record<string, string>>) {
        if (!Object.keys(filesHiddenByPattern).length) {
            return;
        }

        for (const folderPath in filesHiddenByPattern) {
            const folder = workspace.getWorkspaceFolder(Uri.file(`${folderPath.replace('file://', '')}`));
            if (!folder || !Object.keys(filesHiddenByPattern[folderPath]).length) {
                continue;
            }

            // Check if the settings.json exists for the workspace
            let settingsFileExists = false;
            const settingsUri = Uri.joinPath(folder.uri, '.vscode', 'settings.json');
            try {
                await workspace.fs.stat(settingsUri);
                settingsFileExists = true;
            } catch {}

            let message = '';
            let options: string[] = [];
            // If there is only one file hidden by the pattern, we can show a more detailed message
            if (Object.keys(filesHiddenByPattern[folderPath]).length === 1) {
                const file = Object.keys(filesHiddenByPattern[folderPath])[0];
                const pattern = filesHiddenByPattern[folderPath][file];
                const { localPath } = localizePath(Uri.file(file));
                message = l10n.t('The item "{0}" is already hidden by the pattern "{1}", Please resolve this conflict before hiding it with the pattern "{2}"', file.replace(folder.uri.fsPath, ''), pattern, localPath);
                options = [settingsFileExists ? l10n.t('Open settings.json') : undefined, l10n.t('Delete Pattern')].filter(Boolean) as string[];
            } else {
                message = l10n.t('Multiple items are already hidden by existing pattern(s) in your settings.json. Please resolve these conflicts before hiding them.');
                options = [settingsFileExists ? l10n.t('Open settings.json') : undefined, l10n.t('Delete Pattern(s)')].filter(Boolean) as string[];
            }

            window.showErrorMessage(message, ...options).then((choice) => {
                switch (choice) {
                    case l10n.t('Open settings.json'): {
                        void (async () => {
                            const settingsUri = Uri.joinPath(folder.uri, '.vscode', 'settings.json');
                            try {
                                const document = await workspace.openTextDocument(settingsUri);
                                await window.showTextDocument(document);
                            } catch {}
                        })();
                        return;
                    }
                    case l10n.t('Delete Pattern'): {
                        const file = Object.keys(filesHiddenByPattern[folderPath])[0];
                        const pattern = filesHiddenByPattern[folderPath][file];
                        const config = getWorkspaceConfig(folder);
                        delete config[pattern];
                        workspace.getConfiguration('files', folder).update('exclude', config);
                        return;
                    }
                    case l10n.t('Delete Pattern(s)'): {
                        const config = getWorkspaceConfig(folder);
                        for (const pattern of Object.values(filesHiddenByPattern[folderPath])) {
                            delete config[pattern];
                        }
                        workspace.getConfiguration('files', folder).update('exclude', config);
                        return;
                    }
                }
            });
        }
    }

    public destroy() {
        this.switch?.dispose?.();
    }
}