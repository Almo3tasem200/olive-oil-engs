export function capacityLabel(volumeMl: number, locale: 'ar' | 'en') {
  if (locale === 'en') {
    if (volumeMl === 500) return '500 ml';
    if (volumeMl === 1000) return '1 liter';
    if (volumeMl === 12000) return '12 liters';
    return `${volumeMl} ml`;
  }
  if (volumeMl === 500) return '500 مل';
  if (volumeMl === 1000) return '1 لتر';
  if (volumeMl === 12000) return '12 لتر';
  return `${volumeMl} مل`;
}

export function packageLabel(packaging: string, locale: 'ar' | 'en') {
  if (packaging === 'DARK_PLASTIC_BOTTLE') return locale === 'en' ? 'Dark plastic bottle' : 'عبوة بلاستيك داكنة';
  if (packaging === 'PLASTIC_JERRYCAN') return locale === 'en' ? 'Plastic jerrycan' : 'جركن بلاستيك';
  return locale === 'en' ? 'Plastic package' : 'عبوة بلاستيك';
}
