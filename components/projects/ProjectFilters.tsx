'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const categories = [
  'Web Development',
  'Mobile Development',
  'Design',
  'Writing',
  'Marketing',
  'Data Entry',
  'Other'
]

export default function ProjectFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [minBudget, setMinBudget] = useState(searchParams.get('minBudget') || '')
  const [maxBudget, setMaxBudget] = useState(searchParams.get('maxBudget') || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (minBudget) params.set('minBudget', minBudget)
    if (maxBudget) params.set('maxBudget', maxBudget)
    
    router.push(`/projects?${params.toString()}`)
  }

  const clearFilters = () => {
    setCategory('')
    setMinBudget('')
    setMaxBudget('')
    router.push('/projects')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Budget Range (₹)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              min={0}
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={applyFilters} className="flex-1">Apply</Button>
          <Button onClick={clearFilters} variant="outline" className="flex-1">Clear</Button>
        </div>
      </CardContent>
    </Card>
  )
}