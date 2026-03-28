# WhatsApp Chat Export Flow

This project builds a Docker image, runs the WhatsApp export process, filters out group chats, and packages the remaining chat JSON files into a zip archive.

## Bun Entry Point

Use [`start.ts`](/home/pratik/github/devspace/wce/start.ts) as the main entry point.

Run it with:

```bash
bun run start.ts
```

Unsafe mode:

```bash
bun run start.ts --unsafe
```

## What `start.ts` Does

[`start.ts`](/home/pratik/github/devspace/wce/start.ts) performs these steps:

1. Builds the Docker image as `wce`.
2. Runs the container with the current directory mounted to `/work`.
3. Reads only top-level `*.json` files from `./result`.
4. Ignores any file whose parsed [`WSchema`](/home/pratik/github/devspace/wce/src/types/WSchema.ts) contains a group chat key ending in `@g.us`.
5. In default mode, shows the remaining files as a numbered list with human-readable sizes.
6. Creates a zip archive named `whatsapp.zip` in the project root with the required `chats/` directory structure.

Subdirectories under `./result` are ignored.

## Modes

### Default mode

```bash
bun run start.ts
```

This mode is interactive. It shows only non-group JSON files from `./result`.

Each entry shows:

- file name
- file size in human-readable format

Example prompt:

```text
1. Alice.json (1.2MiB)
2. Bob.json (824KiB)
```

You can then type numbers like `1 2` to include only selected files.

### Unsafe mode

```bash
bun run start.ts --unsafe
```

This mode skips the selection prompt and includes all non-group top-level `*.json` files from `./result`.

## Manual Docker Commands

If you do not want to use [`start.ts`](/home/pratik/github/devspace/wce/start.ts), you can still run the Docker steps manually:

### 1. Build the Docker image

```bash
docker build -t wce .
```

### 2. Run the container

```bash
docker run --rm --mount type=bind,source="$PWD",target=/work wce:latest
```

This should generate JSON files inside:

```text
./result
```

The filtering, interactive selection, and zip creation logic are handled by [`start.ts`](/home/pratik/github/devspace/wce/start.ts).

## Group Chat Filtering

Files representing group chats are automatically excluded before selection and packaging.

The exclusion rule is based on the top-level keys in [`WSchema`](/home/pratik/github/devspace/wce/src/types/WSchema.ts):

- direct chat: `${string}@s.whatsapp.net`
- group chat: `${string}@g.us`

If a JSON file contains a top-level key ending in `@g.us`, it is ignored.

## Zip File Naming

The zip file does not have to be named `whatsapp.zip`.

Any filename ending in `.zip` is acceptable, for example:

- `whatsapp.zip`
- `export.zip`
- `customer-a.zip`

The archive filename is flexible. The internal directory structure is not.

## Required Zip Structure

The zip file must contain a top-level directory named `chats`, and all included chat JSON files must be placed inside that directory.

Correct structure:

```text
anything.zip
└── chats/
    ├── contact1.json
    ├── contact2.json
    └── contact3.json
```

## Invalid Structures

These are not valid:

- JSON files at the root of the zip
- A different top-level folder name such as `results/` or `json/`
- Nested chat files like `chats/2026/contact1.json`

Examples of invalid layouts:

```text
anything.zip
├── contact1.json
└── contact2.json
```

```text
anything.zip
└── results/
    ├── contact1.json
    └── contact2.json
```
