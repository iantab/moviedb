import { useEffect } from "react"
import type { MediaItem, MediaType } from "@/lib/types/tmdb"
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"

interface Props {
  item: MediaItem
  mediaType: MediaType
}

export default function RecordViewIsland({ item, mediaType }: Props) {
  const { addItem } = useRecentlyViewed()

  useEffect(() => {
    addItem(item, mediaType)
  }, [item.id, mediaType]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
