# id -> (en,tr,de,es,fr,it,pt,ru,id,ar) description; role reuses existing keys
AIR2 = {
"vanguard": ("Steady all-rounder for new aces.","Yeni aslar için dengeli çok yönlü.","Ausgewogener Allrounder für neue Asse.","Polivalente equilibrado para nuevos ases.","Polyvalent équilibré pour nouveaux as.","Tuttofare equilibrato per nuovi assi.","Versátil equilibrado para novos ases.","Универсал для новых асов.","Serba bisa seimbang untuk as baru.","متوازن شامل للأساطيل الجديدة."),
"ghost": ("Low signature, fast intercepts.","Düşük iz, hızlı önleme.","Niedrige Signatur, schnelle Abfänge.","Firma baja, intercepciones rápidas.","Signature faible, interceptions rapides.","Firma bassa, intercettazioni rapide.","Assinatura baixa, interceptações rápidas.","Низкая заметность, быстрый перехват.","Signatur rendah, penyergapan cepat.","بصمة منخفضة واعتراضات سريعة."),
"talon": ("Light strike craft with a sharp bite.","Keskin vuruşlu hafif taarruz uçağı.","Leichter Angreifer mit scharfem Biss.","Atacante ligero con mordiente afilada.","Appareil d’attaque léger à la morsure vive.","Incursore leggero dal morso tagliente.","Atacante leve com mordida afiada.","Лёгкий ударный с острым жалом.","Penyerang ringan dengan gigitan tajam.","مهاجم خفيف بوطأة حادة."),
"bastion": ("A flying fortress that holds the line.","Hattı tutan uçan kale.","Fliegende Festung, die die Linie hält.","Fortaleza voladora que mantiene la línea.","Forteresse volante qui tient la ligne.","Fortezza volante che tiene la linea.","Fortaleza voadora que segura a linha.","Летающая крепость держит строй.","Benteng terbang penjaga garis.","قلعة طائرة تثبت على الخط."),
"horizon": ("Long legs, long reach, long memory.","Uzun menzil, uzun erişim, uzun hafıza.","Lange Reichweite, langes Gedächtnis.","Alcance largo y buena memoria.","Longue portée, longue mémoire.","Gambe lunghe e lunga memoria.","Alcance longo e boa memória.","Дальний радиус и длинная память.","Jangkauan jauh, memori panjang.","مدى بعيد وذراع طويلة."),
"cyclone": ("Blitz turn rate for knife-fights.","Bıçak dövüşü için şimşek dönüş.","Blitzwenderate für Messerkämpfe.","Giro relámpago para duelos cerrados.","Virage éclair pour duels serrés.","Virata lampo per duelli ravvicinati.","Curva relâmpago para duelos cerrados.","Молниеносный вираж для ближнего боя.","Putaran kilat untuk duel rapat.","دوران خاطف لاشتباكات متلاحمة."),
"marauder": ("Raider built for deck-breaking runs.","Güverte parçalayan baskınlar için.","Räuber für deckbrechende Läufe.","Asaltante para pasadas rompecubiertas.","Raid conçu pour briser les ponts.","Predone nato per passaggi sfonda-ponte.","Assaltante feito para rasgar conveses.","Рейдер для прорыва палуб.","Pemburu untuk serangan pemecah dek.","مغير مبني لاختراق الأسطح."),
"sentinel": ("Watchful escort with spare armor.","Tedbirli refakat, yedekli zırh.","Wachsamer Geleitschutz mit Reservepanzerung.","Escolta vigilante con blindaje de reserva.","Escorte vigilant au blindage de réserve.","Scorta vigile con corazza di riserva.","Escolta vigilante com blindagem extra.","Бдительный эскорт с запасной бронёй.","Pengawal waspada dengan lapis cadangan.","مرافق يقظ بدرع احتياطي."),
"phantom": ("Barely there. Gone before the echo.","Zar zor orada. Yankıdan önce gider.","Kaum da. Weg vor dem Echo.","Apenas está ahí. Se va antes del eco.","À peine là. Parti avant l’écho.","Appena lì. Via prima dell’eco.","Quase não está lá. Some antes do eco.","Почти призрак. Уходит раньше эха.","Nyaris tak ada. Hilang sebelum gema.","بالكاد هناك. يختفي قبل الصدى."),
"archer": ("Patient hunter, precise first shot.","Sabırlı avcı, ilk atışta isabet.","Geduldiger Jäger, präziser Erstschuss.","Cazador paciente, primer tiro preciso.","Chasseur patient, premier tir précis.","Cacciatore paziente, primo tiro preciso.","Caçador paciente, primeiro tiro preciso.","Терпеливый охотник, точный первый выстрел.","Pemburu sabar, tembakan pertama presisi.","صائد صبور وإصابة أولى دقيقة."),
"kraken": ("Heavy torpedo-class payload. Fear it.","Ağır torpido sınıfı yük. Ondan korkun.","Schwere Torpedoklasse. Fürchte es.","Carga pesada clase torpedo. Témelo.","Charge lourde type torpille. Craignez-le.","Carico pesante classe siluri. Temetelo.","Carga pesada classe torpedo. Tema-o.","Тяжёлый торпедный калибр. Бойся.","Muatan berat kelas torpedo. Takutilah.","حملة ثقيلة طوربيدية. رهبة خالصة."),
}
ROLES2 = {
"vanguard":"MULTIROLE","ghost":"INTERCEPTOR","talon":"STRIKE","bastion":"AIR SUPERIORITY","horizon":"STRIKE","cyclone":"INTERCEPTOR","marauder":"STRIKE","sentinel":"MULTIROLE","phantom":"EXPERIMENTAL","archer":"MULTIROLE","kraken":"STRIKE",
}
STATS2 = {
# id: code,name,speed,agility,hull,missiles,color,accent,price
"vanguard":("VG-2","VANGUARD",250,1.5,110,11,"#7a8891","#9fd8e8",600),
"ghost":("GH-3","GHOST",295,1.6,90,10,"#55606b","#b9e4ff",900),
"talon":("TL-9","TALON",270,1.45,100,12,"#6d7a6a","#ffd27a",700),
"bastion":("BS-1","BASTION",230,1.05,150,14,"#5a6672","#c9d8f2",1500),
"horizon":("HZ-7","HORIZON",275,1.2,115,14,"#66707c","#ffb489",1800),
"cyclone":("CY-5","CYCLONE",300,1.7,88,9,"#4d5a66","#7ef0e6",1400),
"marauder":("MR-8","MARAUDER",265,1.15,130,15,"#6a6f62","#ff9d7a",2000),
"sentinel":("SN-4","SENTINEL",235,1.25,125,12,"#75808a","#a4e1f1",1600),
"phantom":("PH-0","PHANTOM",320,1.85,80,8,"#33424e","#58e6e0",2800),
"archer":("AR-6","ARCHER",245,1.4,105,11,"#7b8577","#d9f0a6",1100),
"kraken":("KR-11","KRAKEN",225,0.95,170,16,"#49545f","#ff8f6b",3600),
}
ROLE_TR = {"MULTIROLE":"ÇOK AMAÇLI","INTERCEPTOR":"ÖNLEME","STRIKE":"TAARRUZ","AIR SUPERIORITY":"HAVA ÜSTÜNLÜĞÜ","EXPERIMENTAL":"DENEYSEL"}
