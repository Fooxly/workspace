<p align="center">
  <a title="Learn more about workspace" href="https://marketplace.visualstudio.com/items?itemName=fooxly.workspace">
    <img src="https://assets.fooxly.com/extensions/workspace/banner.jpg" alt="Workspace" width="100%" />
  </a>
</p>

```bash
ext install fooxly.workspace
```

[![Version](https://img.shields.io/vscode-marketplace/v/fooxly.workspace.svg?style=flat-square&label=vscode%20marketplace)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![Installs](https://img.shields.io/vscode-marketplace/i/fooxly.workspace.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![Ratings](https://img.shields.io/vscode-marketplace/r/fooxly.workspace.svg?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/Fooxly/workspace/blob/master/LICENSE)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# 🚀 Recently Added

* Multi-root workspace support
* Optimized performance
* More insights into which files are hidden and how to bring them back
* Coloring for the file explorer to make the hidden files / folders pop when visible

## ❤&nbsp; Support us

> About **40%** of your donation goes to one of the charities we support. For further information or questions please visit [our website](https://www.fooxly.com/charity) or contact us via [charity@fooxly.com](mailto:charity@fooxly.com).

<p>
  <a title="BuyMeACoffee" href="https://www.buymeacoffee.com/fooxly">
    <img src="https://assets.fooxly.com/third_party/buymeacoffee.png" alt="BuyMeACoffee" width="180" height="43" />
  </a>&nbsp;&nbsp;
  <a title="Patreon" href="https://www.patreon.com/fooxly">
    <img src="https://assets.fooxly.com/third_party/patreon.png" alt="Patreon" width="180" height="43" />
  </a>&nbsp;&nbsp;
  <a title="PayPal" href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3GEYSYZFXV9GE">
    <img src="https://assets.fooxly.com/third_party/paypal.png" alt="PayPal" width="180" height="43" />
  </a>
</p>

<br/>

# 🔍 Workspace

`Workspace` provides a simple way to hide files you don't want to be visible while coding.

A package by [Fooxly](https://www.fooxly.com).

## 📕 Features

* Hide specific folders and files from your project
* View your hidden files with our statusbar toggle (or command)
* Easily remove files from the hidden list with our explorer context menu

## 💻&nbsp; Preview

<img src="https://assets.fooxly.com/extensions/workspace/example.gif" alt="Preview" width="400" />

## 📐 Configuration

| property                             | type      | default               | options                | description |
| ---                                  | ---       | ---                   | ---                    | ----        |
| workspace.disableCounter             | boolean   | false                 | true, false            | Disable the counter inside the statusbar item |
| workspace.disableColoring            | boolean   | false                 | true, false            | Disable the coloring when the hidden files are visible |
| workspace.alwaysShowToggle           | boolean   | true                  | true, false            | Always show the toggle inside the statusbar |
| workspace.statusbarPriority          | number    | 0                     | -                      | The priority for the statubar toggle |

## 🎨 Theming

| property              | description |
| ---                   | ---         |
| workspace.explorer.directlyHidden | Used in the explorer file list when the hidden entries are visible. This makes it easy for you to spot the hidden files |
| workspace.explorer.parentHidden | Used in the explorer file list when the hidden entries are visible. This makes items highlighted with are hidden due to their parent or other glob patterns |
| workspace.statusbar.buttonVisible | Used on the statusbar button when the hidden entries are visible. This makes it easy for you to see if your hidden files are visible |

## License

[MIT](https://github.com/Fooxly/workspace/blob/master/LICENSE) &copy; Fooxly
