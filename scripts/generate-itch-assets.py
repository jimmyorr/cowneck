#!/usr/bin/env python3
"""
Generate itch.io profile banner and background images matching Cowneck's signature aesthetic:
- itch-banner.png (1920x480, crisp Retina 2x scale for standard 960x240 banner)
- itch-background.jpg (2560x1440, ambient background with matching #080d1a base and seamless edges)
"""
import math
import os
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


class LCG:
    """Lightweight deterministic random number generator to avoid pyenv hashlib warnings."""
    def __init__(self, seed=42):
        self.state = seed

    def next_int(self):
        self.state = (self.state * 1664525 + 1013904223) & 0xFFFFFFFF
        return self.state

    def randint(self, a, b):
        return a + (self.next_int() % (b - a + 1))

    def choice(self, seq):
        idx = self.next_int() % len(seq)
        return seq[idx]

    def random(self):
        return (self.next_int() & 0xFFFFFF) / 0x1000000


def load_font(size, weight="regular"):
    avenir_path = "/System/Library/Fonts/Avenir Next.ttc"
    if os.path.exists(avenir_path):
        # 0=Bold, 2=Demi Bold, 5=Medium, 7=Regular
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


def add_subtle_starfield(canvas, count=80, seed=42):
    """Add delicate subtle stars/particles with varying brightness."""
    rng = LCG(seed)
    stars_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(stars_layer)
    w, h = canvas.size

    for _ in range(count):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        size = rng.choice([1, 1, 1, 2, 2, 3])
        # Mix of soft cool white, soft cyan, soft warm indigo
        tint = rng.choice([
            (255, 255, 255),
            (226, 232, 240),
            (147, 197, 253),
            (196, 181, 253),
        ])
        alpha = rng.randint(30, 130)
        draw.ellipse((x, y, x + size, y + size), fill=(*tint, alpha))

        # Rare subtle cross-sparkle on a few stars
        if size == 3 and rng.random() < 0.25:
            sp = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
            sp_draw = ImageDraw.Draw(sp)
            sp_draw.line((x - 4, y + 1, x + 6, y + 1), fill=(*tint, 60), width=1)
            sp_draw.line((x + 1, y - 4, x + 1, y + 6), fill=(*tint, 60), width=1)
            stars_layer = Image.alpha_composite(stars_layer, sp)

    return Image.alpha_composite(canvas, stars_layer)


