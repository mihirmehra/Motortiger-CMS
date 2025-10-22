import * as React from "react"
import { LeadType } from "@/models/Lead"
import { Toggle } from "@/components/ui/toggle"
import { Badge } from "@/components/ui/badge"

interface LeadTypeToggleProps {
  value: LeadType
  onChange: (value: LeadType) => void
  showBadge?: boolean
  className?: string
}

export function LeadTypeToggle({ 
  value, 
  onChange, 
  showBadge = false, 
  className = "" 
}: LeadTypeToggleProps) {
  const togglePressed = value === 'website'
  
  const handleToggle = () => {
    onChange(togglePressed ? 'Inbound call' : 'website')
  }
  
  if (showBadge) {
    return (
      <Badge
        {...({ variant: value === 'website' ? "destructive" : "default", className: "mb-2" } as any)}
      >
        {value}
      </Badge>
    )
  }

  return (
    <Toggle
      pressed={togglePressed}
      onPressedChange={handleToggle}
      variant="outline"
      className={className}
      aria-label="Toggle lead type"
    >
      {value}
    </Toggle>
  )
}