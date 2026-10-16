# Apartman Yönetimi

Bir apartman için geliştirilmiş mobil yönetim uygulaması. Aidat takibi, duyurular, arıza bildirimleri, anketler ve giderler tek bir yerde; yönetici ile sakinler arasındaki iletişim şeffaf ve kayıt altında.

Uygulama mağazaya yüklenmez; Android cihazlara APK olarak dağıtılır. Tamamen **Firebase'in ücretsiz (Spark) planında** çalışır.

📘 Teknolojilerin anlatımı, mimari, veri modeli ve modüllerin ayrıntıları için: **[Teknik Dokümantasyon](docs/DOKUMANTASYON.md)**

---

## Özellikler

### Roller

| Rol | Kim | Yetkiler |
|---|---|---|
| **Admin** | Uygulamanın sahibi | Kullanıcı ekler/siler, rol ve telefon atar |
| **Yönetici** | Apartman yöneticisi | Duyuru, aidat, gider, anket, rehber ve raporları yönetir; talepleri sonuçlandırır |
| **Sakin** | Daire sakinleri | Görüntüler, arıza bildirir, oy kullanır |

Roller yalnızca arayüzde değil, **Firestore güvenlik kurallarında** da zorunlu kılınır.

### Modüller

- **Giriş** — Kullanıcı adı ve şifre ile (e-posta gerekmez). Yeni kullanıcılar ilk girişte kendi şifresini belirler. Herkes şifresini ve telefonunu değiştirebilir.
- **Bildirimler** — Yeni duyuru, anket ve aidat dönemi herkese; yeni arıza talebi yöneticiye; talep güncellemesi talebi açan sakine anlık bildirim olarak gider.
- **Ana sayfa (özet panosu)** — Kişiye özel durum: ödenmemiş aidat ya da bu ayın tahsilatı, "Sizi bekleyenler" listesi, son duyuru ve hızlı erişim.
- **Duyurular** — Yönetici yayınlar, "önemli" olarak işaretleyebilir. Sakinler okunmamış duyuruları rozetle görür; yönetici hangi dairelerin okuduğunu takip eder.
- **Aidat takibi** — Aylık dönem açılır, 9 daire için kayıt oluşur. Ödemeler Nakit/EFT olarak işaretlenir. Sakin yalnızca kendi dairesinin borcunu görür. IBAN kartı ve tek dokunuşla kopyalama; ödemeyen daireye WhatsApp hatırlatması.
- **Giderler** — Ay ay harcamalar, kategori dağılımı ve yönetici için kasa bakiyesi.
- **Yıllık rapor** — Gelir-gider özeti, aylık grafik ve tahsilat oranı. Yönetici yayınlar, sakinler görür.
- **Arıza ve istekler** — Kategori ve yer bilgisiyle bildirim; *Açık → İşlemde → Çözüldü* süreci, yönetici notları ve geçmiş.
- **Anketler** — Daire başına tek ve gizli oy; yüzdeli sonuçlar ve katılım takibi.
- **Önemli numaralar** — Yönetici, asansör firması, tesisatçı gibi numaralar; dokununca arama.

---

## Teknolojiler

