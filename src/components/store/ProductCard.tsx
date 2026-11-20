'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { formatEgp } from '@/lib/money';
import { capacityLabel, packageLabel } from '@/lib/product-labels';

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  volumeMl: number;
  packaging: string;
  pricePiasters: number;
  images: { id: string; url: string; alt: string; isPrimary: boolean }[];
};

export function ProductCard({ product, locale = 'ar' }: { product: StoreProduct; locale?: 'ar' | 'en' }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const prefix = locale === 'en' ? '/en' : '';
  const image = product.images[0];

  function add() {
    addItem(product.id, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className='card-surface overflow-hidden'>
      <Link href={prefix + '/products/' + product.slug} className='block'>
        <div className='relative aspect-[4/3] bg-[var(--olive-100)]'>
          {image && <Image src={image.url} alt={image.alt || product.name} fill sizes='(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw' className='object-cover' />}
        </div>
        <div className='p-4'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <h3 className='text-lg font-bold text-[var(--olive-950)]'>{product.name}</h3>
            <span className='rounded-full bg-[var(--olive-100)] px-3 py-1 text-sm font-semibold'>{capacityLabel(product.volumeMl, locale)}</span>
          </div>
          <p className='mt-1 text-sm text-[var(--muted)]'>{packageLabel(product.packaging, locale)}</p>
          {product.shortDescription && <p className='mt-2 line-clamp-2 text-sm'>{product.shortDescription}</p>}
          <p className='mt-4 text-xl font-extrabold text-[var(--olive-950)]'>{formatEgp(product.pricePiasters, locale)}</p>
        </div>
      </Link>
      <div className='px-4 pb-4'>
        <button type='button' onClick={add} className='btn-primary w-full'>
          {added ? <Check size={18} aria-hidden='true' /> : <Plus size={18} aria-hidden='true' />}
          {added
            ? (locale === 'en' ? 'Added' : 'أُضيفت للسلة')
            : (locale === 'en' ? 'Add to cart' : 'أضف للسلة')}
        </button>
      </div>
    </article>
  );
}

