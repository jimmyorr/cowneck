import os
import sys
from PIL import Image

def optimize_images(source_directory='.', output_directory=None, max_width=2048, format='WEBP', quality=80):
    """
    Scans the source_directory for images, resizes them to a max_width,
    converts them to the specified format (default WEBP), and saves them to output_directory.
    """
    
    # If no output directory specified, create it as a subdirectory under source_directory
    if output_directory is None:
        output_directory = os.path.join(source_directory, 'optimized_images')
    
    # Supported input formats
    valid_extensions = ('.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp')
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
        print(f"Created output directory: {output_directory}")

    files = [f for f in os.listdir(source_directory) if f.lower().endswith(valid_extensions)]
    
    # Exclude output directory if it's inside source directory
    files = [f for f in files if os.path.isfile(os.path.join(source_directory, f))]
    
    print(f"Found {len(files)} images to process...")

    for filename in files:
        file_path = os.path.join(source_directory, filename)
        
        try:
            with Image.open(file_path) as img:
                # Calculate new height to maintain aspect ratio
                width_percent = (max_width / float(img.size[0]))
                
                # Only resize if the image is actually bigger than our max_width
                if width_percent < 1:
                    new_height = int((float(img.size[1]) * float(width_percent)))
                    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    print(f"Resizing {filename}...")
                else:
                    print(f"Copying {filename} (already small enough)...")

                # Change extension based on format
                ext = '.webp' if format.upper() == 'WEBP' else '.jpg'
                new_filename = os.path.splitext(filename)[0] + ext
                output_path = os.path.join(output_directory, new_filename)

                # Save with optimization
                if format.upper() == 'WEBP':
                    img.save(output_path, 'WEBP', quality=quality, lossless=False)
                else:
                    # Convert to RGB if saving as JPEG
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    img.save(output_path, 'JPEG', quality=quality, optimize=True)
                
                # Compare sizes
                original_size = os.path.getsize(file_path) / 1024
                new_size = os.path.getsize(output_path) / 1024
                print(f"Saved: {new_filename} ({new_size:.1f}KB) - Reduced by {100 - (new_size/original_size*100):.1f}%")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nDone! Check the 'optimized_images' directory.")

if __name__ == "__main__":
    # Get source directory from command-line argument, default to current directory
    source_directory = sys.argv[1] if len(sys.argv) > 1 else '.'
    optimize_images(source_directory, format='WEBP', quality=80)
