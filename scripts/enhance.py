"""Photo processing for the catalog (variant D + B, chosen by the owner 2026-10-28).

D — originals from Telegram (≈1280 px): Real-ESRGAN x4plus (RRDBNet), then down to the published width.
    Clean edges and readable lettering without the plastic look of the light model.
B — 800 px previews (old posts without an original): no neural network, Lanczos resize + gentle sharpening.
    A heavy GAN on small previews starts inventing details, plain sharpening keeps the photo honest.

x4plus runs on PyTorch (GitHub Actions: pip install torch, CPU). Without torch it falls back to a slow
numpy implementation (fine for a test, too slow for the catalog).
"""
import os
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X4PLUS = os.path.join(ROOT, "scripts", "models", "RealESRGAN_x4plus.pth")
X4PLUS_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
TARGET = 1600  # width of the published copy
TILE, PAD = 256, 16


def gentle(im):
    """Variant B: crisp but natural sharpening (two radii) and a touch of contrast."""
    im = im.filter(ImageFilter.UnsharpMask(radius=2.2, percent=45, threshold=3))
    im = im.filter(ImageFilter.UnsharpMask(radius=0.8, percent=90, threshold=2))
    return ImageEnhance.Contrast(im).enhance(1.03)


def variant_b(im):
    k = min(2.5, TARGET / im.width)
    if k > 1.01:
        im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return gentle(im)


# ---------- x4plus on torch ----------

_net = None


def _torch_net():
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    class RDB(nn.Module):
        def __init__(self, nf=64, gc=32):
            super().__init__()
            for i in range(4):
                setattr(self, f"conv{i + 1}", nn.Conv2d(nf + i * gc, gc, 3, 1, 1))
            self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)

        def forward(self, x):
            a = lambda t: F.leaky_relu(t, 0.2)
            x1 = a(self.conv1(x)); x2 = a(self.conv2(torch.cat((x, x1), 1)))
            x3 = a(self.conv3(torch.cat((x, x1, x2), 1))); x4 = a(self.conv4(torch.cat((x, x1, x2, x3), 1)))
            return self.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

    class RRDB(nn.Module):
        def __init__(self):
            super().__init__()
            self.rdb1, self.rdb2, self.rdb3 = RDB(), RDB(), RDB()

        def forward(self, x):
            return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x

    class Net(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv_first = nn.Conv2d(3, 64, 3, 1, 1)
            self.body = nn.Sequential(*[RRDB() for _ in range(23)])
            self.conv_body = nn.Conv2d(64, 64, 3, 1, 1)
            self.conv_up1 = nn.Conv2d(64, 64, 3, 1, 1)
            self.conv_up2 = nn.Conv2d(64, 64, 3, 1, 1)
            self.conv_hr = nn.Conv2d(64, 64, 3, 1, 1)
            self.conv_last = nn.Conv2d(64, 3, 3, 1, 1)

        def forward(self, x):
            a = lambda t: F.leaky_relu(t, 0.2)
            f = self.conv_first(x)
            f = f + self.conv_body(self.body(f))
            f = a(self.conv_up1(F.interpolate(f, scale_factor=2, mode="nearest")))
            f = a(self.conv_up2(F.interpolate(f, scale_factor=2, mode="nearest")))
            return self.conv_last(a(self.conv_hr(f)))

    sd = torch.load(X4PLUS, map_location="cpu", weights_only=True)
    sd = sd.get("params_ema", sd)
    net = Net(); net.load_state_dict(sd); net.eval()
    torch.set_num_threads(os.cpu_count() or 2)
    return net


def _x4_torch(arr):
    import torch
    global _net
    if _net is None:
        _net = _torch_net()
    h, w, _ = arr.shape
    x = torch.from_numpy(arr.transpose(2, 0, 1).astype(np.float32) / 255.0)[None]
    out = torch.zeros((1, 3, h * 4, w * 4))
    with torch.inference_mode():
        for y0 in range(0, h, TILE):
            for x0 in range(0, w, TILE):
                y1, x1 = min(h, y0 + TILE), min(w, x0 + TILE)
                py0, px0, py1, px1 = max(0, y0 - PAD), max(0, x0 - PAD), min(h, y1 + PAD), min(w, x1 + PAD)
                o = _net(x[:, :, py0:py1, px0:px1])
                out[:, :, y0 * 4:y1 * 4, x0 * 4:x1 * 4] = o[:, :, (y0 - py0) * 4:(y0 - py0 + y1 - y0) * 4, (x0 - px0) * 4:(x0 - px0 + x1 - x0) * 4]
    return (out[0].clamp(0, 1).numpy().transpose(1, 2, 0) * 255 + 0.5).astype(np.uint8)


def _x4_numpy(arr):
    """Same network in numpy (slow): for tests without torch."""
    from upscale import load_pth, conv3
    global _net
    if _net is None:
        p = load_pth(X4PLUS); _net = p.get("params_ema", p)
    P = _net
    lrelu = lambda t: np.where(t > 0, t, 0.2 * t)
    conv = lambda t, k: conv3(t, P[k + ".weight"], P[k + ".bias"])

    def rdb(t, k):
        x1 = lrelu(conv(t, k + ".conv1")); x2 = lrelu(conv(np.concatenate([t, x1]), k + ".conv2"))
        x3 = lrelu(conv(np.concatenate([t, x1, x2]), k + ".conv3")); x4 = lrelu(conv(np.concatenate([t, x1, x2, x3]), k + ".conv4"))
        return conv(np.concatenate([t, x1, x2, x3, x4]), k + ".conv5") * 0.2 + t

    x = arr.transpose(2, 0, 1).astype(np.float32) / 255
    f = conv(x, "conv_first"); b = f; i = 0
    while f"body.{i}.rdb1.conv1.weight" in P:
        b = rdb(rdb(rdb(b, f"body.{i}.rdb1"), f"body.{i}.rdb2"), f"body.{i}.rdb3") * 0.2 + b; i += 1
    f = f + conv(b, "conv_body")
    f = lrelu(conv(f.repeat(2, 1).repeat(2, 2), "conv_up1")); f = lrelu(conv(f.repeat(2, 1).repeat(2, 2), "conv_up2"))
    o = conv(lrelu(conv(f, "conv_hr")), "conv_last")
    return (np.clip(o, 0, 1).transpose(1, 2, 0) * 255 + .5).astype(np.uint8)


def x4(arr):
    try:
        import torch  # noqa: F401
    except ImportError:
        return _x4_numpy(arr)
    return _x4_torch(arr)


def variant_d(im):
    if not os.path.exists(X4PLUS):
        import urllib.request
        os.makedirs(os.path.dirname(X4PLUS), exist_ok=True)
        urllib.request.urlretrieve(X4PLUS_URL, X4PLUS)
    out = Image.fromarray(x4(np.asarray(im)))
    w = min(TARGET, im.width * 4)
    return out.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def process(src, dst, original):
    im = Image.open(src).convert("RGB")
    out = variant_d(im) if original else variant_b(im)
    out.save(dst, "JPEG", quality=88, optimize=True, progressive=True)
