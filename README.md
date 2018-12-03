# FFRK: Luca

A set of data-mining schemas, resources, and utilities for Final Fantasy Record Keeper.

Named after the dwarven mechanic of Final Fantasy IV.

Sample usage:

```sh
# Install dependencies.
yarn

# Build the scripts.
yarn build

# Download game files.  This puts battle.js and lib.js under ./tmp and
# processes them up to make them legible.
node dist/download-game-js.js

# Process game files.  This creates battle.json under src/gl and src/jp, which
# you can use for # futher processing.
node dist/convert-game-js-to-json.js

# Create a symlink to data captures from RK Squared for easier processing.
ln -s ~/Library/Application\ Support/RK\ Squared/captures/

# Get argument mappings from tmp/battle.js.  These aren't directly usable,
# but they can help with further processing.
node dist/get-battle-args.js tmp/gl/battle.js --lang=gl
node dist/get-battle-args.js tmp/jp/battle.js --lang=jp

# Process data.  For example:
src/get-battle-init-abilities.js $(ls captures/*get_battle_init_data.json | tail -n 1)
```
