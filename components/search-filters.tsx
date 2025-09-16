"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuestionStore } from "@/lib/store"
import { SUBJECT_LABELS } from "@/lib/types"
import type { FilterOptions, Subject, DifficultyLevel } from "@/lib/types"

export function SearchFilters() {
  const { filters, setFilters, clearFilters } = useQuestionStore()
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [searchTerm, setSearchTerm] = useState(filters.search || "")

  // Update local filters when store filters change
  useEffect(() => {
    setLocalFilters(filters)
    setSearchTerm(filters.search || "")
  }, [filters])

  // Apply filters with debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        // Use current filters from store instead of localFilters to avoid circular dependency
        setFilters({ ...filters, search: searchTerm || undefined })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, filters, setFilters])

  const handleSubjectChange = (subject: string) => {
    const subjects = localFilters.subjects || []
    const newSubjects = subjects.includes(subject as Subject)
      ? subjects.filter((s) => s !== subject)
      : [...subjects, subject as Subject]

    const updatedFilters = {
      ...localFilters,
      subjects: newSubjects.length > 0 ? newSubjects : undefined,
    }
    setLocalFilters(updatedFilters)
    setFilters(updatedFilters)
  }

  const handleDifficultyChange = (difficulty: string) => {
    const levels = localFilters.difficulty_levels || []
    const difficultyLevel = parseInt(difficulty) as DifficultyLevel
    const newLevels = levels.includes(difficultyLevel)
      ? levels.filter((l) => l !== difficultyLevel)
      : [...levels, difficultyLevel]

    const updatedFilters = {
      ...localFilters,
      difficulty_levels: newLevels.length > 0 ? newLevels : undefined,
    }
    setLocalFilters(updatedFilters)
    setFilters(updatedFilters)
  }

  const handleStatusFilter = (key: "is_favorite" | "is_solved") => {
    const currentValue = localFilters[key]
    const newValue = currentValue === true ? undefined : true

    const updatedFilters = {
      ...localFilters,
      [key]: newValue,
    }
    setLocalFilters(updatedFilters)
    setFilters(updatedFilters)
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setLocalFilters({})
    clearFilters()
    setShowAdvanced(false)
  }

  const hasActiveFilters =
    searchTerm ||
    localFilters.subjects?.length ||
    localFilters.difficulty_levels?.length ||
    localFilters.is_favorite ||
    localFilters.is_solved

  const getDifficultyLabel = (level: DifficultyLevel) => {
    const labels = {
      1: "Çok Kolay",
      2: "Kolay",
      3: "Orta",
      4: "Zor",
      5: "Çok Zor"
    }
    return labels[level]
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Arama & Filtreler</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAdvanced ? "Basit" : "Detaylı"}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Temizle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sorularda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subject Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ders</label>
            <div className="flex flex-wrap gap-1">
              {Object.entries(SUBJECT_LABELS).map(([key, label]) => {
                const isSelected = localFilters.subjects?.includes(key as Subject)
                return (
                  <Badge
                    key={key}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleSubjectChange(key)}
                  >
                    {label}
                  </Badge>
                )
              })}
            </div>
          </div>

          {/* Status Filters */}
          <div>
            <label className="text-sm font-medium mb-2 block">Durum</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={localFilters.is_favorite ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleStatusFilter("is_favorite")}
              >
                ❤️ Favoriler
              </Badge>
              <Badge
                variant={localFilters.is_solved ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleStatusFilter("is_solved")}
              >
                ✅ Çözülenler
              </Badge>
            </div>
          </div>

          {/* Difficulty Filter */}
          {showAdvanced && (
            <div>
              <label className="text-sm font-medium mb-2 block">Zorluk</label>
              <div className="flex flex-wrap gap-1">
                {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => {
                  const isSelected = localFilters.difficulty_levels?.includes(level)
                  return (
                    <Badge
                      key={level}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleDifficultyChange(level.toString())}
                    >
                      {level}⭐ {getDifficultyLabel(level)}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Aktif filtreler:</span>
              <div className="flex flex-wrap gap-1">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Arama: &ldquo;{searchTerm}&rdquo;
                  </Badge>
                )}
                {localFilters.subjects?.map((subject) => (
                  <Badge key={subject} variant="secondary" className="text-xs">
                    {SUBJECT_LABELS[subject]}
                  </Badge>
                ))}
                {localFilters.difficulty_levels?.map((level) => (
                  <Badge key={level} variant="secondary" className="text-xs">
                    {level}⭐
                  </Badge>
                ))}
                {localFilters.is_favorite && (
                  <Badge variant="secondary" className="text-xs">
                    Favoriler
                  </Badge>
                )}
                {localFilters.is_solved && (
                  <Badge variant="secondary" className="text-xs">
                    Çözülenler
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}