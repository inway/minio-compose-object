# Test script for MinIO compose object functionality

Simple PoC to test `composeObject` method from `minio-js` library.

## Setup

Copy `.env.example` to `.env` and modify the values accordingly to your MinIO setup.

## Usage

First modify `index.mjs` settings and set desired part count (per S3 specs its maximum of 10000 parts) and then prepare the parts by running:

```console
$ node index.mjs prepare
```

This will create the parts objects in the specified bucket.

Then run the compose operation:

```console
$ node index.mjs
```

## Test with parallel uploads (with limited concurrency)

Use `minio-js` from our fork instead to test limited concurrency uploads:

```console
$ npm install https://github.com/inway/minio-js/releases/download/v8.0.7-fix.1/minio-8.0.7.tgz
```

To switch back to the original `minio-js` library, run:

```console
$ npm install minio@latest
```

## Trace files

Sample `mc admin trace` files are included in the `traces/` folder for reference.

Traces for compose operation with 1000 parts:

- [parallel-1000-parts.trace](./traces/parallel-1000-parts.trace) - with current implementation,
- [sequential-1000-parts.trace](./traces/sequential-1000-parts.trace) - for sequential approach proposed here (inway/minio-js@3704b5dc3d42bb18a20baf5a0425267766becf48),
- [parallel-concurrent-1000-parts.trace](./traces/parallel-concurrent-1000-parts.trace) - with parallel uploads, but with limited concurrency (inway/minio-js@b7110976d4ef8e9b7b01e0002ee7fe6f7b1869eb).
