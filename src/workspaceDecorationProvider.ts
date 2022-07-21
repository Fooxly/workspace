import { Disposable, FileDecoration, FileDecorationProvider, ThemeColor, Uri, window, workspace } from 'vscode';
import { getConfiguration, isHidden, localizePath } from './utils';

export class WorkspaceDecorationProvider implements FileDecorationProvider {
    private disposable?: Disposable;
    constructor () {
        this.sync();
    }

    async provideFileDecoration(uri: Uri): Promise<FileDecoration> {
        const workspaceConfig = workspace.getConfiguration('workspace');
        const data = localizePath(uri);
        if (!data.workspace) {
            return {};
        }
        const config = await getConfiguration(data.workspace);
        if (!config.hasOwnProperty('files.exclude')) {
            return {};
        }
        if (Object.keys(config['files.exclude']).includes(data.localPath)) {
            const base = {
                badge: '🙈',
                tooltip: 'This item is hidden',
            };
            if (workspaceConfig.get('disableColoring', false)) {
                return base;
            }
            return {
                ...base,
                color: new ThemeColor('workspace.hiddenColor'),
            };
        }
        return {};
    }

    public sync () {
        if (this.disposable) {
            this.disposable.dispose();
        }
        this.disposable = window.registerFileDecorationProvider(this);
    }

    public destroy () {
        if (this.disposable) {
            this.disposable.dispose();
        }
    }
}