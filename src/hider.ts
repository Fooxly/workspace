import { Disposable, ExtensionContext, commands, workspace, window, StatusBarAlignment, StatusBarItem, ConfigurationTarget, ThemeColor, ConfigurationChangeEvent, WorkspaceConfiguration, Uri } from 'vscode'
import * as fs from 'fs'

export default class Hider {
  public context: ExtensionContext
  private cmds: Map<string, Disposable> = new Map<string, Disposable>()

  // status bar state for hiding or showing
  // all normally hidden files at `files.exclude`
  private isHidden: boolean = false
  // the status bar item that switches `isHidden` on or off
  private switch?: StatusBarItem
  private config: WorkspaceConfiguration

  constructor(context: ExtensionContext) {
    this.context = context
    this.config = workspace.getConfiguration()
    this.Initialize()
  }

  private async Initialize() {
    this.registerCommand('workspace.toggle', (_, files) => {
      const excluded = this.config.inspect('files.exclude')
      let items: any = undefined
      if (excluded && excluded.workspaceValue) {
        items = excluded.workspaceValue
      }
      if (!items) items = {}

      for(const f of files) {
        if (fs.existsSync(f.fsPath)) {
          if (fs.lstatSync(f.fsPath).isDirectory()) {
            items = this.toggleFolder(items, f)
          } else {
            items = this.toggleFile(items, f)
          }
        }
      }
      if (items === null) items = undefined
      // update the config
      this.config.update('files.exclude', items, ConfigurationTarget.Workspace)
    })

    // toggle between hidden and non hidden space
    this.registerCommand('workspace.toggleFocus', () => {
      this.toggleFocus()
    })

    ;(async () => {
      const isHidden = this.config.inspect('workspace.isHidden')
      if (isHidden && isHidden.workspaceValue !== undefined) {
        this.isHidden = !(isHidden.workspaceValue as boolean)
      } else {
        const excluded = this.config.inspect('files.exclude')
        if (excluded && excluded.workspaceValue && Object.keys(<any>excluded.workspaceValue).length) {
          await this.config.update('workspace.isHidden', false, ConfigurationTarget.Workspace)
        }
      }
      this.update()
    })()

    workspace.onDidChangeConfiguration(e => {
      this.configUpdate(e)
    })
  }

  public destroy () {
    if(this.switch) {
      this.switch.dispose()
    }
  }

  public configUpdate(ev: ConfigurationChangeEvent) {
    this.config = workspace.getConfiguration()

    if(ev.affectsConfiguration('workspace')) {
      if(!ev.affectsConfiguration('workspace.isHidden')) {
        this.update(true)
      }
		} else if (ev.affectsConfiguration('files')) {
      this.update()
    }
  }

  private toggleFile(items: any, file: Uri): any {
    const newItems = items
    const path = this.pathResolve(file.path)
    if (!path) return;

    // check if file is inside the files.exclude
    if (Object.keys(newItems).includes(path)) {
      // remove it from the files.exclude
      delete newItems[path]
    } else {
      // else: add file to files.exclude
      newItems[path] = !this.isHidden
    }
    return newItems
  }

  private toggleFolder(items: any, folder: Uri): any {
    const newItems = items
    const path = this.pathResolve(folder.path);
    if (!path) return;

    // check if folder is inside the files.exclude
    if (Object.keys(newItems).includes(path)) {
      // remove the folder and sub files from the files.exclude
      for (const key in newItems) {
        if (key.indexOf(path) > -1) {
          delete newItems[key]
        }
      }
    } else {
      // else: add folder to files.exclude
      newItems[path] = !this.isHidden
    }
    return newItems
  }

  // update the statusbar item
  private update(force = false) {
    const excluded: any = this.config.inspect('files.exclude')

    // create the switch if it does not already exist
    if (this.switch === undefined || force) {
      if(this.switch) {
        this.switch.dispose()
      }
      this.switch = window.createStatusBarItem(StatusBarAlignment.Right, this.config.get('workspace.statusbarPriority', 0))
      this.switch.command = 'workspace.toggleFocus'
      this.context.subscriptions.push(this.switch)
    }

    // FIXME: get correct amount of files which are exluded (folders count as 1 now)
    if (this.config.get('workspace.disableCounter', false) === false) {
      this.switch.text = `$(archive) ${Object.keys(excluded.workspaceValue).length || 0}`
    } else {
      this.switch.text = '$(archive)'
    }

    if(this.isHidden) {
      this.switch.tooltip = 'Hide hidden files'
      if (this.config.get('workspace.disableColoring', false) === false) {
        this.switch.color = new ThemeColor('workspace.hiddenColor')
      } else {
        this.switch.color = undefined
      }
    } else {
      this.switch.tooltip = 'Show hidden files'
      this.switch.color = undefined
    }

    // hide when no files are hidden (and the always show option is false)
    if(!Object.keys(excluded.workspaceValue).length && !this.config.get('workspace.alwaysShowToggle', true)) {
      this.switch.hide()
    } else {
      this.switch.show()
    }
  }

  private async toggleFocus () {
    const excluded = this.config.inspect('files.exclude')
    let files: any = undefined
    if (excluded && excluded.workspaceValue) {
      files = excluded.workspaceValue
    }
    // update the files
    if (files) {
      for(const key in files) {
        files[key] = this.isHidden
      }
    }
    // switch is hidden boolean
    this.isHidden = !this.isHidden
    // FIXME: flickering of statusbar happens here somewhere (when the config is not updated the statusbar does not flicker)
    await this.config.update('workspace.isHidden', !this.isHidden, ConfigurationTarget.Workspace)
    // update the value (this also updates the statusbar item)
    await this.config.update('files.exclude', files ?? undefined, ConfigurationTarget.Workspace)
  }

  public registerCommand(uri: string, callback: (...args: any[]) => any) {
    if(this.cmds.get(uri)) return
    let dis = commands.registerCommand(uri, callback)
    this.context.subscriptions.push(dis)
    this.cmds.set(uri, dis)
  }

  // resolve path correctly for both single and multiple workspace roots
  // according to how `file.excludes` requires it to be.
  private pathResolve(full_path: string): string | undefined {
    // When there are multiple workspaces folders [`path`] has
    // the workspace folder's name prepended
    let path = workspace.asRelativePath(full_path);
    const workspace_num = workspace.workspaceFolders?.length || 0;

    if (workspace_num > 1 && this.config.get("workspace.multiRootWorkspaces")) {
      // remove the workspace's prepended name
      // NOTE: has the additional effect of hiding the file
      // in every workspace folder
      // TODO: Add a setting to toggle this behaviour?
      path = path.slice(path.indexOf('/') + 1)
      if (path === "") return;
    }

    return path;
  }
}
