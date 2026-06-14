export function getAuthModalHTML() {
  return `
      <div id="auth-modal" class="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-4 hidden">
        <!-- Backdrop -->
        <div id="auth-backdrop" class="absolute inset-0 bg-[#262626]/80 backdrop-blur-sm transition-opacity opacity-0"></div>
        
        <!-- Modal Content -->
        <div id="auth-box" class="relative w-full max-w-md bg-white border border-[#262626] transition-all transform scale-100 opacity-0 m-4 flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden">
          
          <!-- Header -->
          <div class="p-8 text-[#262626] border-b border-gray-100 flex justify-between items-start">
            <div class="space-y-1">
              <h2 class="text-[32px] font-light uppercase leading-[1.30] tracking-tight" id="auth-title">Đăng Nhập</h2>
              <p class="text-[11px] font-black text-[#757575] uppercase tracking-widest">Chào mừng bạn đến với MindCard</p>
            </div>
            <button id="close-auth" class="w-10 h-10 border border-[#262626] flex items-center justify-center hover:bg-[#262626] hover:text-white transition-all group">
              <svg class="w-5 h-5 text-[#262626] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <form id="auth-form" class="flex-1 overflow-y-auto px-8 pt-4 pb-8 space-y-8">
            <div id="alert-box" class="hidden p-4 border border-red-500 text-red-500 text-[12px] font-bold uppercase tracking-wider bg-red-50"></div>

            <div id="register-fields" class="hidden space-y-6">
               <div class="space-y-3">
                  <label class="block text-[11px] font-black text-[#757575] uppercase tracking-widest">Tên của bạn</label>
                  <input id="auth-username" type="text" class="w-full bg-gray-50 border-b border-[#bbbbbb] focus:border-[#1c69d4] py-3.5 px-0 text-[#262626] font-normal transition-all outline-none" placeholder="Nguyễn Văn A" />
               </div>
            </div>

            <div class="space-y-6">
              <div class="space-y-3">
                <label class="block text-[11px] font-black text-[#757575] uppercase tracking-widest">Email liên hệ</label>
                <input id="auth-email" type="email" required class="w-full bg-gray-50 border-b border-[#bbbbbb] focus:border-[#1c69d4] py-3.5 px-0 text-[#262626] font-normal transition-all outline-none" placeholder="ai@store.com" />
              </div>
              <div class="space-y-3">
                <label class="block text-[11px] font-black text-[#757575] uppercase tracking-widest">Mật khẩu bảo mật</label>
                <input id="auth-password" type="password" required class="w-full bg-gray-50 border-b border-[#bbbbbb] focus:border-[#1c69d4] py-3.5 px-0 text-[#262626] font-normal transition-all outline-none" placeholder="••••••••" />
              </div>
              <div class="space-y-3">
                <label class="block text-[11px] font-black text-[#757575] uppercase tracking-widest">Nhập lại mật khẩu</label>
                <input id="auth-confirm-password" type="password" class="w-full bg-gray-50 border-b border-[#bbbbbb] focus:border-[#1c69d4] py-3.5 px-0 text-[#262626] font-normal transition-all outline-none" placeholder="••••••••" />
              </div>
            </div>

            <div class="pt-4">
              <button type="submit" id="auth-submit-btn" class="w-full bg-[#1c69d4] text-white font-bold text-[14px] py-4 transition-all hover:bg-[#0653b6] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                Tiếp tục
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5-5 5M6 7l5 5-5 5"></path></svg>
              </button>
            </div>
            
            <div class="text-center pt-2">
              <span id="auth-switch-text" class="text-[12px] font-normal text-[#757575]">Bạn chưa có tài khoản?</span> 
              <button type="button" id="auth-switch-btn" class="text-[12px] font-bold text-[#1c69d4] ml-2 uppercase hover:underline underline-offset-4 tracking-wider">Tạo tài khoản</button>
            </div>
          </form>

          <!-- Simple Precision Footer -->
          <div class="bg-[#262626] p-4 flex justify-center gap-6">
            <div class="w-8 h-8 border border-white/20 flex items-center justify-center">
              <div class="w-4 h-4 rounded-full border border-white/40"></div>
            </div>
          </div>
        </div>
      </div>
    `;
}
