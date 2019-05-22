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

# Download FFRK Community Spreadsheet data.  Luca uses this to help annotate
# the data that it's mining.
yarn get-enlir

# Process constants from battle.js.  This creates battle.json under src/gl and
# src/jp, which you can use for # further processing.
node dist/convert-game-js-to-json.js

# Get argument mappings from battle.js.
yarn get-battle-args

# Copy JSON files to the distribution directory.
yarn copy-json

# Optionally, create a symlink to data captures from RK Squared for easier
# processing.  For example, on macOS:
ln -s ~/Library/Application\ Support/RK\ Squared/captures/

# Process data.  For example:
node dist/get-battle-init-abilities.js $(ls captures/*get_battle_init_data.json | tail -n 1)
```

## Enlir Utilities

A set of scripts to download, convert, and update the Enlir spreadsheet and FFRK Community Spreadsheet.

Sample usage:

```sh
# Install dependencies.
yarn

# Compile the TypeScript to JavaScript.
yarn build

# Download the latest data from the FFRK Community Spreadsheet
# and convert it to JSON under src/enlir.
yarn get-enlir

# Update the FFRK Community Spreadsheet by marking several items
# as released in GL.
node dist/update-enlir.js releaseInGl relics 21001145
node dist/update-enlir.js releaseInGl soulBreaks 23080007 23080009
node dist/update-enlir.js releaseInGl legendMateria 201020403
```

Tips for using `update-enlir.js`:

- Items can be given by name or ID; ID is slightly safer, since it's always unambiguous.
- Log output from [RK²](https://www.rk-squared.com/) can help indicate when updates need to be made. (For example, going to the Relic Draw page within FFRK will cause RK² to log any items that are newly released in Global.)
- `update-enlir.js` supports a `--sheet` option, so you can point it at a test copy of the spreadsheet for development and debugging. The Google Sheets ID to use for the test copy is currently hard-coded.
