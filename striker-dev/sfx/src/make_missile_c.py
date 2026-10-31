# Fuze firlatma - C surumu (gercekci, tonsuz): tonal "baraton" yok, ses gurultu tabanli.
# Katmanlar: 1) basinc darbesi (alt frekans, kisa) 2) raylı mekanik tik 3) ates/motor kuklesi (kisa beyaz gurultu, 1.8-3 kHz kisik)
# 4) motor ugultusu: 180->650 Hz bant gecirenden acilan gurultu, sonra kisilen kuyruk 5) hava gecisi (doppler benzeri, 2 kHz alti)
# Ton yok, 3.2 kHz ustu enerji dusuk. Cikti: sfx/candidates/missile_C.wav
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 22050; rng = np.random.default_rng(33)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=4):     return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, o=2):     return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)
def sweep_bp(x, f0, f1, chunk=256):
    out = np.zeros_like(x); n = len(x)
    for i in range(0, n, chunk):
        c = f0 * (f1 / f0) ** (i / n); lo, hi = c * 0.6, c * 1.5
        seg = x[max(0, i - 64): i + chunk + 64]; y = bp(seg, max(60, lo), min(4000, hi))
        s = i - max(0, i - 64); out[i:i + chunk] = y[s:s + chunk][:len(out[i:i + chunk])]
    return out
D = 1.5; t = np.arange(int(SR * D)) / SR; N = len(t)
def env(a, d, t0=0.0): return np.clip((t - t0) / a, 0, 1) * np.exp(-np.maximum(0, t - t0 - a) / d)

pressure = lp(rng.standard_normal(N), 140) * env(0.01, 0.18) * 1.0
clicks = np.zeros(N); L = int(0.02 * SR)
for t0 in [0.0, 0.05]:
    i0 = int(t0 * SR); clicks[i0:i0 + L] += hp(rng.standard_normal(L), 1000)[:L] * np.exp(-np.arange(L) / (0.004 * SR)) * 0.5
igni = bp(rng.standard_normal(N), 1800, 3000) * env(0.005, 0.05, 0.06) * 0.25
roar = sweep_bp(rng.standard_normal(N), 180, 650) * env(0.06, 0.55, 0.02) * 0.85
rush = lp(hp(rng.standard_normal(N), 300), 1900, 4) * env(0.25, 0.5, 0.35) * 0.20
body = lp(rng.standard_normal(N), 420) * env(0.03, 0.9, 0.0) * 0.30
x = pressure + clicks + igni + roar + rush + body
x = x * np.clip((D - t) / 0.3, 0, 1)
x = np.tanh(x * 1.0) / np.tanh(1.0) * 0.55          # yumusak sinirlama, -5 dBFS tepe
x = x / np.max(np.abs(x)) * 0.6
with wave.open('sfx/candidates/missile_C.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
print('ok')
