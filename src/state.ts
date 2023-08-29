import { Disposable, WorkspaceFolder, commands, workspace } from 'vscode';
import { DEFAULT_EXCLUDE_PATTERNS } from './utils/consts';

export interface StateListenerProps {
    folder: WorkspaceFolder;
    attributes: string[];
}

export class WorkspaceState {
    private folder: WorkspaceFolder;
    private onChange: (props?: StateListenerProps) => void;
    private _excludePatterns: string[] = [];
    public get excludePatterns(): string[] {
        return this._excludePatterns;
    }
    public set excludePatterns(value: string[]) {
        const previousValue = this._excludePatterns;
        this._excludePatterns = value;
        // prevent unnecessary updates if the patterns are the same
        if (previousValue.length === value.length &&
            previousValue.every((val) => val === value.find(
                (pattern) => pattern === val)
            )
        ) {
            return;
        }
        this.onChange({ attributes: ['excludePatterns'], folder: this.folder });
    }
    // If the actual workspace should be in focus mode
    private _inFocusMode: boolean = false;
    public get inFocusMode(): boolean {
        return this._inFocusMode;
    }
    public set inFocusMode(value: boolean) {
        const previousValue = this._inFocusMode;
        this._inFocusMode = value;
        // prevent unnecessary updates if the focus mode is the same
        if (previousValue === value) {
            return;
        }
        commands.executeCommand('setContext', 'workspace:inFocusMode', value);
        this.onChange({ attributes: ['inFocusMode'], folder: this.folder });
    }

    constructor(folder: WorkspaceFolder, onChange: (props?: StateListenerProps) => void) {
        this.folder = folder;
        // We link a custom onChange which can update the global state
        this.onChange = onChange;

        workspace.onDidChangeConfiguration((event) => {
            if (!event.affectsConfiguration('files.exclude')) {
                return;
            }
            this.resyncPatterns();
            this.resyncFocusMode();
        });
        this.resyncPatterns();
        this.resyncFocusMode();
    }

    private resyncPatterns() {
        const patterns = workspace.getConfiguration('files', this.folder).get<Record<string, boolean>>('exclude', {});
        const allPatterns = Object.keys(patterns);
        const excludePatterns = allPatterns.filter((pattern) => !DEFAULT_EXCLUDE_PATTERNS.includes(pattern));
        this.excludePatterns = excludePatterns;
    }

    private resyncFocusMode() {
        const patterns = { ...workspace.getConfiguration('files', this.folder).get<Record<string, boolean>>('exclude', {})};
        for (const defaultPattern of DEFAULT_EXCLUDE_PATTERNS) {
            delete patterns[defaultPattern];
        }
        const values = Object.values(patterns);
        const finalValue = values.includes(true);
        this.inFocusMode = finalValue;
    }
}

export class GlobalState {
    private workspaceListenerEvent: Disposable;
    private changeListeners: Set<(props?: StateListenerProps) => void>;
    private workspaceStates: Map<string, WorkspaceState> = new Map<string, WorkspaceState>();
    private folders: Map<string, WorkspaceFolder> = new Map<string, WorkspaceFolder>();

    public get workspaces(): WorkspaceFolder[] {
        return [...this.folders.values()];
    }

    constructor() {
        // Handle events from all the workspaces
        this.changeListeners = new Set<(props?: StateListenerProps) => void>();

        // Initial setup for all open workspaces
        for (const space of workspace.workspaceFolders ?? []) {
            this.setupWorkspace(space);
        }
        // Listen for possible changes in the workspaces and update them accordingly
        this.workspaceListenerEvent = workspace.onDidChangeWorkspaceFolders((event) => {
            for (const workspace of event.removed) {
                this.removeWorkspace(workspace);
            }
            for (const workspace of event.added) {
                this.setupWorkspace(workspace);
            }
        });
    }

    private setupWorkspace(workspace: WorkspaceFolder) {
        this.workspaceStates.set(workspace.uri.fsPath, new WorkspaceState(workspace, (props) => {
            this.changeListeners.forEach((listener) => listener(props));
        }));
        this.folders.set(workspace.uri.fsPath, workspace);
    }

    private removeWorkspace(workspace: WorkspaceFolder) {
        this.workspaceStates.delete(workspace.uri.fsPath);
        this.folders.delete(workspace.uri.fsPath);
    }

    public getWorkspaceState(workspace: WorkspaceFolder): WorkspaceState | undefined {
        return this.workspaceStates.get(workspace.uri.fsPath);
    }

    public isAnyWorkspaceInFocusMode() {
        for (const state of this.workspaceStates.values()) {
            if (state.inFocusMode) {
                return true;
            }
        }
        return false;
    }

    public on(event: 'change', listener: (props?: StateListenerProps) => void) {
        if (event === 'change') {
            this.changeListeners.add(listener);
            return () => this.changeListeners.delete(listener);
        }
        return () => {};
    }

    public destroy () {
        this.workspaceListenerEvent.dispose();
    }
}

export var globalState: GlobalState;

export function setGlobalState(state: GlobalState) {
    globalState = state;
}
