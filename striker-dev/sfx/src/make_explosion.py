# Gerçekçi patlama: çatlama + alt darbe + orta frekans blast + enkaz tıkırtısı + yangın kuyruğu + yankı
# Çıktı: sfx/explosion_crunch.wav (22050 Hz, 16-bit mono)
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 22050; DUR = 2.6
rng = np.random.default_rng(11)
t = np.arange(int(SR * DUR)) / SR; N = len(t)

def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=4):    return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, o=2):    return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)

# A) Çatlama (ilk 25 ms, geniş bant)
crack = hp(rng.standard_normal(N), 1500) * np.exp(-t / 0.006) * 2.4

# B) Alt darbe: 95 -> 38 Hz düşen sinüs + tanh ile hafif harmonik
f_inst = 38 + (95 - 38) * np.exp(-t / 0.10)
ph = 2 * np.pi * np.cumsum(f_inst) / SR
boom = np.tanh(np.sin(ph) * 1.6) / np.tanh(1.6) * np.exp(-t / 0.30) * np.clip(t / 0.003, 0, 1) * 0.55

# C) Orta frekans blast (200–1200 Hz), 0.6 sn
blast = bp(rng.standard_normal(N), 200, 1200) * np.exp(-t / 0.20) * np.clip(t / 0.004, 0, 1) * 0.9

# D) Enkaz tıkırtıları: 28 rastgele kısa patlamacık (2–7 kHz)
debris = np.zeros(N)
for _ in range(28):
    t0 = rng.uniform(0.04, 1.6)
    i0 = int(t0 * SR); L = int(SR * rng.uniform(0.004, 0.012))
    if i0 + L >= N: continue
    burst = hp(rng.standard_normal(L), 2000) * np.exp(-np.arange(L) / (L * 0.35))
    debris[i0:i0 + L] += burst * rng.uniform(0.05, 0.22)

# E) Yangın kuyruğu: kahverengi gürültü, lowpass 320 Hz, geç yükselen zarf
brown = np.cumsum(rng.standard_normal(N)); brown -= brown.mean(); brown /= np.abs(brown).max()
fire = lp(brown, 320) * np.clip((t - 0.05) / 0.30, 0, 1) * np.exp(-np.maximum(0, t - 0.5) / 0.7) * 2.2 * 0.10

mix = crack + boom + blast + debris + fire
import os
if os.environ.get('LAYERS'):
    for nm, a in [('crack',crack),('boom',boom),('blast',blast),('debris',debris),('fire',fire)]:
        print(nm, 'peak %.3f rms %.4f' % (np.max(np.abs(a)), np.sqrt(np.mean(a**2))))

# F) Hafif yankı: 70 ms ve 160 ms gecikmeli, filtrelenmiş kopyalar (arazi yansıması)
def delayed(x, ms, g):
    d = int(SR * ms / 1000); y = np.zeros_like(x); y[d:] = x[:-d] * g; return lp(y, 1800, 2)
mix = mix + delayed(mix, 70, 0.22) + delayed(mix, 160, 0.12)

# G) Son: 6.5 kHz üstünü kes, kuyruk fade, yumuşak sınırlama, -1 dBFS
mix = lp(mix, 6500)
mix *= np.clip((DUR - t) / 0.4, 0, 1)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix = mix / np.max(np.abs(mix)) * 0.89

with wave.open('sfx/explosion_crunch.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('written', DUR, 's')
