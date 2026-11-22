'use client';
import { Button } from '@/components/ui/button';

export function PrintButton() {
  return (
    <Button className="no-print self-start" onClick={() => window.print()}>
      列印桌卡
    </Button>
  );
}
