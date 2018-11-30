# FFRK: Luca

A set of data-mining schemas, resources, and utilities for Final Fantasy Record Keeper.

Named after the dwarven mechanic of Final Fantasy IV.

Sample usage:

```sh
# Install dependencies.
yarn

# Download game files.  This puts battle.js and lib.js under ./tmp and
# processes them up to make them legible.
src/download-game-js.ts

# Process game files.  This creates src/battle.json, which you can use for
# futher processing.
src/game-js-to-json.ts

# Create a symlink to data captures from RK Squared for easier processing.
ln -s ~/Library/Application\ Support/RK\ Squared/captures/

# Get argument mappings from tmp/battle.js.  These aren't directly usable,
# but they can help with further processing.
src/get-battle-args.js tmp/battle.js  > tmp/battle-args.json

# Process data.  For example:
src/get-battle-init-abilities.ts $(ls captures/*get_battle_init_data.json | tail -n 1)
```
