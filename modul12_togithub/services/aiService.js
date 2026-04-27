// Pastikan API KEY sudah diisi! Ambil di: https://aistudio.google.com/
const GEMINI_API_KEY = "API_key_masing-masing"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

export const generatePromoAI = async (keyword) => {
  try {
    const prompt = `Buatkan satu ide promo UMKM untuk tema: "${keyword}". 
    PENTING: Berikan jawaban HANYA berupa JSON mentah saja tanpa teks penjelasan apapun dan tanpa tanda petik backtick.
    Contoh format: {"title": "Promo Merdeka", "description": "Diskon spesial hari kemerdekaan", "discount_pct": 17}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
       throw new Error(data.error.message);
    }

    let textResponse = data.candidates[0].content.parts[0].text;
    
    // Logika Pembersihan: Menghapus karakter ```json atau ``` jika ada
    const cleanJson = textResponse.replace(/```json|```/gi, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Detail Error AI:", error);
    throw error;
  }
};