#!/usr/bin/env bash

function resolve_extension_path() {
  find . -name '*.vsix' | head -1
}

function package_extension() {
  npm run vsce-package
}

function install_extension() {
  local -r _extension_path=$1
  code --install-extension ${_extension_path}
}

## SCRIPT ENTRYPOINT

package_extension
readonly extension_path=$(resolve_extension_path)
install_extension ${extension_path}

cat <<EOF

  Installed extension '${extension_path}' locally.

  Remember to restart VSCode IDE to have the new extension version loaded.

EOF
