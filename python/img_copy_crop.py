import os
import cv2
import numpy as np


def ensure_directory_exists(path):
    """Creates directory if it does not exist."""
    if not os.path.exists(path):
        os.makedirs(path)


def process_image(input_path, output_path, crop_output_path, folder_prefix):
    """Resizes image to half and saves as compressed JPEG. Also creates a center crop."""
    img = cv2.imread(input_path)
    if img is None:
        return

    # Resize to half
    height, width = img.shape[:2]
    resized_img = cv2.resize(img, (width // 2, height // 2), interpolation=cv2.INTER_AREA)

    # Generate filename with folder prefix
    filename = os.path.basename(input_path)
    name, ext = os.path.splitext(filename)
    new_filename = f"{folder_prefix}_{name}.jpg"
    output_file_path = os.path.join(output_path, new_filename)

    # Save resized image as compressed JPEG
    cv2.imwrite(output_file_path, resized_img, [cv2.IMWRITE_JPEG_QUALITY, 90])

    # # Create a 512x512 center crop if image is large enough
    # if height >= 512 and width >= 512:
    #     crop_x = (width - 512) // 2
    #     crop_y = (height - 512) // 2
    #     crop_img = img[crop_y:crop_y + 512, crop_x:crop_x + 512]
    #
    #     # Save the cropped image
    #     crop_filename = f"{folder_prefix}_{name}_crop.jpg"
    #     crop_file_path = os.path.join(crop_output_path, crop_filename)
    #     cv2.imwrite(crop_file_path, crop_img, [cv2.IMWRITE_JPEG_QUALITY, 90])


def process_folder(input_folder, output_folder):
    """Recursively processes a folder and maintains structure in output_folder."""
    for root, dirs, files in os.walk(input_folder):
        relative_path = os.path.relpath(root, input_folder)
        output_path = os.path.join(output_folder, relative_path)
        crop_output_path = os.path.join(output_path, 'crop')
        ensure_directory_exists(output_path)

        folder_name = os.path.basename(root)
        has_images = False

        for file in files:
            if file.lower().endswith(('jpg', 'jpeg', 'png', 'webp')):
                has_images = True
                input_file_path = os.path.join(root, file)
                process_image(input_file_path, output_path, crop_output_path, folder_name)

        # # Create the crop directory only if images were found
        # if has_images:
        #     ensure_directory_exists(crop_output_path)


if __name__ == "__main__":
    input_folder = "../orig_data"  # Change this to your source folder
    output_folder = "../data"  # Change this to your desired output folder
    process_folder(input_folder, output_folder)
    print("Processing complete.")