def create_banner():
    # 1920 x 480 (Retina 2x for standard 960x240 banner)
    W, H = 1920, 480

    # Base background: #080d1a
    img = Image.new("RGBA", (W, H), (8, 13, 26, 255))

    # Ambient glows matching cowneck.com
    # Indigo glow at left/center, pink/purple glow upper right, sky blue glow center bottom
    img = draw_radial_glow(img, int(W * 0.22), int(H * 0.40), int(W * 0.30), (99, 102, 241), 55)
    img = draw_radial_glow(img, int(W * 0.78), int(H * 0.50), int(W * 0.28), (244, 114, 182), 40)
    img = draw_radial_glow(img, int(W * 0.50), int(H * 0.65), int(W * 0.25), (56, 189, 248), 35)

    # Add gentle starfield
    img = add_subtle_starfield(img, count=90, seed=101)

    # Chester presence on right side (softly glowing and composited)
    chester_path = "chester.webp"
    if os.path.exists(chester_path):
        chester_orig = Image.open(chester_path).convert("RGBA")
        cw, ch = chester_orig.size
        corner_mask = Image.new("L", (cw, ch), 0)
        corner_draw = ImageDraw.Draw(corner_mask)
        corner_draw.ellipse((2, 2, cw - 3, ch - 3), fill=255)
        clean_alpha = ImageChops.multiply(chester_orig.getchannel("A"), corner_mask)
        chester_orig.putalpha(clean_alpha)

        chester_size = 320
        chester = chester_orig.resize((chester_size, chester_size), Image.Resampling.LANCZOS)
        ch_x = W - chester_size - 180
        ch_y = (H - chester_size) // 2

        # Soft glow behind Chester
        ch_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        glow_sil = Image.new("RGBA", (chester_size, chester_size), (99, 102, 241, 0))
        glow_sil.putalpha(chester.getchannel("A").point(lambda a: int(a * 0.35)))
        ch_glow.paste(glow_sil, (ch_x, ch_y))
        ch_glow = ch_glow.filter(ImageFilter.GaussianBlur(32))
        img = Image.alpha_composite(img, ch_glow)

        # Soft drop shadow
        ch_shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        shadow_sil = Image.new("RGBA", (chester_size, chester_size), (0, 0, 0, 0))
        shadow_sil.putalpha(chester.getchannel("A").point(lambda a: int(a * 0.55)))
        ch_shadow.paste(shadow_sil, (ch_x, ch_y + 8))
        ch_shadow = ch_shadow.filter(ImageFilter.GaussianBlur(20))
        img = Image.alpha_composite(img, ch_shadow)

        # Composite Chester
        ch_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ch_layer.paste(chester, (ch_x, ch_y), chester)
        img = Image.alpha_composite(img, ch_layer)

    # Typography & wordmark
    text_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(text_layer)

    f_brand = load_font(104, weight="bold")
    f_sub = load_font(24, weight="medium")

    # Left content anchor
    left_x = 180
    brand_text = "cowneck"
    draw.text((left_x, 140), brand_text, font=f_brand, fill=(248, 250, 252, 255))

    # Subtitle with letter tracking feel
    sub_text = "GAMES  •  PROJECTS  •  EXPERIMENTS"
    draw.text((left_x + 4, 275), sub_text, font=f_sub, fill=(148, 163, 184, 230))

    # Seamless bottom gradient fade into #080d1a
    fade_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fade_draw = ImageDraw.Draw(fade_layer)
    fade_height = 90
    for y in range(H - fade_height, H):
        factor = (y - (H - fade_height)) / fade_height
        alpha = int(255 * (factor ** 1.6))
        fade_draw.line((0, y, W, y), fill=(8, 13, 26, alpha))

    img = Image.alpha_composite(img, text_layer)
    img = Image.alpha_composite(img, fade_layer)

    # Save PNG
    banner_out = "itch-banner.png"
    img.save(banner_out, "PNG", optimize=True)
    print(f"Created {banner_out} ({W}x{H})")


def create_background():
    # 2560 x 1440 ambient wallpaper / background
    W, H = 2560, 1440

    img = Image.new("RGBA", (W, H), (8, 13, 26, 255))

    # Recreate the exact radial gradients from cowneck.com:
    # 1. circle at 10% 15%, rgba(99, 102, 241, 0.15)
    img = draw_radial_glow(img, int(W * 0.12), int(H * 0.16), int(W * 0.40), (99, 102, 241), 48)
    # 2. circle at 90% 85%, rgba(244, 114, 182, 0.12)
    img = draw_radial_glow(img, int(W * 0.88), int(H * 0.84), int(W * 0.38), (244, 114, 182), 38)
    # 3. circle at 50% 50%, rgba(56, 189, 248, 0.05)
    img = draw_radial_glow(img, int(W * 0.50), int(H * 0.48), int(W * 0.45), (56, 189, 248), 24)

    # Add gentle ambient starfield across the full background
    img = add_subtle_starfield(img, count=160, seed=777)

    # Edge vignette to guarantee edges fade into pure #080d1a
    # so repeated or scaled backgrounds never show a seam
    edge_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    e_draw = ImageDraw.Draw(edge_layer)

    # Top & bottom margins
    margin_v = 140
    for y in range(margin_v):
        factor = 1.0 - (y / margin_v)
        alpha = int(255 * (factor ** 1.5))
        e_draw.line((0, y, W, y), fill=(8, 13, 26, alpha))
        e_draw.line((0, H - 1 - y, W, H - 1 - y), fill=(8, 13, 26, alpha))

    # Left & right margins
    margin_h = 180
    for x in range(margin_h):
        factor = 1.0 - (x / margin_h)
        alpha = int(255 * (factor ** 1.5))
        e_draw.line((x, 0, x, H), fill=(8, 13, 26, alpha))
        e_draw.line((W - 1 - x, 0, W - 1 - x, H), fill=(8, 13, 26, alpha))

    img = Image.alpha_composite(img, edge_layer)

    # Convert to high-quality optimized JPG
    bg_out = "itch-background.jpg"
    final_img = img.convert("RGB")
    final_img.save(bg_out, "JPEG", quality=92, subsampling=0, optimize=True)
    print(f"Created {bg_out} ({W}x{H})")


if __name__ == "__main__":
    create_banner()
    create_background()
