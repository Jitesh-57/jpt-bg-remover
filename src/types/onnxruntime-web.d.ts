// onnxruntime-web ships its typings at the package root (types.d.ts, which
// declares "onnxruntime-web", "onnxruntime-web/webgpu", …), but its
// package.json "exports" map has no "types" condition, so TypeScript's
// bundler resolution never finds them. Pull the file in directly.
/// <reference path="../../node_modules/onnxruntime-web/types.d.ts" />
