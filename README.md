# Azel

A fast, native desktop chat app built with Tauri, letting you chat with local or remote AI models right from your desktop.

![Azel screenshot](docs/screenshot.png)
<!-- Replace with an actual screenshot or demo GIF before publishing -->

## Features

- 🗨️ Clean, native chat interface
- ⚡ Lightweight — built with Tauri (Rust backend + web frontend), not Electron
- 🔀 Switch between multiple AI models
- 🪟 Quick-toggle floating window (Hyprland: `CTRL + SPACE`)
- 🖥️ Cross-platform: Linux, macOS, Windows *(update to match what you actually support)*

## Installation

### Download (recommended)

Grab the latest release for your platform from the [Releases page](https://github.com/yourusername/azel/releases).

- **Linux:** `.AppImage` or `.deb`
- **macOS:** `.dmg`
- **Windows:** `.msi`

### Build from source

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) toolchain
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

```bash
git clone https://github.com/yourusername/azel.git
cd azel
npm install
npm run tauri build
```

The built app will be in `src-tauri/target/release/bundle/`.

## Usage

1. Launch Azel.
2. Select a model from the dropdown *(populated automatically from your available models)*.
3. Type your message and hit **Send** or press `Enter`.
4. Toggle the Azel window from anywhere with `CTRL + SPACE` *(Hyprland users — see Configuration below)*.

## Configuration

### Models

Azel automatically detects available models on startup. To add or configure model sources, edit:

```
~/.config/azel/config.toml
```
<!-- Update this path/format to match your actual config setup -->

### Hyprland: floating quick-toggle window

If you're on Hyprland, Azel ships with a window rule that makes it a floating, pinned window on a special workspace, toggleable with `CTRL + SPACE`. Add this to your `hyprland.conf`:

```ini
windowrule {
    name = "azel_rule"
    match:class = ^(azel)$
    float = on
    pin = on
}
exec-once = hyprctl dispatch movetoworkspacesilent special:azel
bind = CTRL, SPACE, togglespecialworkspace, azel
```

## Tech stack

- **Frontend:** React + TypeScript
- **Backend:** Rust (Tauri)
- **Styling:** Tailwind CSS

## Troubleshooting

- **App won't launch on Linux:** make sure you've made the AppImage executable: `chmod +x Azel.AppImage`
- **Models not showing up:** confirm your model source is running/reachable, and check the config file path above.

## License

MIT License — see [LICENSE](LICENSE) for details.
