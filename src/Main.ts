import { Disposable, ExtensionContext, commands, workspace, window, StatusBarAlignment, StatusBarItem, ConfigurationTarget, ThemeColor, ConfigurationChangeEvent } from 'vscode'

export default class Main {
  public context: ExtensionContext
  private cmds: Map<string, Disposable> = new Map<string, Disposable>()

  private inHiddenSpace: boolean = false
  private switch?: StatusBarItem

  constructor(context: ExtensionContext) {
    this.context = context
    this.Initialize()
  }

  private async Initialize() {
    const workspaceConfig = workspace.getConfiguration('workspace')
    const config = workspace.getConfiguration('files')

    this.registerCommand('workspace.toggleFile', ev => {
      const config = workspace.getConfiguration('files')
      const excluded = config.inspect('exclude')
      let files: any = null
      if (excluded && excluded.workspaceValue) {
        files = excluded.workspaceValue
      }
      const path = workspace.asRelativePath(ev.path)
      // check if file is inside the files.exclude
      if (Object.keys(files).includes(path)) {
        // remove it from the files.exclude
        delete files[path]
      } else {
        // else: add file to files.exclude
        files[path] = true
      }
      // update the config
      config.update('exclude', files, ConfigurationTarget.Workspace)
      this.update()
    })

    this.registerCommand('workspace.toggleFolder', ev => {
      const config = workspace.getConfiguration('files')
      const excluded = config.inspect('exclude')
      let files: any = null
      if (excluded && excluded.workspaceValue) {
        files = excluded.workspaceValue
      }
      const path = workspace.asRelativePath(ev.path)
      // check if folder is inside the files.exclude
      if (Object.keys(files).includes(path)) {
        // remove the folder and sub files from the files.exclude
        for (const key in files) {
          if (key.indexOf(path) > -1) {
            delete files[key]
          }
        }
      } else {
        // else: add folder to files.exclude
        files[path] = true
      }
      // update the config
      config.update('exclude', files, ConfigurationTarget.Workspace)
      this.update()
    })

    // toggle between hidden and non hidden space
    this.registerCommand('workspace.toggleFocus', () => {
      this.toggleFocus()
    })

    ;(async () => {
      const isHidden = workspaceConfig.inspect('isHidden')
      if (isHidden && !!isHidden.workspaceValue) {
        this.inHiddenSpace = !(isHidden.workspaceValue as boolean)
      } else {
        const excluded = config.inspect('exclude')
        if (excluded && excluded.workspaceValue && Object.keys(<any>excluded.workspaceValue).length) {
          await workspaceConfig.update('isHidden', false, ConfigurationTarget.Workspace)
        }
      }
      this.update()
    })()

  }

  public configUpdate(ev: ConfigurationChangeEvent) {
    if(!ev.affectsConfiguration('workspace.isHidden')) {
      this.update(true)
    }
  }

  // update the statusbar item
  private update(force = false) {
    const workspaceConfig = workspace.getConfiguration('workspace')
    const config = workspace.getConfiguration('files')
    const excluded: any = config.inspect('exclude')

    // create the switch if it does not already exist
    if (this.switch === undefined || force) {
      if(this.switch) {
        this.switch.dispose()
      }
      this.switch = window.createStatusBarItem(StatusBarAlignment.Right, workspaceConfig.get('statusbarPriority', 0))
      this.switch.command = 'workspace.toggleFocus'
      this.switch.show()
    }

    // hide when no files are hidden (and the always show option is false)
    if(!Object.keys(excluded.workspaceValue).length && !workspaceConfig.get('alwaysShowToggle', true)) {
      this.switch.hide()
    }

    // FIXME: get correct amount of files which are exluded (folders count as 1 now)
    if (workspaceConfig.get('disableCounter', false) === false) {
      this.switch.text = `$(archive) ${Object.keys(excluded.workspaceValue).length || 0}`
    } else {
      this.switch.text = '$(archive)'
    }

    if(this.inHiddenSpace) {
      this.switch.tooltip = 'Hide hidden files'
      if (workspaceConfig.get('disableColoring', false) === false) {
        this.switch.color = new ThemeColor('workspace.hiddenColor')
      } else {
        this.switch.color = undefined
      }
    } else {
      this.switch.tooltip = 'Show hidden files'
      this.switch.color = undefined
    }
  }

  private toggleFocus () {
    (async () => {
      const workspaceConfig = workspace.getConfiguration('workspace')
      const config = workspace.getConfiguration('files')
      const excluded = config.inspect('exclude')
      let files: any = null
      if (excluded && excluded.workspaceValue) {
        files = excluded.workspaceValue
      }
      // update the files
      if (files) {
        for(const key in files) {
          files[key] = this.inHiddenSpace
        }
      }
      // update the settings
      
      await config.update('exclude', files)
      // switch hidden space boolean
      this.inHiddenSpace = !this.inHiddenSpace
      // update the value (this also updates the statusbar item)
      await workspaceConfig.update('isHidden', !this.inHiddenSpace, ConfigurationTarget.Workspace)
    })()
  }

  public registerCommand(uri: string, callback: (...args: any[]) => any) {
    if(this.cmds.get(uri)) return
    let dis = commands.registerCommand(uri, callback)
    this.context.subscriptions.push(dis)
    this.cmds.set(uri, dis)
  }
}