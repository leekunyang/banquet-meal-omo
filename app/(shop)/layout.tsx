import { ShopChrome } from '@/components/common/shop-chrome';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopChrome>{children}</ShopChrome>;
}
