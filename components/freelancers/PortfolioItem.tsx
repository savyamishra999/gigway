import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Github } from 'lucide-react'
import Image from 'next/image'

interface PortfolioItemProps {
  item: {
    id: string
    title: string
    description: string
    image_urls: string[]
    live_url: string
    github_url: string
    is_verified: boolean
  }
}

export default function PortfolioItem({ item }: PortfolioItemProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{item.title}</span>
          {item.is_verified && <Badge className="bg-green-600">Verified</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {item.image_urls?.[0] && (
          <div className="relative w-full h-40 mb-3 rounded-md overflow-hidden">
            <Image
              src={item.image_urls[0]}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
      </CardContent>
      <CardFooter className="flex gap-2">
        {item.live_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={item.live_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" /> Live Demo
            </a>
          </Button>
        )}
        {item.github_url && (
          <Button size="sm" variant="outline" asChild>
            <a href={item.github_url} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4 mr-1" /> Code
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}