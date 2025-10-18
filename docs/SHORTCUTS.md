# Keyboard Shortcuts Reference

**Quick Access:** All commands use `Ctrl+Alt+P` prefix (Windows/Linux) or `Cmd+Alt+P` (Mac)

---

## Core Commands

| Command | Shortcut (Win/Linux) | Shortcut (Mac) | Description |
|---------|---------------------|----------------|-------------|
| **Show Menu** | `Ctrl+Alt+P Ctrl+Alt+P` | `Cmd+Alt+P Cmd+Alt+P` | Show all available commands |
| **Open View** | `Ctrl+Alt+P O` | `Cmd+Alt+P O` | Open paired comments view |
| **Add Comment** | `Ctrl+Alt+P A` | `Cmd+Alt+P A` | Add comment to current line |
| **Edit Comment** | `Ctrl+Alt+P E` | `Cmd+Alt+P E` | Edit existing comment |
| **Delete Comment** | `Ctrl+Alt+P D` | `Cmd+Alt+P D` | Delete comment |

---

## Navigation Commands

| Command | Shortcut (Win/Linux) | Shortcut (Mac) | Status |
|---------|---------------------|----------------|--------|
| **Show All Comments** | `Ctrl+Alt+P S` | `Cmd+Alt+P S` | ✅ Available |
| **Next Comment** | `Ctrl+Alt+P N` | `Cmd+Alt+P N` | 📋 Planned (v0.3.0) |
| **Previous Comment** | `Ctrl+Alt+P B` | `Cmd+Alt+P B` | 📋 Planned (v0.3.0) |
| **Find in Comments** | `Ctrl+Alt+P F` | `Cmd+Alt+P F` | 📋 Planned (v0.5.0) |

---

## View Controls

| Command | Shortcut (Win/Linux) | Shortcut (Mac) | Status |
|---------|---------------------|----------------|--------|
| **Toggle Scroll Sync** | `Ctrl+Alt+P T` | `Cmd+Alt+P T` | ✅ Available |
| **Toggle File Visibility** | (Command Palette only) | (Command Palette only) | ✅ Available |

---

## Import/Export Commands

| Command | Shortcut (Win/Linux) | Shortcut (Mac) | Status |
|---------|---------------------|----------------|--------|
| **Copy All Comments** | `Ctrl+Alt+P C` | `Cmd+Alt+P C` | 📋 Planned (v0.4.0) |
| **Export Comments** | `Ctrl+Alt+P X` | `Cmd+Alt+P X` | 📋 Planned (v0.4.0) |
| **Import Comments** | `Ctrl+Alt+P I` | `Cmd+Alt+P I` | 📋 Planned (v0.4.0) |

---

## Advanced Commands (Future)

| Command | Shortcut (Win/Linux) | Shortcut (Mac) | Status |
|---------|---------------------|----------------|--------|
| **Capture Output** | `Ctrl+Alt+P Ctrl+Alt+O` | `Cmd+Alt+P Ctrl+Alt+O` | 📋 Planned (v2.2.0) |
| **Mark Resolved** | `Ctrl+Alt+P M` | `Cmd+Alt+P M` | 📋 Planned (v0.6.0) |
| **Generate Link** | `Ctrl+Alt+P L` | `Cmd+Alt+P L` | 📋 Planned (v0.7.0) |

---

## Context Menu Actions

Right-click in editor to access:
- **Paired Comments: Open**
- **Paired Comments: Add Comment**
- **Paired Comments: Edit Comment** (when cursor on commented line)
- **Paired Comments: Delete Comment** (when cursor on commented line)

---

## Command Palette

All commands are available via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

```
> Paired Comments: Show Menu
> Paired Comments: Open
> Paired Comments: Add Comment
> Paired Comments: Edit Comment
> Paired Comments: Delete Comment
> Paired Comments: Show All Comments
> Paired Comments: Toggle Scroll Sync
> Paired Comments: Copy All Comments
> Paired Comments: Export Comments
> Paired Comments: Import Comments
> Paired Comments: Find in Comments
> Paired Comments: Next Comment
> Paired Comments: Previous Comment
> Paired Comments: Toggle .comments Files Visibility
```

---

## Customizing Shortcuts

To customize any keybinding:

1. Open Keyboard Shortcuts: `Ctrl+K Ctrl+S` (Win/Linux) or `Cmd+K Cmd+S` (Mac)
2. Search for "Paired Comments"
3. Click the pencil icon next to command
4. Press desired key combination
5. Press Enter to confirm

---

## Tips & Tricks

### Quick Access Pattern
All shortcuts follow `Ctrl+Alt+P` + letter pattern:
- **A** = Add
- **E** = Edit
- **D** = Delete
- **O** = Open
- **S** = Show all
- **T** = Toggle sync
- **C** = Copy
- **X** = eXport
- **I** = Import
- **F** = Find
- **N** = Next
- **B** = Back (previous)

### Remember the Pattern
`Ctrl+Alt+P` twice shows the menu - from there you can see all commands!

### Context Menu Alternative
If you forget shortcuts, right-click in editor for quick access to common commands.

---

## Platform Notes

### Windows/Linux
- Primary modifier: `Ctrl+Alt+P`
- All shortcuts use `Ctrl` key

### macOS
- Primary modifier: `Cmd+Alt+P`
- All shortcuts use `Cmd` key instead of `Ctrl`

### Linux-Specific
Some Linux desktop environments may reserve `Ctrl+Alt+P` for system functions. If shortcuts don't work:

1. Check for conflicting keybindings in system settings
2. Customize shortcuts (see "Customizing Shortcuts" above)
3. Use Command Palette as alternative

---

## Related Documentation

- [Feature Guide](FEATURES.md) - What each command does
- [Getting Started](guides/getting-started.md) - First-time user guide
