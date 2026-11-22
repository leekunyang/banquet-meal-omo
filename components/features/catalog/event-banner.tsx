import type { BanquetEvent } from '@/types/domain';
import { Notice } from '@/components/ui/notice';
import { IconClock, IconGift } from '@/components/common/icons';
import { formatDateTime, formatTWD } from '@/lib/utils';
import { isEventActive } from '@/lib/events/rules';

/** US-5.2 / US-5.3: the banquet offer is applied automatically; an expired one never blocks buying. */
export function EventBanner({ event }: { event: BanquetEvent }) {
  if (isEventActive(event) && event.discountAmount > 0) {
    return (
      <Notice tone="danger" role="status" icon={<IconGift className="text-primary" />} title={<span className="text-primary-hover">宴席限定：結帳自動折 {formatTWD(event.discountAmount)}</span>}>
        不用輸入優惠碼，優惠到 {formatDateTime(event.validUntil)}
      </Notice>
    );
  }
  return (
    <Notice tone="info" icon={<IconClock className="text-muted" />} title="此優惠已結束">
      商品仍可用原價購買
    </Notice>
  );
}
