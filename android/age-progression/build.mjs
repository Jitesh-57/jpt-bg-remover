#!/usr/bin/env node
/**
 * Builds the AI Age Progression Android app: a Trusted Web Activity that opens
 * https://www.sjpt.io/m/age-progression full screen, with Google Play Billing.
 *
 *   KEYSTORE=/path/age-ai-upload-key.jks KEYSTORE_PASSWORD=… node android/age-progression/build.mjs
 *
 * Needs JDK 17+ and the Android SDK (ANDROID_HOME, with build-tools and the
 * platform the template targets). Writes to android/age-progression/build/:
 *   out/age-ai-<version>.aab   upload this to Play Console
 *   out/age-ai-<version>.apk   install this on a phone to test
 *
 * The Android project is generated fresh from twa-manifest.json on every run
 * by @bubblewrap/core (the library behind the Bubblewrap CLI, minus its
 * prompts), so twa-manifest.json is the one file to edit. For a new release,
 * raise appVersionCode and appVersion there.
 *
 * --icons-from <origin>  read the icons from another origin (e.g. a local
 *                        `next start`) while they are not yet live.
 */
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUBBLEWRAP = "@bubblewrap/core@1.27.0";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(HERE, "build");
const PROJECT = path.join(BUILD, "project");
const OUT = path.join(BUILD, "out");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const need = (name) => {
  if (!process.env[name]) throw new Error(`Set ${name}.`);
  return process.env[name];
};
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: "inherit", ...opts });

// Bubblewrap lives outside the repo: its type files would otherwise be picked
// up by the site's tsconfig, and the site never needs it.
const tools = process.env.TWA_TOOLS_DIR || path.join(os.homedir(), ".cache", "sjpt-twa");
if (!fs.existsSync(path.join(tools, "node_modules", "@bubblewrap", "core"))) {
  fs.mkdirSync(tools, { recursive: true });
  run("npm", ["install", "--prefix", tools, "--no-save", "--silent", BUBBLEWRAP]);
}
const { TwaGenerator, TwaManifest, ConsoleLog } = createRequire(path.join(tools, "noop.js"))("@bubblewrap/core");

const sdk = need("ANDROID_HOME");
const keystore = path.resolve(need("KEYSTORE"));
need("KEYSTORE_PASSWORD");

const json = JSON.parse(fs.readFileSync(path.join(HERE, "twa-manifest.json"), "utf8"));
const iconsFrom = arg("--icons-from");
if (iconsFrom) {
  for (const k of ["iconUrl", "maskableIconUrl"]) json[k] = new URL(new URL(json[k]).pathname, iconsFrom).href;
}
json.signingKey = { ...json.signingKey, path: keystore };
const manifest = new TwaManifest(json);
const problem = manifest.validate();
if (problem) throw new Error(`twa-manifest.json: ${problem}`);

fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await new TwaGenerator().createTwaProject(PROJECT, manifest, new ConsoleLog("twa"));
fs.writeFileSync(path.join(PROJECT, "local.properties"), `sdk.dir=${sdk}\n`);

run(path.join(PROJECT, "gradlew"), ["--no-daemon", "--quiet", "bundleRelease", "assembleRelease"], { cwd: PROJECT });

const buildTools = path.join(sdk, "build-tools", fs.readdirSync(path.join(sdk, "build-tools")).sort().pop());
const name = `age-ai-${manifest.appVersionName}`;
const apk = path.join(OUT, `${name}.apk`);
const aab = path.join(OUT, `${name}.aab`);
const pass = ["--ks-pass", "env:KEYSTORE_PASSWORD", "--key-pass", "env:KEYSTORE_PASSWORD"];

// APK: align, then sign (v2/v3), for installing straight on a phone.
const aligned = path.join(BUILD, "aligned.apk");
run(path.join(buildTools, "zipalign"), ["-f", "-p", "4", path.join(PROJECT, "app/build/outputs/apk/release/app-release-unsigned.apk"), aligned]);
run(path.join(buildTools, "apksigner"), ["sign", "--v4-signing-enabled", "false", "--ks", keystore, "--ks-key-alias", json.signingKey.alias, ...pass, "--out", apk, aligned]);

// AAB: Play takes the bundle signed with the upload key, then re-signs it.
fs.copyFileSync(path.join(PROJECT, "app/build/outputs/bundle/release/app-release.aab"), aab);
run("jarsigner", ["-keystore", keystore, "-storepass:env", "KEYSTORE_PASSWORD", "-sigalg", "SHA256withRSA", "-digestalg", "SHA-256", aab, json.signingKey.alias], { stdio: "ignore" });

console.log(`\nBuilt:\n  ${aab}\n  ${apk}`);
