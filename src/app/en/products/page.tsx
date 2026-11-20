import { ProductListView } from '@/components/store/ProductListView';

export const dynamic = 'force-dynamic';

export default function EnglishProductsPage() {
  return <ProductListView locale='en' />;
}

