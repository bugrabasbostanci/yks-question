"use client"

import { SearchFilters } from "@/components/search-filters"
import { QuestionGrid } from "@/components/question-grid"

export default function SearchPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Soru Arama</h1>
        <p className="text-muted-foreground mt-2">
          Sorularınızı filtreleyin ve arayın
        </p>
      </div>

      {/* Search and Filters */}
      <SearchFilters />

      {/* Questions Grid */}
      <QuestionGrid onQuestionClick={(id) => {
        // Navigate to question detail page
        window.location.href = `/question/${id}`
      }} />
    </div>
  )
}