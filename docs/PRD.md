# YKS Soru Arşivi - Product Requirements Document (PRD)

## 1. Problem Statement

YKS'ye hazırlanan öğrenciler zorlandıkları veya beğendikleri soruları kağıt-kalem ile kaydetmekte, bu da organizasyon ve erişim zorluğu yaratmaktadır. Dijital bir platform ile soruların kategorize edilmesi, aranması ve tekrar edilmesi çok daha verimli olacaktır.

## 2. Target Users

### Phase 1: Kişisel Kullanım

- **Primary User:** Sen (YKS'ye hazırlanan öğrenci)
- **Use Case:** Kişisel soru arşivi oluşturma ve yönetme

### Phase 2: Multi-User Platform

- **Primary Users:** YKS'ye hazırlanan öğrenciler (16-18 yaş)
- **Secondary Users:** Öğretmenler, dershane öğretmenleri
- **Use Case:** Soru paylaşımı, kolektif öğrenme

## 3. Goals & Objectives

### Primary Goals

- ✅ Soruları dijital ortamda organize etme
- ✅ Hızlı arama ve filtreleme
- ✅ Konu/ders bazında kategorizasyon
- ✅ Mobil uyumlu erişim

### Secondary Goals

- 📈 Çalışma istatistikleri
- 🤝 Soru paylaşım sistemi (Phase 2)
- 📊 Performans analizi

## 4. Feature Specifications

### 🚀 MVP Features (Phase 1 - Kişisel)

| Feature                | Öncelik | Açıklama                                   |
| ---------------------- | ------- | ------------------------------------------ |
| **Fotoğraf Yükleme**   | P0      | Drag&drop ile soru fotoğrafı yükleme       |
| **Tag Sistemi**        | P0      | Ders, konu, zorluk seviyesi etiketleme     |
| **Arama & Filtreleme** | P0      | Text search + tag filtreleri               |
| **Soru Detay Sayfası** | P0      | Fotoğraf görüntüleme + metadata            |
| **Favori Sistemi**     | P1      | Önemli soruları işaretleme                 |
| **Dashboard**          | P1      | İstatistikler (toplam soru, ders dağılımı) |

### 🔮 Future Features (Phase 2 - Multi-User)

| Feature                    | Öncelik | Açıklama                              |
| -------------------------- | ------- | ------------------------------------- |
| **User Authentication**    | P0      | Kayıt/giriş sistemi                   |
| **Public/Private Sorular** | P0      | Soru paylaşım ayarları                |
| **Soru Paylaşım**          | P1      | Diğer kullanıcıların sorularını görme |
| **Comment System**         | P1      | Sorulara yorum yapma                  |
| **Rating System**          | P2      | Soruları puanlama                     |
| **Study Groups**           | P2      | Grup çalışması özelliği               |

## 5. Technical Requirements

### Frontend

- **Framework:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand (basit) veya Redux Toolkit
- **Image Handling:** next/image + lazy loading

### Backend & Database

- **BaaS:** Supabase (PostgreSQL + Storage + Auth)
- **Image Storage:** Supabase Storage
- **Real-time:** Supabase Real-time (Phase 2 için)

### Performance Requirements

- ⚡ İlk yükleme: <3 saniye
- 🖼️ Image loading: <2 saniye
- 🔍 Arama sonuçları: <1 saniye
- 📱 Mobile responsive: 100%

## 6. Success Metrics

### Phase 1 Metrics

- 📊 Günlük soru yükleme sayısı
- 🔍 Arama kullanım sıklığı
- ⏱️ Platform kullanım süresi
- 📱 Mobil vs desktop kullanım oranı

### Phase 2 Metrics

- 👥 Aktif kullanıcı sayısı
- 🤝 Soru paylaşım oranı
- 💬 Engagement rate (yorum, beğeni)
- 📈 User retention rate
