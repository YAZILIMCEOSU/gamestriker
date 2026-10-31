# Füze fırlatma sesi: ateşleme darbesi + motor ıslığı (filtrelenmiş gürültü) + temiz kuyruk.
# Çıktı: sfx/launch_missile.wav (22050 Hz, 16-bit mono)
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 22050
rng = np.random.default_rng(7)
DUR = 1.4
t = np.arange(int(SR * DUR)) / SR
N = len(t)

def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return sosfilt(sos, x)
def lp(x, f, order=4):
    sos = butter(order, f, btype='low', fs=SR, output='sos'); return sosfilt(sos, x)
def hp(x, f, order=2):
    sos = butter(order, f, btype='high', fs=SR, output='sos'); return sosfilt(sos, x)

# 1) Ateşleme darbesi: 150 Hz -> 55 Hz hızlı düşen sinüs, 0.25 sn'de sönüyor
f_inst = 150 * (55 / 150) ** np.clip(t / 0.25, 0, 1)
phase = 2 * np.pi * np.cumsum(f_inst) / SR
thump = np.sin(phase) * np.exp(-t / 0.09) * 0.6
thump[t > 0.5] = 0

# 2) Ateşleme patlaması: kısa filtrelenmiş gürültü (ilk 60 ms)
click = hp(rng.standard_normal(N), 900) * np.exp(-t / 0.018) * 0.35

# 3) Motor gövdesi: kahverengi gürültü, bant geçiren merkezi 350 -> 900 Hz zamanla kayıyor
brown = np.cumsum(rng.standard_normal(N)); brown -= np.mean(brown); brown /= np.max(np.abs(brown))
body = np.zeros(N)
chunk = 512
for i in range(0, N, chunk):
    c = (i / SR)
    center = 350 + 550 * min(1, c / 1.0)
    lo, hi = max(200, center * 0.6), center * 1.5
    body[i:i+chunk] = bp(brown[i:i+chunk] * 6 + rng.standard_normal(min(chunk, N - i)) * 0.08, lo, min(hi, 6000))[:min(chunk, N - i)] if i + chunk <= N else bp(brown[i:] * 6, lo, min(hi, 6000))[:N - i]
# Yükseliş zarfı: 30 ms atak, 1.1 sn sürdürme, sonra yumuşak sönme
env_body = np.clip(t / 0.03, 0, 1) * np.exp(-np.maximum(0, t - 0.9) / 0.35)
env_body *= (t < 1.8) * 1.0
body = body * env_body * 0.55

# 4) Alçak motor ruhu: 70 Hz gövde, hafif titreşimli
rumble = np.sin(2 * np.pi * 72 * t) * (1 + 0.15 * np.sin(2 * np.pi * 14 * t))
rumble = rumble * np.exp(-np.maximum(0, t - 0.2) / 0.6) * np.clip(t / 0.05, 0, 1) * 0.12

# 3b) Hava hışırtısı: 1.2 kHz üstü gürültü, yavaş yükselip sönüyor ("whoosh" hissi)
air = hp(rng.standard_normal(N), 1200) * np.clip(t / 0.15, 0, 1) * np.exp(-np.maximum(0, t - 0.6) / 0.5) * 0.02
mix = thump + click + body + rumble + air

# 5) Sertliği al: 6.5 kHz üstünü kes, hafif yumuşat
mix = lp(mix, 4200)
mix = hp(mix, 35)

# 6) Kuyruk fade + tepe normalizasyonu (-1 dBFS) + yumuşak sınırlama
fade = np.clip((DUR - t) / 0.25, 0, 1)
mix *= fade
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
peak = np.max(np.abs(mix))
mix = mix / peak * 0.89

pcm = (mix * 32767).astype('<i2')
with wave.open('sfx/launch_missile.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('written', N / SR, 's')
