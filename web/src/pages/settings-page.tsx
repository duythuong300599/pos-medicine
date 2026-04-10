import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getCategoriesWithCount,
  createCategory,
  updateCategory,
  deleteCategory,
  getUnitsWithCount,
  createUnit,
  updateUnit,
  deleteUnit,
} from '@/lib/supabase-operations'
import type { Category, Unit } from '@/lib/supabase'
import type { CategoryWithCount, UnitWithCount } from '@/lib/supabase-operations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pencil, Trash2 } from 'lucide-react'

// ─── Category Tab ─────────────────────────────────────────────────────────────

function CategoryTab() {
  const [items, setItems] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<Category | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getCategoriesWithCount())
    } catch {
      toast.error('Không thể tải danh mục')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteCategory(deleteTarget.id)
      toast.success(`Đã xóa danh mục "${deleteTarget.name}"`)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Có lỗi khi xóa danh mục')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <p className="text-sm text-muted-foreground">{items.length} danh mục</p>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          + Thêm danh mục
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Chưa có danh mục nào
          </div>
        ) : (
          <div className="divide-y px-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {item.productCount} sp
                </Badge>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditItem(item); setDialogOpen(true) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={item.productCount > 0}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {item.productCount > 0 && (
                      <TooltipContent>
                        Có {item.productCount} sản phẩm đang dùng danh mục này
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <CategoryFormDialog
        open={dialogOpen}
        item={editItem}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) load()
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa danh mục</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa danh mục <strong>"{deleteTarget?.name}"</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Category Form Dialog ─────────────────────────────────────────────────────

interface CategoryFormDialogProps {
  open: boolean
  item: Category | null
  onOpenChange: (open: boolean) => void
}

function CategoryFormDialog({ open, item, onOpenChange }: CategoryFormDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setDescription(item?.description ?? '')
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      if (item) {
        await updateCategory(item.id, name.trim(), description.trim() || undefined)
        toast.success('Đã cập nhật danh mục')
      } else {
        await createCategory(name.trim(), description.trim() || undefined)
        toast.success('Đã thêm danh mục')
      }
      onOpenChange(false)
    } catch {
      toast.error('Có lỗi khi lưu danh mục')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? 'Sửa danh mục' : 'Thêm danh mục'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Tên danh mục *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Thuốc kháng sinh"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">Mô tả</Label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả danh mục..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Unit Tab ─────────────────────────────────────────────────────────────────

function UnitTab() {
  const [items, setItems] = useState<UnitWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [editItem, setEditItem] = useState<Unit | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<UnitWithCount | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getUnitsWithCount())
    } catch {
      toast.error('Không thể tải đơn vị')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteUnit(deleteTarget.id)
      toast.success(`Đã xóa đơn vị "${deleteTarget.name}"`)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Có lỗi khi xóa đơn vị')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <p className="text-sm text-muted-foreground">{items.length} đơn vị</p>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          + Thêm đơn vị
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Chưa có đơn vị nào
          </div>
        ) : (
          <div className="divide-y px-6">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.abbreviation}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {item.productCount} sp
                </Badge>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => { setEditItem(item); setDialogOpen(true) }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          disabled={item.productCount > 0}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {item.productCount > 0 && (
                      <TooltipContent>
                        Có {item.productCount} sản phẩm đang dùng đơn vị này
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <UnitFormDialog
        open={dialogOpen}
        item={editItem}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) load()
        }}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xóa đơn vị</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa đơn vị <strong>"{deleteTarget?.name}"</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Unit Form Dialog ─────────────────────────────────────────────────────────

interface UnitFormDialogProps {
  open: boolean
  item: Unit | null
  onOpenChange: (open: boolean) => void
}

function UnitFormDialog({ open, item, onOpenChange }: UnitFormDialogProps) {
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(item?.name ?? '')
      setAbbreviation(item?.abbreviation ?? '')
    }
  }, [open, item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !abbreviation.trim()) return
    setLoading(true)
    try {
      if (item) {
        await updateUnit(item.id, name.trim(), abbreviation.trim())
        toast.success('Đã cập nhật đơn vị')
      } else {
        await createUnit(name.trim(), abbreviation.trim())
        toast.success('Đã thêm đơn vị')
      }
      onOpenChange(false)
    } catch {
      toast.error('Có lỗi khi lưu đơn vị')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{item ? 'Sửa đơn vị' : 'Thêm đơn vị'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="unit-name">Tên đơn vị *</Label>
            <Input
              id="unit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Viên"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit-abbr">Ký hiệu *</Label>
            <Input
              id="unit-abbr"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="v"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading || !name.trim() || !abbreviation.trim()}>
              {loading ? 'Đang lưu...' : item ? 'Cập nhật' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Cài đặt</h1>
      </div>

      <Tabs defaultValue="categories" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="categories">Danh mục</TabsTrigger>
          <TabsTrigger value="units">Đơn vị</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="flex-1 flex flex-col min-h-0 mt-0">
          <CategoryTab />
        </TabsContent>

        <TabsContent value="units" className="flex-1 flex flex-col min-h-0 mt-0">
          <UnitTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
