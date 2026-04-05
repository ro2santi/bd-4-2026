// State internal yang tidak terhapus selama aplikasi terbuka
const state = {
  items: []
};

export const CartManager = {
  // Fungsi untuk mendapatkan data terbaru
  getItems() {
    return state.items;
  },

  // Menambah produk
  add(product) {
    const exist = state.items.find(i => i.id === product.id);
    if (exist) {
      state.items = state.items.map(i => 
        i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      state.items = [...state.items, { ...product, quantity: 1 }];
    }
  },

  // Update jumlah (+ / -)
  updateQty(id, action) {
    state.items = state.items.map(item => {
      if (item.id === id) {
        const newQty = action === 'plus' ? item.quantity + 1 : Math.max(1, item.quantity - 1);
        return { ...item, quantity: newQty };
      }
      return item;
    });
  },

  // Hapus satu item
  remove(id) {
    state.items = state.items.filter(item => item.id !== id);
  },

  // Bersihkan keranjang setelah checkout
  clear() {
    state.items = [];
  }
};