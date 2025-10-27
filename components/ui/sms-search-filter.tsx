"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter } from "lucide-react"

interface SearchFilters {
  query: string
  status: "active" | "archived" | "closed" | "all"
  sortBy: "recent" | "unread" | "oldest"
  hasUnread: boolean
}

interface SMSSearchFilterProps {
  onFiltersChange: (filters: SearchFilters) => void
  totalConversations: number
  unreadCount: number
}

export default function SMSSearchFilter({ onFiltersChange, totalConversations, unreadCount }: SMSSearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    status: "active",
    sortBy: "recent",
    hasUnread: false,
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
  }

  const handleReset = () => {
    const defaultFilters: SearchFilters = {
      query: "",
      status: "active",
      sortBy: "recent",
      hasUnread: false,
    }
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const isFiltered =
    filters.query !== "" || filters.status !== "active" || filters.sortBy !== "recent" || filters.hasUnread

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by phone, name, or message..."
              value={filters.query}
              onChange={(e) => handleFilterChange({ query: e.target.value })}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="gap-1">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1">
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t">
            {/* Status Filter */}
            <div>
              <p className="text-sm font-medium mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "archived", "closed"] as const).map((status) => (
                  <Badge
                    key={status}
                    variant={filters.status === status ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => handleFilterChange({ status })}
                  >
                    {status}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <p className="text-sm font-medium mb-2">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {(["recent", "unread", "oldest"] as const).map((sort) => (
                  <Badge
                    key={sort}
                    variant={filters.sortBy === sort ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => handleFilterChange({ sortBy: sort })}
                  >
                    {sort === "recent" ? "Most Recent" : sort === "unread" ? "Unread First" : "Oldest First"}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Unread Filter */}
            <div>
              <Button
                variant={filters.hasUnread ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange({ hasUnread: !filters.hasUnread })}
                className="gap-2"
              >
                {filters.hasUnread ? "✓" : ""} Unread Only
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-gray-600 pt-2 border-t">
              <span>Total: {totalConversations}</span>
              {unreadCount > 0 && <span className="text-red-600 font-medium">Unread: {unreadCount}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
