# Change Log

## [1.3.1] - 2025-04-01

### Changed

- Upgraded dependencies and project foundation

## [1.3.0] - 2023-08-29

### Added

- Colors for items which are hidden due to their parent or other glob patterns
- We added support for translations (currently only English is translated, we are open for PRs)

### Changed

- Optimized performance
- workspace.isHidden is no longer used
- workspace.hiddenColor is changed to workspace.explorer.directlyHidden to match workspace.explorer.parentHidden
- Fixed an issue where the extension would rewrite the settings.json even if nothing happened
- Events are now only fired when something related to the workspace happens and not when unrelated settings are changed

## [1.2.0] - 2022-07-21

### Added

- File explorer coloring for hidden files

## [1.1.6] - 2022-07-21

### Added

- Multi-root workspace support

## [1.1.1] - 2020-04-08

### Added

- Preview inside  the README.md

## [1.1.0] - 2020-04-08

### Added

- Color property called `workspace.hiddenColor` which shows when the hidden files are visible
- Option to disable the new coloring
- Added number in statusbar item to show the amount of hidden entries (folders don't count the files inside, folders just add 1)
- Option to disable the counter for the statusbar item

### Changed

- Use true/false value of the files.exclude instead of removing the object content
- Forget and Focus buttons are now 1 single button called toggle (for folders and files)

### Removed

- Removed workspace.exclude property

## [1.0.9] - 2020-03-04

### Changed

- Small text fixes to the README.md which were not noticed before

## [1.0.8] - 2020-03-04

### Changed

- README.md

## [1.0.7] - 2020-02-12

### Changed

- Fixed an issue with focussing files

## [1.0.4] - 2019-10-10

### Added

- Correct MIT license from the project itself

## [1.0.3] - 2019-10-10

### Changed

- Moved all our assets to our new developer portal

## [1.0.2] - 2019-10-10

### Added

- Disable creation of settings file when there are no excluded files
- Only show the statusbar toggle when there are items hidden
- Option to switch the statusbar toggle between always active or only when items are hidden
- Priority option for the statusbar toggle

## [1.0.1] - 2019-10-10

### Added

- Support to hide files
- Support to hide folders
- Toggle between normal and hidden view
- Support to get files back to focus
- Support to get folders back to focus
- Created project
