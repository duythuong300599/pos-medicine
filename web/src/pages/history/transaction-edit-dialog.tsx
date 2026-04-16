import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Banknote, QrCode, CalendarDays, History, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  updateTransaction,
  getTransactionEditLogs,
  updateTransactionItemPrices,
} from '@/lib/supabase-operations';
import type {
  DbTransaction,
  DbTransactionItem,
  DbTransactionEditLog,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const fmt = new Intl.NumberFormat('vi-VN');

function toDateInputValue(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}

function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/** Hiển thị tên trường theo tiếng Việt */
function fieldLabel(fieldName: string): string {
  if (fieldName.startsWith('item_price:')) return 'Giá bán sản phẩm';
  const labels: Record<string, string> = {
    payment_method: 'Phương thức thanh toán',
    notes: 'Ghi chú',
    sale_date: 'Ngày bán',
    discount_amount: 'Giảm giá',
    subtotal: 'Tạm tính',
    total_amount: 'Tổng cộng',
  };
  return labels[fieldName] ?? fieldName;
}

function formatFieldValue(
  fieldName: string,
  value: string | undefined,
): string {
  if (value === undefined || value === null) return '(trống)';
  if (fieldName === 'payment_method')
    return value === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
  if (fieldName === 'sale_date') {
    try {
      return format(new Date(value), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return value;
    }
  }
  if (
    ['discount_amount', 'subtotal', 'total_amount'].includes(fieldName) ||
    fieldName.startsWith('item_price:')
  ) {
    const num = parseFloat(value);
    return isNaN(num) ? value : `${fmt.format(num)}₫`;
  }
  return value;
}

interface TransactionEditDialogProps {
  transaction: DbTransaction | null;
  txItems: DbTransactionItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: DbTransaction) => void;
  onItemsUpdated?: (items: DbTransactionItem[]) => void;
}

export function TransactionEditDialog({
  transaction,
  txItems,
  open,
  onOpenChange,
  onSaved,
  onItemsUpdated,
}: TransactionEditDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash');
  const [notes, setNotes] = useState('');
  const [saleDate, setSaleDate] = useState(today());
  const [discountAmount, setDiscountAmount] = useState(0);
  const [editReason, setEditReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [editLogs, setEditLogs] = useState<DbTransactionEditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  // Giá sản phẩm đang chỉnh sửa: map itemId → newPrice
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});

  // Đồng bộ state khi mở dialog với dữ liệu hoá đơn hiện tại
  useEffect(() => {
    if (!transaction) return;
    setPaymentMethod(transaction.payment_method);
    setNotes(transaction.notes ?? '');
    const dateStr = transaction.saleDate ?? transaction.createdAt;
    setSaleDate(dateStr ? toDateInputValue(dateStr) : today());
    setDiscountAmount(transaction.discountAmount ?? 0);
    setEditReason('');
  }, [transaction]);

  // Reset giá sản phẩm theo txItems khi items thay đổi
  useEffect(() => {
    const prices: Record<string, number> = {};
    for (const item of txItems) prices[item.id] = item.unitPrice;
    setItemPrices(prices);
  }, [txItems]);

  // Tải lịch sử chỉnh sửa mỗi khi mở dialog
  useEffect(() => {
    if (!open || !transaction) return;
    setLogsLoading(true);
    getTransactionEditLogs(transaction.id)
      .then(setEditLogs)
      .catch(() => toast.error('Không thể tải lịch sử chỉnh sửa'))
      .finally(() => setLogsLoading(false));
  }, [open, transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    setLoading(true);
    try {
      const saleDateISO = new Date(
        saleDate + 'T' + format(new Date(), 'HH:mm:ss'),
      ).toISOString();

      // Cập nhật metadata hoá đơn
      const updatedTx = await updateTransaction(
        transaction.id,
        {
          paymentMethod,
          notes: notes.trim() || null,
          saleDate: saleDateISO,
          discountAmount,
          editReason: editReason.trim() || undefined,
        },
        transaction,
      );

      // Cập nhật giá sản phẩm nếu có thay đổi
      const priceChanges = txItems
        .filter(
          (item) =>
            itemPrices[item.id] !== undefined &&
            itemPrices[item.id] !== item.unitPrice,
        )
        .map((item) => ({
          itemId: item.id,
          oldPrice: item.unitPrice,
          newPrice: itemPrices[item.id],
        }));

      let finalTx = updatedTx;
      if (priceChanges.length > 0) {
        finalTx = await updateTransactionItemPrices(
          transaction.id,
          updatedTx,
          priceChanges,
          editReason.trim() || undefined,
        );
        // Tính lại items để báo lên trên
        if (onItemsUpdated) {
          const updatedItems = txItems.map((item) => {
            const change = priceChanges.find((c) => c.itemId === item.id);
            if (!change) return item;
            return {
              ...item,
              unitPrice: change.newPrice,
              subtotal: change.newPrice * item.quantity,
            };
          });
          onItemsUpdated(updatedItems);
        }
      }

      toast.success('Đã lưu thay đổi');
      onSaved(finalTx);
      onOpenChange(false);
    } catch {
      toast.error('Có lỗi khi lưu thay đổi');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Chỉnh sửa hoá đơn — {transaction.transactionCode}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="edit" className="flex flex-col flex-1 min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">
              Chỉnh sửa
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 flex items-center gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              Lịch sử
              {editLogs.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-4 min-w-4 px-1 text-[10px]"
                >
                  {editLogs.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Tab chỉnh sửa ───────────────────────────────── */}
          <TabsContent
            value="edit"
            className="flex-1 min-h-0 overflow-y-auto mt-4"
          >
            <div className="space-y-4 pr-0.5">
              {/* Ngày bán */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-sale-date"
                  className="flex items-center gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  Ngày bán
                </Label>
                <input
                  id="edit-sale-date"
                  type="date"
                  value={saleDate}
                  max={today()}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className="flex gap-2"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote className="h-4 w-4" />
                    Tiền mặt
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                    className="flex gap-2"
                    onClick={() => setPaymentMethod('qr')}
                  >
                    <QrCode className="h-4 w-4" />
                    Chuyển khoản
                  </Button>
                </div>
              </div>

              {/* Giảm giá */}
              <div className="space-y-2">
                <Label htmlFor="edit-discount">Giảm giá (₫)</Label>
                <input
                  id="edit-discount"
                  type="number"
                  min={0}
                  value={discountAmount || ''}
                  onChange={(e) =>
                    setDiscountAmount(Number(e.target.value) || 0)
                  }
                  placeholder="0"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {/* Giá sản phẩm */}
              {txItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Giá bán sản phẩm</Label>
                  <div className="space-y-2 rounded-md border p-3">
                    {txItems.map((item) => (
                      <ItemPriceRow
                        key={item.id}
                        item={item}
                        currentPrice={itemPrices[item.id] ?? item.unitPrice}
                        onPriceChange={(price) =>
                          setItemPrices((prev) => ({
                            ...prev,
                            [item.id]: price,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Ghi chú</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Ghi chú đơn hàng..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Lý do chỉnh sửa */}
              <div className="space-y-2">
                <Label htmlFor="edit-reason">
                  Lý do chỉnh sửa{' '}
                  <span className="text-muted-foreground font-normal">
                    (tuỳ chọn)
                  </span>
                </Label>
                <Textarea
                  id="edit-reason"
                  placeholder="Vd: Khách đổi hình thức thanh toán..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tab lịch sử chỉnh sửa ────────────────────────── */}
          <TabsContent
            value="history"
            className="flex-1 min-h-0 overflow-y-auto mt-4"
          >
            {logsLoading ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Đang tải...
              </p>
            ) : editLogs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Chưa có lịch sử chỉnh sửa
              </p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-2">
                  {editLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-md border p-3 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {fieldLabel(log.field_name)}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {log.createdAt
                            ? format(
                                new Date(log.createdAt),
                                'HH:mm dd/MM/yyyy',
                                { locale: vi },
                              )
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground line-through">
                          {formatFieldValue(log.field_name, log.oldValue)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-foreground font-medium">
                          {formatFieldValue(log.field_name, log.newValue)}
                        </span>
                      </div>
                      {log.editReason && (
                        <p className="text-xs text-muted-foreground italic">
                          Lý do: {log.editReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ItemPriceRow ─────────────────────────────────────────────────────────────

interface ItemPriceRowProps {
  item: DbTransactionItem;
  currentPrice: number;
  onPriceChange: (price: number) => void;
}

function ItemPriceRow({
  item,
  currentPrice,
  onPriceChange,
}: ItemPriceRowProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(currentPrice));
  const changed = currentPrice !== item.unitPrice;

  const handleBlur = () => {
    const val = parseInt(input.replace(/\D/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      onPriceChange(val);
      setInput(String(val));
    } else {
      onPriceChange(item.unitPrice);
      setInput(String(item.unitPrice));
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm">{item.productName}</p>
        <p className="text-xs text-muted-foreground">
          × {item.quantity} {item.unitName}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              value={input}
              autoFocus
              onChange={(e) => setInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setInput(String(currentPrice));
                  setEditing(false);
                }
              }}
              className="h-7 w-28 rounded border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-right"
            />
            <span className="text-xs text-muted-foreground">₫</span>
          </div>
        ) : (
          <button
            type="button"
            className="flex items-center gap-1 text-xs hover:text-foreground group"
            onClick={() => {
              setInput(String(currentPrice));
              setEditing(true);
            }}
          >
            <span
              className={
                changed
                  ? 'text-orange-600 font-medium'
                  : 'text-muted-foreground'
              }
            >
              {fmt.format(currentPrice)}₫
            </span>
            <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </button>
        )}
      </div>
    </div>
  );
}
