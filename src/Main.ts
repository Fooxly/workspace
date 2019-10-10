import {Disposable, ExtensionContext, commands, workspace, WorkspaceConfiguration, window, StatusBarAlignment, StatusBarItem} from 'vscode'
import * as fs from 'fs'

export default class Main {
  public context: ExtensionContext
  private cmds: Map<string, Disposable> = new Map<string, Disposable>()

  public config: WorkspaceConfiguration

  private inHiddenSpace: boolean = false
  private switch?: StatusBarItem

  constructor(context: ExtensionContext) {
    this.context = context
    this.config = workspace.getConfiguration('workspace')
    this.ConfigChanged(false)
    this.Initialize()
  }

  private Initialize() {
    // remove the file from hidden space
    this.registerCommand('workspace.focusFile', async e => {
      let f: any | undefined = this.config.get('exclude')
      if(!f) f = {}
      let p = workspace.asRelativePath(e.path)
      if(f[p] !== undefined) {
        delete f[p]
      }
      await this.config.update('exclude', f)
      // if there are no items left, set back to normal workspace
      let t: any = this.config.get('exclude')
      if(Object.keys(t).length === 0) {
        this.enableFocus()
      } else {
        this.updateStatusbarItem()
      }
    })
    // add file to hidden space
    this.registerCommand('workspace.removeFile', async e => {
      let f: any | undefined = this.config.get('exclude')
      if(!f) f = {}
      f[workspace.asRelativePath(e.path)] = true
      this.config.update('exclude', f)
      
      let c = workspace.getConfiguration()
      await c.update('files.exclude', f)
      this.updateStatusbarItem()
    })

    // remove the folder from hidden space
    this.registerCommand('workspace.focusFolder', async e => {
      let f: any | undefined = this.config.get('exclude')
      if(!f) f = {}
      let p = workspace.asRelativePath(e.path)
      if(f[p] !== undefined) {
        delete f[p]
      }
      await this.config.update('exclude', f)
      // if there are no items left, set back to normal workspace
      let t: any = this.config.get('exclude')
      if(Object.keys(t).length === 0) {
        this.enableFocus()
      } else {
        this.updateStatusbarItem()
      }
    })
    // add folder to hidden space
    this.registerCommand('workspace.removeFolder', async e => {
      let f: any | undefined = this.config.get('exclude')
      if(!f) f = {}
      f[workspace.asRelativePath(e.path)] = true
      this.config.update('exclude', f)
      
      let c = workspace.getConfiguration()
      await c.update('files.exclude', f)
      this.updateStatusbarItem()
    })

    // toggle between hidden and non hidden space
    this.registerCommand('workspace.toggleFocus', () => {
      if(this.inHiddenSpace) {
        this.enableFocus()
      } else {
        this.disableFocus()
      }
    })
    
    this.switch = window.createStatusBarItem(StatusBarAlignment.Right, this.config.get('statusbarPriority', 100))
    this.switch.command = 'workspace.toggleFocus'
    this.switch.text = '$(archive)'
    this.enableFocus()
  }

  public ConfigChanged(getconfig: boolean = true) {
    if(getconfig) this.config = workspace.getConfiguration('workspace')
    // TODO: update the switch?
  }

  public registerCommand(uri: string, callback: (...args: any[]) => any) {
    if(this.cmds.get(uri)) return
    let dis = commands.registerCommand(uri, callback)
    this.context.subscriptions.push(dis)
    this.cmds.set(uri, dis)
  }

  private async enableFocus() {
    this.inHiddenSpace = false
    commands.executeCommand('setContext', 'workspace.inHiddenSpace', this.inHiddenSpace)
    let c = workspace.getConfiguration()

    let ce = this.config.inspect('exclude')
    if(ce && ce.workspaceValue && Object.entries(<any>ce.workspaceValue).length) {
      await c.update('files.exclude', ce.workspaceValue)
    }
    this.updateStatusbarItem()
  }
  
  private async disableFocus() {
    this.inHiddenSpace = true
    commands.executeCommand('setContext', 'workspace.inHiddenSpace', this.inHiddenSpace)
    let c = workspace.getConfiguration()

    let de = c.inspect('files.exclude')
    let ce = this.config.inspect('exclude')
    if(ce && ce.workspaceValue && Object.entries(<any>ce.workspaceValue).length) {
      await c.update('files.exclude', {})
    } else if(de && de.workspaceValue&& Object.entries(<any>de.workspaceValue).length) {
      await this.config.update('exclude', de.workspaceValue)
      await c.update('files.exclude', {})
    }
    this.updateStatusbarItem()
  }

  private updateStatusbarItem() {
    if(this.switch) {
      let c = workspace.getConfiguration()
      let de = c.inspect('files.exclude')
      let ce = this.config.inspect('exclude')
      if((ce && ce.workspaceValue && Object.entries(<any>ce.workspaceValue).length) ||
         (de && de.workspaceValue && Object.entries(<any>de.workspaceValue).length)) {
        this.switch.show()
      } else {
        if(!this.config.get('alwaysShowToggle', true)) {
          this.switch.hide()
        }
      }
      
      if(this.inHiddenSpace) {
        this.switch.tooltip = 'Hide hidden files'
      } else {
        this.switch.tooltip = 'Show hidden files'
      }
    }
  }
}