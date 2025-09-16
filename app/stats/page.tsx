"use client";

// Edge Runtime configuration for Cloudflare Pages
export const runtime = 'edge';

import { useEffect } from "react"
import { BarChart3, Heart, CheckCircle, BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuestionStore } from "@/lib/store"
import { SUBJECT_LABELS } from "@/lib/types"

export default function StatsPage() {
  const { stats, loadStatistics, loading } = useQuestionStore()

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">İstatistikler yükleniyor...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">İstatistik bulunamadı</div>
      </div>
    )
  }

  const completionRate = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0
  const favoriteRate = stats.total > 0 ? Math.round((stats.favorites / stats.total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">İstatistikler</h1>
        <p className="text-muted-foreground mt-2">
          Çalışma ilerlemenizi takip edin
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Toplam Soru</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.solved}</p>
                <p className="text-sm text-muted-foreground">Çözülen Soru</p>
                <p className="text-xs text-green-500 font-medium">%{completionRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.favorites}</p>
                <p className="text-sm text-muted-foreground">Favori Soru</p>
                <p className="text-xs text-red-500 font-medium">%{favoriteRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total - stats.solved}</p>
                <p className="text-sm text-muted-foreground">Bekleyen Soru</p>
                <p className="text-xs text-yellow-500 font-medium">%{100 - completionRate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Ders Bazında Dağılım
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.bySubject).map(([subject, count]) => (
              <div key={subject} className="text-center">
                <div className="bg-primary/5 rounded-lg p-4 mb-2">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS]}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Çözüm İlerlemesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Çözülen Sorular</span>
                <span>{stats.solved}/{stats.total} (%{completionRate})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Favori Sorular</span>
                <span>{stats.favorites}/{stats.total} (%{favoriteRate})</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${favoriteRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">Çözülmemiş sorular</span>
              <Badge variant="outline">{stats.total - stats.solved} soru</Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <span className="text-sm font-medium">Favori sorular</span>
              <Badge variant="outline" className="border-red-200 text-red-700">
                {stats.favorites} soru
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <span className="text-sm font-medium">Çözülen sorular</span>
              <Badge variant="outline" className="border-green-200 text-green-700">
                {stats.solved} soru
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}