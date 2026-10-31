# Patlama sesi - B fuze sesiyle ayni katmanli tasarim: kisa catlama + alt darbe (sweep) + gurultu kuyrugu
# + enkaz tiklamalari + hafif yanki (gecikmeli, filtreli kopya). Cikti: sfx/explosion_b.wav (22050 Hz mono 16-bit)
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 22050; rng = np.random.default_rng(7)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=4):     return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, o=2):     return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)
def sweep_lp(x, f0, f1, chunk=256):
    out = np.zeros_like(x); n = len(x)
    for i in range(0, n, chunk):
        c = f0 * (f1 / f0) ** (i / n)
        seg = x[max(0, i - 64): i + chunk + 64]; y = lp(seg, max(60, c))
        s = i - max(0, i - 64); out[i:i + chunk] = y[s:s + chunk][:len(out[i:i + chunk])]
    return out
D = 2.3; t = np.arange(int(SR * D)) / SR; N = len(t); noise = rng.standard_normal(N)

crack = hp(rng.standard_normal(N), 1800) * np.exp(-t / 0.008) * 0.9
phase = 2 * np.pi * np.cumsum(95 * (40 / 95) ** np.clip(t / 0.5, 0, 1)) / SR
boom = np.sin(phase) * np.clip(t / 0.004, 0, 1) * np.exp(-t / 0.42) * 0.95
body = sweep_lp(noise, 1400, 180) * np.clip(t / 0.012, 0, 1) * np.exp(-t / 0.55) * 0.75
fire = bp(rng.standard_normal(N), 250, 900) * np.clip((t - 0.25) / 0.5, 0, 1) * np.exp(-np.maximum(0, t - 0.8) / 0.55) * 0.22
debris = np.zeros(N)
for _ in range(7):
    t0 = 0.12 + rng.random() * 1.0; i0 = int(t0 * SR); L = int(0.03 * SR)
    burst = hp(rng.standard_normal(L), 2200 + rng.random() * 2600) * np.exp(-np.arange(L) / (0.006 * SR))
    debris[i0:i0 + L] += burst[:max(0, min(L, N - i0))] * (0.18 + 0.12 * rng.random())
dry = crack + boom + body + fire + debris
# hafif yanki: 2 gecikmeli, filtreli kopya
echo = np.zeros(N)
for d, g in [(0.11, 0.28), (0.23, 0.14)]:
    k = int(d * SR); echo[k:] += lp(dry, 2600)[:N - k] * g
x = dry + echo
x = x * np.clip((D - t) / 0.35, 0, 1)
x = np.tanh(x * 1.25) / np.tanh(1.25)
x = x / np.max(np.abs(x)) * 0.89
with wave.open('sfx/explosion_b.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
print('ok', D)
