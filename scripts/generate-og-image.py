#!/usr/bin/env python3
"""
Generate a 1200x630 social preview image (Open Graph / Twitter card) for cowneck.com
Featuring Chester, the site aesthetic, and brand typography.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), (8, 13, 26, 255)) # #080d1a
    
    # Glow layer
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    
    # 1. Indigo glow top-left
    glow_draw.ellipse((-150, -150, 550, 550), fill=(99, 102, 241, 45))
    # 2. Pink glow bottom-right
    glow_draw.ellipse((750, 250, 1400, 850), fill=(244, 114, 182, 35))
    # 3. Cyan glow near center-right
    glow_draw.ellipse((500, 100, 1000, 600), fill=(56, 189, 248, 25))
    
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    img = Image.alpha_composite(img, glow)
    
    # Chester avatar
    chester_path = "chester.webp"
    if os.path.exists(chester_path):
        chester = Image.open(chester_path).convert("RGBA")
        avatar_size = 360
        chester = chester.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)
        
        # Circle mask for Chester
        mask = Image.new("L", (avatar_size, avatar_size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse((0, 0, avatar_size, avatar_size), fill=255)
        
        # Outer glow ring for Chester
        ring_size = avatar_size + 40
        ring = Image.new("RGBA", (ring_size, ring_size), (0, 0, 0, 0))
        ring_draw = ImageDraw.Draw(ring)
        ring_draw.ellipse((0, 0, ring_size, ring_size), fill=(99, 102, 241, 60))
        ring = ring.filter(ImageFilter.GaussianBlur(12))
        
        # Border stroke ring
        stroke_size = avatar_size + 8
        stroke_layer = Image.new("RGBA", (stroke_size, stroke_size), (0, 0, 0, 0))
        stroke_draw = ImageDraw.Draw(stroke_layer)
        stroke_draw.ellipse((0, 0, stroke_size, stroke_size), outline=(255, 255, 255, 60), width=3)
        
        avatar_x = 760
        avatar_y = (H - avatar_size) // 2
        
        # Paste glow ring
        img.paste(ring, (avatar_x - 20, avatar_y - 20), ring)
        # Paste stroke
        img.paste(stroke_layer, (avatar_x - 4, avatar_y - 4), stroke_layer)
        # Paste Chester
        img.paste(chester, (avatar_x, avatar_y), mask)
    
    draw = ImageDraw.Draw(img)
    
    # Fonts
    font_bold = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    font_reg = "/System/Library/Fonts/Supplemental/Arial.ttf"
    if not os.path.exists(font_bold):
        font_bold = "/System/Library/Fonts/Helvetica.ttc"
        font_reg = "/System/Library/Fonts/Helvetica.ttc"
        
    f_badge = ImageFont.truetype(font_bold, 18)
    f_title = ImageFont.truetype(font_bold, 84)
    f_subtitle = ImageFont.truetype(font_reg, 28)
    f_tag = ImageFont.truetype(font_bold, 18)
    f_url = ImageFont.truetype(font_bold, 20)
    
    left_x = 90
    
    # 1. Badge "COWNECK"
    badge_text = "COWNECK"
    bbox = draw.textbbox((0, 0), badge_text, font=f_badge)
    bw = bbox[2] - bbox[0]
    bh = bbox[3] - bbox[1]
    bx, by = left_x, 115
    pad_x, pad_y = 16, 8
    badge_rect = (bx, by, bx + bw + pad_x * 2, by + bh + pad_y * 2)
    draw.rounded_rectangle(badge_rect, radius=8, fill=(30, 41, 59, 180), outline=(99, 102, 241, 140), width=1)
    draw.text((bx + pad_x, by + pad_y - 1), badge_text, font=f_badge, fill=(165, 180, 252))
    
    # 2. Main Title
    draw.text((left_x, 180), "cowneck", font=f_title, fill=(248, 250, 252))
    
    # 3. Subtitle description
    sub_line1 = "Interactive games, web projects,"
    sub_line2 = "and essays by Jimmy Orr."
    draw.text((left_x, 305), sub_line1, font=f_subtitle, fill=(203, 213, 225))
    draw.text((left_x, 348), sub_line2, font=f_subtitle, fill=(148, 163, 184))
    
    # 4. Feature Pills
    pills = [("GAMES", (102, 126, 234)), ("PROJECTS", (0, 198, 255)), ("ESSAYS", (244, 114, 182))]
    px = left_x
    py = 430
    for label, col in pills:
        p_bbox = draw.textbbox((0, 0), label, font=f_tag)
        pw = p_bbox[2] - p_bbox[0]
        ph = p_bbox[3] - p_bbox[1]
        p_rect = (px, py, px + pw + 28, py + ph + 18)
        draw.rounded_rectangle(p_rect, radius=999, fill=(255, 255, 255, 14), outline=(col[0], col[1], col[2], 120), width=1)
        draw.text((px + 14, py + 9), label, font=f_tag, fill=(col[0], col[1], col[2]))
        px += pw + 44
        
    # 5. Domain footer
    draw.text((left_x, 520), "https://cowneck.com", font=f_url, fill=(100, 116, 139))
    
    # Save as high quality JPEG
    final_rgb = img.convert("RGB")
    final_rgb.save("og-image.jpg", "JPEG", quality=92, optimize=True)
    print("Created og-image.jpg (1200x630)")

if __name__ == "__main__":
    create_og_image()
