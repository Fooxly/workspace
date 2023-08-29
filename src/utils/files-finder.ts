import { Uri, WorkspaceFolder, workspace } from 'vscode';
import { minimatch } from 'minimatch';

/**
 * Check if a file / folder is hidden by a specific pattern in a workspace
 * @param folder The workspace root folder
 * @param uri The file / folder uri
 * @param pattern The glob pattern to check
 * @returns If the file / folder is hidden by the pattern and if it is a direct match
 */
export function isHidden(folder: WorkspaceFolder, uri: Uri, pattern: string) {
    // Check if the file is hidden by the pattern
    const relativePath = uri.fsPath.replace(folder.uri.fsPath, '').substring(1);

    // We need to check if the relative path is a direct match
    let hidden = minimatch(uri.fsPath.replace(folder.uri.fsPath, '').substring(1), pattern);
    if (hidden) { return { direct: true, hidden: true }; }
    // Check if one of the parent folders is hidden by the pattern
    const path = relativePath.split('/');
    // We will keep removing the last part of the path until we reach the root
    for (let i = path.length; i > 0; i--) {
        const parent = path.slice(0, i).join('/');
        // If the pattern ends with **, we need to also check if the folder itself matches as vscode will hide that folder too
        if (pattern.endsWith('**')) {
            // If the pattern ends with **, we need to check if the parent folder is hidden by the pattern
            hidden = minimatch(parent + '/', pattern.substring(0, pattern.length - 2));
            if (hidden) { return { direct: true, hidden: true }; }
        }
        // Just check if the folder is hidden by the pattern
        hidden = minimatch(parent, pattern);
        if (hidden) { return { direct: false, hidden: true }; }
    }
    return { direct: false, hidden: false };
}

export function localizePath (file: Uri) {
    const folder = workspace.getWorkspaceFolder(Uri.file(`${file.fsPath.replace('file://', '')}`));

    if (!folder) {
        return {
            workspace: undefined,
            localPath: file.fsPath,
        };
    }
    return {
        workspace: folder,
        localPath: file.fsPath.replace(folder.uri.fsPath, '').substring(1),
    };
}
