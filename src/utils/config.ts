import { WorkspaceFolder, workspace } from 'vscode';
import { DEFAULT_EXCLUDE_PATTERNS } from './consts';

/**
 * Get all the files.exclude entries for a workspace
 * @param folder The workspace folder the config should be in
 * @returns An object which contains all exclude patterns for the workspace
 */
export function getWorkspaceConfig(folder: WorkspaceFolder) {
    const config = workspace.getConfiguration('files', folder);
    const current = { ...config.get<Record<string, boolean>>('exclude', {})};
    // We still need to remove the default excludes from the config
    for (const defaultPattern of DEFAULT_EXCLUDE_PATTERNS) {
        delete current[defaultPattern];
    }
    return current;
}
