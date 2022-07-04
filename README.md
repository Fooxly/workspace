<p align="center">
  <a title="Learn more about workspace" href="https://marketplace.visualstudio.com/items?itemName=fooxly.workspace">
    <img src="https://assets.fooxly.com/extensions/workspace/banner.jpg" alt="Workspace" width="100%" />
  </a>
</p>

```bash
ext install fooxly.workspace
```

[![Version](https://vsmarketplacebadge.apphb.com/version-short/fooxly.workspace.svg)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/fooxly.workspace.svg)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![Ratings](https://vsmarketplacebadge.apphb.com/rating-short/fooxly.workspace.svg)](https://marketplace.visualstudio.com/items?itemName=fooxly.workspace)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://github.com/Fooxly/workspace/blob/master/LICENSE)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# 🚀 Recently Added

* Multiple files/folder selection
* Theme coloring for the active state
* Option to disable the theme coloring
* Counter for the number of entries listed
* Option to disable the counter
* Optimalization to the add and remove functions

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
* View your hidden files
* Bring back a hidden file or folder

## 💻&nbsp; Preview

<img src="https://assets.fooxly.com/extensions/workspace/example.gif" alt="Preview" width="400" />

## 📐 Configuration

| property                             | type      | default               | options                | description |
| ---                                  | ---       | ---                   | ---                    | ----        |
| workspace.disableCounter             | boolean   | false                 | true, false            | Disable the counter inside the statusbar item |
| workspace.disableColoring            | boolean   | false                 | true, false            | Disable the coloring when the hidden files are visible |
| workspace.alwaysShowToggle           | boolean   | true                  | true, false            | Always show the toggle inside the statusbar |
| workspace.statusbarPriority          | number    | 0                     | -                      | The priority for the statubar toggle |
| workspace.multiRootWorkspaces        | boolean   | true                  | true, false            | Toggle multi-root workspace support |

## 🎨 Theming

| property              | description |
| ---                   | ---         |
| workspace.hiddenColor | The color used for when the hidden entries are visible. This is to easily show users that their hidden files are visible |

## Future plans

* Change the color of the filename to gray when viewing the hidden files / folders

## License

[MIT](https://github.com/Fooxly/workspace/blob/master/LICENSE) &copy; Fooxly
