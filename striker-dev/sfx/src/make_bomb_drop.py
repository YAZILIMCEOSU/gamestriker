# Bomba bırakma sesi: düşen bombanın hava sürtünmesi ıslığı (aşağı kayan ton) + hava gürültüsü.
# Çıktı: sfx/bomb_drop.wav (22050 Hz, 16-bit mono)
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 22050; DUR = 1.8
rng = np.random.default_rng(3)
t = np.arange(int(SR * DUR)) / SR; N = len(t)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, o=4):     return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
f_inst = 1250 * (430 / 1250) ** np.clip(t / 1.4, 0, 1)
ph = 2 * np.pi * np.cumsum(f_inst) / SR
whistle = np.sin(ph) * 0.35 * np.clip(t / 0.25, 0, 1) * np.exp(-np.maximum(0, t - 1.0) / 0.35)
air = bp(rng.standard_normal(N), 700, 2600) * (0.12 + 0.35 * np.clip(t / 1.3, 0, 1)) * np.exp(-np.maximum(0, t - 1.2) / 0.3)
mix = lp(whistle + air, 4500)
mix *= np.clip((DUR - t) / 0.3, 0, 1)
mix = mix / np.max(np.abs(mix)) * 0.62
with wave.open('sfx/bomb_drop.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
print('bomb written')
