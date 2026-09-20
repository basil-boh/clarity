import type { FoodTranslation } from '@/domain/diet-foods-i18n'

/**
 * Bahasa Melayu (ms-SG) for the food guide.
 *
 * MACHINE-TRANSLATED AND UNREVIEWED -- see `messages/en.ts`. This file is the
 * one a reviewer works through: it is the only place the food names and their
 * conditions exist in this language, and a dropped condition here is a patient
 * eating something they should not on the day before a scope.
 *
 * Keyed by the `id` in `domain/diet-foods.ts`, which is generated from the
 * department's workbook. Kept separate from that file on purpose: re-running
 * `npm run import:diet` overwrites the generated dataset, and translations
 * living inside it would be destroyed every time the food list was updated.
 * An id that disappears from the dataset simply stops being looked up here.
 */
export const msFoods: FoodTranslation = {
  foods: {
    "food-2": {
        "food": "Nasi putih"
    },
    "food-3": {
        "food": "Bubur nasi putih (kosong)",
        "notes": "Kosong sahaja. Untuk vegetarian/vegan, jangan masak dengan stok daging/ikan; tiada taburan sayur, biji benih atau kelapa."
    },
    "food-4": {
        "food": "Roti putih",
        "notes": "Vegan: banyak roti mengandungi susu, telur atau mentega. Halal: lemak babi jarang digunakan, tetapi semak label."
    },
    "food-5": {
        "food": "Biskut kosong (tepung halus, bukan bijirin penuh)",
        "notes": "Halal: semak lemak babi/gelatin. Vegan: semak susu/mentega."
    },
    "food-6": {
        "food": "Bee hoon (mihun)",
        "notes": "Hidang kosong. Buang sayur dan hiasan."
    },
    "food-7": {
        "food": "Kway teow (kuetiau)",
        "notes": "Hidang kosong. Buang sayur, taugeh dan cili."
    },
    "food-8": {
        "food": "Mi kuning",
        "notes": "Vegan: selalunya mengandungi telur. Pasukan sahkan mi tepung halus boleh."
    },
    "food-9": {
        "food": "Mee pok / mee kia (mi telur)",
        "notes": "Vegan: mi telur bukan vegan; mee kia kadangkala tanpa telur, semak label."
    },
    "food-10": {
        "food": "Mi telur",
        "notes": "Senarai SCS benarkan. Bukan vegan (mengandungi telur)."
    },
    "food-11": {
        "food": "Mee sua",
        "notes": "Pasukan sahkan mi tepung halus boleh."
    },
    "food-12": {
        "food": "Pasta tepung halus",
        "notes": "Vegan: pasta kering biasanya tanpa telur, pasta segar selalunya ada telur."
    },
    "food-13": {
        "food": "Idli",
        "notes": "Kosong, tanpa chutney sayur atau chutney kelapa yang berbiji."
    },
    "food-14": {
        "food": "Thosai (kosong)",
        "notes": "Kosong sahaja; tanpa inti masala kentang-sayur."
    },
    "food-15": {
        "food": "Iddiyappam / putu mayam",
        "notes": "Tanpa taburan kelapa parut."
    },
    "food-16": {
        "food": "Cornflakes / bijirin beras kosong",
        "notes": "Tiada buah, kacang, biji benih atau bijirin penuh. Makan dengan susu (hari rendah sisa) atau susu soya yang ditapis."
    },
    "food-17": {
        "food": "Kentang (dikupas, dimasak lembut)",
        "notes": "Parkway East dan pasukan benarkan kentang yang dikupas. Senarai ketat SCS tidak benarkan sebarang sayur."
    },
    "food-18": {
        "food": "Keledek / keladi (dikupas, dimasak lembut)",
        "notes": "Pasukan: biasanya dibenarkan, sesetengah klinik lebih ketat. Tiada dalam senarai SCS atau Parkway East."
    },
    "food-19": {
        "food": "Nasi perang / nasi merah"
    },
    "food-20": {
        "food": "Roti dan biskut gandum penuh / bijirin penuh"
    },
    "food-21": {
        "food": "Chapati, naan gandum penuh"
    },
    "food-22": {
        "food": "Vadai"
    },
    "food-23": {
        "food": "Oat, muesli, granola"
    },
    "food-24": {
        "food": "Quinoa, sekoi, dedak"
    },
    "food-25": {
        "food": "Mi bijirin penuh / tinggi serat / soba"
    },
    "food-26": {
        "food": "Ikan",
        "notes": "Masak hingga lembut, tanpa tulang."
    },
    "food-27": {
        "food": "Ayam",
        "notes": "Halal: yang disahkan halal sahaja. Potongan kecil, lembut dan masak betul; tanpa kulit/urat."
    },
    "food-28": {
        "food": "Daging babi",
        "notes": "Senarai SCS benarkan. Bukan halal."
    },
    "food-29": {
        "food": "Daging tanpa lemak yang lembut (masak betul, potong kecil)",
        "notes": "Halal: yang disahkan halal sahaja. Pasukan: elakkan potongan liat yang berurat atau bertisu penghubung."
    },
    "food-30": {
        "food": "Telur",
        "notes": "Vegetarian: sesuai untuk lakto-ovo. Ramai vegetarian India dan Buddha mengelak telur, jadi tanya pesakit."
    },
    "food-31": {
        "food": "Udang / kerang-kerangan",
        "notes": "Halal: umumnya diterima di Singapura (mazhab Syafie), sahkan dengan pesakit sendiri. Parkway East: kerang tidak sesuai."
    },
    "food-32": {
        "food": "Tauhu (kosong)"
    },
    "food-33": {
        "food": "Taukwa (kosong)"
    },
    "food-34": {
        "food": "Tau pok (kosong)",
        "notes": "Pasukan: boleh jika kosong. Bukan yang berinti sayur."
    },
    "food-35": {
        "food": "Daging tiruan vegetarian",
        "notes": "Halal: perlu pensijilan halal. Vegan: semak putih telur/susu. Tidak boleh ada cendawan atau ketulan sayur."
    },
    "food-36": {
        "food": "Serbuk protein tumbuhan",
        "notes": "SCS. Pilih yang tiada serat tambahan, ketulan buah atau kacang."
    },
    "food-37": {
        "food": "Suplemen pemakanan (jika perlu)",
        "notes": "Parkway East. Halal/vegan: banyak mengandungi susu/gelatin, semak label."
    },
    "food-38": {
        "food": "Mentega kacang lembut (lapisan nipis, tiada ketulan)",
        "notes": "Pasukan sahaja. Lapisan nipis."
    },
    "food-39": {
        "food": "Bebola ikan / kek ikan / luncheon meat",
        "notes": "Pasukan: tiada sisa tambahan jika tiada sayur/biji ditambah, tetapi bukan pilihan sihat. Halal: luncheon meat selalunya daging babi. Kek ikan mungkin ada ketulan sayur."
    },
    "food-40": {
        "food": "Daging lembu / kambing (daging merah)",
        "notes": "Senarai SCS: elakkan. Jawapan pasukan tentang daging lembu/kambing tidak jelas, tanya hospital."
    },
    "food-41": {
        "food": "Daging liat / goreng rendam"
    },
    "food-42": {
        "food": "Sosej, lap cheong, salami (daging proses)",
        "notes": "Senarai SCS: elakkan. Lap cheong dan salami selalunya daging babi."
    },
    "food-43": {
        "food": "Tempe"
    },
    "food-44": {
        "food": "Kekacang, lentil, dhal"
    },
    "food-45": {
        "food": "Kacang dan biji benih (utuh/berketul)"
    },
    "food-46": {
        "food": "Tau pok / tauhu berinti sayur"
    },
    "food-47": {
        "food": "Susu",
        "notes": "SCS: ikut hospital. Parkway East: rendah lemak/skim, bahagian terkawal. Pasukan: boleh. SKH: elakkan tenusu. Bukan pada hari cecair jernih."
    },
    "food-48": {
        "food": "Keju (kosong)",
        "notes": "Parkway East: rendah lemak, bahagian terkawal. SKH: elakkan. Halal/vegetarian: semak rennet haiwan."
    },
    "food-49": {
        "food": "Yogurt kosong",
        "notes": "Parkway East: rendah lemak, bahagian terkawal. SKH: elakkan. Halal/vegetarian: sesetengahnya mengandungi gelatin. Tiada buah atau kacang."
    },
    "food-50": {
        "food": "Ais krim (kosong)",
        "notes": "Senarai SCS benarkan (bergantung pada hospital). Halal/vegetarian: semak gelatin."
    },
    "food-51": {
        "food": "Kastard",
        "notes": "Senarai SCS benarkan (bergantung pada hospital). Mengandungi susu dan telur."
    },
    "food-52": {
        "food": "Susu pekat manis / susu sejat / krim",
        "notes": "Pasukan: tiada sekatan jika tiada kacang/biji/sayur/buah ditambah. Ikut peraturan tenusu hospital."
    },
    "food-53": {
        "food": "Milo",
        "notes": "SCS dan Parkway East: boleh. Berhenti pada hari cecair jernih. Mengandungi susu."
    },
    "food-54": {
        "food": "Horlicks",
        "notes": "Pasukan: berhenti pada hari cecair jernih. Mengandungi susu."
    },
    "food-55": {
        "food": "Kopi / teh bersusu (kopi-C, teh-C, teh tarik)",
        "notes": "Pasukan: berhenti pada hari cecair jernih."
    },
    "food-56": {
        "food": "Susu soya (ditapis)",
        "notes": "SCS dan pasukan: boleh pada hari rendah sisa, tidak pada hari cecair jernih."
    },
    "food-57": {
        "food": "Santan",
        "notes": "Pasukan: boleh. Parkway East: laksa tidak sesuai kerana santan. Senarai buah SCS: elakkan kelapa."
    },
    "food-58": {
        "food": "Tenusu berperisa / berbuah / berkacang",
        "notes": "Senarai SCS: elakkan."
    },
    "food-59": {
        "food": "Jus buah ditapis, tanpa hampas (epal, pear, anggur)",
        "notes": "Pilih warna cerah. Elakkan merah/ungu/biru."
    },
    "food-60": {
        "food": "Pisang masak yang kecil",
        "notes": "SCS: dibenarkan. Parkway East: tidak dibenarkan."
    },
    "food-61": {
        "food": "Avokado kecil",
        "notes": "SCS: dibenarkan. Parkway East: tidak dibenarkan."
    },
    "food-62": {
        "food": "Buah berkulit, berbiji atau berhampas"
    },
    "food-63": {
        "food": "Buah kering"
    },
    "food-64": {
        "food": "Kelapa (isi)"
    },
    "food-65": {
        "food": "Jus prun",
        "notes": "Pasukan: mengandungi serat."
    },
    "food-66": {
        "food": "Jus oren, tomato, tebu, limau kasturi",
        "notes": "Pasukan: mungkin mengandungi hampas atau biji."
    },
    "food-67": {
        "food": "Sup / jus sayur yang ditapis",
        "notes": "Parkway East: dibenarkan. Versi ketat SCS: tiada sayur."
    },
    "food-68": {
        "food": "Bawang, bawang putih, halia, serai (perisa, tidak kelihatan)",
        "notes": "Pasukan: guna sedikit sahaja; jumlah yang tidak kelihatan biasanya OK. Sesetengah vegetarian Buddha/India mengelak bawang dan bawang putih."
    },
    "food-69": {
        "food": "Sayur dikupas dan dimasak lembut (sedikit sahaja)",
        "notes": "SCS: hanya jika pesakit mahu dan hospital benarkan. Parkway East: tidak."
    },
    "food-70": {
        "food": "Semua sayur lain (mentah, berkulit/berbiji, jagung, sayur berdaun)"
    },
    "food-71": {
        "food": "Cendawan",
        "notes": "Pasukan: sangat tinggi serat."
    },
    "food-72": {
        "food": "Agar-agar / jeli jernih (tiada ketulan buah)",
        "notes": "Bukan merah, ungu, biru atau gelap."
    },
    "food-73": {
        "food": "Jeli gelatin (jernih, tiada ketulan buah)",
        "notes": "Halal: hanya jika gelatin disahkan halal. Bukan merah, ungu, biru atau gelap."
    },
    "food-74": {
        "food": "Tau huay (tauhu lembut)",
        "notes": "Kosong, dengan air gula sahaja."
    },
    "food-75": {
        "food": "Sup pencuci mulut yang ditapis",
        "notes": "SCS. Tiada ketulan (tiada kekacang, biji benih, kacang, buah)."
    },
    "food-76": {
        "food": "Kek kosong",
        "notes": "Mengandungi telur dan mentega/susu, jadi bukan vegan. Tiada buah, kacang, biji benih atau bijirin penuh."
    },
    "food-77": {
        "food": "Sorbet",
        "notes": "Vegan: sesetengahnya mengandungi putih telur. Bukan merah/ungu/biru."
    },
    "food-78": {
        "food": "Aiskrim batang (ice pop)",
        "notes": "Semak sama ada mengandungi gelatin. Bukan merah, ungu atau biru."
    },
    "food-79": {
        "food": "Gula-gula biasa",
        "notes": "Banyak yang mengandungi gelatin. Bukan merah, ungu atau biru."
    },
    "food-80": {
        "food": "Coklat kosong",
        "notes": "Vegan: pilih coklat gelap tanpa susu. Tiada kacang, buah atau biji benih."
    },
    "food-81": {
        "food": "Chwee kueh",
        "notes": "SCS: boleh. Parkway East: tidak sesuai."
    },
    "food-82": {
        "food": "Pencuci mulut dengan buah, kacang, biji benih, bijirin penuh atau kelapa"
    },
    "food-83": {
        "food": "Roti bakar kaya (roti putih)",
        "notes": "SCS dan Parkway East: boleh jika roti putih. Kaya mengandungi telur dan santan, jadi bukan vegan."
    },
    "food-84": {
        "food": "Mee soto (sayur, taugeh dan hiasan dibuang)",
        "notes": "SCS: elakkan semua sayur. Parkway East: boleh dengan pengubahsuaian. Sup ayam, jadi bukan vegetarian."
    },
    "food-85": {
        "food": "Laksa",
        "notes": "Parkway East: santan, kerang, taugeh. SCS: elakkan semua sayur."
    },
    "food-86": {
        "food": "Kicap / kicap hitam",
        "notes": "Pasukan: boleh jika tiada ketulan sayur yang kelihatan."
    },
    "food-87": {
        "food": "Sos tiram",
        "notes": "Pasukan: boleh jika tiada ketulan sayur yang kelihatan. Dibuat daripada tiram."
    },
    "food-88": {
        "food": "Mayonis",
        "notes": "Mengandungi telur."
    },
    "food-89": {
        "food": "Sos tomato",
        "notes": "Tiada ketulan sayur yang kelihatan."
    },
    "food-90": {
        "food": "Cili, sambal, sos cili",
        "notes": "Pasukan: elok dielakkan kerana biji dan pepejal."
    },
    "food-91": {
        "food": "Hiasan: bawang goreng, daun bawang, daun ketumbar",
        "notes": "Pasukan: buang."
    },
    "food-92": {
        "food": "Air kosong"
    },
    "food-93": {
        "food": "Teh kosong / kopi hitam (kopi-O, teh-O)",
        "notes": "Tiada susu pada hari cecair jernih. Gula boleh."
    },
    "food-94": {
        "food": "Minuman isotonik / elektrolit",
        "notes": "Pasukan: pilih yang tidak berwarna. Bukan merah, ungu atau biru."
    },
    "food-95": {
        "food": "Air barli ditapis",
        "notes": "Pasukan: ditapis, dicairkan, tidak keruh, tiada bijian."
    },
    "food-96": {
        "food": "Sup jernih, ditapis (ayam/daging)",
        "notes": "Halal: sumber yang disahkan halal. Tiada pepejal atau ketulan minyak."
    },
    "food-97": {
        "food": "Sup jernih, ditapis (sayur)",
        "notes": "Ditapis sepenuhnya, tiada pepejal."
    },
    "food-98": {
        "food": "Madu",
        "notes": "SCS. Ramai vegan mengelak madu; guna gula atau sirap."
    },
    "food-99": {
        "food": "Jus berhampas"
    },
    "food-100": {
        "food": "Susu, minuman bersusu (kopi, teh, Milo, Horlicks)",
        "notes": "Berhenti minum susu pada hari cecair jernih."
    },
    "food-101": {
        "food": "Susu soya",
        "notes": "Pasukan: boleh pada hari rendah sisa tetapi tidak pada hari cecair jernih."
    },
    "food-102": {
        "food": "Minuman/jeli berwarna merah, ungu, biru atau gelap",
        "notes": "Boleh kelihatan seperti darah semasa pemeriksaan skop."
    },
    "food-103": {
        "food": "Alkohol (arak)"
    }
},
  categories: {
    "Clear liquids": "Cecair jernih",
    "Dairy & alternatives": "Tenusu & alternatif",
    "Fruit & juice": "Buah & jus",
    "Grains & starches": "Bijirin & makanan berkanji",
    "Local dishes": "Hidangan tempatan",
    "Meat & protein": "Daging & protein",
    "Sauces & condiments": "Sos & perencah",
    "Snacks & desserts": "Snek & pencuci mulut",
    "Vegetables": "Sayur-sayuran"
},
  statuses: {
    "Allowed": "Dibenarkan",
    "Avoid": "Elakkan",
    "Check hospital": "Tanya hospital",
    "Check label": "Semak label"
},
}
