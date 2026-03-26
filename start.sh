#!/bin/bash

set -euo pipefail

IMAGE_NAME="wce"
RESULT_DIR="$PWD/result"
ZIP_NAME="$PWD/whatsapp.zip"
TMP_DIR="$(mktemp -d)"
SAFE_MODE=true

usage() {
    cat <<'EOF'
Usage: bash start.sh [--unsafe]

Options:
  --unsafe  Include all JSON files from ./result without prompting.
EOF
}

human_size() {
    numfmt --to=iec-i --suffix=B "$1"
}

copy_all_json_files() {
    find "$RESULT_DIR" -maxdepth 1 -type f -name '*.json' -exec cp {} "$TMP_DIR/chats/" \;
}

copy_selected_json_files() {
    mapfile -t json_files < <(find "$RESULT_DIR" -maxdepth 1 -type f -name '*.json' | sort)

    if [ "${#json_files[@]}" -eq 0 ]; then
        echo "No JSON files found in $RESULT_DIR" >&2
        exit 1
    fi

    echo "Select files to include in the zip."
    echo "Enter numbers separated by spaces."

    for i in "${!json_files[@]}"; do
        file_path="${json_files[$i]}"
        file_name="$(basename "$file_path")"
        file_size="$(stat -c %s "$file_path")"
        echo "$((i + 1)). $file_name ($(human_size "$file_size"))"
    done

    read -r -p "Selection: " selection

    if [ -z "$selection" ]; then
        echo "No files selected." >&2
        exit 1
    fi

    declare -A seen_indexes=()

    for index in $selection; do
        if ! [[ "$index" =~ ^[0-9]+$ ]]; then
            echo "Invalid selection: $index" >&2
            exit 1
        fi

        if [ "$index" -lt 1 ] || [ "$index" -gt "${#json_files[@]}" ]; then
            echo "Selection out of range: $index" >&2
            exit 1
        fi

        if [ -n "${seen_indexes[$index]:-}" ]; then
            continue
        fi

        seen_indexes[$index]=1
        cp "${json_files[$((index - 1))]}" "$TMP_DIR/chats/"
    done
}

cleanup() {
    rm -rf "$TMP_DIR"
}

trap cleanup EXIT

while [ "$#" -gt 0 ]; do
    case "$1" in
        --unsafe)
            SAFE_MODE=false
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
    shift
done

echo "Step 1: Building the Docker image..."
docker build -t "$IMAGE_NAME" .

echo "Step 2: Running the container..."
docker run --rm -v "$PWD:/work" "$IMAGE_NAME:latest"

echo "Step 3: Packaging JSON output..."

if [ ! -d "$RESULT_DIR" ]; then
    echo "Result directory not found: $RESULT_DIR" >&2
    exit 1
fi

mkdir -p "$TMP_DIR/chats"

if [ "$SAFE_MODE" = true ]; then
    copy_selected_json_files
else
    copy_all_json_files
fi

if ! find "$TMP_DIR/chats" -maxdepth 1 -type f -name '*.json' | grep -q .; then
    echo "No JSON files found in $RESULT_DIR" >&2
    exit 1
fi

rm -f "$ZIP_NAME"

(
    cd "$TMP_DIR"
    zip -r "$ZIP_NAME" chats
)

echo "Created $ZIP_NAME"
