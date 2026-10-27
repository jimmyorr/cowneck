#!/usr/bin/env python3
"""
Generate a 1200x630 social preview image (Open Graph / Twitter card) for cowneck.com
Minimal split layout matching the homepage aesthetic.
"""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


def load_font(size, weight="regular"):
    avenir_path = "/System/Library/Fonts/Avenir Next.ttc"
    if os.path.exists(avenir_path):
        # Avenir Next indices: 0=Bold, 2=Demi Bold, 5=Medium, 7=Regular
        index_map = {"bold": 0, "demi": 2, "medium": 5, "regular": 7}
        return ImageFont.truetype(avenir_path, size, index=index_map.get(weight, 7))

    helv_path = "/System/Library/Fonts/HelveticaNeue.ttc"
    if os.path.exists(helv_path):
        index_map = {"bold": 1, "demi": 10, "medium": 10, "regular": 0}
        return ImageFont.truetype(helv_path, size, index=index_map.get(weight, 0))

    return ImageFont.load_default()


def draw_radial_glow(canvas, center_x, center_y, radius, color_rgb, max_alpha):
    """Draw a smooth radial gradient glow onto an RGBA canvas."""
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    x0 = center_x - radius
    y0 = center_y - radius
    x1 = center_x + radius
    y1 = center_y + radius
    draw.ellipse((x0, y0, x1, y1), fill=(*color_rgb, max_alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius * 0.45))
    return Image.alpha_composite(canvas, glow)


def create_og_image():
    # Render at 2x resolution for crisp anti-aliased typography and borders
    SCALE = 2
    W, H = 1200 * SCALE, 630 * SCALE

    # Base background: #080d1a
    img = Image.new("RGBA", (W, H), (8, 13, 26, 255))

    # Match index.html radial gradients:
    # radial-gradient(circle at 10% 15%, rgba(99, 102, 241, 0.15) 0%, transparent 45%)
    # radial-gradient(circle at 90% 85%, rgba(244, 114, 182, 0.12) 0%, transparent 45%)
    # radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 60%)
    img = draw_radial_glow(img, int(W * 0.10), int(H * 0.15), int(W * 0.35), (99, 102, 241), 50)
    img = draw_radial_glow(img, int(W * 0.90), int(H * 0.85), int(W * 0.35), (244, 114, 182), 40)
    img = draw_radial_glow(img, int(W * 0.50), int(H * 0.50), int(W * 0.42), (56, 189, 248), 20)

    # Right side: Chester
    chester_path = "chester.webp"
    if os.path.exists(chester_path):
        chester_orig = Image.open(chester_path).convert("RGBA")
        cw, ch = chester_orig.size

        # Clip only the outer square corner artifact pixels at (0,0), (439,0), (0,439)
        # while preserving Chester's true alpha channel and protruding eyebrows
        corner_mask = Image.new("L", (cw, ch), 0)
        corner_draw = ImageDraw.Draw(corner_mask)
        corner_draw.ellipse((2, 2, cw - 3, ch - 3), fill=255)
        clean_alpha = ImageChops.multiply(chester_orig.getchannel("A"), corner_mask)
        chester_orig.putalpha(clean_alpha)

        avatar_size = 420 * SCALE
        chester = chester_orig.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)
        chester_alpha = chester.getchannel("A")

        avatar_x = 660 * SCALE
        avatar_y = (H - avatar_size) // 2

        # Soft indigo ambient glow behind Chester (matching index.html box-shadow)
        glow_pad = 60 * SCALE
        glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        indigo_sil = Image.new("RGBA", (avatar_size, avatar_size), (99, 102, 241, 0))
        indigo_sil.putalpha(chester_alpha.point(lambda a: int(a * 0.28)))
        glow_layer.paste(indigo_sil, (avatar_x, avatar_y))
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(28 * SCALE))
        img = Image.alpha_composite(img, glow_layer)

        # Soft dark drop shadow (0 10px 40px rgba(0,0,0,0.45))
        shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        black_sil = Image.new("RGBA", (avatar_size, avatar_size), (0, 0, 0, 0))
        black_sil.putalpha(chester_alpha.point(lambda a: int(a * 0.50)))
        shadow_layer.paste(black_sil, (avatar_x, avatar_y + 10 * SCALE))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(22 * SCALE))
        img = Image.alpha_composite(img, shadow_layer)

        # Composite Chester cleanly using his alpha channel
        chester_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        chester_layer.paste(chester, (avatar_x, avatar_y), chester)
        img = Image.alpha_composite(img, chester_layer)

    # Left side: Minimal typography + frosted buttons matching index.html
    ui_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(ui_layer)

    f_title = load_font(96 * SCALE, weight="bold")
    f_btn = load_font(22 * SCALE, weight="medium")

    left_x = 125 * SCALE

    # 1. Wordmark "cowneck"
    title_text = "cowneck"
    title_y = 205 * SCALE
    draw.text((left_x, title_y), title_text, font=f_title, fill=(248, 250, 252, 255))

    # 2. Frosted glass buttons matching index.html (.links a)
    # padding: 10px 18px; border: 1px solid rgba(255, 255, 255, 0.1);
    # border-radius: 12px; background: rgba(255, 255, 255, 0.05); color: #f8fafc;
    buttons = ["games", "projects"]
    btn_x = left_x + 4 * SCALE
    btn_y = 355 * SCALE
    pad_x = 24 * SCALE
    pad_y = 13 * SCALE
    btn_gap = 20 * SCALE
    radius = 12 * SCALE

    # Measure x-height once so both buttons share the exact same baseline
    x_bbox = draw.textbbox((0, 0), "x", font=f_btn)
    x_h = x_bbox[3] - x_bbox[1]
    bh = 52 * SCALE
    text_baseline_y = btn_y + (bh - x_h) // 2 - x_bbox[1]

    for label in buttons:
        bbox = draw.textbbox((0, 0), label, font=f_btn)
        tw = bbox[2] - bbox[0]
        bw = tw + pad_x * 2

        # Button drop shadow
        btn_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(btn_shadow)
        s_draw.rounded_rectangle(
            (btn_x, btn_y + 4 * SCALE, btn_x + bw, btn_y + bh + 4 * SCALE),
            radius=radius,
            fill=(0, 0, 0, 65),
        )
        btn_shadow = btn_shadow.filter(ImageFilter.GaussianBlur(8 * SCALE))
        img = Image.alpha_composite(img, btn_shadow)

        # Frosted button background & border
        rect = (btn_x, btn_y, btn_x + bw, btn_y + bh)
        draw.rounded_rectangle(
            rect,
            radius=radius,
            fill=(255, 255, 255, 14),
            outline=(255, 255, 255, 30),
            width=1 * SCALE,
        )

        # Center text horizontally and align to shared baseline vertically
        tx = btn_x + (bw - tw) // 2 - bbox[0]
        draw.text((tx, text_baseline_y), label, font=f_btn, fill=(248, 250, 252, 255))

        btn_x += bw + btn_gap

    img = Image.alpha_composite(img, ui_layer)

    # Downsample to 1200x630 and save as high quality JPEG
    final_img = img.resize((1200, 630), Image.Resampling.LANCZOS).convert("RGB")
    final_img.save("og-image.jpg", "JPEG", quality=94, subsampling=0, optimize=True)
    print("Created og-image.jpg (1200x630)")


if __name__ == "__main__":
    create_og_image()
