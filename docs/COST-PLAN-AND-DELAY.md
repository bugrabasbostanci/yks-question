# 💰 Maliyet Erteleme Optimizasyon Teknikleri

## 1. 🖼️ Akıllı Görsel Sıkıştırma

### Frontend - Upload Sırasında Sıkıştırma

```typescript
// lib/imageCompression.ts
export class ImageOptimizer {
  static async compressImage(
    file: File,
    maxWidth = 1200,
    quality = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      const img = new Image();

      img.onload = () => {
        // Orantılı boyutlandırma
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Sıkıştırma
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: "image/webp", // WebP formatında kaydet
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Thumbnail oluşturma
  static async createThumbnail(file: File): Promise<File> {
    return this.compressImage(file, 400, 0.6); // 400px, %60 kalite
  }
}
```

### Upload Komponenti

```typescript
// components/UploadQuestion.tsx
import { ImageOptimizer } from "@/lib/imageCompression";

export default function UploadQuestion() {
  const handleFileUpload = async (file: File) => {
    try {
      // Hem thumbnail hem full size sıkıştır
      const [thumbnail, compressed] = await Promise.all([
        ImageOptimizer.createThumbnail(file),
        ImageOptimizer.compressImage(file, 1200, 0.8),
      ]);

      console.log(`Orijinal: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `Sıkıştırılmış: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`
      );
      console.log(`Thumbnail: ${(thumbnail.size / 1024).toFixed(0)}KB`);

      // Upload işlemi
      await uploadToSupabase(compressed, thumbnail);
    } catch (error) {
      console.error("Sıkıştırma hatası:", error);
    }
  };
}
```

## 2. 📦 Smart Storage Strategy

### Database Schema - Storage Optimized

```sql
-- storage_optimized_schema.sql
CREATE TABLE sorular (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik VARCHAR(255),

  -- Sadece dosya yolları - metadata'yı minimize et
  image_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,

  -- Enum'lar storage tasarrufu için
  ders soru_ders_enum NOT NULL,
  zorluk_seviyesi INTEGER CHECK (zorluk_seviyesi BETWEEN 1 AND 5),

  -- Array yerine junction table (daha verimli)
  favori BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Index'ler sadece gerekli yerlerde
  INDEX idx_ders (ders),
  INDEX idx_favori (favori) WHERE favori = TRUE -- Partial index
);

-- Tags için ayrı tablo (normalize)
CREATE TABLE soru_tags (
  soru_id UUID REFERENCES sorular(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  PRIMARY KEY (soru_id, tag)
);
```

### Supabase Storage Konfigürasyonu

```typescript
// lib/supabase-storage.ts
export class StorageManager {
  private static BUCKETS = {
    IMAGES: "soru-images",
    THUMBNAILS: "soru-thumbnails",
  };

  static async uploadOptimized(file: File, thumbnail: File, soruId: string) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Klasör yapısı - organize storage
    const imagePath = `${year}/${month}/${soruId}.webp`;
    const thumbPath = `${year}/${month}/${soruId}_thumb.webp`;

    const [imageUpload, thumbUpload] = await Promise.all([
      supabase.storage.from(this.BUCKETS.IMAGES).upload(imagePath, file, {
        cacheControl: "31536000", // 1 yıl cache
        upsert: false,
      }),
      supabase.storage
        .from(this.BUCKETS.THUMBNAILS)
        .upload(thumbPath, thumbnail, {
          cacheControl: "31536000",
          upsert: false,
        }),
    ]);

    return { imagePath, thumbPath };
  }
}
```

## 3. 🚀 Smart Loading & Caching

### Lazy Loading Komponenti

```typescript
// components/SoruGrid.tsx
import { useState, useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";

export default function SoruGrid() {
  const [sorular, setSorular] = useState<Soru[]>([]);
  const [page, setPage] = useState(0);
  const { ref, inView } = useInView();

  // Sayfalama - her seferinde 20 soru
  const loadSorular = useCallback(async (pageNum: number) => {
    const from = pageNum * 20;
    const to = from + 19;

    const { data } = await supabase
      .from("sorular")
      .select(
        `
        id, baslik, thumbnail_path, ders, favori,
        soru_tags(tag)
      `
      )
      .range(from, to)
      .order("created_at", { ascending: false });

    return data || [];
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (inView) {
      loadSorular(page).then((newSorular) => {
        setSorular((prev) => [...prev, ...newSorular]);
        setPage((prev) => prev + 1);
      });
    }
  }, [inView, page]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sorular.map((soru) => (
        <SoruCard key={soru.id} soru={soru} />
      ))}
      <div ref={ref} className="col-span-full h-20" />
    </div>
  );
}
```

### Image Lazy Loading

```typescript
// components/OptimizedImage.tsx
import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  className?: string;
}

