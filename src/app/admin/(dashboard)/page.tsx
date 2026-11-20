import Link from 'next/link';
import { OrderStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/db';
import { formatEgp } from '@/lib/money';

export const dynamic = 'force-dynamic';

const statusLabels: Record<OrderStatus, string> = {
  NEW: 'جديد',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
};

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    grouped,
    value,
    collected,
    recent,
    unreadNotifications,
    productCount,
    activeZones,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalPiasters: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' }, paymentStatus: 'PAID' },
      _sum: { totalPiasters: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderNumber: true, customerName: true, status: true, totalPiasters: true, createdAt: true },
    }),
    prisma.notification.count({ where: { channel: 'ADMIN_DASHBOARD', readAt: null } }),
    prisma.product.count(),
    prisma.deliveryZone.count({ where: { isActive: true } }),
  ]);

  const counts = new Map(grouped.map((row) => [row.status, row._count._all]));
  const statusCards: OrderStatus[] = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <p className='text-sm font-bold text-[var(--olive-600)]'>نظرة عامة</p>
          <h1 className='text-3xl font-black text-[var(--olive-950)]'>إدارة المتجر</h1>
        </div>
        <Link href='/admin/orders' className='btn-primary'>عرض الطلبات الجديدة ({counts.get('NEW') || 0})</Link>
      </div>

      <section className='mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {statusCards.map((status) => (
          <Link key={status} href={'/admin/orders?status=' + status} className='card-surface p-4 hover:border-[var(--olive-600)]'>
            <p className='text-sm text-[var(--muted)]'>{statusLabels[status]}</p>
            <p className='mt-1 text-3xl font-black text-[var(--olive-950)]'>{counts.get(status) || 0}</p>
          </Link>
        ))}
      </section>

      <section className='mt-5 grid gap-3 md:grid-cols-3'>
        <article className='card-surface p-5'>
          <p className='text-sm text-[var(--muted)]'>إجمالي الطلبات</p>
          <p className='mt-2 text-2xl font-extrabold'>{totalOrders}</p>
        </article>
        <article className='card-surface p-5'>
          <p className='text-sm text-[var(--muted)]'>قيمة الطلبات غير الملغاة</p>
          <p className='mt-2 text-2xl font-extrabold'>{formatEgp(value._sum.totalPiasters || 0)}</p>
        </article>
        <article className='card-surface p-5'>
          <p className='text-sm text-[var(--muted)]'>المبالغ المسجلة كمحصلة</p>
          <p className='mt-2 text-2xl font-extrabold'>{formatEgp(collected._sum.totalPiasters || 0)}</p>
          <p className='mt-1 text-xs text-[var(--muted)]'>تُسجل يدويًا بعد استلام الدفع النقدي.</p>
        </article>
      </section>

      <section className='mt-5 grid gap-5 xl:grid-cols-[1fr_300px]'>
        <div className='card-surface overflow-hidden'>
          <div className='flex items-center justify-between gap-3 p-5'>
            <h2 className='text-xl font-extrabold'>أحدث الطلبات</h2>
            <Link href='/admin/orders' className='text-sm font-bold text-[var(--olive-800)] underline'>كل الطلبات</Link>
          </div>
          {recent.length ? (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[600px] text-right text-sm'>
                <thead className='bg-[var(--olive-100)]'><tr><th className='p-3'>رقم الطلب</th><th className='p-3'>العميل</th><th className='p-3'>الحالة</th><th className='p-3'>الإجمالي</th></tr></thead>
                <tbody>
                  {recent.map((order) => (
                    <tr key={order.id} className='border-t border-[var(--line)]'>
                      <td className='p-3'><Link href={'/admin/orders/' + order.id} className='font-bold underline' dir='ltr'>{order.orderNumber}</Link></td>
                      <td className='p-3'>{order.customerName}</td>
                      <td className='p-3'>{statusLabels[order.status]}</td>
                      <td className='p-3 font-bold'>{formatEgp(order.totalPiasters)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className='p-5 text-sm text-[var(--muted)]'>لا توجد طلبات بعد.</p>}
        </div>

        <aside className='card-surface p-5'>
          <h2 className='text-lg font-extrabold'>حالة المتجر</h2>
          <dl className='mt-4 space-y-3 text-sm'>
            <div className='flex justify-between gap-4'><dt>المنتجات</dt><dd className='font-bold'>{productCount}</dd></div>
            <div className='flex justify-between gap-4'><dt>مناطق التوصيل الفعالة</dt><dd className='font-bold'>{activeZones}</dd></div>
            <div className='flex justify-between gap-4'><dt>تنبيهات غير مقروءة</dt><dd className='font-bold'>{unreadNotifications}</dd></div>
          </dl>
          <div className='mt-5 grid gap-2'>
            <Link href='/admin/products' className='btn-secondary'>إدارة المنتجات والأسعار</Link>
            <Link href='/admin/delivery' className='btn-secondary'>إعداد التوصيل</Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

