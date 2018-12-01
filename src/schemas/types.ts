// A `/Content/lang/ww/compile` path
export type ContentPath = string;

export interface Asset {
  bundle: {
    // `/Content/lang/ww/compile` path to PNG, JSON, or OGG
    [contentPath: string]: {
      // Hashes are MD5 checksums, base64-encoded, with two trailing `=` stripped.
      hash: string;
    };
  };
  assetPath: ContentPath;
}

export interface AssetCollection {
  [assetKey: string]: Asset;
}

export interface SimpleAssets {
  [key: string]: string;
}

/**
 * A string containing JSON.  E.g.:
 * '{"ptcl_shot_thief_zanzo":["pb_shot_thief_zanzo"]}
 */
export type JsonString = string;
