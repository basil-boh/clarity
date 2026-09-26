/**
 * Patient-facing copy shared by server pages and client interactions.
 * Keys are the English source; values are Simplified Chinese, Malay and Tamil.
 * Keep placeholders identical across languages. The i18n tests enforce coverage
 * for visible literals, preparation steps, readiness guidance and food records.
 * These translations share the unreviewed status documented in messages/en.ts.
 */
export const PATIENT_COPY: Readonly<Record<string, readonly [string, string, string]>> = {
  "Sign out of Colonaid?": [
    "要退出 Colonaid 吗？",
    "Log keluar daripada Colonaid?",
    "Colonaid-இலிருந்து வெளியேற வேண்டுமா?"
  ],
  "You will need your mobile number and a new code to get back in.": [
    "再次登录时，您需要使用手机号码和新的验证码。",
    "Anda memerlukan nombor telefon bimbit dan kod baharu untuk masuk semula.",
    "மீண்டும் உள்நுழைய உங்கள் கைப்பேசி எண்ணும் புதிய குறியீடும் தேவை."
  ],
  "Sign out": [
    "退出登录",
    "Log keluar",
    "வெளியேறு"
  ],
  "Stay signed in": [
    "保持登录",
    "Kekal log masuk",
    "உள்நுழைந்த நிலையிலேயே இரு"
  ],
  "Skip to content": [
    "跳至正文",
    "Langkau ke kandungan",
    "உள்ளடக்கத்திற்குச் செல்"
  ],
  "{0} of {1} glasses recorded": [
    "已记录 {0} 杯，共 {1} 杯",
    "{0} daripada {1} gelas direkodkan",
    "{1} குவளைகளில் {0} பதிவு செய்யப்பட்டுள்ளன"
  ],
  "Full volume done": [
    "已喝完全部用量",
    "Jumlah penuh sudah diminum",
    "முழு அளவும் குடித்து முடிக்கப்பட்டது"
  ],
  "All finished": [
    "全部完成",
    "Semuanya selesai",
    "அனைத்தும் முடிந்தது"
  ],
  "I drank a glass": [
    "我喝了一杯",
    "Saya sudah minum segelas",
    "ஒரு குவளை குடித்தேன்"
  ],
  "Undo one glass": [
    "撤销一杯",
    "Batalkan satu gelas",
    "ஒரு குவளைப் பதிவை நீக்கு"
  ],
  "Undo": [
    "撤销",
    "Batal",
    "மீட்டமை"
  ],
  "Saving": [
    "正在保存",
    "Menyimpan",
    "சேமிக்கிறது"
  ],
  "{0} added to your plan": [
    "已向计划添加 {0} 项",
    "{0} ditambah pada pelan anda",
    "உங்கள் திட்டத்தில் {0} சேர்க்கப்பட்டன"
  ],
  "Enlarge photo {0}": [
    "放大第 {0} 张照片",
    "Besarkan foto {0}",
    "படம் {0}-ஐப் பெரிதாக்கு"
  ],
  "Instruction sheet, photo {0}": [
    "说明单，第 {0} 张照片",
    "Helaian arahan, foto {0}",
    "அறிவுறுத்தல் தாள், படம் {0}"
  ],
  "Remove {0}": [
    "移除 {0}",
    "Buang {0}",
    "{0}-ஐ நீக்கு"
  ],
  "Remove": [
    "移除",
    "Buang",
    "நீக்கு"
  ],
  "Photo": [
    "照片",
    "Foto",
    "படம்"
  ],
  "Take": [
    "服用",
    "Ambil",
    "எடுத்துக்கொள்"
  ],
  "Do not take": [
    "暂停服用",
    "Jangan ambil",
    "எடுத்துக்கொள்ள வேண்டாம்"
  ],
  "Dose {0}": [
    "第 {0} 剂",
    "Dos {0}",
    "வேளை {0}"
  ],
  "Take dose {0} at": [
    "第 {0} 剂服用时间",
    "Ambil dos {0} pada",
    "வேளை {0} எடுக்கும் நேரம்"
  ],
  "{0} added. Your plan now includes these reminders.": [
    "已添加 {0}。您的计划现已包含这些提醒。",
    "{0} ditambah. Pelan anda kini mengandungi peringatan ini.",
    "{0} சேர்க்கப்பட்டது. உங்கள் திட்டத்தில் இந்த நினைவூட்டல்கள் இப்போது உள்ளன."
  ],
  "Nothing booked under this number": [
    "此号码下没有预约",
    "Tiada tempahan di bawah nombor ini",
    "இந்த எண்ணில் முன்பதிவு இல்லை"
  ],
  "We have no colonoscopy against": [
    "以下号码没有结肠镜预约：",
    "Tiada tempahan kolonoskopi untuk",
    "இந்த எண்ணில் பெருங்குடல் நோக்கிப் பரிசோதனை முன்பதிவு இல்லை:"
  ],
  ". That usually means the hospital/clinic holds a different number for you — often a family member’s.": [
    "。这通常表示医院/诊所记录的是另一个号码，可能是家人的号码。",
    ". Biasanya hospital/klinik menyimpan nombor lain untuk anda — selalunya nombor ahli keluarga.",
    ". பொதுவாக மருத்துவமனை/கிளினிக்கில் வேறு எண், பெரும்பாலும் குடும்ப உறுப்பினரின் எண், பதிவு செய்யப்பட்டிருக்கலாம்."
  ],
  "Call your endoscopy hospital/clinic to check which number they have, then sign in with that one.": [
    "请致电内镜医院/诊所确认他们记录的号码，再用该号码登录。",
    "Hubungi hospital/klinik endoskopi untuk menyemak nombor dalam rekod, kemudian log masuk dengan nombor itu.",
    "பதிவு செய்யப்பட்ட எண்ணை உறுதிசெய்ய எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும்; பின்னர் அந்த எண்ணில் உள்நுழையவும்."
  ],
  "Try a different number": [
    "尝试其他号码",
    "Cuba nombor lain",
    "வேறு எண்ணை முயலவும்"
  ],
  "How to prep": [
    "如何准备",
    "Cara membuat persediaan",
    "எவ்வாறு தயாராவது"
  ],
  "Every day of the run-up, in order. Today is marked.": [
    "按顺序查看检查前每一天的安排。今天已标记。",
    "Setiap hari sebelum prosedur, mengikut urutan. Hari ini ditandakan.",
    "பரிசோதனைக்கு முன் ஒவ்வொரு நாளும் வரிசையாக. இன்று குறிக்கப்பட்டுள்ளது."
  ],
  "Includes": [
    "包含",
    "Termasuk",
    "உள்ளடக்கம்:"
  ],
  "The second dose of purgative is the one most often skipped, and it is the one that clears the right side of the colon. Finish both.": [
    "第二剂清肠药最容易被漏服，也是清洁结肠右侧的关键。请完成两剂。",
    "Dos kedua ubat pencuci usus paling kerap terlepas dan membersihkan bahagian kanan kolon. Habiskan kedua-duanya.",
    "குடல் சுத்திகரிப்பு மருந்தின் இரண்டாவது வேளைதான் அதிகம் தவறவிடப்படுகிறது; அதுவே பெருங்குடலின் வலப்பக்கத்தைச் சுத்தம் செய்கிறது. இரண்டையும் முடிக்கவும்."
  ],
  "From the hospital/clinic’s sheet you reviewed.": [
    "来自您已核对的医院/诊所说明单。",
    "Daripada helaian hospital/klinik yang anda semak.",
    "நீங்கள் சரிபார்த்த மருத்துவமனை/கிளினிக் தாளிலிருந்து."
  ],
  "Good · followed for all required days": [
    "良好 · 所有要求的日子均有遵守",
    "Baik · diikuti pada semua hari yang diperlukan",
    "நன்று · தேவையான எல்லா நாட்களிலும் பின்பற்றப்பட்டது"
  ],
  "Partial · mostly followed": [
    "部分 · 大致遵守",
    "Sebahagian · kebanyakannya diikuti",
    "பகுதியளவு · பெரும்பாலும் பின்பற்றப்பட்டது"
  ],
  "Poor · largely not followed": [
    "较差 · 大部分未遵守",
    "Kurang baik · kebanyakannya tidak diikuti",
    "குறைவு · பெரும்பாலும் பின்பற்றப்படவில்லை"
  ],
  "Check-ins still needed": [
    "仍需填写记录",
    "Catatan masih diperlukan",
    "இன்னும் பதிவுகள் தேவை"
  ],
  "Good · full preparation, on time": [
    "良好 · 按时完成全部准备",
    "Baik · persediaan penuh, tepat pada masanya",
    "நன்று · முழுத் தயாரிப்பும் சரியான நேரத்தில் முடிந்தது"
  ],
  "Partial · timing off or still completing": [
    "部分 · 时间不符或仍在完成",
    "Sebahagian · masa berbeza atau masih melengkapkan",
    "பகுதியளவு · நேரம் மாறியது அல்லது இன்னும் முடிக்கப்படுகிறது"
  ],
  "Poor · missed or incomplete preparation": [
    "较差 · 漏服或准备未完成",
    "Kurang baik · terlepas atau persediaan tidak lengkap",
    "குறைவு · தவறவிடப்பட்டது அல்லது தயாரிப்பு முடியவில்லை"
  ],
  "Completion or timing not yet confirmed": [
    "尚未确认完成情况或时间",
    "Penyelesaian atau masa belum disahkan",
    "முடித்ததா அல்லது நேரமா என்பது இன்னும் உறுதியாகவில்லை"
  ],
  "Ready appearance · clear or pale-yellow liquid, no bits": [
    "外观接近准备就绪 · 透明或淡黄色液体，无颗粒",
    "Rupa sedia · cecair jernih atau kuning pucat, tiada ketulan",
    "தயாரான தோற்றம் · துகள்களில்லாத தெளிவான அல்லது வெளிர் மஞ்சள் திரவம்"
  ],
  "Almost · mostly clear with a few particles or light orange liquid": [
    "接近 · 大致透明，有少量颗粒或浅橙色液体",
    "Hampir · kebanyakannya jernih dengan sedikit zarah atau cecair jingga muda",
    "கிட்டத்தட்ட · சில துகள்களுடன் பெரும்பாலும் தெளிவான அல்லது வெளிர் ஆரஞ்சு திரவம்"
  ],
  "Not ready appearance · brown, murky or solid": [
    "外观尚未准备好 · 棕色、浑浊或固体",
    "Rupa belum sedia · coklat, keruh atau pejal",
    "தயாராகாத தோற்றம் · பழுப்பு, கலங்கல் அல்லது திடமானது"
  ],
  "Procedure-morning check still needed or uncertain": [
    "仍需检查当天早晨的记录，或结果不确定",
    "Pemeriksaan pagi prosedur masih diperlukan atau tidak pasti",
    "பரிசோதனைக் காலைச் சரிபார்ப்பு இன்னும் தேவை அல்லது உறுதியில்லை"
  ],
  "04 · Overall bowel readiness": [
    "04 · 整体肠道准备情况",
    "04 · Kesediaan usus keseluruhan",
    "04 · ஒட்டுமொத்தக் குடல் தயார்நிலை"
  ],
  "flag · Based on saved check-ins": [
    "指示 · 根据已保存的记录",
    "petunjuk · Berdasarkan catatan disimpan",
    "குறிகாட்டி · சேமித்த பதிவுகளின் அடிப்படையில்"
  ],
  "Purgative": [
    "清肠药",
    "Ubat pencuci usus",
    "குடல் சுத்திகரிப்பு மருந்து"
  ],
  "Morning stool": [
    "早晨排便",
    "Najis pagi",
    "காலை மலம்"
  ],
  "Low-residue diet": [
    "低渣饮食",
    "Diet rendah sisa",
    "குறைந்த சக்கை உணவு"
  ],
  "Your morning output is not yet clear.": [
    "您早晨的排出物尚未清澈。",
    "Najis pagi anda belum jernih.",
    "உங்கள் காலைக் கழிவு இன்னும் தெளிவாக இல்லை."
  ],
  "You reported a missed dose or incomplete preparation.": [
    "您报告了漏服或未完成准备。",
    "Anda melaporkan dos terlepas atau persediaan tidak lengkap.",
    "ஒரு வேளையைத் தவறவிட்டதாக அல்லது தயாரிப்பை முடிக்கவில்லை எனப் பதிவு செய்துள்ளீர்கள்."
  ],
  "Complete or clarify the missing check-ins. Missing information is not the same as poor preparation.": [
    "请补全或确认缺少的记录。资料不足不代表准备不佳。",
    "Lengkapkan atau jelaskan catatan yang belum ada. Maklumat tiada tidak bermaksud persediaan kurang baik.",
    "விடுபட்ட பதிவுகளை முடிக்கவும் அல்லது தெளிவுபடுத்தவும். தகவல் இல்லாதது தயாரிப்பு குறைவாக உள்ளது என்று பொருளல்ல."
  ],
  "If you are still completing preparation, follow the remaining prescribed steps. Ask your team if timing has changed.": [
    "若仍在准备中，请完成余下的医嘱步骤。如时间有变，请询问医护团队。",
    "Jika masih melengkapkan persediaan, ikut langkah preskripsi yang berbaki. Tanya pasukan anda jika masa telah berubah.",
    "இன்னும் தயாரிப்பை முடிக்கிறீர்கள் என்றால், மீதமுள்ள பரிந்துரைக்கப்பட்ட படிகளைப் பின்பற்றவும். நேரம் மாறியிருந்தால் மருத்துவக் குழுவிடம் கேட்கவும்."
  ],
  "Follow your hospital/clinic’s clear-fluid and fasting instructions, including when to stop drinking.": [
    "遵循医院/诊所的清流质及禁食说明，包括停止饮水的时间。",
    "Ikut arahan cecair jernih dan puasa hospital/klinik anda, termasuk masa berhenti minum.",
    "குடிப்பதை நிறுத்தும் நேரம் உட்பட மருத்துவமனை/கிளினிக்கின் தெளிந்த திரவம் மற்றும் உண்ணாநிலை அறிவுறுத்தல்களைப் பின்பற்றவும்."
  ],
  "Re-check the latest output on procedure morning; colour or frequent trips alone do not confirm clarity.": [
    "检查当天早晨请再次查看最新排出物；仅凭颜色或频繁排便不能确认清澈度。",
    "Periksa semula najis terkini pada pagi prosedur; warna atau kekerapan ke tandas sahaja tidak mengesahkan kejernihan.",
    "பரிசோதனைக் காலையில் சமீபத்திய கழிவை மீண்டும் பார்க்கவும்; நிறம் அல்லது அடிக்கடி கழிப்பறை செல்வது மட்டும் தெளிவை உறுதிசெய்யாது."
  ],
  "You followed the diet — thank you for keeping track.": [
    "您已遵守饮食要求，感谢您持续记录。",
    "Anda mengikuti diet — terima kasih kerana mencatatnya.",
    "உணவுமுறையைப் பின்பற்றியுள்ளீர்கள் — பதிவு செய்ததற்கு நன்றி."
  ],
  "Add your diet check-ins when those days are complete.": [
    "相关日期结束后，请补填饮食记录。",
    "Tambah catatan diet selepas hari berkenaan selesai.",
    "அந்த நாட்கள் முடிந்ததும் உணவுப் பதிவுகளைச் சேர்க்கவும்."
  ],
  "Tell your team about diet slips. Keep following the diet for your current prep stage.": [
    "如饮食未完全遵守，请告知团队，并继续遵循当前阶段的饮食要求。",
    "Beritahu pasukan anda tentang pelanggaran diet. Terus ikut diet bagi peringkat persediaan semasa.",
    "உணவுமுறை தவறுகளை மருத்துவக் குழுவிடம் தெரிவிக்கவும். தற்போதைய தயாரிப்பு நிலைக்கான உணவுமுறையைத் தொடர்ந்து பின்பற்றவும்."
  ],
  "Diet alone does not change this flag.": [
    "饮食本身不会改变此指示。",
    "Diet sahaja tidak mengubah petunjuk ini.",
    "உணவுமுறை மட்டும் இந்தக் குறிகாட்டியை மாற்றாது."
  ],
  "You reported very dark or blood-like output. Contact your care team, whatever the flag colour.": [
    "您报告排出物很深色或像血。无论指示颜色如何，请联系医护团队。",
    "Anda melaporkan najis sangat gelap atau seperti darah. Hubungi pasukan penjagaan tanpa mengira warna petunjuk.",
    "மிகவும் கருமையான அல்லது இரத்தம் போன்ற கழிவைப் பதிவு செய்துள்ளீர்கள். குறிகாட்டி நிறம் எதுவாக இருந்தாலும் மருத்துவக் குழுவைத் தொடர்புகொள்ளவும்."
  ],
  "Contact the endoscopy team": [
    "联系内镜团队",
    "Hubungi pasukan endoskopi",
    "எண்டோஸ்கோபி குழுவைத் தொடர்புகொள்"
  ],
  "Call the endoscopy team using the number on your appointment letter.": [
    "请使用预约信上的号码致电内镜团队。",
    "Hubungi pasukan endoskopi melalui nombor pada surat janji temu anda.",
    "முன்பதிவுக் கடிதத்தில் உள்ள எண்ணில் எண்டோஸ்கோபி குழுவை அழைக்கவும்."
  ],
  "This flag supports a conversation with your care team. It does not decide whether your colonoscopy goes ahead. Do not take extra purgative based on this flag; your team decides any changes.": [
    "此指示用于协助您与医护团队沟通，不能决定结肠镜检查是否进行。请勿据此额外服用清肠药；任何调整均由团队决定。",
    "Petunjuk ini membantu perbincangan dengan pasukan penjagaan. Ia tidak menentukan sama ada kolonoskopi diteruskan. Jangan tambah ubat pencuci usus berdasarkan petunjuk ini; pasukan anda menentukan perubahan.",
    "இந்தக் குறிகாட்டி மருத்துவக் குழுவுடனான உரையாடலுக்கு உதவும். பரிசோதனை நடைபெறுமா என்பதை இது முடிவுசெய்யாது. இதன் அடிப்படையில் கூடுதல் சுத்திகரிப்பு மருந்து எடுக்க வேண்டாம்; மாற்றங்களை உங்கள் குழுவே முடிவுசெய்யும்."
  ],
  "Diet": [
    "饮食",
    "Diet",
    "உணவுமுறை"
  ],
  "Fluids": [
    "液体",
    "Cecair",
    "திரவங்கள்"
  ],
  "Meds": [
    "药物",
    "Ubat",
    "மருந்துகள்"
  ],
  "Prep": [
    "准备",
    "Persediaan",
    "தயாரிப்பு"
  ],
  "Admin": [
    "事务",
    "Urusan",
    "நிர்வாகம்"
  ],
  "That did not save. Check your connection and try again.": [
    "未能保存。请检查网络连接并重试。",
    "Tidak dapat disimpan. Semak sambungan dan cuba lagi.",
    "சேமிக்க முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்."
  ],
  "Done": [
    "完成",
    "Selesai",
    "முடிந்தது"
  ],
  "What makes you think your preparation is working?": [
    "您为什么觉得清肠准备正在起作用？",
    "Apakah yang membuat anda fikir persediaan anda berkesan?",
    "உங்கள் தயாரிப்பு வேலை செய்கிறது என்று ஏன் நினைக்கிறீர்கள்?"
  ],
  "What colour was the output on your latest trip?": [
    "最近一次排便是什么颜色？",
    "Apakah warna najis pada kali terakhir anda ke tandas?",
    "கடைசியாகக் கழிப்பறை சென்றபோது கழிவு என்ன நிறத்தில் இருந்தது?"
  ],
  "What was its consistency?": [
    "质地如何？",
    "Bagaimanakah kepekatannya?",
    "அதன் தன்மை எப்படி இருந்தது?"
  ],
  "Could you see through the liquid?": [
    "您能透过液体看见后面的东西吗？",
    "Bolehkah anda melihat menembusi cecair itu?",
    "திரவத்தின் ஊடாகப் பார்க்க முடிந்ததா?"
  ],
  "Could not save your check-in. Please try again.": [
    "未能保存记录，请重试。",
    "Catatan tidak dapat disimpan. Sila cuba lagi.",
    "பதிவைச் சேமிக்க முடியவில்லை. மீண்டும் முயலவும்."
  ],
  "Last saved check:": [
    "上次保存的检查：",
    "Pemeriksaan terakhir disimpan:",
    "கடைசியாகச் சேமித்த சரிபார்ப்பு:"
  ],
  "Question {0}": [
    "问题 {0}",
    "Soalan {0}",
    "கேள்வி {0}"
  ],
  "Your check-in": [
    "您的记录",
    "Catatan anda",
    "உங்கள் பதிவு"
  ],
  "Iron tablets and some foods can darken output; bile can tint it yellow-green. Colour alone cannot tell us whether your bowel is clear.": [
    "铁剂及某些食物会使排出物变深，胆汁可使其呈黄绿色。仅凭颜色不能判断肠道是否清洁。",
    "Tablet zat besi dan sesetengah makanan boleh menggelapkan najis; hempedu boleh menjadikannya kuning kehijauan. Warna sahaja tidak menentukan usus sudah bersih.",
    "இரும்பு மாத்திரைகளும் சில உணவுகளும் கழிவைக் கருமையாக்கலாம்; பித்தம் மஞ்சள்-பச்சை நிறம் தரலாம். நிறம் மட்டும் குடல் சுத்தமாக உள்ளதா என்பதைக் கூறாது."
  ],
  "Continue": [
    "继续",
    "Teruskan",
    "தொடர்"
  ],
  "The number of toilet trips does not confirm readiness. Focus on whether the latest output is watery and clear.": [
    "排便次数不能确认准备是否充分。请注意最新排出物是否呈水样且清澈。",
    "Bilangan lawatan ke tandas tidak mengesahkan kesediaan. Tumpukan pada sama ada najis terkini berair dan jernih.",
    "கழிப்பறை சென்ற எண்ணிக்கை தயார்நிலையை உறுதிசெய்யாது. சமீபத்திய கழிவு நீர்த்தும் தெளிவாகவும் உள்ளதா என்பதைக் கவனிக்கவும்."
  ],
  "Colour alone can mislead. Watery consistency and see-through clarity matter together.": [
    "仅凭颜色可能误判。水样质地和透明度需要一起考虑。",
    "Warna sahaja boleh mengelirukan. Keadaan berair dan kejernihan kedua-duanya penting.",
    "நிறம் மட்டும் தவறாக வழிநடத்தலாம். நீர்த்த தன்மையும் ஊடாகப் பார்க்கும் தெளிவும் ஒன்றாக முக்கியம்."
  ],
  "Judge the latest output, rather than the number of trips or its colour alone.": [
    "请判断最近一次的排出物，不要只看次数或颜色。",
    "Nilai najis terkini, bukan hanya bilangan lawatan atau warnanya.",
    "சமீபத்திய கழிவை மதிப்பிடவும்; சென்ற எண்ணிக்கை அல்லது நிறத்தை மட்டும் பார்க்க வேண்டாம்."
  ],
  "Your answers:": [
    "您的回答：",
    "Jawapan anda:",
    "உங்கள் பதில்கள்:"
  ],
  "Saving…": [
    "正在保存…",
    "Menyimpan…",
    "சேமிக்கிறது…"
  ],
  "Check-in saved": [
    "记录已保存",
    "Catatan disimpan",
    "பதிவு சேமிக்கப்பட்டது"
  ],
  "Save my check-in": [
    "保存我的记录",
    "Simpan catatan saya",
    "என் பதிவைச் சேமி"
  ],
  "Saved. You can check again after your next trip.": [
    "已保存。下次排便后可再次检查。",
    "Disimpan. Anda boleh periksa lagi selepas lawatan seterusnya.",
    "சேமிக்கப்பட்டது. அடுத்த முறை கழிப்பறை சென்ற பிறகு மீண்டும் சரிபார்க்கலாம்."
  ],
  "Call the hospital/clinic →": [
    "致电医院/诊所 →",
    "Hubungi hospital/klinik →",
    "மருத்துவமனை/கிளினிக்கை அழை →"
  ],
  "Use the hospital/clinic number on your appointment letter.": [
    "请使用预约信上的医院/诊所号码。",
    "Gunakan nombor hospital/klinik pada surat janji temu anda.",
    "முன்பதிவுக் கடிதத்தில் உள்ள மருத்துவமனை/கிளினிக் எண்ணைப் பயன்படுத்தவும்."
  ],
  "Do not take extra preparation or change medicines based on this check. Your clinical team decides whether your bowel preparation is adequate.": [
    "不要根据此检查额外服用清肠药或更改用药。肠道准备是否充分由医护团队判断。",
    "Jangan tambah persediaan atau ubah ubat berdasarkan pemeriksaan ini. Pasukan klinikal menentukan sama ada persediaan usus anda mencukupi.",
    "இந்தச் சரிபார்ப்பின் அடிப்படையில் கூடுதல் தயாரிப்பு மருந்து எடுக்கவோ மருந்துகளை மாற்றவோ வேண்டாம். குடல் தயாரிப்பு போதுமானதா என்பதை மருத்துவக் குழுவே முடிவுசெய்யும்."
  ],
  "Start a new check-in": [
    "开始新的检查",
    "Mulakan pemeriksaan baharu",
    "புதிய சரிபார்ப்பைத் தொடங்கு"
  ],
  "Back": [
    "返回",
    "Kembali",
    "பின்"
  ],
  "Sections": [
    "栏目",
    "Bahagian",
    "பிரிவுகள்"
  ],
  "WAIT": [
    "等待",
    "TUNGGU",
    "காத்திரு"
  ],
  "WK −1": [
    "前一周",
    "MINGGU −1",
    "வாரம் −1"
  ],
  "DIET": [
    "饮食",
    "DIET",
    "உணவு"
  ],
  "PURGE": [
    "清肠",
    "CUCI USUS",
    "சுத்திகரிப்பு"
  ],
  "SCOPE": [
    "检查",
    "SKOP",
    "பரிசோதனை"
  ],
  "DONE": [
    "完成",
    "SELESAI",
    "முடிந்தது"
  ],
  "UNTIL WK −1": [
    "至前一周",
    "HINGGA MINGGU −1",
    "முந்தைய வாரம் வரை"
  ],
  "You are here": [
    "您在这里",
    "Anda di sini",
    "நீங்கள் இங்கே உள்ளீர்கள்"
  ],
  "Not recorded": [
    "未记录",
    "Belum direkodkan",
    "பதிவு செய்யப்படவில்லை"
  ],
  "{0}: not recorded": [
    "{0}：未记录",
    "{0}: belum direkodkan",
    "{0}: பதிவு செய்யப்படவில்லை"
  ],
  "I threw up after the first dose": [
    "我服用第一剂后呕吐了",
    "Saya muntah selepas dos pertama",
    "முதல் வேளைக்குப் பிறகு வாந்தி எடுத்தேன்"
  ],
  "Can I drink milk tomorrow?": [
    "我明天可以喝牛奶吗？",
    "Bolehkah saya minum susu esok?",
    "நாளை பால் குடிக்கலாமா?"
  ],
  "My stools are still brown": [
    "我的粪便仍是棕色",
    "Najis saya masih coklat",
    "எனது மலம் இன்னும் பழுப்பு நிறத்தில் உள்ளது"
  ],
  "I cannot finish the whole bottle": [
    "我喝不完整瓶",
    "Saya tidak dapat menghabiskan seluruh botol",
    "முழுப் பாட்டிலையும் குடிக்க முடியவில்லை"
  ],
  "Something went wrong. Please call your hospital/clinic.": [
    "出现问题，请致电医院/诊所。",
    "Sesuatu tidak kena. Sila hubungi hospital/klinik anda.",
    "ஏதோ தவறு ஏற்பட்டது. மருத்துவமனை/கிளினிக்கை அழைக்கவும்."
  ],
  "No connection, so I cannot answer. Please call your endoscopy hospital/clinic, or 995 if this is severe.": [
    "没有网络连接，无法回答。请致电内镜医院/诊所，情况严重请拨打 995。",
    "Tiada sambungan, jadi saya tidak dapat menjawab. Hubungi hospital/klinik endoskopi anda, atau 995 jika teruk.",
    "இணைப்பு இல்லாததால் பதிலளிக்க முடியவில்லை. எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும்; நிலை கடுமையாக இருந்தால் 995-ஐ அழைக்கவும்."
  ],
  "Thinking…": [
    "正在思考…",
    "Sedang berfikir…",
    "பதிலைத் தயாரிக்கிறது…"
  ],
  "What people ask at 1am": [
    "凌晨一点的常见问题",
    "Soalan biasa pada pukul 1 pagi",
    "அதிகாலை 1 மணியில் பொதுவான கேள்விகள்"
  ],
  "Ask a question": [
    "提问",
    "Tanya soalan",
    "கேள்வி கேள்"
  ],
  "Send": [
    "发送",
    "Hantar",
    "அனுப்பு"
  ],
  "This assistant supports your preparation and cannot change your dose or decide whether your procedure goes ahead. This is an AI-powered chatbot for guidance only and AI can make mistakes. For anything urgent call": [
    "此助手协助您准备，不能更改剂量或决定检查是否进行。这是一个人工智能聊天机器人，仅供参考，而且人工智能可能会出错。紧急情况请致电",
    "Pembantu ini menyokong persediaan anda dan tidak boleh mengubah dos atau menentukan sama ada prosedur diteruskan. Ini ialah chatbot berkuasa AI untuk panduan sahaja dan AI boleh membuat kesilapan. Untuk perkara segera, hubungi",
    "இந்த உதவியாளர் தயாரிப்புக்கு உதவும்; மருந்தளவை மாற்றவோ பரிசோதனை நடைபெறுமா என்பதை முடிவுசெய்யவோ முடியாது. இது வழிகாட்டுதலுக்காக மட்டுமே உள்ள செயற்கை நுண்ணறிவு உரையாடல் உதவியாளர், மேலும் செயற்கை நுண்ணறிவு தவறுகள் செய்யலாம். அவசரமான விஷயங்களுக்கு அழைக்கவும்:"
  ],
  "your hospital/clinic": [
    "您的医院/诊所",
    "hospital/klinik anda",
    "உங்கள் மருத்துவமனை/கிளினிக்"
  ],
  ", or 995 if it is severe.": [
    "，情况严重请拨打 995。",
    ", atau 995 jika teruk.",
    ", நிலை கடுமையாக இருந்தால் 995."
  ],
  "your hospital/clinic, or 995 if it is severe.": [
    "您的医院/诊所，情况严重请拨打 995。",
    "hospital/klinik anda, atau 995 jika teruk.",
    "உங்கள் மருத்துவமனை/கிளினிக்; நிலை கடுமையாக இருந்தால் 995."
  ],
  "Ask — Colonaid": [
    "提问 — Colonaid",
    "Tanya — Colonaid",
    "கேள்விகள் — Colonaid"
  ],
  "Ask": [
    "提问",
    "Tanya",
    "கேள்"
  ],
  "For the hours when the hospital/clinic is closed and the sheet does not cover it.": [
    "医院/诊所休息、说明单又未涵盖时，在这里提问。",
    "Untuk waktu hospital/klinik ditutup dan helaian tidak menjawab soalan anda.",
    "மருத்துவமனை/கிளினிக் மூடியிருக்கும் நேரத்திலும் தாளில் பதில் இல்லாதபோதும் உதவ."
  ],
  "General": [
    "普通饮食",
    "Umum",
    "பொதுவான உணவு"
  ],
  "Prep day": [
    "准备日",
    "Hari persediaan",
    "தயாரிப்பு நாள்"
  ],
  "Low residue day": [
    "低渣饮食日",
    "Hari rendah sisa",
    "குறைந்த சக்கை உணவு நாள்"
  ],
  "Clear liquid day": [
    "清流质饮食日",
    "Hari cecair jernih",
    "தெளிந்த திரவ உணவு நாள்"
  ],
  "Diet preference": [
    "饮食偏好",
    "Pilihan diet",
    "உணவு விருப்பம்"
  ],
  "Vegetarian": [
    "蛋奶素",
    "Vegetarian",
    "சைவம்"
  ],
  "Vegan": [
    "纯素",
    "Vegan",
    "முழுச் சைவம்"
  ],
  "Food category": [
    "食物类别",
    "Kategori makanan",
    "உணவு வகை"
  ],
  "All categories": [
    "所有类别",
    "Semua kategori",
    "அனைத்து வகைகளும்"
  ],
  "foods you can eat ·": [
    "种可食用食物 ·",
    "makanan boleh dimakan ·",
    "உண்ணக்கூடிய உணவுகள் ·"
  ],
  "You are not allowed to eat this category of the food": [
    "此类食物不能食用",
    "Anda tidak dibenarkan makan kategori makanan ini",
    "இந்த வகை உணவை நீங்கள் உண்ணக்கூடாது"
  ],
  "You can eat": [
    "可以吃",
    "Boleh dimakan",
    "உண்ணலாம்"
  ],
  "Avoid": [
    "避免",
    "Elakkan",
    "தவிர்க்கவும்"
  ],
  "No foods listed to avoid in this category.": [
    "此类别没有列出需避免的食物。",
    "Tiada makanan untuk dielakkan dalam kategori ini.",
    "இந்த வகையில் தவிர்க்க வேண்டிய உணவுகள் பட்டியலிடப்படவில்லை."
  ],
  "No foods listed for this selection.": [
    "此选择下没有列出的食物。",
    "Tiada makanan disenaraikan untuk pilihan ini.",
    "இந்தத் தேர்வுக்கு உணவுகள் பட்டியலிடப்படவில்லை."
  ],
  "Meal list — Colonaid": [
    "食物清单 — Colonaid",
    "Senarai makanan — Colonaid",
    "உணவுப் பட்டியல் — Colonaid"
  ],
  "Meal list": [
    "食物清单",
    "Senarai makanan",
    "உணவுப் பட்டியல்"
  ],
  "Choose your prep day and diet preference to see what you can eat.": [
    "选择准备日和饮食偏好，查看可以吃什么。",
    "Pilih hari persediaan dan pilihan diet untuk melihat makanan yang boleh dimakan.",
    "எதை உண்ணலாம் என்பதைப் பார்க்க தயாரிப்பு நாளையும் உணவு விருப்பத்தையும் தேர்ந்தெடுக்கவும்."
  ],
  "Not on the list?": [
    "清单上没有？",
    "Tiada dalam senarai?",
    "பட்டியலில் இல்லையா?"
  ],
  "Guidance differs between hospitals, so when it matters your hospital’s answer is the one that applies to you.": [
    "不同医院的指引可能不同，请以您的医院提供的答复为准。",
    "Panduan berbeza antara hospital, jadi jawapan hospital anda yang terpakai kepada anda.",
    "மருத்துவமனைகளின் வழிகாட்டல்கள் மாறுபடும்; உங்கள் மருத்துவமனையின் பதிலே உங்களுக்குப் பொருந்தும்."
  ],
  "Call the hospital": [
    "致电医院",
    "Hubungi hospital",
    "மருத்துவமனையை அழை"
  ],
  "Ask in chat": [
    "在聊天中提问",
    "Tanya dalam sembang",
    "உரையாடலில் கேள்"
  ],
  "The preparation — Colonaid": [
    "清肠准备 — Colonaid",
    "Persediaan — Colonaid",
    "தயாரிப்பு — Colonaid"
  ],
  "The preparation": [
    "清肠准备",
    "Persediaan",
    "தயாரிப்பு"
  ],
  "Record each glass as you finish it. This is what tells the nurse how your prep went.": [
    "每喝完一杯就记录。这能让护士了解您的准备情况。",
    "Catat setiap gelas selepas diminum. Ini memberitahu jururawat tentang persediaan anda.",
    "ஒவ்வொரு குவளையையும் குடித்து முடித்ததும் பதிவு செய்யவும். இது உங்கள் தயாரிப்பு எப்படி நடந்தது என்பதை செவிலியருக்குத் தெரிவிக்கும்."
  ],
  "Finishing the full volume is what decides whether the scope works. If you cannot keep it down, call your hospital/clinic — do not take extra to make up for it.": [
    "喝完全部用量是检查成功的关键。如无法喝下或持续吐出，请联系医院/诊所，不要额外服用来补偿。",
    "Menghabiskan jumlah penuh menentukan kejayaan skop. Jika anda tidak dapat mengekalkannya tanpa muntah, hubungi hospital/klinik — jangan ambil tambahan untuk menggantikan.",
    "முழு அளவையும் முடிப்பது பரிசோதனையின் வெற்றிக்கு முக்கியம். வாந்தியின்றிக் குடிக்க முடியாவிட்டால் மருத்துவமனை/கிளினிக்கை அழைக்கவும் — ஈடுசெய்யக் கூடுதலாக எடுக்க வேண்டாம்."
  ],
  "Tonight’s doses": [
    "今晚的剂量",
    "Dos malam ini",
    "இன்றிரவு வேளைகள்"
  ],
  "Call the hospital/clinic": [
    "致电医院/诊所",
    "Hubungi hospital/klinik",
    "மருத்துவமனை/கிளினிக்கை அழை"
  ],
  "Journey — Colonaid": [
    "准备过程 — Colonaid",
    "Perjalanan — Colonaid",
    "தயாரிப்புப் பயணம் — Colonaid"
  ],
  "Your journey": [
    "您的准备过程",
    "Perjalanan anda",
    "உங்கள் தயாரிப்புப் பயணம்"
  ],
  "Stages": [
    "各个阶段",
    "Peringkat",
    "நிலைகள்"
  ],
  "All of this happens outside the hospital, which is exactly why it usually goes unnoticed.": [
    "这些准备都在医院外进行，因此往往容易被忽略。",
    "Semua ini berlaku di luar hospital, sebab itulah ia sering tidak disedari.",
    "இவை அனைத்தும் மருத்துவமனைக்கு வெளியே நடப்பதால் பெரும்பாலும் கவனிக்கப்படுவதில்லை."
  ],
  "How to prep — Colonaid": [
    "如何准备 — Colonaid",
    "Cara membuat persediaan — Colonaid",
    "எவ்வாறு தயாராவது — Colonaid"
  ],
  "Not sure about something?": [
    "有不确定的地方？",
    "Tidak pasti tentang sesuatu?",
    "ஏதேனும் சந்தேகமா?"
  ],
  "Guidance differs between hospitals. When in doubt, your hospital/clinic’s answer is the one that applies to you.": [
    "不同医院的指引可能不同。如有疑问，请以您的医院/诊所的答复为准。",
    "Panduan berbeza antara hospital. Jika ragu, jawapan hospital/klinik anda yang terpakai kepada anda.",
    "மருத்துவமனைகளின் வழிகாட்டல்கள் மாறுபடும். சந்தேகமிருந்தால் உங்கள் மருத்துவமனை/கிளினிக்கின் பதிலே உங்களுக்குப் பொருந்தும்."
  ],
  "Saved": [
    "已保存",
    "Disimpan",
    "சேமிக்கப்பட்டது"
  ],
  "Readiness — Colonaid": [
    "准备情况 — Colonaid",
    "Kesediaan — Colonaid",
    "தயார்நிலை — Colonaid"
  ],
  "Choose a valid preparation status.": [
    "请选择有效的准备状态。",
    "Pilih status persediaan yang sah.",
    "சரியான தயாரிப்பு நிலையைத் தேர்ந்தெடுக்கவும்."
  ],
  "Please choose a valid diet day and answer.": [
    "请选择有效的饮食日期和回答。",
    "Pilih hari diet dan jawapan yang sah.",
    "சரியான உணவு நாளையும் பதிலையும் தேர்ந்தெடுக்கவும்."
  ],
  "This dose is not due yet.": [
    "还未到服用此剂的时间。",
    "Belum tiba masa untuk dos ini.",
    "இந்த வேளைக்கான நேரம் இன்னும் வரவில்லை."
  ],
  "Readiness": [
    "准备情况",
    "Kesediaan",
    "தயார்நிலை"
  ],
  "A little check-in, one step at a time. See what you have recorded and what comes next.": [
    "一步步记录，看看您已完成什么、接下来做什么。",
    "Semak sedikit demi sedikit. Lihat catatan anda dan langkah seterusnya.",
    "ஒவ்வொரு படியாகச் சரிபார்க்கவும். பதிவு செய்ததையும் அடுத்து செய்ய வேண்டியதையும் பார்க்கவும்."
  ],
  "01 · Low-residue diet": [
    "01 · 低渣饮食",
    "01 · Diet rendah sisa",
    "01 · குறைந்த சக்கை உணவு"
  ],
  "How have your meals been?": [
    "这几天饮食如何？",
    "Bagaimanakah pemakanan anda?",
    "உங்கள் உணவுமுறை எப்படி இருந்தது?"
  ],
  "Diet followed on all three days": [
    "三天均遵守饮食要求",
    "Diet diikuti ketiga-tiga hari",
    "மூன்று நாட்களிலும் உணவுமுறை பின்பற்றப்பட்டது"
  ],
  "{0} of 3 days checked in": [
    "已记录 {0} 天，共 3 天",
    "{0} daripada 3 hari dicatat",
    "3 நாட்களில் {0} பதிவு செய்யப்பட்டன"
  ],
  "Record how each day went. It is okay if things did not go exactly to plan.": [
    "记录每一天的情况。没有完全按计划也没关系。",
    "Catat keadaan setiap hari. Tidak mengapa jika tidak semuanya mengikut pelan.",
    "ஒவ்வொரு நாளும் எப்படி இருந்தது எனப் பதிவு செய்யவும். அனைத்தும் திட்டப்படி செல்லாவிட்டாலும் பரவாயில்லை."
  ],
  "Upcoming": [
    "即将到来",
    "Akan datang",
    "வரவுள்ளது"
  ],
  "View my meal list →": [
    "查看我的食物清单 →",
    "Lihat senarai makanan saya →",
    "என் உணவுப் பட்டியலைப் பார் →"
  ],
  "02 · Purgative schedule": [
    "02 · 清肠药时间表",
    "02 · Jadual ubat pencuci usus",
    "02 · குடல் சுத்திகரிப்பு அட்டவணை"
  ],
  "Schedule confirmed by you": [
    "您已确认时间表",
    "Jadual disahkan oleh anda",
    "அட்டவணையை நீங்கள் உறுதிசெய்துள்ளீர்கள்"
  ],
  "{0} of {1} doses confirmed on time": [
    "已确认 {0} / {1} 剂按时服用",
    "{0} daripada {1} dos disahkan tepat pada masanya",
    "{1} வேளைகளில் {0} சரியான நேரத்தில் எடுத்தது உறுதியானது"
  ],
  "Check against your hospital/clinic’s instructions. Recorded volume and timing are separate — only confirm a dose after taking it.": [
    "请核对医院/诊所的说明。记录饮用量和确认时间是两回事，请在服用后才确认。",
    "Semak arahan hospital/klinik anda. Jumlah direkodkan dan masa adalah berasingan — sahkan dos hanya selepas mengambilnya.",
    "மருத்துவமனை/கிளினிக் அறிவுறுத்தல்களைச் சரிபார்க்கவும். குடித்த அளவும் நேரமும் தனித்தனி — எடுத்த பிறகே வேளையை உறுதிசெய்யவும்."
  ],
  "Evening before": [
    "前一天晚上",
    "Malam sebelumnya",
    "முந்தைய மாலை"
  ],
  "Procedure morning": [
    "检查当天早晨",
    "Pagi prosedur",
    "பரிசோதனைக் காலை"
  ],
  "✓ Taken on time · Undo": [
    "✓ 已按时服用 · 撤销",
    "✓ Diambil tepat pada masa · Batal",
    "✓ சரியான நேரத்தில் எடுத்தேன் · மீட்டமை"
  ],
  "I took this dose on time": [
    "我按时服用了这一剂",
    "Saya mengambil dos ini tepat pada masanya",
    "இந்த வேளையைச் சரியான நேரத்தில் எடுத்தேன்"
  ],
  "Choose your current status. Update it when things change; this report takes priority over the dose log.": [
    "选择目前的状态，情况改变时请更新。此报告优先于剂量记录。",
    "Pilih status semasa. Kemas kini apabila berubah; laporan ini diutamakan berbanding log dos.",
    "தற்போதைய நிலையைத் தேர்ந்தெடுக்கவும். மாற்றம் ஏற்பட்டால் புதுப்பிக்கவும்; இந்த அறிக்கைக்கு வேளைப் பதிவைவிட முன்னுரிமை உள்ளது."
  ],
  "Record my glasses →": [
    "记录我喝的杯数 →",
    "Catat gelas saya →",
    "குடித்த குவளைகளைப் பதிவு செய் →"
  ],
  "Missed a dose or unsure about timing? Contact your hospital/clinic. Do not take extra preparation.": [
    "漏服或不确定时间？请联系医院/诊所，不要额外服用清肠药。",
    "Terlepas dos atau tidak pasti tentang masa? Hubungi hospital/klinik. Jangan ambil persediaan tambahan.",
    "வேளையைத் தவறவிட்டீர்களா அல்லது நேரத்தில் சந்தேகமா? மருத்துவமனை/கிளினிக்கைத் தொடர்புகொள்ளவும். கூடுதல் தயாரிப்பு மருந்து எடுக்க வேண்டாம்."
  ],
  "03 · Stool check-in": [
    "03 · 排便记录",
    "03 · Catatan najis",
    "03 · மலப் பதிவு"
  ],
  "Let’s check your latest output": [
    "一起检查您最近的排出物",
    "Mari periksa najis terkini anda",
    "உங்கள் சமீபத்திய கழிவைச் சரிபார்ப்போம்"
  ],
  "A few short questions about what you see. No photo needed.": [
    "几个关于您所见情况的简短问题，无需照片。",
    "Beberapa soalan ringkas tentang apa yang anda lihat. Tidak perlu foto.",
    "நீங்கள் பார்த்தது பற்றிய சில சிறிய கேள்விகள். படம் தேவையில்லை."
  ],
  "Your team makes the final call": [
    "最终由您的医护团队决定",
    "Pasukan anda membuat keputusan akhir",
    "இறுதி முடிவை உங்கள் மருத்துவக் குழுவே எடுக்கும்"
  ],
  "These check-ins help you share your progress. Colour or frequent toilet trips alone cannot confirm readiness for your colonoscopy.": [
    "这些记录有助于您分享进展。单凭颜色或频繁排便，无法确认结肠镜准备是否充分。",
    "Catatan ini membantu anda berkongsi kemajuan. Warna atau kekerapan ke tandas sahaja tidak mengesahkan kesediaan untuk kolonoskopi.",
    "இந்தப் பதிவுகள் முன்னேற்றத்தைப் பகிர உதவும். நிறம் அல்லது அடிக்கடி கழிப்பறை செல்வது மட்டும் பரிசோதனைக்கான தயார்நிலையை உறுதிசெய்யாது."
  ],
  "Ask a question →": [
    "提问 →",
    "Tanya soalan →",
    "கேள்வி கேள் →"
  ],
  "Home — Colonaid": [
    "首页 — Colonaid",
    "Utama — Colonaid",
    "முகப்பு — Colonaid"
  ],
  "You are preparing with {0}.": [
    "您正在陪同 {0} 做准备。",
    "Anda membuat persediaan bersama {0}.",
    "நீங்கள் {0} உடன் தயாராகிறீர்கள்."
  ],
  "Tonight decides whether the scope works. Finish the whole volume, at the times below.": [
    "今晚的准备决定检查效果。请在以下时间喝完全部用量。",
    "Persediaan malam ini menentukan kejayaan skop. Habiskan jumlah penuh pada masa di bawah.",
    "இன்றிரவு தயாரிப்பு பரிசோதனை வெற்றிக்கு முக்கியம். கீழே உள்ள நேரங்களில் முழு அளவையும் முடிக்கவும்."
  ],
  "Your appointment": [
    "您的预约",
    "Janji temu anda",
    "உங்கள் முன்பதிவு"
  ],
  "Arrive {0}": [
    "到达时间 {0}",
    "Tiba {0}",
    "வருகை நேரம் {0}"
  ],
  "Where you are": [
    "您目前的阶段",
    "Peringkat semasa anda",
    "உங்கள் தற்போதைய நிலை"
  ],
  "All stages": [
    "所有阶段",
    "Semua peringkat",
    "அனைத்து நிலைகளும்"
  ],
  "Record each glass as you finish it. It is the one thing here that changes what the nurse sees in the morning.": [
    "每喝完一杯就记录，让护士明早了解您的准备情况。",
    "Catat setiap gelas selepas diminum. Ini membantu jururawat mengetahui keadaan anda pada waktu pagi.",
    "ஒவ்வொரு குவளையையும் முடித்ததும் பதிவு செய்யவும். காலையில் செவிலியர் உங்கள் தயாரிப்பை அறிய இது உதவும்."
  ],
  "Track tonight’s doses": [
    "记录今晚的剂量",
    "Jejak dos malam ini",
    "இன்றிரவு வேளைகளைப் பதிவு செய்"
  ],
  "What to do today": [
    "今天要做什么",
    "Apa perlu dibuat hari ini",
    "இன்று செய்ய வேண்டியது"
  ],
  "How your prep is going": [
    "您的准备进展",
    "Kemajuan persediaan anda",
    "உங்கள் தயாரிப்பு முன்னேற்றம்"
  ],
  "Signed in as": [
    "当前登录号码",
    "Log masuk sebagai",
    "உள்நுழைந்த எண்"
  ],
  "Stool check-in — Colonaid": [
    "排便记录 — Colonaid",
    "Catatan najis — Colonaid",
    "மலப் பதிவு — Colonaid"
  ],
  "Stool check-in": [
    "排便记录",
    "Catatan najis",
    "மலப் பதிவு"
  ],
  "Tell us what you noticed on your latest toilet trip. We will take it one question at a time.": [
    "请告诉我们您最近一次排便的情况。我们一次问一个问题。",
    "Beritahu kami apa yang anda perhatikan pada lawatan terakhir ke tandas. Kita jawab satu soalan pada satu masa.",
    "கடைசியாகக் கழிப்பறை சென்றபோது கவனித்ததைக் கூறவும். ஒவ்வொரு கேள்வியாகப் பார்ப்போம்."
  ],
  "We could not send the code.": [
    "未能发送验证码。",
    "Kami tidak dapat menghantar kod.",
    "குறியீட்டை அனுப்ப முடியவில்லை."
  ],
  "No connection. Check your signal and try again.": [
    "没有网络连接。请检查信号并重试。",
    "Tiada sambungan. Semak isyarat dan cuba lagi.",
    "இணைப்பு இல்லை. சமிக்ஞையைச் சரிபார்த்து மீண்டும் முயலவும்."
  ],
  "That code is not right.": [
    "验证码不正确。",
    "Kod itu tidak betul.",
    "அந்தக் குறியீடு தவறானது."
  ],
  "Your mobile number": [
    "您的手机号码",
    "Nombor telefon bimbit anda",
    "உங்கள் கைப்பேசி எண்"
  ],
  "The number your endoscopy hospital/clinic has on file.": [
    "内镜医院/诊所记录的号码。",
    "Nombor dalam rekod hospital/klinik endoskopi anda.",
    "எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கில் பதிவுசெய்த எண்."
  ],
  "Sending…": [
    "正在发送…",
    "Menghantar…",
    "அனுப்புகிறது…"
  ],
  "Send me a code": [
    "发送验证码给我",
    "Hantar kod kepada saya",
    "எனக்குக் குறியீடு அனுப்பு"
  ],
  "We will text you a 6-digit code. Standard message rates apply.": [
    "我们将通过短信发送 6 位验证码。短信按标准资费收取。",
    "Kami akan menghantar kod 6 digit melalui SMS. Kadar mesej standard dikenakan.",
    "6 இலக்கக் குறியீட்டைக் குறுஞ்செய்தியாக அனுப்புவோம். வழக்கமான செய்திக் கட்டணங்கள் பொருந்தும்."
  ],
  "Demo mode.": [
    "演示模式。",
    "Mod demo.",
    "செயல்விளக்க முறை."
  ],
  "Demo numbers.": [
    "演示号码。",
    "Nombor demo.",
    "செயல்விளக்க எண்கள்."
  ],
  "No text message is sent — your code is shown on the next screen.": [
    "不会发送短信，验证码将显示在下一页。",
    "Tiada SMS dihantar — kod anda dipaparkan pada skrin seterusnya.",
    "குறுஞ்செய்தி அனுப்பப்படாது — அடுத்த திரையில் குறியீடு காட்டப்படும்."
  ],
  "These numbers skip the text message and show their code on the next screen. Any other number gets a real text.": [
    "这些号码不会收到短信，验证码将显示在下一页。其他号码会收到真实短信。",
    "Nombor ini tidak menerima SMS dan kod dipaparkan pada skrin seterusnya. Nombor lain menerima SMS sebenar.",
    "இந்த எண்களுக்கு குறுஞ்செய்தி அனுப்பாமல் அடுத்த திரையில் குறியீடு காட்டப்படும். மற்ற எண்களுக்கு உண்மையான குறுஞ்செய்தி வரும்."
  ],
  "Try": [
    "试用",
    "Cuba",
    "முயலவும்"
  ],
  "Demo number, so no text was sent.": [
    "这是演示号码，因此未发送短信。",
    "Nombor demo, jadi tiada SMS dihantar.",
    "செயல்விளக்க எண் என்பதால் குறுஞ்செய்தி அனுப்பப்படவில்லை."
  ],
  "Your code is": [
    "您的验证码是",
    "Kod anda ialah",
    "உங்கள் குறியீடு"
  ],
  "Enter your code": [
    "输入验证码",
    "Masukkan kod anda",
    "உங்கள் குறியீட்டை உள்ளிடவும்"
  ],
  "We sent a 6-digit code to the number ending {0}.": [
    "我们已向尾号为 {0} 的号码发送 6 位验证码。",
    "Kami menghantar kod 6 digit ke nombor berakhir dengan {0}.",
    "{0} என்று முடியும் எண்ணுக்கு 6 இலக்கக் குறியீட்டை அனுப்பியுள்ளோம்."
  ],
  "We sent you a 6-digit code.": [
    "我们已向您发送 6 位验证码。",
    "Kami menghantar kod 6 digit kepada anda.",
    "உங்களுக்கு 6 இலக்கக் குறியீட்டை அனுப்பியுள்ளோம்."
  ],
  "Checking…": [
    "正在验证…",
    "Menyemak…",
    "சரிபார்க்கிறது…"
  ],
  "Send a new code in {0}s": [
    "{0} 秒后可重新发送验证码",
    "Hantar kod baharu dalam {0}s",
    "{0} விநாடிகளில் புதிய குறியீடு அனுப்பு"
  ],
  "Send a new code": [
    "重新发送验证码",
    "Hantar kod baharu",
    "புதிய குறியீடு அனுப்பு"
  ],
  "Use a different number": [
    "使用其他号码",
    "Gunakan nombor lain",
    "வேறு எண்ணைப் பயன்படுத்து"
  ],
  "Sign in — Colonaid": [
    "登录 — Colonaid",
    "Log masuk — Colonaid",
    "உள்நுழை — Colonaid"
  ],
  "Your colonoscopy preparation": [
    "您的结肠镜检查准备",
    "Persediaan kolonoskopi anda",
    "உங்கள் பெருங்குடல் நோக்கிப் பரிசோதனைத் தயாரிப்பு"
  ],
  "Sign in with the mobile number your endoscopy hospital/clinic has on file.": [
    "请使用内镜医院/诊所记录的手机号码登录。",
    "Log masuk dengan nombor telefon bimbit dalam rekod hospital/klinik endoskopi anda.",
    "எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கில் பதிவுசெய்த கைப்பேசி எண்ணில் உள்நுழையவும்."
  ],
  "This app supports your preparation. It does not replace your care team. In an emergency, call 995.": [
    "本应用协助您准备，不能替代医护团队。紧急情况请拨打 995。",
    "Aplikasi ini menyokong persediaan anda, bukan menggantikan pasukan penjagaan. Dalam kecemasan, hubungi 995.",
    "இந்தச் செயலி தயாரிப்புக்கு உதவும்; மருத்துவக் குழுவிற்கு மாற்றாகாது. அவசரநிலையில் 995-ஐ அழைக்கவும்."
  ],
  "Before you start — Colonaid": [
    "开始之前 — Colonaid",
    "Sebelum bermula — Colonaid",
    "தொடங்கும் முன் — Colonaid"
  ],
  "Colonaid — QR code for printing": [
    "Colonaid — 可打印二维码",
    "Colonaid — kod QR untuk dicetak",
    "Colonaid — அச்சிடுவதற்கான QR குறியீடு"
  ],
  "Scan this with your phone camera. Sign in with the mobile number the endoscopy hospital/clinic has on file.": [
    "用手机相机扫描。使用内镜医院/诊所记录的手机号码登录。",
    "Imbas dengan kamera telefon. Log masuk dengan nombor telefon bimbit dalam rekod hospital/klinik endoskopi.",
    "கைப்பேசி கேமராவால் ஸ்கேன் செய்யவும். எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கில் பதிவுசெய்த கைப்பேசி எண்ணில் உள்நுழையவும்."
  ],
  "Sign out — Colonaid": [
    "退出 — Colonaid",
    "Log keluar — Colonaid",
    "வெளியேறு — Colonaid"
  ],
  "Colonaid — your colonoscopy preparation": [
    "Colonaid — 您的结肠镜准备",
    "Colonaid — persediaan kolonoskopi anda",
    "Colonaid — உங்கள் பெருங்குடல் நோக்கிப் பரிசோதனைத் தயாரிப்பு"
  ],
  "Your appointment, what to do and when, and how your preparation is going. From your endoscopy hospital/clinic.": [
    "您的预约、各项准备的时间安排及准备进展。来自您的内镜医院/诊所。",
    "Janji temu, apa perlu dibuat dan bila, serta kemajuan persediaan anda. Daripada hospital/klinik endoskopi anda.",
    "உங்கள் முன்பதிவு, எப்போது என்ன செய்ய வேண்டும், தயாரிப்பு முன்னேற்றம். உங்கள் எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கிலிருந்து."
  ],
  "Today is the day": [
    "今天是检查日",
    "Hari ini hari prosedur",
    "இன்றுதான் பரிசோதனை நாள்"
  ],
  "Tonight is the prep": [
    "今晚开始清肠准备",
    "Malam ini persediaannya",
    "இன்றிரவு தயாரிப்பு"
  ],
  "Tomorrow you start the prep": [
    "明天开始准备",
    "Esok anda mula membuat persediaan",
    "நாளை தயாரிப்பைத் தொடங்குகிறீர்கள்"
  ],
  "Your procedure has passed": [
    "您的检查日期已过",
    "Tarikh prosedur anda telah berlalu",
    "உங்கள் பரிசோதனைத் தேதி கடந்துவிட்டது"
  ],
  "{0} days to go": [
    "还有 {0} 天",
    "{0} hari lagi",
    "இன்னும் {0} நாட்கள்"
  ],
  "{0} weeks to go": [
    "还有 {0} 周",
    "{0} minggu lagi",
    "இன்னும் {0} வாரங்கள்"
  ],
  "{0} months to go": [
    "还有 {0} 个月",
    "{0} bulan lagi",
    "இன்னும் {0} மாதங்கள்"
  ],
  "Waiting": [
    "等待中",
    "Menunggu",
    "காத்திருக்கிறது"
  ],
  "Nothing to do yet. We will tell you when to start, so you can put the sheet away.": [
    "目前无需准备。到开始时我们会提醒您，暂时可以收起说明单。",
    "Belum perlu buat apa-apa. Kami akan beritahu bila hendak bermula, jadi simpan dahulu helaian anda.",
    "இப்போது எதுவும் செய்யத் தேவையில்லை. எப்போது தொடங்க வேண்டும் என்று தெரிவிப்போம்; தாளை இப்போதைக்கு வைத்துவிடலாம்."
  ],
  "The week before": [
    "检查前一周",
    "Seminggu sebelum",
    "முந்தைய வாரம்"
  ],
  "Arrange your escort, check your medicines, collect the preparation.": [
    "安排陪同人员、核对药物，并领取清肠药。",
    "Aturkan pengiring, semak ubat, ambil ubat persediaan.",
    "உடன் வருபவரை ஏற்பாடு செய்து, மருந்துகளைச் சரிபார்த்து, தயாரிப்பு மருந்தைப் பெற்றுக்கொள்ளவும்."
  ],
  "Diet days": [
    "饮食准备日",
    "Hari diet",
    "உணவுமுறை நாட்கள்"
  ],
  "Low-residue meals only. Clarify dishes you are unsure about in the Ask tab.": [
    "只吃低渣餐食。对不确定的菜肴，请在「提问」页面咨询。",
    "Makan rendah sisa sahaja. Dapatkan penjelasan tentang hidangan yang anda kurang pasti dalam tab Tanya.",
    "குறைந்த சக்கை உணவு மட்டும். சந்தேகமுள்ள உணவுகளைப் பற்றி கேள்விகள் தாவலில் தெளிவுபடுத்திக் கொள்ளவும்."
  ],
  "The purge night": [
    "清肠之夜",
    "Malam pencucian usus",
    "குடல் சுத்திகரிப்பு இரவு"
  ],
  "Finish the full volume, at the times given. This is what decides the outcome.": [
    "按指定时间喝完全部用量。这是准备效果的关键。",
    "Habiskan jumlah penuh pada masa ditetapkan. Inilah yang menentukan hasilnya.",
    "குறிப்பிட்ட நேரங்களில் முழு அளவையும் முடிக்கவும். இதுவே முடிவுக்கு முக்கியம்."
  ],
  "Procedure day": [
    "检查日",
    "Hari prosedur",
    "பரிசோதனை நாள்"
  ],
  "Nothing by mouth. Bring your prep summary to admission.": [
    "禁食禁饮。入院时请携带准备摘要。",
    "Jangan makan atau minum. Bawa ringkasan persediaan semasa kemasukan.",
    "எதையும் உண்ணவோ குடிக்கவோ வேண்டாம். சேர்க்கையின்போது தயாரிப்புச் சுருக்கத்தைக் கொண்டுவரவும்."
  ],
  "Afterwards": [
    "检查之后",
    "Selepas prosedur",
    "பரிசோதனைக்குப் பிறகு"
  ],
  "Your procedure has passed. Your next one will appear here when it is booked.": [
    "您的检查日期已过。下次检查预约后会显示在此处。",
    "Prosedur anda telah berlalu. Prosedur seterusnya akan dipaparkan selepas ditempah.",
    "உங்கள் பரிசோதனைத் தேதி கடந்துவிட்டது. அடுத்த பரிசோதனை முன்பதிவு செய்யப்பட்டதும் இங்கே தோன்றும்."
  ],
  "Check which medicines to hold": [
    "确认需要暂停的药物",
    "Semak ubat yang perlu dihentikan",
    "நிறுத்த வேண்டிய மருந்துகளைச் சரிபார்"
  ],
  "Iron tablets and some blood thinners are usually stopped before a scope. The hospital/clinic confirms which, and when.": [
    "检查前通常需暂停铁剂及某些抗凝血药。由医院/诊所确认哪些药物需要停、何时停。",
    "Tablet zat besi dan sesetengah pencair darah biasanya dihentikan sebelum skop. Hospital/klinik mengesahkan yang mana dan bila.",
    "பரிசோதனைக்கு முன் இரும்பு மாத்திரைகளும் சில இரத்தம் உறைவதைத் தடுக்கும் மருந்துகளும் பொதுவாக நிறுத்தப்படும். எவை, எப்போது என்பதை மருத்துவமனை/கிளினிக் உறுதிசெய்யும்."
  ],
  "Arrange someone to take you home": [
    "安排接您回家的人",
    "Aturkan seseorang membawa anda pulang",
    "வீட்டிற்கு அழைத்துச் செல்ல ஒருவரை ஏற்பாடு செய்"
  ],
  "Collect the bowel preparation": [
    "领取清肠药",
    "Ambil ubat pencuci usus",
    "குடல் சுத்திகரிப்பு மருந்தைப் பெற்றுக்கொள்"
  ],
  "Low-residue meals only": [
    "只吃低渣餐食",
    "Makanan rendah sisa sahaja",
    "குறைந்த சக்கை உணவு மட்டும்"
  ],
  "No skins, seeds, nuts or wholegrains.": [
    "不吃果皮、种子、坚果或全谷物。",
    "Tiada kulit, biji, kekacang atau bijirin penuh.",
    "தோல்கள், விதைகள், கொட்டைகள் அல்லது முழுத் தானியங்கள் வேண்டாம்."
  ],
  "Drink through the day": [
    "全天补充水分",
    "Minum sepanjang hari",
    "நாள் முழுவதும் குடிக்கவும்"
  ],
  "Aim for 8 glasses.": [
    "目标为 8 杯。",
    "Sasarkan 8 gelas.",
    "8 குவளைகளை இலக்காகக் கொள்ளவும்."
  ],
  "First dose of the preparation": [
    "第一剂清肠药",
    "Dos pertama persediaan",
    "முதல் வேளை தயாரிப்பு மருந்து"
  ],
  "Finish the whole volume. Keep drinking clear fluid alongside it.": [
    "喝完全部用量，同时继续饮用清流质。",
    "Habiskan jumlah penuh. Terus minum cecair jernih bersamanya.",
    "முழு அளவையும் முடிக்கவும். அதனுடன் தெளிந்த திரவங்களையும் தொடர்ந்து குடிக்கவும்."
  ],
  "Clear fluid after the first dose": [
    "第一剂后饮用清流质",
    "Cecair jernih selepas dos pertama",
    "முதல் வேளைக்குப் பிறகு தெளிந்த திரவம்"
  ],
  "Second dose": [
    "第二剂",
    "Dos kedua",
    "இரண்டாம் வேளை"
  ],
  "The second dose of purgative is what clears the right side of the colon. It is the one most often skipped.": [
    "第二剂清肠药能清洁结肠右侧，也是最容易被漏服的一剂。",
    "Dos kedua ubat pencuci usus membersihkan bahagian kanan kolon. Dos inilah yang paling kerap terlepas.",
    "குடல் சுத்திகரிப்பு மருந்தின் இரண்டாம் வேளை பெருங்குடலின் வலப்பக்கத்தைச் சுத்தம் செய்கிறது. இதுவே அதிகம் தவறவிடப்படுகிறது."
  ],
  "Nothing by mouth": [
    "禁食禁饮",
    "Jangan makan atau minum",
    "எதையும் உண்ணவோ குடிக்கவோ வேண்டாம்"
  ],
  "Show your prep summary at admission": [
    "入院时出示准备摘要",
    "Tunjukkan ringkasan persediaan semasa kemasukan",
    "சேர்க்கையின்போது தயாரிப்புச் சுருக்கத்தைக் காட்டு"
  ],
  "First dose": [
    "第一剂",
    "Dos pertama",
    "முதல் வேளை"
  ],
  "This is the one that clears the right side of the colon, and the one most often skipped.": [
    "这一剂清洁结肠右侧，也是最容易被漏服的一剂。",
    "Dos ini membersihkan bahagian kanan kolon dan paling kerap terlepas.",
    "இந்த வேளை பெருங்குடலின் வலப்பக்கத்தைச் சுத்தம் செய்கிறது; இதுவே அதிகம் தவறவிடப்படுகிறது."
  ],
  "Prep timing": [
    "清肠药时间",
    "Masa persediaan",
    "தயாரிப்பு நேரம்"
  ],
  "Bowel output": [
    "排便情况",
    "Najis",
    "மலத்தின் நிலை"
  ],
  "{0} not recorded": [
    "{0} 未记录",
    "{0} belum direkodkan",
    "{0} பதிவு செய்யப்படவில்லை"
  ],
  "{0} below target": [
    "{0} 低于目标",
    "{0} di bawah sasaran",
    "{0} இலக்கிற்குக் கீழே உள்ளது"
  ],
  "No prep data recorded": [
    "尚无准备记录",
    "Tiada data persediaan direkodkan",
    "தயாரிப்பு விவரம் பதிவு செய்யப்படவில்லை"
  ],
  "Your prep is on track. Come in as planned.": [
    "您的准备进展良好，请按计划前来。",
    "Persediaan anda berjalan lancar. Datang seperti dirancang.",
    "உங்கள் தயாரிப்பு சரியாக உள்ளது. திட்டமிட்டபடி வரவும்."
  ],
  "Something in your prep is worth a check. Bring this summary with you and mention it at admission.": [
    "您的准备有些地方需要确认。请带上此摘要并在入院时告知团队。",
    "Ada perkara dalam persediaan anda yang perlu disemak. Bawa ringkasan ini dan maklumkan semasa kemasukan.",
    "உங்கள் தயாரிப்பில் சிலவற்றைச் சரிபார்க்க வேண்டும். இந்தச் சுருக்கத்தைக் கொண்டுவந்து சேர்க்கையின்போது தெரிவிக்கவும்."
  ],
  "Please call the endoscopy hospital/clinic before you travel. Do not take any extra preparation.": [
    "出发前请致电内镜医院/诊所。不要额外服用清肠药。",
    "Hubungi hospital/klinik endoskopi sebelum bertolak. Jangan ambil persediaan tambahan.",
    "புறப்படும் முன் எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும். கூடுதல் தயாரிப்பு மருந்து எடுக்க வேண்டாம்."
  ],
  "On track": [
    "进展良好",
    "Mengikut rancangan",
    "சரியான பாதையில்"
  ],
  "Worth a check": [
    "需要确认",
    "Perlu disemak",
    "சரிபார்க்க வேண்டும்"
  ],
  "Solid": [
    "固体",
    "Pejal",
    "திடமானது"
  ],
  "Formed stool. The preparation has not started working yet.": [
    "成形粪便，清肠药尚未起效。",
    "Najis berbentuk. Persediaan belum mula berkesan.",
    "வடிவமுள்ள மலம். தயாரிப்பு இன்னும் வேலை செய்யத் தொடங்கவில்லை."
  ],
  "Mostly solid": [
    "大部分为固体",
    "Kebanyakannya pejal",
    "பெரும்பாலும் திடமானது"
  ],
  "Still formed, some liquid. Keep going with the fluids.": [
    "仍有成形粪便，伴少量液体。继续补充液体。",
    "Masih berbentuk, sedikit cecair. Teruskan minum cecair.",
    "இன்னும் வடிவமுள்ளது, சிறிது திரவத்துடன். திரவங்களைத் தொடர்ந்து குடிக்கவும்."
  ],
  "Cloudy liquid": [
    "浑浊液体",
    "Cecair keruh",
    "கலங்கலான திரவம்"
  ],
  "Liquid with solid pieces. It is starting to work.": [
    "液体中有固体颗粒，开始起效。",
    "Cecair dengan ketulan pejal. Ia mula berkesan.",
    "திடத் துண்டுகளுடன் திரவம். வேலை செய்யத் தொடங்குகிறது."
  ],
  "Light and cloudy": [
    "浅色但浑浊",
    "Cerah dan keruh",
    "வெளிர்ந்தும் கலங்கலாகவும்"
  ],
  "Mostly clear liquid with some cloudiness. This is close.": [
    "大致清澈的液体，略浑浊。已接近目标。",
    "Kebanyakannya cecair jernih dengan sedikit kekeruhan. Hampir mencapai sasaran.",
    "சிறிது கலங்கலுடன் பெரும்பாலும் தெளிவான திரவம். இலக்கை நெருங்குகிறது."
  ],
  "Clear": [
    "清澈",
    "Jernih",
    "தெளிவானது"
  ],
  "Clear or pale yellow liquid. This is what the team is looking for.": [
    "透明或淡黄色液体，这是团队希望看到的。",
    "Cecair jernih atau kuning pucat. Inilah yang diharapkan pasukan.",
    "தெளிவான அல்லது வெளிர் மஞ்சள் திரவம். மருத்துவக் குழு எதிர்பார்ப்பது இதுவே."
  ],
  "Stuck to it": [
    "完全遵守",
    "Ikut sepenuhnya",
    "முழுமையாகப் பின்பற்றினேன்"
  ],
  "Mostly": [
    "大致遵守",
    "Kebanyakannya",
    "பெரும்பாலும்"
  ],
  "Slipped": [
    "未能遵守",
    "Tidak mengikut",
    "தவறிவிட்டேன்"
  ],
  "Use my dose and timing records": [
    "使用我的剂量和时间记录",
    "Gunakan rekod dos dan masa saya",
    "என் வேளை மற்றும் நேரப் பதிவுகளைப் பயன்படுத்து"
  ],
  "I am behind schedule but still completing the prep": [
    "我落后于时间表，但仍在完成准备",
    "Saya lewat daripada jadual tetapi masih melengkapkan persediaan",
    "அட்டவணையைவிடத் தாமதமாக இருந்தாலும் தயாரிப்பைத் தொடர்கிறேன்"
  ],
  "I took the full preparation, but the timing was off": [
    "我已服用全部清肠药，但时间不符",
    "Saya mengambil persediaan penuh tetapi masanya berbeza",
    "முழுத் தயாரிப்பு மருந்தையும் எடுத்தேன், ஆனால் நேரம் மாறியது"
  ],
  "I missed a dose or stopped without completing it": [
    "我漏服了一剂或未完成就停止了",
    "Saya terlepas dos atau berhenti sebelum selesai",
    "ஒரு வேளையைத் தவறவிட்டேன் அல்லது முடிக்காமல் நிறுத்தினேன்"
  ],
  "Your morning stool check and completed, on-time preparation are on track. Follow the final steps in your hospital/clinic’s instructions.": [
    "早晨排便检查及按时完成的准备显示进展良好。请遵循医院/诊所说明中的最后步骤。",
    "Pemeriksaan najis pagi dan persediaan lengkap tepat pada masanya mengikut rancangan. Ikut langkah akhir dalam arahan hospital/klinik anda.",
    "காலை மலச் சரிபார்ப்பும் சரியான நேரத்தில் முடித்த தயாரிப்பும் சரியாக உள்ளன. மருத்துவமனை/கிளினிக் அறிவுறுத்தல்களில் உள்ள இறுதிப் படிகளைப் பின்பற்றவும்."
  ],
  "A little more to check": [
    "还有一些需要确认",
    "Ada lagi untuk disemak",
    "இன்னும் சிறிது சரிபார்க்க வேண்டும்"
  ],
  "Review the items below. Follow your prescribed preparation and fluid cut-off instructions, and check your latest stool again on the morning of your procedure.": [
    "请查看以下项目，遵循医嘱中的准备及停止饮水时间，并在检查当天早晨再次查看最新粪便。",
    "Semak perkara di bawah. Ikut arahan persediaan dan waktu berhenti minum yang ditetapkan, dan periksa najis terkini sekali lagi pada pagi prosedur.",
    "கீழே உள்ளவற்றைப் பாருங்கள். பரிந்துரைத்த தயாரிப்பு மற்றும் திரவம் நிறுத்தும் நேர அறிவுறுத்தல்களைப் பின்பற்றி, பரிசோதனைக் காலையில் சமீபத்திய மலத்தை மீண்டும் சரிபார்க்கவும்."
  ],
  "Preparation may not be complete": [
    "准备可能尚未完成",
    "Persediaan mungkin belum lengkap",
    "தயாரிப்பு இன்னும் முடியாமல் இருக்கலாம்"
  ],
  "Please contact your endoscopy team for advice. They can review your preparation with you.": [
    "请联系内镜团队寻求建议。他们可与您一起核对准备情况。",
    "Hubungi pasukan endoskopi untuk nasihat. Mereka boleh menyemak persediaan bersama anda.",
    "ஆலோசனைக்கு எண்டோஸ்கோபி குழுவைத் தொடர்புகொள்ளவும். அவர்கள் உங்களுடன் தயாரிப்பைச் சரிபார்க்கலாம்."
  ],
  "The colour looks different": [
    "颜色变了",
    "Warnanya berbeza",
    "நிறம் மாறியுள்ளது"
  ],
  "I have been to the toilet many times": [
    "我已多次去厕所",
    "Saya sudah ke tandas banyak kali",
    "பலமுறை கழிப்பறைக்குச் சென்றேன்"
  ],
  "The latest output looks watery and clear": [
    "最新排出物呈水样且清澈",
    "Najis terkini kelihatan berair dan jernih",
    "சமீபத்திய கழிவு நீர்த்தும் தெளிவாகவும் உள்ளது"
  ],
  "I am not sure what to look for": [
    "我不知道该看什么",
    "Saya tidak pasti apa yang perlu diperhatikan",
    "எதைக் கவனிக்க வேண்டும் என்று தெரியவில்லை"
  ],
  "Pale yellow": [
    "淡黄色",
    "Kuning pucat",
    "வெளிர் மஞ்சள்"
  ],
  "Yellow-green": [
    "黄绿色",
    "Kuning kehijauan",
    "மஞ்சள்-பச்சை"
  ],
  "Light orange": [
    "浅橙色",
    "Jingga muda",
    "வெளிர் ஆரஞ்சு"
  ],
  "Brown": [
    "棕色",
    "Coklat",
    "பழுப்பு"
  ],
  "Very dark or black": [
    "很深色或黑色",
    "Sangat gelap atau hitam",
    "மிகவும் கருமை அல்லது கருப்பு"
  ],
  "Red or blood-like": [
    "红色或像血",
    "Merah atau seperti darah",
    "சிவப்பு அல்லது இரத்தம் போன்றது"
  ],
  "Almost colourless": [
    "几乎无色",
    "Hampir tidak berwarna",
    "கிட்டத்தட்ட நிறமற்றது"
  ],
  "I cannot tell": [
    "我无法判断",
    "Saya tidak dapat pastikan",
    "என்னால் அறிய முடியவில்லை"
  ],
  "Formed or mostly solid": [
    "成形或大部分为固体",
    "Berbentuk atau kebanyakannya pejal",
    "வடிவமுள்ள அல்லது பெரும்பாலும் திடமானது"
  ],
  "Liquid with solid pieces": [
    "液体中有固体颗粒",
    "Cecair dengan ketulan pejal",
    "திடத் துண்டுகளுடன் திரவம்"
  ],
  "Mostly liquid, with a few small particles": [
    "大部分为液体，有少量小颗粒",
    "Kebanyakannya cecair dengan sedikit zarah kecil",
    "சில சிறிய துகள்களுடன் பெரும்பாலும் திரவம்"
  ],
  "Watery, with no solid pieces": [
    "水样，没有固体颗粒",
    "Berair, tanpa ketulan pejal",
    "திடத் துண்டுகளில்லாமல் நீர்த்தது"
  ],
  "See-through — I can see through the liquid": [
    "透明 — 能透过液体看清",
    "Jernih — saya boleh melihat menembusi cecair",
    "தெளிவானது — திரவத்தின் ஊடாகப் பார்க்க முடிகிறது"
  ],
  "Cloudy — I cannot see through it clearly": [
    "浑浊 — 无法透过液体看清",
    "Keruh — saya tidak dapat melihat menembusinya dengan jelas",
    "கலங்கலானது — அதன் ஊடாகத் தெளிவாகப் பார்க்க முடியவில்லை"
  ],
  "Colour is only one clue. Let’s check whether the latest output is watery and see-through.": [
    "颜色只是线索之一。我们再看看最新排出物是否呈水样且透明。",
    "Warna hanyalah satu petunjuk. Mari periksa sama ada najis terkini berair dan boleh dilihat menembusinya.",
    "நிறம் ஒரு குறிப்பு மட்டுமே. சமீபத்திய கழிவு நீர்த்தும் ஊடாகப் பார்க்கக்கூடியதாகவும் உள்ளதா எனப் பார்ப்போம்."
  ],
  "Those are useful things to notice. Let’s check the latest output, including whether any pieces remain.": [
    "这些观察很有帮助。再看看最新排出物，包括是否还有颗粒。",
    "Itu pemerhatian yang berguna. Mari periksa najis terkini, termasuk sama ada masih ada ketulan.",
    "இவை பயனுள்ள கவனிப்புகள். துண்டுகள் மீதமுள்ளனவா என்பது உட்பட சமீபத்திய கழிவைப் பார்ப்போம்."
  ],
  "We will check one thing at a time: colour, solid pieces, then whether you can see through the liquid.": [
    "我们逐项查看：颜色、固体颗粒，然后看液体是否透明。",
    "Kita periksa satu demi satu: warna, ketulan pejal, kemudian sama ada cecair boleh dilihat menembusinya.",
    "ஒவ்வொன்றாகப் பார்ப்போம்: நிறம், திடத் துண்டுகள், பிறகு திரவத்தின் ஊடாகப் பார்க்க முடிகிறதா என்பது."
  ],
  "Check this with your clinical team": [
    "请向医护团队确认",
    "Semak dengan pasukan klinikal anda",
    "மருத்துவக் குழுவுடன் இதைச் சரிபார்க்கவும்"
  ],
  "Do not assume very dark, black or red output is caused by food or iron. Contact your hospital/clinic for advice, even if it is watery or you have been many times.": [
    "不要以为很深色、黑色或红色排出物只是由食物或铁剂造成。即使呈水样或已多次排便，也请联系医院/诊所。",
    "Jangan anggap najis sangat gelap, hitam atau merah disebabkan makanan atau zat besi. Hubungi hospital/klinik walaupun berair atau anda telah ke tandas banyak kali.",
    "மிகவும் கருமையான, கருப்பு அல்லது சிவப்புக் கழிவு உணவு அல்லது இரும்பால் ஏற்பட்டது எனக் கருத வேண்டாம். நீர்த்திருந்தாலும் பலமுறை சென்றிருந்தாலும் மருத்துவமனை/கிளினிக்கைத் தொடர்புகொள்ளவும்."
  ],
  "It is okay to be unsure": [
    "不确定也没关系",
    "Tidak mengapa jika tidak pasti",
    "உறுதியில்லாவிட்டாலும் பரவாயில்லை"
  ],
  "On your next trip, look for solid pieces and whether you can see through the liquid. If you still cannot tell, ask your hospital/clinic.": [
    "下次排便时，注意是否有固体颗粒，以及能否透过液体看清。若仍无法判断，请询问医院/诊所。",
    "Pada lawatan seterusnya, lihat jika ada ketulan pejal dan sama ada cecair boleh dilihat menembusinya. Jika masih tidak pasti, tanya hospital/klinik.",
    "அடுத்த முறை திடத் துண்டுகள் உள்ளனவா, திரவத்தின் ஊடாகப் பார்க்க முடிகிறதா எனக் கவனிக்கவும். இன்னும் தெரியாவிட்டால் மருத்துவமனை/கிளினிக்கைக் கேட்கவும்."
  ],
  "You are still seeing solid material": [
    "您仍看到固体物质",
    "Anda masih melihat bahan pejal",
    "இன்னும் திடப் பொருட்களைப் பார்க்கிறீர்கள்"
  ],
  "The latest output is not yet watery and clear. Follow your prescribed plan. If you have finished it and still see solid material, contact your hospital/clinic.": [
    "最新排出物尚未呈水样且清澈。请遵循医嘱计划。若已完成却仍见固体物质，请联系医院/诊所。",
    "Najis terkini belum berair dan jernih. Ikut pelan preskripsi. Jika sudah selesai tetapi masih ada bahan pejal, hubungi hospital/klinik.",
    "சமீபத்திய கழிவு இன்னும் நீர்த்தும் தெளிவாகவும் இல்லை. பரிந்துரைத்த திட்டத்தைப் பின்பற்றவும். முடித்தும் திடப் பொருட்கள் இருந்தால் மருத்துவமனை/கிளினிக்கைத் தொடர்புகொள்ளவும்."
  ],
  "Watery, but still cloudy": [
    "呈水样，但仍浑浊",
    "Berair tetapi masih keruh",
    "நீர்த்துள்ளது, ஆனால் இன்னும் கலங்கலாக உள்ளது"
  ],
  "Watery and see-through are different. Cloudy liquid can still contain material. Follow your prescribed plan; if you have finished it and the output remains cloudy, contact your hospital/clinic.": [
    "水样与透明不同。浑浊液体仍可含有残留物。请遵循医嘱；若已完成准备但仍浑浊，请联系医院/诊所。",
    "Berair dan jernih adalah berbeza. Cecair keruh masih boleh mengandungi bahan. Ikut pelan preskripsi; jika sudah selesai tetapi masih keruh, hubungi hospital/klinik.",
    "நீர்த்ததும் ஊடாகத் தெரிவதும் வேறுபடும். கலங்கலான திரவத்தில் பொருட்கள் இருக்கலாம். பரிந்துரைத்த திட்டத்தைப் பின்பற்றவும்; முடித்தும் கலங்கலாக இருந்தால் மருத்துவமனை/கிளினிக்கைத் தொடர்புகொள்ளவும்."
  ],
  "You described watery, see-through output": [
    "您描述的是水样、透明的排出物",
    "Anda menerangkan najis berair dan jernih",
    "நீர்த்த, ஊடாகத் தெரியும் கழிவை விவரித்துள்ளீர்கள்"
  ],
  "That describes clarity, not confirmation that you are ready. Complete your preparation as prescribed and follow your hospital/clinic’s instructions.": [
    "这说明清澈程度，不代表已确认准备就绪。请按医嘱完成准备，遵循医院/诊所的说明。",
    "Ini menerangkan kejernihan, bukan pengesahan kesediaan. Lengkapkan persediaan seperti dipreskripsikan dan ikut arahan hospital/klinik.",
    "இது தெளிவை விவரிக்கிறது; தயாராகிவிட்டதை உறுதிசெய்யவில்லை. பரிந்துரைத்தபடி தயாரிப்பை முடித்து மருத்துவமனை/கிளினிக் அறிவுறுத்தல்களைப் பின்பற்றவும்."
  ],
  "Medicine details: {0}": [
    "药物详情：{0}",
    "Butiran ubat: {0}",
    "மருந்து விவரங்கள்: {0}"
  ],
  "Do not take from {0} at {1}.": [
    "从 {0} {1} 起暂停服用。",
    "Jangan ambil mulai {0} pada {1}.",
    "{0} அன்று {1} முதல் எடுக்க வேண்டாம்."
  ],
  "Hospital/clinic instruction: {0}": [
    "医院/诊所说明：{0}",
    "Arahan hospital/klinik: {0}",
    "மருத்துவமனை/கிளினிக் அறிவுறுத்தல்: {0}"
  ],
  "Written timing: {0}": [
    "医嘱时间：{0}",
    "Masa bertulis: {0}",
    "எழுதப்பட்ட நேரம்: {0}"
  ],
  "Daily reminder: {0}. No restart date is implied.": [
    "每日提醒：{0}。这不表示恢复用药日期。",
    "Peringatan harian: {0}. Ini tidak menetapkan tarikh mula semula.",
    "தினசரி நினைவூட்டல்: {0}. மீண்டும் தொடங்கும் தேதியை இது குறிக்காது."
  ],
  "Time to take: {0}": [
    "服用时间：{0}",
    "Masa mengambil: {0}",
    "எடுக்கும் நேரம்: {0}"
  ],
  "Calendar reminders end on {0}; follow your hospital/clinic's instructions after that.": [
    "提醒于 {0} 结束；之后请遵循医院/诊所说明。",
    "Peringatan berakhir pada {0}; ikut arahan hospital/klinik selepas itu.",
    "நினைவூட்டல்கள் {0} அன்று முடியும்; அதன் பிறகு மருத்துவமனை/கிளினிக் அறிவுறுத்தல்களைப் பின்பற்றவும்."
  ],
  "Sign-in is unavailable right now. Please call the hospital/clinic.": [
    "暂时无法登录，请致电医院/诊所。",
    "Log masuk tidak tersedia sekarang. Hubungi hospital/klinik.",
    "இப்போது உள்நுழைய முடியவில்லை. மருத்துவமனை/கிளினிக்கை அழைக்கவும்."
  ],
  "Please wait {0}s before asking for another code.": [
    "请等待 {0} 秒后再索取验证码。",
    "Tunggu {0}s sebelum meminta kod lagi.",
    "மீண்டும் குறியீடு கேட்கும் முன் {0} விநாடிகள் காத்திருக்கவும்."
  ],
  "That does not look like a mobile number.": [
    "这似乎不是手机号码。",
    "Itu tidak kelihatan seperti nombor telefon bimbit.",
    "அது கைப்பேசி எண் போலத் தெரியவில்லை."
  ],
  "Too many codes requested. Try again in a few minutes.": [
    "请求验证码次数过多，请几分钟后再试。",
    "Terlalu banyak permintaan kod. Cuba lagi dalam beberapa minit.",
    "மிக அதிக குறியீடுகள் கோரப்பட்டன. சில நிமிடங்களில் மீண்டும் முயலவும்."
  ],
  "That number cannot receive SMS.": [
    "此号码无法接收短信。",
    "Nombor itu tidak boleh menerima SMS.",
    "இந்த எண்ணால் குறுஞ்செய்தி பெற முடியாது."
  ],
  "We could not send the code. Please try again.": [
    "未能发送验证码，请重试。",
    "Kami tidak dapat menghantar kod. Sila cuba lagi.",
    "குறியீட்டை அனுப்ப முடியவில்லை. மீண்டும் முயலவும்."
  ],
  "Enter the 6-digit code.": [
    "请输入 6 位验证码。",
    "Masukkan kod 6 digit.",
    "6 இலக்கக் குறியீட்டை உள்ளிடவும்."
  ],
  "That code has expired. Ask for a new one.": [
    "验证码已过期，请索取新的验证码。",
    "Kod telah tamat tempoh. Minta kod baharu.",
    "குறியீடு காலாவதியானது. புதிய குறியீட்டைக் கேட்கவும்."
  ],
  "Too many wrong attempts. Ask for a new code.": [
    "输入错误次数过多，请索取新的验证码。",
    "Terlalu banyak percubaan salah. Minta kod baharu.",
    "மிக அதிக தவறான முயற்சிகள். புதிய குறியீட்டைக் கேட்கவும்."
  ],
  "We could not check the code. Please try again.": [
    "未能验证验证码，请重试。",
    "Kami tidak dapat menyemak kod. Sila cuba lagi.",
    "குறியீட்டைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயலவும்."
  ],
  "of": [
    "／",
    "daripada",
    "இல்"
  ],
  "ml": [
    "毫升",
    "ml",
    "மி.லி."
  ],
  "glasses": [
    "杯",
    "gelas",
    "குவளைகள்"
  ],
  "entry": [
    "条目",
    "entri",
    "பதிவு"
  ],
  "doses": [
    "剂量",
    "dos",
    "வேளைகள்"
  ],
  "at": [
    "时间",
    "pada",
    "நேரம்"
  ],
  " · Today": [
    " · 今天",
    " · Hari ini",
    " · இன்று"
  ],
  "after midnight": [
    "午夜后",
    "selepas tengah malam",
    "நள்ளிரவுக்குப் பிறகு"
  ],
  "Choose the closest answer. We will guide you from there.": [
    "选择最符合的答案，我们会逐步引导您。",
    "Pilih jawapan paling hampir. Kami akan membimbing anda seterusnya.",
    "மிகப் பொருத்தமான பதிலைத் தேர்ந்தெடுக்கவும். அங்கிருந்து வழிகாட்டுவோம்."
  ],
  "% of the summary": [
    "% 的综合评分",
    "% daripada ringkasan",
    "% சுருக்கத்தின் பங்கு"
  ],
  "to avoid": [
    "种需避免",
    "perlu dielakkan",
    "தவிர்க்க வேண்டியவை"
  ],
  "Five stages from here to the procedure. You are in": [
    "从现在到检查共五个阶段。您目前处于",
    "Lima peringkat hingga prosedur. Anda kini dalam",
    "இங்கிருந்து பரிசோதனை வரை ஐந்து நிலைகள். நீங்கள் இருப்பது"
  ],
  "day": [
    "天",
    "hari",
    "நாள்"
  ],
  "days": [
    "天",
    "hari",
    "நாட்கள்"
  ],
  "before ·": [
    "前 ·",
    "sebelum ·",
    "முன்பு ·"
  ],
  "ml recorded": [
    "毫升已记录",
    "ml direkodkan",
    "மி.லி. பதிவு செய்யப்பட்டது"
  ],
  "Anything different from your dose records?": [
    "实际情况与剂量记录有不同吗？",
    "Ada perbezaan daripada rekod dos anda?",
    "வேளைப் பதிவுகளிலிருந்து ஏதேனும் வேறுபாடு உள்ளதா?"
  ],
  " or ": [
    " 或 ",
    " atau ",
    " அல்லது "
  ],
  ", filled in below.": [
    "，已填写在下方。",
    ", diisi di bawah.",
    ", கீழே நிரப்பப்பட்டுள்ளது."
  ],
  "green": [
    "绿色",
    "hijau",
    "பச்சை"
  ],
  "amber": [
    "琥珀色",
    "kuning ambar",
    "அம்பர்"
  ],
  "red": [
    "红色",
    "merah",
    "சிவப்பு"
  ],
  "Hello, {0}.": [
    "您好，{0}。",
    "Helo, {0}.",
    "வணக்கம், {0}."
  ],
  "Clear fluids only from now": [
    "从现在起只喝清流质",
    "Cecair jernih sahaja mulai sekarang",
    "இனி தெளிந்த திரவங்கள் மட்டும்"
  ],
  "Dose: {0}": [
    "剂量：{0}",
    "Dos: {0}",
    "அளவு: {0}"
  ],
  "Take {0}": [
    "服用 {0}",
    "Ambil {0}",
    "{0} எடுத்துக்கொள்ளவும்"
  ],
  "Do not take {0}": [
    "暂停服用 {0}",
    "Jangan ambil {0}",
    "{0} எடுக்க வேண்டாம்"
  ],
  "{0}: {1} percent": [
    "{0}：百分之 {1}",
    "{0}: {1} peratus",
    "{0}: {1} சதவீதம்"
  ],
  "Enter your mobile number.": [
    "请输入手机号码。",
    "Masukkan nombor telefon bimbit anda.",
    "உங்கள் கைப்பேசி எண்ணை உள்ளிடவும்."
  ],
  "Enter an 8-digit Singapore mobile number, or the full number with +.": [
    "请输入 8 位新加坡手机号码，或以 + 开头的完整号码。",
    "Masukkan nombor bimbit Singapura 8 digit, atau nombor penuh dengan +.",
    "8 இலக்க சிங்கப்பூர் கைப்பேசி எண்ணை அல்லது + உடன் முழு எண்ணை உள்ளிடவும்."
  ],
  "Bad request.": [
    "请求无效，请重试。",
    "Permintaan tidak sah. Sila cuba lagi.",
    "கோரிக்கை செல்லாது. மீண்டும் முயலவும்."
  ],
  "Not signed in.": [
    "尚未登录。",
    "Belum log masuk.",
    "உள்நுழையவில்லை."
  ],
  "The assistant is not switched on in this build, so I cannot answer that here.": [
    "此版本尚未启用助手，暂时无法回答。",
    "Pembantu belum diaktifkan dalam versi ini, jadi saya tidak dapat menjawab di sini.",
    "இந்தப் பதிப்பில் உதவியாளர் இயக்கப்படவில்லை; இங்கே பதிலளிக்க முடியவில்லை."
  ],
  "Please call your endoscopy hospital/clinic on {0}.": [
    "请拨打 {0} 联系内镜医院/诊所。",
    "Sila hubungi hospital/klinik endoskopi anda di {0}.",
    "{0} என்ற எண்ணில் எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும்."
  ],
  "Please call your endoscopy hospital/clinic on the number in your appointment letter.": [
    "请使用预约信上的号码致电内镜医院/诊所。",
    "Sila hubungi hospital/klinik endoskopi melalui nombor pada surat janji temu anda.",
    "முன்பதிவுக் கடிதத்தில் உள்ள எண்ணில் எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும்."
  ],
  "If you have severe pain, a hard or swollen tummy, cannot stop vomiting, or feel faint, call 995 now.": [
    "如有剧烈疼痛、腹部发硬或肿胀、持续呕吐或感到昏厥，请立即拨打 995。",
    "Jika sakit teruk, perut keras atau bengkak, muntah berterusan atau rasa hendak pitam, hubungi 995 sekarang.",
    "கடுமையான வலி, கடினமான அல்லது வீங்கிய வயிறு, நிற்காத வாந்தி அல்லது மயக்க உணர்வு இருந்தால் உடனே 995-ஐ அழைக்கவும்."
  ],
  "I am not able to answer that one safely. Please call your endoscopy hospital/clinic on the number in your appointment letter. If you have severe pain, a hard or swollen tummy, cannot stop vomiting, or feel faint, call 995 now. Do not take any extra preparation.": [
    "我无法安全地回答这个问题。请使用预约信上的号码致电内镜医院/诊所。如有剧烈疼痛、腹部发硬或肿胀、持续呕吐或感到昏厥，请立即拨打 995。不要额外服用清肠药。",
    "Saya tidak dapat menjawab soalan itu dengan selamat. Hubungi hospital/klinik endoskopi melalui nombor pada surat janji temu. Jika sakit teruk, perut keras atau bengkak, muntah berterusan atau rasa hendak pitam, hubungi 995 sekarang. Jangan ambil persediaan tambahan.",
    "அந்தக் கேள்விக்குப் பாதுகாப்பாகப் பதிலளிக்க முடியவில்லை. முன்பதிவுக் கடிதத்தில் உள்ள எண்ணில் எண்டோஸ்கோபி மருத்துவமனை/கிளினிக்கை அழைக்கவும். கடுமையான வலி, கடினமான அல்லது வீங்கிய வயிறு, நிற்காத வாந்தி அல்லது மயக்க உணர்வு இருந்தால் உடனே 995-ஐ அழைக்கவும். கூடுதல் தயாரிப்பு மருந்து எடுக்க வேண்டாம்."
  ],
  "Many toilet trips do not tell us whether the bowel is clear. Let’s look at the output from your latest trip.": [
    "多次排便不能说明肠道是否清洁。我们来看看最近一次的排出物。",
    "Kerap ke tandas tidak menentukan sama ada usus sudah bersih. Mari lihat najis pada lawatan terkini.",
    "பலமுறை கழிப்பறை சென்றது மட்டும் குடல் சுத்தமானதா என்பதைக் கூறாது. சமீபத்திய கழிவைப் பார்ப்போம்."
  ],
  "Singapore General Hospital": [
    "新加坡中央医院",
    "Hospital Besar Singapura",
    "சிங்கப்பூர் பொது மருத்துவமனை"
  ],
  "Changi General Hospital": [
    "樟宜综合医院",
    "Hospital Besar Changi",
    "சாங்கி பொது மருத்துவமனை"
  ],
  "Block 3, Level 4 — Endoscopy Centre": [
    "第3座，4楼 — 内镜中心",
    "Blok 3, Aras 4 — Pusat Endoskopi",
    "பிளாக் 3, தளம் 4 — எண்டோஸ்கோபி நிலையம்"
  ],
  "Medical Centre, Level 2": [
    "医疗中心，2楼",
    "Pusat Perubatan, Aras 2",
    "மருத்துவ நிலையம், தளம் 2"
  ],
  "{0} foods you can eat · {1} to avoid": [
    "{0} 种可食用食物 · {1} 种需避免",
    "{0} makanan boleh dimakan · {1} perlu dielakkan",
    "உண்ணக்கூடியவை {0} · தவிர்க்க வேண்டியவை {1}"
  ],
  "{0} of {1} ml": [
    "{0} / {1} 毫升",
    "{0} daripada {1} ml",
    "{1} மி.லி. அளவில் {0} மி.லி."
  ],
  "{0} / {1} glasses": [
    "{0} / {1} 杯",
    "{0} / {1} gelas",
    "{0} / {1} குவளைகள்"
  ],
  "{0} days before": [
    "{0} 天前",
    "{0} hari sebelum",
    "{0} நாட்களுக்கு முன்பு"
  ],
  "1 day before": [
    "1 天前",
    "1 hari sebelum",
    "1 நாளுக்கு முன்பு"
  ],
  "What is coming up, from today. Days already done are hidden.": [
    "从今天起即将进行的步骤。已完成的日子不再显示。",
    "Apa yang akan datang, mulai hari ini. Hari yang sudah selesai disembunyikan.",
    "இன்று முதல் வரவிருப்பவை. முடிந்த நாட்கள் மறைக்கப்பட்டுள்ளன."
  ],
  "Nothing left to do in your preparation plan.": [
    "您的准备计划中已没有需要做的事项。",
    "Tiada lagi yang perlu dilakukan dalam pelan persediaan anda.",
    "உங்கள் தயாரிப்புத் திட்டத்தில் செய்ய வேண்டியது எதுவும் இல்லை."
  ],
  "01 · Purgative schedule": [
    "01 · 泻药时间表",
    "01 · Jadual julap",
    "01 · பேதி மருந்து அட்டவணை"
  ],
  "02 · Stool check-in": [
    "02 · 粪便检查记录",
    "02 · Semakan najis",
    "02 · மலப் பரிசோதனைப் பதிவு"
  ],
  "03 · Overall bowel readiness": [
    "03 · 整体肠道准备情况",
    "03 · Kesediaan usus keseluruhan",
    "03 · ஒட்டுமொத்த குடல் தயார்நிலை"
  ],
  "Only confirm a dose after you have finished the whole volume.": [
    "请在喝完全部分量后，才确认该剂。",
    "Sahkan dos hanya selepas anda menghabiskan keseluruhan isipadu.",
    "முழு அளவையும் குடித்து முடித்த பிறகே ஒரு டோஸை உறுதிப்படுத்துங்கள்."
  ],
  "Same night, after midnight": [
    "同一晚，午夜之后",
    "Malam yang sama, selepas tengah malam",
    "அதே இரவு, நள்ளிரவுக்குப் பிறகு"
  ],
  "{0} ml": [
    "{0} 毫升",
    "{0} ml",
    "{0} மி.லி."
  ],
  "✓ Finished on time · Undo": [
    "✓ 已按时喝完 · 撤销",
    "✓ Selesai tepat pada masanya · Buat asal",
    "✓ சரியான நேரத்தில் முடிந்தது · செயல்தவிர்"
  ],
  "I finished this dose on time": [
    "我已按时喝完这一剂",
    "Saya telah menghabiskan dos ini tepat pada masanya",
    "இந்த டோஸை சரியான நேரத்தில் குடித்து முடித்தேன்"
  ],
  "Missed a dose? Do not take extra preparation to make up for it.": [
    "漏服了一剂？不要额外服用泻药来弥补。",
    "Terlepas dos? Jangan ambil persediaan tambahan untuk menggantikannya.",
    "ஒரு டோஸைத் தவறவிட்டீர்களா? அதை ஈடுசெய்ய கூடுதல் மருந்து எடுக்க வேண்டாம்."
  ],
  "Compare what you see with the pictures, and choose the closest one.": [
    "将您看到的与图片对比，选择最接近的一项。",
    "Bandingkan apa yang anda lihat dengan gambar, dan pilih yang paling hampir.",
    "நீங்கள் பார்ப்பதைப் படங்களுடன் ஒப்பிட்டு, மிக நெருக்கமானதைத் தேர்ந்தெடுங்கள்."
  ],
  "Finishing the full volume is what decides whether the scope works. If you cannot keep it down, do not take extra to make up for it.": [
    "喝完全部分量决定了肠镜检查能否顺利进行。如果您喝下后呕吐，不要额外服用来弥补。",
    "Menghabiskan keseluruhan isipadu menentukan sama ada skop berjaya. Jika anda muntah, jangan ambil tambahan untuk menggantikannya.",
    "முழு அளவையும் குடித்து முடிப்பதே பரிசோதனை வெற்றிபெறுமா என்பதைத் தீர்மானிக்கிறது. வாந்தி எடுத்தால், அதை ஈடுசெய்ய கூடுதலாக எடுக்க வேண்டாம்."
  ],
  "Ask in chat about a food you cannot find here.": [
    "如果这里找不到某种食物，请在聊天中询问。",
    "Tanya dalam sembang tentang makanan yang tiada di sini.",
    "இங்கே காணாத உணவைப் பற்றி அரட்டையில் கேளுங்கள்."
  ],
  "Do not assume very dark, black or red output is caused by food or iron, even if it is watery or you have been many times. See Overall bowel readiness in the Readiness tab for what to do.": [
    "即使排出物呈水状或您已多次如厕，也不要以为非常深色、黑色或红色的排出物是食物或铁剂引起的。请查看“准备情况”标签中的“整体肠道准备情况”了解应该怎么做。",
    "Jangan anggap najis yang sangat gelap, hitam atau merah disebabkan oleh makanan atau zat besi, walaupun ia berair atau anda sudah ke tandas berkali-kali. Lihat Kesediaan usus keseluruhan dalam tab Kesediaan untuk tindakan seterusnya.",
    "நீர்போல் இருந்தாலும் அல்லது பலமுறை கழிவறைக்குச் சென்றிருந்தாலும், மிகவும் அடர்ந்த, கருப்பு அல்லது சிவப்பு வெளியேற்றம் உணவு அல்லது இரும்புச்சத்தால் ஏற்பட்டது என்று எண்ண வேண்டாம். என்ன செய்வது என்பதற்கு தயார்நிலை தாவலில் உள்ள ஒட்டுமொத்த குடல் தயார்நிலையைப் பாருங்கள்."
  ],
  "On your next trip, look for solid pieces and whether you can see through the liquid. If you still cannot tell, record “I cannot tell”.": [
    "下次如厕时，留意是否有固体块，以及液体是否透明。如果仍无法判断，请选择“我无法判断”。",
    "Pada lawatan seterusnya, perhatikan kepingan pepejal dan sama ada anda boleh melihat menembusi cecair. Jika masih tidak pasti, pilih “Saya tidak dapat pastikan”.",
    "அடுத்த முறை, திடத் துண்டுகள் உள்ளதா, திரவத்தின் வழியே பார்க்க முடிகிறதா என்று கவனியுங்கள். இன்னும் சொல்ல முடியாவிட்டால், “என்னால் சொல்ல முடியவில்லை” என்று பதிவு செய்யுங்கள்."
  ],
  "The latest output is not yet watery and clear. Follow your prescribed plan and check again after your next trip.": [
    "最近一次的排出物还不是水状且清澈。请按照处方计划进行，并在下次如厕后再检查。",
    "Najis terkini belum berair dan jernih. Ikut pelan yang ditetapkan dan semak semula selepas lawatan seterusnya.",
    "சமீபத்திய வெளியேற்றம் இன்னும் நீர்போலவும் தெளிவாகவும் இல்லை. பரிந்துரைக்கப்பட்ட திட்டத்தைப் பின்பற்றி, அடுத்த முறைக்குப் பிறகு மீண்டும் சரிபாருங்கள்."
  ],
  "Watery and see-through are different. Cloudy liquid can still contain material. Follow your prescribed plan and check again after your next trip.": [
    "水状和透明是不同的。浑浊的液体仍可能含有残留物。请按照处方计划进行，并在下次如厕后再检查。",
    "Berair dan jernih adalah berbeza. Cecair keruh masih boleh mengandungi sisa. Ikut pelan yang ditetapkan dan semak semula selepas lawatan seterusnya.",
    "நீர்போல் இருப்பதும் தெளிவாக இருப்பதும் வேறு. கலங்கலான திரவத்தில் இன்னும் கழிவு இருக்கலாம். பரிந்துரைக்கப்பட்ட திட்டத்தைப் பின்பற்றி, அடுத்த முறைக்குப் பிறகு மீண்டும் சரிபாருங்கள்."
  ],
}
