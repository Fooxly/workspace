import { Disposable, FileDecorationProvider, ThemeColor, Uri, WorkspaceConfiguration, l10n, window, workspace } from 'vscode';
import { globalState } from '../state';
import { isHidden } from '../utils/files-finder';

export class HiddenDecorationProvider implements FileDecorationProvider {
    private disposable?: Disposable;
    private configDisposable?: Disposable;
    private workspaceConfig: WorkspaceConfiguration;
    private listeners: Set<() => void> = new Set<() => void>();

    constructor() {
        this.workspaceConfig = workspace.getConfiguration('workspace');
        this.configDisposable = workspace.onDidChangeConfiguration((event) => {
            if (
                !event.affectsConfiguration('workspace.explorer.directlyHidden') &&
                !event.affectsConfiguration('workspace.explorer.parentHidden') &&
                !event.affectsConfiguration('workspace.disableColoring')
            ) {
                return;
            }
            this.reSync();
        });

        this.listeners.add(globalState.on('change', (props) => {
            // We don't want to reSync the decoration provider if it is not needed
            if (!props?.attributes.includes('excludePatterns')) {
                return;
            }
            this.reSync();
        }));
        this.reSync();
    }

    provideFileDecoration(uri: Uri) {
        for (const folder of globalState.workspaces) {
            if (!uri.fsPath.startsWith(folder.uri.fsPath)) {
                continue;
            }

            const state = globalState.getWorkspaceState(folder);
            if (!state) {
                continue;
            }
            for (const pattern of state.excludePatterns) {
                const { direct, hidden } = isHidden(folder, uri, pattern);
                if (!hidden) {
                    continue;
                }

                const base = {
                    badge: direct ? '○' : undefined,
                    tooltip: l10n.t('This item is set to be hidden'),
                };

                if (this.workspaceConfig.get('disableColoring', false)) {
                    return base;
                }

                return {
                    ...base,
                    color: new ThemeColor(`workspace.explorer.${direct ? 'directlyHidden' : 'parentHidden'}`),
                };
            }
        }

        return {};
    }

    public reSync() {
        this.disposable?.dispose();
        this.workspaceConfig = workspace.getConfiguration('workspace');
        this.disposable = window.registerFileDecorationProvider(this);
    }

    public destroy() {
        for (const removeHandler of this.listeners) {
            removeHandler();
        }
        this.disposable?.dispose();
        this.configDisposable?.dispose();
    }
}