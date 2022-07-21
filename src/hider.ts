import { Disposable, ExtensionContext, commands, workspace, window, StatusBarAlignment, StatusBarItem, ThemeColor, ConfigurationChangeEvent, Uri, WorkspaceFolder } from 'vscode';
import { getConfiguration, isHidden, localizePath, setIsHidden, writeConfig } from './utils';

export default class Hider {
    public context: ExtensionContext;

    private cmds: Map<string, Disposable> = new Map<string, Disposable>();

    // the status bar item that switches `isHidden` on or off
    private switch?: StatusBarItem;
    // The priority of the status bar item
    private lastPriority: number = 0;

    constructor(context: ExtensionContext) {
        this.context = context;

        this.registerCommands();
        this.sync();
    }

    // Clean up when the extension is unloaded
    public destroy () {
        if(this.switch) {
        this.switch.dispose();
        }
        this.cmds.forEach((cmd) => cmd.dispose());
        this.cmds.clear();
    }

    // Toggle the given files / folders to the `files.exclude` setting of the correct workspace
    private async toggleItems (files: Uri[]) {
        const workspaces: WorkspaceFolder[] = [];
        for (const file of files) {
            const data = localizePath(file);
            if (!data.workspace) {
                break;
            }
            if (!workspaces.includes(data.workspace)) {
                workspaces.push(data.workspace);
            }
        }

        for (const space of workspaces) {
            // Get the config
            let config = await getConfiguration(space);
            const excludedFiles = config.hasOwnProperty('files.exclude') ? Object.keys(config['files.exclude']) : [];

            // Update all the files in the workspace
            for (const file of files) {
                const data = localizePath(file);
                if (data.workspace?.name === space.name) {
                    if (excludedFiles.includes(data.localPath)) {
                        delete config['files.exclude'][data.localPath];
                    } else {
                        if (!config.hasOwnProperty('files.exclude')) {
                            config['files.exclude'] = {};
                        }
                        config['files.exclude'][data.localPath] = isHidden;
                    }
                    config = {
                        ...config,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        'files.exclude': config['files.exclude'],
                    };
                }
            }
            // Update the workspace.isHidden property if there are any files excluded
            if (config.hasOwnProperty('files.exclude')) {
                config['workspace.isHidden'] = isHidden;
            } else {
                delete config['workspace.isHidden'];
            }

            // Update the config for this space
            await writeConfig(config, space);
        }
        await this.syncSwitch();
    }

    // Update the settings.json for every workspace with the workspace.isHidden property
    public async sync () {
        if (!workspace.workspaceFolders?.length) {
            return;
        }

        const configs = new Map<string, any>();
        let shouldBeShown = false;
        for (const space of workspace.workspaceFolders) {
            const config = await getConfiguration(space);
            configs.set(space.name ?? '', config);
            // If there is one workspace with isHidden set to false, all the workspace folders should be synced with that
            if (config.hasOwnProperty('workspace.isHidden') && config['workspace.isHidden'] === false) {
                shouldBeShown = true;
            }
        }

        // Update all the workspace folder settings if they have the files.exclude property
        for (const space of workspace.workspaceFolders) {
            const config = configs.get(space.name ?? '');
            if (config.hasOwnProperty('files.exclude')) {
                config['workspace.isHidden'] = !shouldBeShown;
                for (const file in config['files.exclude']) {
                    config['files.exclude'][file] = !shouldBeShown;
                }
            } else {
                delete config['workspace.isHidden'];
            }
            await writeConfig(config, space);
        }
        setIsHidden(!shouldBeShown);
        await this.syncSwitch();
    }

    private async syncSwitch () {
        if (!workspace.workspaceFolders) {
            if (this.switch) {
                this.switch.dispose();
            }
            return;
        }
        const workspaceConfig = workspace.getConfiguration('workspace');
        // Update the switch status bar item
        if (!this.switch || this.lastPriority !== workspaceConfig.get('statusbarPriority', 0)) {
            if (this.switch) {
                this.switch.dispose();
            }
            this.lastPriority = workspace.getConfiguration('workspace').get('statusbarPriority', 0);
            this.switch = window.createStatusBarItem(StatusBarAlignment.Right, this.lastPriority);
            this.switch.command = 'workspace.toggleFocus';
            this.context.subscriptions.push(this.switch);
        }
        let hiddenFilesCount = 0;
        for (const space of workspace.workspaceFolders) {
            const config = await getConfiguration(space);
            if (config.hasOwnProperty('files.exclude')) {
                hiddenFilesCount += Object.keys(config['files.exclude']).length;
            }
        }
        // Update the switch properties
        this.switch.text = `$(archive)${!workspaceConfig.get('disableCounter', false) ? ` ${hiddenFilesCount}` : ''}`;
        this.switch.tooltip = isHidden ? 'Show hidden files' : 'Hide hidden files';
        this.switch.color = workspaceConfig.get('disableColoring', false) || isHidden ? undefined : new ThemeColor('workspace.hiddenButtonColor');
        if (!hiddenFilesCount && !workspaceConfig.get('alwaysShowToggle', true)) {
            this.switch.hide();
        } else {
            this.switch.show();
        }
    }

    // Register all the commands for the extension
    private registerCommands () {
        // Clean up the commands when the extension is unloaded
        this.cmds.forEach((cmd) => cmd.dispose());
        this.cmds.clear();

        // Register the toggle buttons to the context menu
        this.cmds.set('workspace.toggleFile', commands.registerCommand('workspace.toggleFile', (_, files) => {
            this.toggleItems(files);
        }));
        this.context.subscriptions.push(this.cmds.get('workspace.toggleFile')!);
        this.cmds.set('workspace.toggleFolder', commands.registerCommand('workspace.toggleFolder', (_, files) => {
            this.toggleItems(files);
        }));
        this.context.subscriptions.push(this.cmds.get('workspace.toggleFolder')!);

        // Register toggle button command
        this.cmds.set('workspace.toggleFocus', commands.registerCommand('workspace.toggleFocus', () => {
            setIsHidden(!isHidden);
            // Show error when there is no workspace
            if (!workspace.workspaceFolders?.length) {
                window.showErrorMessage('The Fooxly Workspace extension can only be used within a workspace');
                return;
            }
            // Update the settings for every workspace
            for (const space of workspace.workspaceFolders) {
                const config = getConfiguration(space);
                config.then(async (settings) => {
                    if (settings.hasOwnProperty('workspace.isHidden')) {
                        settings['workspace.isHidden'] = isHidden;
                    }
                    if (settings.hasOwnProperty('files.exclude')) {
                        for (const entry in settings['files.exclude']) {
                        settings['files.exclude'][entry] = isHidden;
                        }
                    }
                    await writeConfig(settings, space);
                });
            }
            this.syncSwitch();
        }));
    }
}
