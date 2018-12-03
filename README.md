# FFRK: Luca

A set of data-mining schemas, resources, and utilities for Final Fantasy Record Keeper.

Named after the dwarven mechanic of Final Fantasy IV.

Sample usage:

```sh
# Install dependencies.
yarn

# Compile the TypeScript to JavaScript.
yarn build

# Download game files.  This puts battle.js and lib.js under ./tmp and
# processes them up to make them legible.
node dist/download-game-js.js

# Process constants from battle.js.  This creates battle.json under src/gl and 
# src/jp, which you can use for # futher processing.
node dist/convert-game-js-to-json.js

# Get argument mappings from battle.js.
yarn get-battle-args

# Copy JSON files to the distribution directory.
yarn copy-json

# Create a symlink to data captures from RK Squared for easier processing.
# For example, on macOS:
ln -s ~/Library/Application\ Support/RK\ Squared/captures/

# Process data.  For example:
src/get-battle-init-abilities.js $(ls captures/*get_battle_init_data.json | tail -n 1)
```
