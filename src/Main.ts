import { Disposable, ExtensionContext, commands, workspace, window, StatusBarAlignment, StatusBarItem, ConfigurationTarget, ThemeColor, ConfigurationChangeEvent, WorkspaceConfiguration, Uri } from 'vscode'
import * as fs from 'fs'

export default class Main {
  public context: ExtensionContext
  private cmds: Map<string, Disposable> = new Map<string, Disposable>()

  private inHiddenSpace: boolean = false
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
        this.inHiddenSpace = !(isHidden.workspaceValue as boolean)
      } else {
        const excluded = this.config.inspect('files.exclude')
        if (excluded && excluded.workspaceValue && Object.keys(<any>excluded.workspaceValue).length) {
          await this.config.update('workspace.isHidden', false, ConfigurationTarget.Workspace)
        }
      }
      this.update()
    })()
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
    const path = workspace.asRelativePath(file.path)
    // check if file is inside the files.exclude
    if (Object.keys(newItems).includes(path)) {
      // remove it from the files.exclude
      delete newItems[path]
    } else {
      // else: add file to files.exclude
      newItems[path] = !this.inHiddenSpace
    }
    return newItems
  }

  private toggleFolder(items: any, folder: Uri): any {
    const newItems = items
    const path = workspace.asRelativePath(folder.path)
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
      newItems[path] = !this.inHiddenSpace
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

    if(this.inHiddenSpace) {
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
        files[key] = this.inHiddenSpace
      }
    }
    // switch hidden space boolean
    this.inHiddenSpace = !this.inHiddenSpace
    // FIXME: flickering of statusbar happens here somewhere (when the config is not updated the statusbar does not flicker)
    await this.config.update('workspace.isHidden', !this.inHiddenSpace, ConfigurationTarget.Workspace)
    // update the value (this also updates the statusbar item)
    await this.config.update('files.exclude', files ?? undefined, ConfigurationTarget.Workspace)
  }

  public registerCommand(uri: string, callback: (...args: any[]) => any) {
    if(this.cmds.get(uri)) return
    let dis = commands.registerCommand(uri, callback)
    this.context.subscriptions.push(dis)
    this.cmds.set(uri, dis)
  }
}