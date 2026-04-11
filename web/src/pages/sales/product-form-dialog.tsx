import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { getUnits, getCategories, createProduct, updateProduct } from '@/lib/supabase-operations'
import type { DbProduct, Unit, Category } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NO_CATEGORY = '__none__'

interface FormValues {
  name: string
  categoryId: string
  unitId: string
  sellingPrice: number
  costPrice: number
  stockQuantity: number
  description: string
}

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: DbProduct | null
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      categoryId: NO_CATEGORY,
      unitId: '',
      sellingPrice: 0,
      costPrice: 0,
      stockQuantity: 0,
      description: '',
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const [us, cats] = await Promise.all([getUnits(), getCategories()])
        setUnits(us)
        setCategories(cats)
      } catch {
        toast.error('Không thể tải dữ liệu')
      }
    }
    if (open) load()
  }, [open])

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        categoryId: product.categoryId ?? NO_CATEGORY,
        unitId: product.unitId,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        description: product.description ?? '',
      })
    } else {
      reset({
        name: '',
        categoryId: NO_CATEGORY,
        unitId: units[0]?.id ?? '',
        sellingPrice: 0,
        costPrice: 0,
        stockQuantity: 0,
        description: '',
      })
    }
  }, [product, open, reset, units])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const categoryId = values.categoryId === NO_CATEGORY ? undefined : values.categoryId
      if (product) {
        await updateProduct(product.id, {
          name: values.name,
          categoryId,
          unitId: values.unitId,
          sellingPrice: Number(values.sellingPrice),
          costPrice: Number(values.costPrice),
          stockQuantity: Number(values.stockQuantity),
          description: values.description || undefined,
        })
        toast.success('Đã cập nhật sản phẩm')
      } else {
        await createProduct({
          name: values.name,
          categoryId,
          unitId: values.unitId,
          sellingPrice: Number(values.sellingPrice),
          costPrice: Number(values.costPrice),
          stockQuantity: Number(values.stockQuantity),
          description: values.description || undefined,
        })
        toast.success('Đã thêm sản phẩm')
      }
      onOpenChange(false)
    } catch {
      toast.error('Có lỗi khi lưu sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  const unitId = watch('unitId')
  const categoryId = watch('categoryId')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên sản phẩm *</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder="Paracetamol 500mg"
            />
            {errors.name && <p className="text-xs text-destructive">Bắt buộc nhập tên</p>}
          </div>

          <div className="space-y-2">
            <Label>Đơn vị *</Label>
            <Select value={unitId} onValueChange={(v) => setValue('unitId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} ({u.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Select value={categoryId} onValueChange={(v) => setValue('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY}>Không có danh mục</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="selling-price">Giá bán (₫) *</Label>
              <Input
                id="selling-price"
                type="number"
                min={0}
                {...register('sellingPrice', { required: true, min: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost-price">Giá nhập (₫) *</Label>
              <Input
                id="cost-price"
                type="number"
                min={0}
                {...register('costPrice', { required: true, min: 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Tồn kho</Label>
            <Input
              id="stock"
              type="number"
              min={0}
              {...register('stockQuantity', { min: 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Công dụng, liều dùng..."
              rows={2}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : product ? 'Cập nhật' : 'Thêm sản phẩm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
