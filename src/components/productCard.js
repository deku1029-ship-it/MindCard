export const ProductCard = (product) => {
  const categoryName = product.Category ? product.Category.name : (product.category || 'Công nghệ');

  const priceValue = parseFloat(product.price) || 0;
  const originalPriceValue = product.original_price ? parseFloat(product.original_price) : null;
  const hasDiscount = originalPriceValue && originalPriceValue > priceValue;
  const discountPercent = hasDiscount ? Math.round((1 - priceValue / originalPriceValue) * 100) : 0;

  const formatCurrency = (val) => {
      try {
        if (val === null || val === undefined || isNaN(val)) return '0 ₫';
        return new Intl.NumberFormat('vi-VN').format(Math.round(val)) + ' ₫';
      } catch (e) {
        return (val || 0) + ' ₫';
      }
  };

  return `
        <article class="reveal group relative flex flex-col h-full bg-white border border-gray-200 hover:border-[#1c69d4] hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden rounded-sm">
          <!-- Image Section -->
          <div onclick="window.showProductDetail(${product.id})" class="relative aspect-square overflow-hidden cursor-pointer bg-white flex items-center justify-center p-4">
            <img src="${product.image_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f8fafc'/%3E%3Ctext x='50%25' y='50%25' font-size='80' font-family='Arial,sans-serif' fill='%23cbd5e1' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent((product.name||'P').charAt(0).toUpperCase())}%3C/text%3E%3C/svg%3E`}" 
                 alt="${product.name}" 
                 class="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105" 
                 loading="lazy">
            
            <!-- Badges -->
            <div class="absolute top-0 left-0 flex flex-col z-10">
              ${hasDiscount ? `<span class="bg-[#1c69d4] text-white text-[11px] font-bold px-3 py-1 uppercase">-${discountPercent}%</span>` : ''}
              ${product.is_new ? `<span class="bg-[#262626] text-white text-[11px] font-bold px-3 py-1 uppercase">New</span>` : ''}
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="p-6 flex flex-col flex-grow bg-white">
            <div class="flex justify-between items-start mb-2">
              <span class="text-[11px] font-black text-[#757575] uppercase tracking-wider">${categoryName}</span>
              ${product.rating ? `
              <div class="flex items-center gap-1">
                <svg class="w-3 h-3 text-[#1c69d4]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                <span class="text-[11px] font-bold text-[#262626]">${parseFloat(product.rating || 0).toFixed(1)}</span>
              </div>` : ''}
            </div>
            
            <h3 class="font-normal text-[#262626] text-base mb-4 line-clamp-2 h-12 leading-tight group-hover:text-[#1c69d4] transition-colors">
              <a href="javascript:void(0)" onclick="window.showProductDetail(${product.id})" class="outline-none">${product.name}</a>
            </h3>
            <div class="mt-auto pt-4 border-t border-gray-100">
               <div class="flex flex-col mb-4">
                 <span class="text-xl font-black text-[#262626] tracking-tight line-height-tight-bmw">${formatCurrency(priceValue)}</span>
                 ${hasDiscount ? `<span class="text-[12px] text-[#bbbbbb] line-through font-normal">${formatCurrency(originalPriceValue)}</span>` : ''}
               </div>
               
               <button class="w-full py-3 bg-transparent text-[#262626] border border-[#262626] text-[12px] font-bold uppercase tracking-widest hover:bg-[#262626] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2" 
                       onclick="event.stopPropagation(); window.addToCart?window.addToCart(${product.id}):null">
                 <span>Thêm vào giỏ hàng</span>
               </button>
             </div>
          </div>
        </article>
    `;
};
