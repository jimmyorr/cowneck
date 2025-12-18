import os
import sys
from PIL import Image, ImageOps

def optimize_images(source_directory='.', output_directory=None, target_width=1024, target_height=1024):
    """
    Scans the source_directory for images, fits them to exactly target_width x target_height,
    converts them to JPG (quality 85), and saves them to output_directory.
    """
    
    # If no output directory specified, create it as a subdirectory under source_directory
    if output_directory is None:
        output_directory = os.path.join(source_directory, 'optimized_images')
    
    # Supported input formats
    valid_extensions = ('.png', '.jpg', '.jpeg', '.tiff', '.bmp')
    
    # Create output directory if it doesn't exist
    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
        print(f"Created output directory: {output_directory}")

    files = [f for f in os.listdir(source_directory) if f.lower().endswith(valid_extensions)]
    
    print(f"Found {len(files)} images to process...")
    print(f"Target dimensions: {target_width}x{target_height}")

    for filename in files:
        file_path = os.path.join(source_directory, filename)
        
        try:
            with Image.open(file_path) as img:
                # Convert to RGB (necessary for PNG to JPG conversion to handle transparency)
                if img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')

                # Use ImageOps.fit to resize and crop to exact dimensions
                # centering defaults to (0.5, 0.5) which is center crop
                # specific to 2816x1536 as requested
                new_img = ImageOps.fit(img, (target_width, target_height), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
                
                print(f"Processed {filename} -> {target_width}x{target_height}")

                # Change extension to .jpg
                new_filename = os.path.splitext(filename)[0] + '.jpg'
                output_path = os.path.join(output_directory, new_filename)

                # Save with optimization, slightly higher quality for display
                new_img.save(output_path, 'JPEG', quality=85, optimize=True)
                
                # ALSO save as PNG to overwrite the source file (so modal matches)
                # Only if the source was a PNG/BMP/etc (we want to maintain .png extension for consistency with HTML script)
                if filename.lower().endswith('.png'):
                    source_output_path = os.path.join(source_directory, filename)
                    new_img.save(source_output_path, 'PNG')
                    print(f"Updated source file: {filename}")
                
                # Compare sizes
                original_size = os.path.getsize(file_path) / 1024
                new_size = os.path.getsize(output_path) / 1024
                print(f"Saved: {new_filename} ({new_size:.1f}KB)")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

    print("\nDone! Check the 'optimized_images' directory.")

if __name__ == "__main__":
    # Usage: python image_optimizer.py [source_dir] [output_dir] [width] [height]
    source_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    width = 1024
    height = 1024
    
    if len(sys.argv) > 3:
        try:
            width = int(sys.argv[3])
        except ValueError:
            print(f"Invalid width: {sys.argv[3]}. Using default 1024.")
            
    if len(sys.argv) > 4:
        try:
            height = int(sys.argv[4])
        except ValueError:
            print(f"Invalid height: {sys.argv[4]}. Using default 1024.")
    
    optimize_images(source_dir, output_directory=output_dir, target_width=width, target_height=height)
