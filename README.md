# WhatsApp Chat Export Flow

This project builds a Docker image, runs the WhatsApp export process, and packages the generated chat JSON files into a zip archive.

## What `start.sh` Does

[`start.sh`](/home/pratik/github/devspace/wce/start.sh) performs these steps:

1. Builds the Docker image as `wce`.
2. Runs the container with the current directory mounted to `/work`.
3. Looks for JSON files directly inside `./result` only.
4. Copies those JSON files into a temporary `chats/` directory.
5. Creates a zip archive named `whatsapp.zip` in the project root.

Subdirectories under `./result` are ignored for the zip step.

## `start.sh` Modes

[`start.sh`](/home/pratik/github/devspace/wce/start.sh) supports two modes.

### Default mode

```bash
bash start.sh
```

This mode shows a numbered list of top-level JSON files from `./result` before creating the zip.

Each entry shows:

- file name
- file size in human-readable format

Example prompt:

```text
1. Alice.json (1.2MiB)
2. Bob.json (824KiB)
3. Team Chat.json (3.8MiB)
```

You can then type numbers like `1 3` to include only selected files

### Unsafe mode

```bash
bash start.sh --unsafe
```

This mode includes all top-level `*.json` files from `./result` in the zip archive without prompting.

## Manual Commands

If you do not want to use [`start.sh`](/home/pratik/github/devspace/wce/start.sh), run these commands one by one:

### 1. Build the Docker image

```bash
docker build -t wce .
```

### 2. Run the container

```bash
docker run --rm -v "$PWD:/work" wce:latest
```

This should generate JSON files inside:

```text
./result
```

### 3. Create the required zip structure

```bash
mkdir -p tmp/chats
find result -maxdepth 1 -type f -name '*.json' -exec cp {} tmp/chats/ \;
cd tmp && zip -r ../whatsapp.zip chats
```

After that, the zip file will be available in the project root.

If you want a manual equivalent of the default safe selection flow, first inspect the files:

```bash
find result -maxdepth 1 -type f -name '*.json' -exec ls -lh {} \;
```

Then copy only the files you want into `tmp/chats` before creating the zip.

## Zip File Naming

The zip file does not have to be named `whatsapp.zip`.

Any filename ending in `.zip` is acceptable, for example:

- `whatsapp.zip`
- `export.zip`
- `customer-a.zip`

The archive filename is flexible. The internal directory structure is not.

## Required Zip Structure

The zip file must contain a top-level directory named `chats`, and all chat JSON files must be placed inside that directory.

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