| Alan | Kullanılan |
|---|---|
| Uygulama | [Expo SDK 57](https://docs.expo.dev), React Native 0.86, React 19, TypeScript |
| Yönlendirme | Expo Router (dosya tabanlı, `Stack.Protected` ile rol koruması) |
| Arka uç | Firebase Authentication, Cloud Firestore |
| Bildirim | expo-notifications, Expo Push Servisi, Firebase Cloud Messaging |
| Dağıtım | EAS Build (APK), EAS Update (uzaktan güncelleme) |
| Arayüz | Kendi bileşen seti, Plus Jakarta Sans, Ionicons, Reanimated |

---

## Proje yapısı

```
src/
├── app/                  # Ekranlar (Expo Router)
│   ├── _layout.tsx       # Kök: oturum, yazı tipleri ve rol koruması
│   ├── login.tsx
│   ├── admin/            # Admin: kullanıcı yönetimi
│   ├── manager/          # Yönetici ekranları
│   └── resident/         # Sakin ekranları
├── components/           # Ortak ekranlar ve arayüz bileşenleri (ui/)
├── config/firebase.ts    # Firebase bağlantısı
├── constants/            # Tema, apartman adı ve daire sayısı
├── context/              # Oturum ve profil (AuthProvider)
├── hooks/                # Ana sayfa özetleri, okunmamış duyurular vb.
├── lib/                  # Yardımcılar: para, tarih, telefon, titreşim
├── services/             # Firestore işlemleri (koleksiyon başına bir dosya)
└── types/                # Veri tipleri
firestore.rules           # Firestore güvenlik kuralları
```

---

## Kurulum

### Gereksinimler

- Node.js 20 veya üzeri
- Android telefonda [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) (geliştirme için)
- Bir Firebase projesi

### 1. Firebase projesi

1. [Firebase Console](https://console.firebase.google.com)'da yeni bir proje oluşturun.
2. **Authentication → Sign-in method** bölümünde **Email/Password**'ü etkinleştirin.
3. **Firestore Database** oluşturun (konum: `eur3`, mod: production).
4. **Project settings → Your apps** bölümünden bir **Web** uygulaması kaydedip yapılandırma değerlerini alın.
5. **Firestore → Rules** sekmesine [`firestore.rules`](firestore.rules) içeriğini yapıştırıp yayınlayın.

### 2. Ortam değişkenleri

```bash
cp .env.example .env
```

`.env` dosyasını Firebase web uygulamasının değerleriyle doldurun. Bu dosya git'e eklenmez.

### 3. Çalıştırma

```bash
npm install
npx expo start
```

Terminaldeki QR kodu Expo Go ile okutun.

### 4. İlk admin hesabı

Uygulama içinden kullanıcı oluşturmak için önce bir admin gerekir; bu hesap bir kez Firebase Console'dan elle açılır:

1. **Authentication → Users → Add user**: e-posta `kullaniciadi@apartman.local`, bir şifre.
2. **Firestore → `users` koleksiyonu**, döküman kimliği = kullanıcının **UID**'si:

   | Alan | Tür | Değer |
   |---|---|---|
   | `username` | string | `kullaniciadi` |
   | `displayName` | string | Ad Soyad |
   | `role` | string | `admin` |
   | `apartmentNo` | null | — |

Sonraki tüm kullanıcılar uygulamadaki admin panelinden eklenir.

> Kullanıcı adları arka planda `kullaniciadi@apartman.local` biçimine çevrilir. Bu adrese hiçbir zaman e-posta gönderilmez; alan adı gerekmez.

---

## Veri modeli

| Koleksiyon | İçerik | Okuma | Yazma |
|---|---|---|---|
| `users/{uid}` | Profil, rol, daire, telefon | Kendisi, yönetici, admin | Admin (kişi kendi telefonunu ve ilk giriş işaretini) |
| `announcements/{id}` | Duyurular | Herkes | Yönetici |
| `announcements/{id}/reads/{uid}` | Okunma kayıtları | Yönetici | Kişinin kendisi |
| `duePeriods/{yyyy-mm}` | Aylık aidat dönemleri | Herkes | Yönetici |
| `dues/{yyyy-mm}_{daire}` | Daire bazlı aidat | Yönetici, ilgili daire | Yönetici |
| `expenses/{id}` | Giderler | Herkes | Yönetici |
| `reports/{yıl}` | Yıllık özet | Herkes | Yönetici |
| `issues/{id}` | Arıza ve istekler | Herkes | Sakin oluşturur, yönetici günceller |
| `polls/{id}` · `votes/{daire}` | Anketler ve gizli oylar | Herkes · ilgili daire | Yönetici · daire tek oy |
| `contacts/{id}` | Önemli numaralar | Herkes | Yönetici |
| `settings/apartment` | IBAN ve hesap bilgisi | Herkes | Yönetici |
| `pushTokens/{uid}` | Bildirim adresi | Yönetici, admin; sakin sadece yöneticilerinkini | Kişinin kendisi |

"Herkes", profili olan giriş yapmış kullanıcıları ifade eder.

---

## Güvenlik

- Yetkiler [`firestore.rules`](firestore.rules) içinde sunucu tarafında denetlenir; arayüzdeki gizleme yalnızca kolaylık içindir.
- Kimse kendi rolünü değiştiremez, admin kendini silemez.
- Sakin başka bir dairenin aidat kaydını ve anket oyunu okuyamaz.
- Anket oyu, oy kaydı ile sayaç aynı işlemde yazılır; kurallar ikisinin tutarlılığını ve daire başına tek oyu zorunlu kılar.
- Firebase web yapılandırma değerleri gizli değildir; asıl koruma güvenlik kurallarıdır. Yine de `.env` git'e eklenmez.

---

## Geliştirme

```bash
npm run typecheck                         # TypeScript kontrolü
npx expo export --platform android        # Android paketini derleyip doğrular
```

Apartman adı ve daire sayısı [`src/constants/apartment.ts`](src/constants/apartment.ts) içinden değiştirilir.

---

## Yol haritası

- [x] İlk girişte zorunlu şifre değişikliği
- [x] APK dağıtımı (EAS Build) ve uzaktan güncelleme (EAS Update)
- [x] Bildirimler (duyuru, anket, aidat, talep güncellemesi)
- [ ] iPhone desteği (kod uyumlu; Apple geliştirici hesabı gerektirir)

---

## Lisans

[MIT](LICENSE) © 2026 Ensar Akbaş
