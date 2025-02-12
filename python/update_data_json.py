#!/usr/bin/env python3

import os
import sys
import json


def update_data_json(data_path, overwrite=False):
    """
    Loads data.json from data_path, enumerates each subfolder,
    collects image filenames, and stores them in the JSON under "files".
    """
    print("trying to process: ", os.path.abspath(data_path))
    data_file = os.path.join(data_path, "data.json")
    default_fields = {"exposure": {"tp": "exp", "val": 1},
                      "hsv": {"tp": "hsv", "val": [0, 0, 0]},
                      "note": {"tp": "str", "val": "Add some notes here."},
                      "ok": {"tp": "bool", "val": 1}}
    if overwrite:
        data = {}
    else:
        # 1) Load existing data.json
        try:
            with open(data_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"Error: {data_file} not found.")
            return
        except json.JSONDecodeError as e:
            print(f"Error parsing {data_file}: {e}")
            return

    # 2) Scan subfolders. For each folder "XYZ", store images in data["XYZ"]["files"].
    for entry in os.listdir(data_path):
        folder_path = os.path.join(data_path, entry)

        if os.path.isdir(folder_path) and entry != "__pycache__":
            current_data = data.get(entry, {})
            # Collect image files in this folder
            images = [
                fname for fname in os.listdir(folder_path)
                if fname.lower().endswith((".jpg", ".jpeg", ".png"))
            ]

            # fill in default values
            for key, value in default_fields.items():
                if key not in current_data:
                    current_data[key] = value

            # Ensure that the JSON object for "entry" exists
            data[entry] = current_data

            # Update/override the "files" list
            data[entry]["files"] = images

    # 3) Write updated JSON back to disk
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Updated {data_file} successfully.")


def main():
    data_path = r"../data"

    update_data_json(data_path, overwrite=True)


if __name__ == "__main__":
    main()
