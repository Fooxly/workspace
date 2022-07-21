import { Uri, workspace, WorkspaceFolder } from 'vscode';
import { parse, stringify } from 'comment-json';

const configs = new Map<string, any>();

// status bar state for hiding or showing
// all normally hidden files at `files.exclude`
export let isHidden: boolean = false;

export function setIsHidden (hidden: boolean) {
    isHidden = hidden;
}

export function getConfiguration (folder: WorkspaceFolder, forced = false): Promise<any> {
    return new Promise((resolve) => {
        if (configs.has(folder.name ?? '') && !forced) {
            resolve(configs.get(folder.name ?? '') ?? {});
            return;
        }
        workspace.fs.readFile(Uri.file(`${folder.uri.fsPath}/.vscode/settings.json`)).then((readData) => {
            try {
                const settings = parse(Buffer.from(readData).toString('utf8'));
                configs.set(folder.name ?? '', settings ?? {});
                return settings ?? {};
            } catch (err) {
                return {};
            }
        }, () => resolve({})).then(resolve);
    });
}

// Update the settings.json file for the given workspace
export function writeConfig (config: any, folder: WorkspaceFolder) {
    return new Promise<void>((resolve) => {
        const indentationSize = workspace.getConfiguration('editor').get('tabSize', 4);
        const uri = Uri.file(`${folder.uri.fsPath}/.vscode/settings.json`);
        // Update the config locally
        configs.set(folder.name ?? '', config);
        // Check if the file already exists, otherwise create it
        workspace.fs.stat(uri).then(async () => {
            // Write to the config file
            await workspace.fs.writeFile(uri, Buffer.from(stringify(config, null, indentationSize)));
            resolve();
        }, async () => {
            if (!Object.keys(config)?.length) {
                resolve();
                return;
            }
            await workspace.fs.createDirectory(Uri.file(`${folder.uri.fsPath}/.vscode`));
            // Write to the config file
            await workspace.fs.writeFile(uri, Buffer.from(stringify(config, null, indentationSize)));
            resolve();
        });
    });
}

// Localize the given path to the correct workspace
export function localizePath (file: Uri) {
    const space = workspace.getWorkspaceFolder(Uri.file(`${file.fsPath.replace('file://', '')}`));

    if (!space) {
        return {
            workspace: undefined,
            localPath: file.fsPath,
        };
    }
    return {
        workspace: space,
        localPath: file.fsPath.replace(space.uri.fsPath, '').substring(1),
    };
}