export default function OptimizedImage({
  src,
  thumbnailSrc,
  alt,
  className,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Thumbnail önce yüklenir */}
      {thumbnailSrc && !isLoaded && (
        <Image
          src={thumbnailSrc}
          alt={alt}
          fill
          className="object-cover blur-sm"
          priority={false}
        />
      )}

      {/* Ana görsel lazy load */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoadingComplete={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />

      {/* Fallback */}
      {error && (
        <div className="flex items-center justify-center bg-gray-200">
          <span className="text-gray-500">Görsel yüklenemedi</span>
        </div>
      )}
    </div>
  );
}
```

## 4. 🔍 Verimli Database Queries

### Query Optimizasyonu

```typescript
// lib/queries.ts
export class OptimizedQueries {
  // Sadece gerekli alanları çek
  static async getMinimalSorular(filters: FilterOptions) {
    let query = supabase.from("sorular").select(`
        id,
        baslik,
        thumbnail_path,
        ders,
        favori,
        created_at
      `); // Full image path'i alma - sadece detay sayfasında

    // Conditional loading
    if (filters.tags?.length) {
      query = query.in(
        "id",
        supabase.from("soru_tags").select("soru_id").in("tag", filters.tags)
      );
    }

    return query
      .range(filters.offset, filters.offset + 19)
      .order("created_at", { ascending: false });
  }

  // Cache-friendly search
  static async searchSorular(searchTerm: string) {
    const cacheKey = `search:${searchTerm}`;

    // LocalStorage cache kontrol
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        // 5 dakika cache
        return data;
      }
    }

    const { data } = await supabase
      .from("sorular")
      .select("id, baslik, thumbnail_path, ders")
      .ilike("baslik", `%${searchTerm}%`)
      .limit(50);

    // Cache'e kaydet
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );

    return data;
  }
}
```

## 5. 📱 Mobile-First Optimizations

### Service Worker - Offline Support

```typescript
// public/sw.js
const CACHE_NAME = "soru-arsivi-v1";
const STATIC_CACHE = ["/", "/manifest.json", "/favicon.ico"];

// Thumbnail'ları cache'le
self.addEventListener("fetch", (event) => {
  if (event.request.url.includes("thumbnails")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response;

          return fetch(event.request).then((fetchResponse) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

## 📊 Beklenen Tasarruf

| Optimizasyon           | Tasarruf Oranı     | Ek Süre  |
| ---------------------- | ------------------ | -------- |
| **WebP + Sıkıştırma**  | 60-70%             | +4-5 ay  |
| **Thumbnail Sistemi**  | 80% bandwidth      | +3 ay    |
| **Lazy Loading**       | 90% ilk yükleme    | Sınırsız |
| **Query Optimization** | API call %50       | Sınırsız |
| **Caching**            | %80 tekrar ziyaret | Sınırsız |

### 🎯 Sonuç

- **Ücretsiz kullanım:** 4-5 ay → **12+ ay**
- **Dosya boyutu:** 1MB → **300-400KB**
- **Yükleme hızı:** 3x daha hızlı
- **Bandwidth:** 5x tasarruf

Bu optimizasyonları hangi sırayla uygulamak istiyorsun? Öncelikli olanlardan başlayalım! 🚀
