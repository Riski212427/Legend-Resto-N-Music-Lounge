export interface MenuItem {
  id: string;
  name: string;
  category: 'main_course' | 'classic' | 'snack' | 'indomie' | 'sambal_side' | 'dessert' | 'beverages';
  subCategory?: string;
  price: number;
  description: string;
  image?: string;
  isPopular?: boolean;
  options?: string[]; // e.g. ['Rebus', 'Goreng'] or ['Bakar', 'Goreng']
}

export const CATEGORIES = [
  { id: 'semua', label: 'Semua Menu' },
  { id: 'main_course', label: 'Main Course' },
  { id: 'classic', label: 'The Classic' },
  { id: 'snack', label: 'Snack & Rebusan' },
  { id: 'indomie', label: 'Indomie Corner' },
  { id: 'sambal_side', label: 'Side & Sambal' },
  { id: 'dessert', label: 'Toast & Dessert' },
  { id: 'beverages', label: 'Beverages' },
] as const;

export const LEGEND_MENU: MenuItem[] = [
  // ================= MAIN COURSE =================
  {
    id: 'mc-1',
    name: 'Sate Kambing',
    category: 'main_course',
    subCategory: 'Olahan Kambing Pilihan',
    price: 70000,
    description: 'Potongan daging kambing berkualitas, dibakar sempurna, disajikan dengan sambal kecap khas Tangerang.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-2',
    name: 'Iga Bakar Sapi',
    category: 'main_course',
    subCategory: 'Iga Sapi Pilihan',
    price: 70000,
    description: 'Iga pilihan dengan bumbu meresap, dengan daging tebal yang berkualitas, dibakar hingga juicy dan smoky.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-3',
    name: 'Sop Iga Sapi Spesial',
    category: 'main_course',
    subCategory: 'Iga Sapi Pilihan',
    price: 75000,
    description: 'Kuah bening gurih dengan iga empuk yang dimasak perlahan (slow-cooked).',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-4',
    name: 'Sop Kambing',
    category: 'main_course',
    subCategory: 'Olahan Kambing Pilihan',
    price: 80000,
    description: 'Campuran 80% daging kambing dan 20% dalaman / jeroan. Disajikan dalam bentuk kuah bening gurih.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'mc-5',
    name: 'Soto Betawi Creamy',
    category: 'main_course',
    subCategory: 'Soto Tradisional',
    price: 65000,
    description: 'Kuah susu gurih kaya rempah dengan campuran 80% jeroan dan 20% daging kualitas, disajikan hangat dan menggugah selera.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-6',
    name: 'Pindang Bandeng',
    category: 'main_course',
    subCategory: 'Olahan Ikan Khas',
    price: 65000,
    description: 'Daging bandeng yang lembut dan empuk, diolah dengan kuah bumbu rempah asam manis gurih pilihan.',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-7',
    name: 'Ayam Bakar 2 Potong',
    category: 'main_course',
    subCategory: 'Ayam Probiotik',
    price: 55000,
    description: 'Ayam probiotik 2 potong dengan bumbu khas yang dibakar harum dan meresap.',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'mc-8',
    name: 'Ayam Bakar Utuh 1 Ekor',
    category: 'main_course',
    subCategory: 'Ayam Probiotik',
    price: 100000,
    description: 'Ayam probiotik utuh 1 ekor dengan bumbu khas yang dibakar sempurna, cocok untuk santap bersama.',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'mc-9',
    name: 'Sayur Asam',
    category: 'main_course',
    subCategory: 'Sayur Tradisional',
    price: 20000,
    description: 'Makanan tradisional khas Indonesia dengan racikan kuah bumbu khas asam jawa yang menyegarkan.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'mc-10',
    name: 'Sop Kepala Kambing Muda Bening Segar',
    category: 'main_course',
    subCategory: 'Specialty Legend',
    price: 250000,
    description: 'Kuah bening gurih dengan olahan kepala kambing muda yang sangat empuk, kaldu bening ringan kaya rempah dengan tomat merah segar.',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  },

  // ================= THE CLASSIC =================
  {
    id: 'cl-1',
    name: 'Nasi Goreng Kambing Legend',
    category: 'classic',
    subCategory: 'Wok Hei Legend',
    price: 50000,
    description: 'Nasi goreng spesial dengan daging kambing dicampur bakso berkualitas dengan bumbu khas, disajikan hangat dan aromatik.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'cl-2',
    name: 'Nasi Goreng Ayam Probiotik',
    category: 'classic',
    subCategory: 'Wok Hei Legend',
    price: 50000,
    description: 'Nasi goreng spesial dengan daging ayam probiotik dicampur bakso berkualitas dengan bumbu khas aromatik.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cl-3',
    name: 'Kwetiau Goreng Kambing Legend',
    category: 'classic',
    subCategory: 'Kwetiau Wok',
    price: 50000,
    description: 'Kwetiau dengan daging kambing dicampur dengan bakso berkualitas dengan bumbu autentik khas wok hei.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cl-4',
    name: 'Kwetiau Goreng Ayam Probiotik',
    category: 'classic',
    subCategory: 'Kwetiau Wok',
    price: 50000,
    description: 'Kwetiau dengan daging ayam probiotik dicampur dengan bakso berkualitas dengan bumbu autentik.',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'cl-5',
    name: 'Mie Goreng Kambing Legend',
    category: 'classic',
    subCategory: 'Mie Tradisional',
    price: 50000,
    description: 'Mie kuning pilihan ditumis daging kambing dan bakso, bumbu legendaris perpaduan rasa gurih manis meresap.',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
    isPopular: true,
  },
  {
    id: 'cl-6',
    name: 'Mie Goreng Ayam Probiotik',
    category: 'classic',
    subCategory: 'Mie Tradisional',
    price: 50000,
    description: 'Mie kuning pilihan ditumis ayam probiotik dan bakso, bumbu legendaris rasa gurih manis meresap.',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
  },

  // ================= SNACK & REBUSAN =================
  {
    id: 'sn-1',
    name: 'Pisang Goreng',
    category: 'snack',
    price: 25000,
    description: 'Pisang goreng manis berbalut tepung renyah keemasan, teman setia santai di lounge.',
  },
  {
    id: 'sn-2',
    name: 'Bakwan Jagung',
    category: 'snack',
    price: 25000,
    description: 'Bakwan jagung manis gurih dengan daun bawang dan bumbu racik renyah.',
    isPopular: true,
  },
  {
    id: 'sn-3',
    name: 'Tempe Mendoan',
    category: 'snack',
    price: 25000,
    description: 'Tempe mendoan hangat bertepung lembut dengan irisan daun bawang, disajikan dengan kecap rawit.',
    isPopular: true,
  },
  {
    id: 'sn-4',
    name: 'Otak-Otak (Bakar / Goreng)',
    category: 'snack',
    price: 25000,
    description: 'Otak-otak ikan gurih beraroma wangi, pilihan dibakar atau digoreng renyah.',
    options: ['Bakar', 'Goreng'],
  },
  {
    id: 'sn-5',
    name: 'Sosis Bakar',
    category: 'snack',
    price: 18000,
    description: 'Sosis bakar dengan olesan saus barbeque gurih manis dan sedikit aroma smoky.',
  },
  {
    id: 'sn-6',
    name: 'Ubi Goreng',
    category: 'snack',
    price: 25000,
    description: 'Potongan ubi manis digoreng garing di luar dan lembut di dalam.',
  },
  {
    id: 'sn-7',
    name: 'Cireng Renyah',
    category: 'snack',
    price: 23000,
    description: 'Aci goreng renyah kenyal dengan cocolan saus bumbu rujak pedas manis.',
  },
  {
    id: 'sn-8',
    name: 'Dimsum',
    category: 'snack',
    price: 20000,
    description: 'Dimsum kukus gurih lembut dengan isian daging dan saus cocolan sedap.',
  },
  {
    id: 'sn-9',
    name: 'Kentang Goreng',
    category: 'snack',
    price: 23000,
    description: 'French fries garing renyah bertabur garam gurih, cocok untuk teman live music.',
  },
  {
    id: 'sn-10',
    name: 'Kentang & Sosis Platter',
    category: 'snack',
    price: 25000,
    description: 'Kombinasi kentang goreng renyah dan potongan sosis bakar gurih dengan saus pendamping.',
    isPopular: true,
  },
  {
    id: 'sn-11',
    name: 'Nugget Ayam Crispy',
    category: 'snack',
    price: 23000,
    description: 'Nugget ayam dilapisi tepung roti renyah keemasan, empuk dan disukai semua kalangan.',
  },
  {
    id: 'sn-12',
    name: 'Jagung Susu Keju (Jasuke)',
    category: 'snack',
    price: 23000,
    description: 'Pipilan jagung manis hangat dengan lumuran mentega gurih, susu kental manis, dan keju parut.',
  },
  {
    id: 'sn-13',
    name: 'Sukun Goreng',
    category: 'snack',
    price: 23000,
    description: 'Irisan buah sukun pulen digoreng garing renyah dengan taburan garam halus.',
  },
  {
    id: 'sn-14',
    name: 'Buah Potong (Melon, Pepaya, Semangka)',
    category: 'snack',
    price: 30000,
    description: 'Pilihan buah segar dingin: melon, pepaya manis, dan semangka renyah penyejuk dahaga.',
  },
  // Rebusan Tradisional
  {
    id: 'sn-15',
    name: 'Singkong Rebus',
    category: 'snack',
    price: 20000,
    description: 'Singkong pulen empuk direbus hangat tradisional.',
  },
  {
    id: 'sn-16',
    name: 'Ubi Rebus',
    category: 'snack',
    price: 20000,
    description: 'Ubi manis direbus empuk, camilan sehat kaya serat.',
  },
  {
    id: 'sn-17',
    name: 'Jagung Rebus',
    category: 'snack',
    price: 20000,
    description: 'Jagung manis segar direbus hangat.',
  },
  {
    id: 'sn-18',
    name: 'Kacang Rebus',
    category: 'snack',
    price: 20000,
    description: 'Kacang kulit rebus gurih hangat, pas untuk obrolan santai.',
  },
  {
    id: 'sn-19',
    name: 'Pisang Rebus',
    category: 'snack',
    price: 20000,
    description: 'Pisang olahan direbus hangat dengan rasa manis alami.',
  },
  {
    id: 'sn-20',
    name: 'Talas Rebus',
    category: 'snack',
    price: 20000,
    description: 'Talas pulen direbus hangat khas pedesaan.',
  },
  {
    id: 'sn-21',
    name: 'Kentang Rebus',
    category: 'snack',
    price: 20000,
    description: 'Kentang utuh rebus empuk dan lezat.',
  },
  {
    id: 'sn-22',
    name: 'Labu Rebus',
    category: 'snack',
    price: 20000,
    description: 'Labu kuning empuk manis alami direbus hangat.',
  },
  {
    id: 'sn-23',
    name: 'Telur Rebus',
    category: 'snack',
    price: 20000,
    description: 'Telur ayam rebus matang sempurna kaya protein.',
  },

  // ================= INDOMIE CORNER =================
  {
    id: 'in-1',
    name: 'Indomie + Telur',
    category: 'indomie',
    price: 23000,
    description: 'Indomie legendaris dengan tambahan telur matang / setengah matang.',
    options: ['Goreng', 'Rebus / Kuah'],
    isPopular: true,
  },
  {
    id: 'in-2',
    name: 'Indomie Jumbo + Telur',
    category: 'indomie',
    price: 25000,
    description: 'Porsi Indomie jumbo mantap dilengkapi telur hangat gurih.',
    options: ['Goreng', 'Rebus / Kuah'],
    isPopular: true,
  },
  {
    id: 'in-3',
    name: 'Indomie + Bakso',
    category: 'indomie',
    price: 23000,
    description: 'Indomie gurih dengan topping bakso sapi kenyal berdaging.',
    options: ['Goreng', 'Rebus / Kuah'],
  },
  {
    id: 'in-4',
    name: 'Indomie + Keju',
    category: 'indomie',
    price: 23000,
    description: 'Indomie nikmat bertabur parutan keju cheddar creamy gurih.',
    options: ['Goreng', 'Rebus / Kuah'],
  },
  {
    id: 'in-5',
    name: 'Indomie + Sosis',
    category: 'indomie',
    price: 23000,
    description: 'Indomie dengan potongan sosis sapi lezat.',
    options: ['Goreng', 'Rebus / Kuah'],
  },

  // ================= SIDE & SAMBAL =================
  {
    id: 'sd-1',
    name: 'Nasi Putih',
    category: 'sambal_side',
    price: 10000,
    description: 'Nasi putih pulen hangat aromatik.',
  },
  {
    id: 'sd-2',
    name: 'Ikan Asin Jambal + Sambal',
    category: 'sambal_side',
    price: 20000,
    description: 'Ikan asin jambal roti garing gurih dengan pilihan sambal khas Legend.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
  },
  {
    id: 'sd-3',
    name: 'Ikan Asin Tenggiri + Sambal',
    category: 'sambal_side',
    price: 20000,
    description: 'Ikan asin tenggiri renyah gurih nikmat dengan pilihan sambal.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
  },
  {
    id: 'sd-4',
    name: 'Cumi Asin + Sambal',
    category: 'sambal_side',
    price: 20000,
    description: 'Cumi asin tumis gurih empuk dipadukan sambal pilihan.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
    isPopular: true,
  },
  {
    id: 'sd-5',
    name: 'Tempe Bacem + Sambal',
    category: 'sambal_side',
    price: 15000,
    description: 'Tempe bumbu bacem manis gurih legit khas Jawa dipadukan sambal pedas.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
  },
  {
    id: 'sd-6',
    name: 'Tahu Bacem + Sambal',
    category: 'sambal_side',
    price: 15000,
    description: 'Tahu bumbu bacem empuk manis gurih berpadu sambal pilihan.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
  },
  {
    id: 'sd-7',
    name: 'Tempe + Tahu + Sambal',
    category: 'sambal_side',
    price: 15000,
    description: 'Paket komplit tahu dan tempe goreng gurih dengan sambal pilihan.',
    options: ['Sambal Bawang', 'Sambal Matah', 'Sambal Terasi', 'Sambal Kecap', 'Sambal Tomat'],
  },
  // Selection of Sambal
  {
    id: 'sm-1',
    name: 'Sambal Bawang',
    category: 'sambal_side',
    price: 10000,
    description: 'Ulekan cabai rawit dan bawang putih disiram minyak panas gurih pedas nendang.',
    isPopular: true,
  },
  {
    id: 'sm-2',
    name: 'Sambal Matah',
    category: 'sambal_side',
    price: 10000,
    description: 'Irisan bawang merah, serai, cabai rawit, dan perasan jeruk limau segar.',
    isPopular: true,
  },
  {
    id: 'sm-3',
    name: 'Sambal Terasi Segar',
    category: 'sambal_side',
    price: 10000,
    description: 'Sambal terasi bakar ulek segar dengan tomat dan perasan jeruk limau.',
  },
  {
    id: 'sm-4',
    name: 'Sambal Kecap',
    category: 'sambal_side',
    price: 10000,
    description: 'Kecap manis kental dengan irisan cabai rawit, tomat, dan bawang merah.',
  },
  {
    id: 'sm-5',
    name: 'Sambal Tomat Segar',
    category: 'sambal_side',
    price: 10000,
    description: 'Sambal tomat segar ulek matang pas, rasa asam manis pedas nikmat.',
  },

  // ================= ARTISAN TOAST & DESSERT =================
  {
    id: 'ds-1',
    name: 'Roti Bakar Coklat Keju',
    category: 'dessert',
    subCategory: 'Artisan Toast',
    price: 25000,
    description: 'Roti bakar empuk renyah dengan isian cokelat lumer dan taburan parutan keju melimpah.',
    isPopular: true,
  },
  {
    id: 'ds-2',
    name: 'Roti Bakar Tiramisu Keju',
    category: 'dessert',
    subCategory: 'Artisan Toast',
    price: 25000,
    description: 'Roti bakar hangat dengan krim tiramisu wangi kopi dan parutan keju gurih.',
  },
  {
    id: 'ds-3',
    name: 'Roti Bakar Matcha Keju',
    category: 'dessert',
    subCategory: 'Artisan Toast',
    price: 25000,
    description: 'Roti bakar dengan olesan selai matcha teh hijau dan keju cheddar gurih.',
  },
  {
    id: 'ds-4',
    name: 'Banana Puding',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 25000,
    description: 'Puding pisang lembut dengan vla manis legit dan aroma vanila harum.',
  },
  {
    id: 'ds-5',
    name: 'Cheesecake Biscuit',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 25000,
    description: 'Dessert cup cream cheese lembut dengan remahan biskuit mentega gurih manis.',
    isPopular: true,
  },
  {
    id: 'ds-6',
    name: 'Mango Sago',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 25000,
    description: 'Potongan mangga manis segar, mutiara sagu kenyal, dan kuah santan susu creamy dingin.',
    isPopular: true,
  },
  {
    id: 'ds-7',
    name: 'Buko Pandan',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 25000,
    description: 'Dessert kelapa muda aroma pandan segar berpadu nata de coco dan kuah susu kental dingin.',
  },
  {
    id: 'ds-8',
    name: 'Pie Buah',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 10000,
    description: 'Kulit pie renyah dengan isian vla lembut dan topping aneka buah segar.',
  },
  {
    id: 'ds-9',
    name: 'Pie Brownis',
    category: 'dessert',
    subCategory: 'Sweet Desserts',
    price: 10000,
    description: 'Kombinasi kulit pie renyah dengan isian cokelat brownies pekat legit.',
  },

  // ================= BEVERAGES =================
  {
    id: 'bv-1',
    name: 'Jus Jambu',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Jus jambu biji merah segar kaya vitamin C, disajikan dingin menyegarkan.',
  },
  {
    id: 'bv-2',
    name: 'Jus Strawberry',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Jus buah strawberry segar dengan rasa asam manis alami dan es batu dingin.',
    isPopular: true,
  },
  {
    id: 'bv-3',
    name: 'Jus Mangga',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Jus mangga harum manis kental segar murni pelepas dahaga.',
    isPopular: true,
  },
  {
    id: 'bv-4',
    name: 'Jus Sirsak',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Jus buah sirsak manis segar dengan tekstur lembut khas.',
  },
  {
    id: 'bv-5',
    name: 'Jus Buah Naga',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Jus buah naga merah pekat kaya antioksidan, segar dan sehat.',
  },
  {
    id: 'bv-6',
    name: 'Es Timun Selasih',
    category: 'beverages',
    subCategory: 'Fresh Juice Selection',
    price: 23000,
    description: 'Serutan mentimun segar dengan biji selasih kenyal, sirup manis dan perasan jeruk nipis.',
    isPopular: true,
  },
  {
    id: 'bv-7',
    name: 'Wedang Jahe Sereh',
    category: 'beverages',
    subCategory: 'Warm & Traditional Drinks',
    price: 28000,
    description: 'Minuman hangat seduhan jahe merah bakar dan serai wangi, menghangatkan tubuh di lounge.',
  },
  {
    id: 'bv-8',
    name: 'Wedang Uwuh',
    category: 'beverages',
    subCategory: 'Warm & Traditional Drinks',
    price: 28000,
    description: 'Racikan rempah tradisional kayu secang, cengkeh, jahe, kapulaga, dan gula batu khas keraton.',
    isPopular: true,
  },
  {
    id: 'bv-9',
    name: 'Air Mineral - Free Refill',
    category: 'beverages',
    subCategory: 'Free Low Beverage',
    price: 10000,
    description: 'Air mineral segar berkualitas, bisa isi ulang sepuasnya (Free Refill).',
  },
  {
    id: 'bv-10',
    name: 'Teh Tawar - Free Refill',
    category: 'beverages',
    subCategory: 'Free Low Beverage',
    price: 10000,
    description: 'Seduhan teh tawar wangi (bisa dingin/hangat), bisa isi ulang sepuasnya (Free Refill).',
  },
  {
    id: 'bv-11',
    name: 'Es Batu',
    category: 'beverages',
    subCategory: 'Free Low Beverage',
    price: 5000,
    description: 'Es batu kristal higienis dan segar.',
  },
];

const MENU_STORAGE_KEY = 'legend_custom_menu_catalog';

export const MenuStore = {
  getMenu(): MenuItem[] {
    if (typeof window === 'undefined') return LEGEND_MENU;
    try {
      const saved = localStorage.getItem(MENU_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return LEGEND_MENU;
  },

  saveMenu(items: MenuItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('legend_menu_catalog_changed', { detail: items }));
    } catch (e) {
      console.warn('Failed to save menu catalog:', e);
    }
  },

  addItem(item: Omit<MenuItem, 'id'> & { id?: string }): MenuItem {
    const list = this.getMenu();
    const newItem: MenuItem = {
      ...item,
      id: item.id || `menu-custom-${Date.now()}`,
    };
    const updated = [newItem, ...list];
    this.saveMenu(updated);
    return newItem;
  },

  updateItem(updatedItem: MenuItem) {
    const list = this.getMenu();
    const updated = list.map((m) => (m.id === updatedItem.id ? updatedItem : m));
    this.saveMenu(updated);
  },

  deleteItem(id: string) {
    const list = this.getMenu();
    const updated = list.filter((m) => m.id !== id);
    this.saveMenu(updated);
  },

  resetToDefault() {
    this.saveMenu(LEGEND_MENU);
  }
};

