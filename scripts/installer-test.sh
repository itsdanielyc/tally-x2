#!/usr/bin/env bash
# L7 on macOS and Linux: open the bundle the way a user would, launch the
# installed app, confirm it stays alive for six seconds, then remove it.
# Linux needs a display: CI runs this script under xvfb-run.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
bundle="$here/../release"
log="${RUNNER_TEMP:-/tmp}/tally-launch.log"

ok()   { echo "ok: $*"; }
fail() { echo "FAIL: $*" >&2; exit 1; }

# $1 = command that starts the app, $2 = pattern matching the app's own
# process (not the launcher), so a launcher that outlives a crash cannot pass.
smoke_launch() {
  bash -c "$1" >"$log" 2>&1 &
  local launcher=$!
  sleep 6
  if pgrep -f "$2" >/dev/null; then
    ok "installed app launched and stayed alive for 6s ($1)"
    pkill -f "$2" || true
    sleep 2
  else
    cat "$log" || true
    fail "installed app did not stay alive ($1)"
  fi
  kill "$launcher" 2>/dev/null || true
  wait "$launcher" 2>/dev/null || true
}

case "$(uname -s)" in
  Darwin)
    dmg=$(ls "$bundle"/*.dmg | head -1); [ -f "$dmg" ] || fail "no dmg"
    mnt=$(mktemp -d)
    hdiutil attach "$dmg" -nobrowse -readonly -mountpoint "$mnt" >/dev/null
    ok "dmg mounted"
    app=$(ls -d "$mnt"/*.app | head -1); [ -d "$app" ] || fail "no .app inside dmg"
    dest="$HOME/Applications"; mkdir -p "$dest"; rm -rf "$dest/tally.app"
    cp -R "$app" "$dest/tally.app"
    hdiutil detach "$mnt" >/dev/null; ok "dmg copied to $dest and detached"
    xattr -cr "$dest/tally.app" || true
    smoke_launch "open -n '$dest/tally.app'" "$dest/tally.app/Contents/MacOS/tally"
    rm -rf "$dest/tally.app"; ok "app removed"
    ;;
  Linux)
    [ -n "${DISPLAY:-}" ] || fail "no DISPLAY; run under xvfb-run"
    deb=$(ls "$bundle"/*.deb | head -1); [ -f "$deb" ] || fail "no deb"
    sudo apt-get install -y "$deb" >/dev/null; ok "deb installed"
    command -v tally >/dev/null || fail "tally not on PATH after deb install"
    smoke_launch "tally" "/opt/tally/tally"
    sudo apt-get remove -y tally >/dev/null; ok "deb removed"
    command -v tally >/dev/null && fail "tally still on PATH after removal" || ok "tally gone from PATH"
    appimage=$(ls "$bundle"/*.AppImage | head -1); [ -f "$appimage" ] || fail "no AppImage"
    chmod +x "$appimage"
    smoke_launch "'$appimage' --appimage-extract-and-run" "appimage_extracted_.*/tally"
    ;;
  *) fail "unsupported OS" ;;
esac
echo "installer tests passed"
