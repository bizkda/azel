# Azel

A fast, native desktop chat app built with Tauri, letting you chat with local or remote AI models right from your desktop.

![Azel screenshot](docs/screenshot.png)
![Azel screenshot](docs/screenshot1.png)
<!-- Replace with an actual screenshot or demo GIF before publishing -->

## Features

-  Clean, native chat interface
-  Lightweight — built with Tauri (Rust backend + web frontend), not Electron
-  Switch between multiple AI models
-  Quick-toggle floating window (Hyprland: `CTRL + SPACE`)
-  Cross-platform: Linux, Windows, and macOS

## Installation

### Download (recommended)

Grab the latest release for your platform from the [Releases page](https://github.com/bizkda/azel/releases).

- **Linux:** `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL/openSUSE), or `.AppImage` (any distro, no install needed)
- **Windows:** `.msi` or `.exe` (NSIS installer)
- **macOS:** `.dmg` — separate builds for Apple Silicon and Intel

### Build from source

**Prerequisites:**
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) toolchain
- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

```bash
git clone https://github.com/bizkda/azel.git
cd azel
npm install
npm run tauri build
```

The built app and installers will be in `src-tauri/target/release/` (raw binary) and `src-tauri/target/release/bundle/` (platform installers — `.deb`/`.rpm`/`.AppImage` on Linux, `.msi`/`.exe` on Windows, `.dmg` on macOS).

> **Note:** cross-compiling isn't supported — building on Linux only produces Linux installers, building on Windows only produces Windows installers, and so on. To get all platforms, either build on each OS separately or use the GitHub Actions release workflow (see below).

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

## Releasing (for maintainers)

New releases are built and published automatically via GitHub Actions for Linux, Windows, and macOS. To cut a new release:

```bash
git tag v0.2.0
git push origin v0.2.0
```

This triggers `.github/workflows/release.yml`, which builds all platform installers and attaches them to a **draft** GitHub Release. Review the draft, then publish it manually from the Releases tab.

## Tech stack

- **Frontend:** React + TypeScript
- **Backend:** Rust (Tauri)
- **Styling:** Tailwind CSS

## Troubleshooting

- **AppImage won't launch on Linux:** make sure it's executable: `chmod +x azel_0.1.0_amd64.AppImage`, then run it directly (`./azel_0.1.0_amd64.AppImage`). Requires `fuse2` on some distros — e.g. `sudo pacman -S fuse2` (Arch) or `sudo apt install libfuse2` (Debian/Ubuntu).
- **Models not showing up:** confirm your model source is running/reachable, and check the config file path above.

## License

MIT License — see [LICENSE](LICENSE) for details.
