import type { FoodTranslation } from '@/domain/diet-foods-i18n'

/**
 * Simplified Chinese (zh-Hans-SG) for the food guide.
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
export const zhFoods: FoodTranslation = {
  foods: {
    "food-2": {
        "food": "白饭"
    },
    "food-3": {
        "food": "白粥（原味）",
        "notes": "只可吃原味。素食／纯素：不可用肉汤或鱼汤煮；配料不可含蔬菜、种子或椰子。"
    },
    "food-4": {
        "food": "白面包",
        "notes": "纯素：许多面包含牛奶、鸡蛋或牛油。清真：猪油少见，但仍须查看包装标签。"
    },
    "food-5": {
        "food": "原味饼干（精制，非全谷）",
        "notes": "清真：查看标签有没有猪油或明胶。纯素：查看有没有牛奶或牛油。"
    },
    "food-6": {
        "food": "米粉（bee hoon）",
        "notes": "只吃原味。去掉蔬菜和配料。"
    },
    "food-7": {
        "food": "粿条（kway teow）",
        "notes": "只吃原味。去掉蔬菜、豆芽和辣椒。"
    },
    "food-8": {
        "food": "黄面",
        "notes": "纯素：通常含鸡蛋。医疗团队确认精制面条可以吃。"
    },
    "food-9": {
        "food": "面薄／面细（蛋面）",
        "notes": "纯素：蛋面不是纯素；面细有时不含蛋，请查看包装标签。"
    },
    "food-10": {
        "food": "蛋面",
        "notes": "SCS 名单允许。含蛋，非纯素。"
    },
    "food-11": {
        "food": "面线（mee sua）",
        "notes": "医疗团队确认精制面条可以吃。"
    },
    "food-12": {
        "food": "精制意大利面",
        "notes": "纯素：干意大利面通常不含蛋，鲜意大利面多含蛋。"
    },
    "food-13": {
        "food": "Idli（印度蒸米糕）",
        "notes": "只吃原味，不配蔬菜或含种子的椰子酸辣酱（chutney）。"
    },
    "food-14": {
        "food": "Thosai 印度煎饼（原味）",
        "notes": "只可吃原味；不可有马铃薯蔬菜马萨拉馅料。"
    },
    "food-15": {
        "food": "Putu mayam（iddiyappam，印度米粉）",
        "notes": "不可加椰丝。"
    },
    "food-16": {
        "food": "原味玉米片／米片麦片",
        "notes": "不可有水果、坚果、种子或全谷。可配牛奶（低渣日）或过滤豆浆。"
    },
    "food-17": {
        "food": "马铃薯（去皮、煮熟煮软）",
        "notes": "百汇东岸医院和医疗团队允许去皮马铃薯。SCS 严格名单不允许任何蔬菜。"
    },
    "food-18": {
        "food": "番薯／芋头（去皮、煮熟煮软）",
        "notes": "医疗团队：一般允许，有些诊所较严格。不在 SCS 和百汇东岸医院名单内。"
    },
    "food-19": {
        "food": "糙米饭／红米饭"
    },
    "food-20": {
        "food": "全麦／全谷面包和饼干"
    },
    "food-21": {
        "food": "Chapati、全麦印度烤饼（naan）"
    },
    "food-22": {
        "food": "Vadai（印度炸豆饼）"
    },
    "food-23": {
        "food": "燕麦、什锦麦片（muesli、granola）"
    },
    "food-24": {
        "food": "藜麦、小米、麸皮"
    },
    "food-25": {
        "food": "全谷／高纤／荞麦面"
    },
    "food-26": {
        "food": "鱼",
        "notes": "煮软，去骨。"
    },
    "food-27": {
        "food": "鸡肉",
        "notes": "清真：只吃有清真认证的。切小块、煮熟、肉质要嫩；不吃皮和脆骨。"
    },
    "food-28": {
        "food": "猪肉",
        "notes": "SCS 名单允许。"
    },
    "food-29": {
        "food": "嫩瘦肉（煮熟、切小块）",
        "notes": "清真：只吃有清真认证的。医疗团队：避免带筋或结缔组织的硬肉。"
    },
    "food-30": {
        "food": "鸡蛋",
        "notes": "素食：奶蛋素可以吃。许多印度素食者和佛教素食者不吃蛋，须询问病人。"
    },
    "food-31": {
        "food": "虾／贝类",
        "notes": "清真：在新加坡一般可接受（沙斐仪派），仍须向病人确认。百汇东岸医院：血蛤不适合。"
    },
    "food-32": {
        "food": "豆腐（原味）"
    },
    "food-33": {
        "food": "豆干（taukwa，原味）"
    },
    "food-34": {
        "food": "豆卜（tau pok，原味）",
        "notes": "医疗团队：原味可以吃。不可吃酿了蔬菜的。"
    },
    "food-35": {
        "food": "素肉（仿荤素食）",
        "notes": "清真：须有清真认证。纯素：查看有没有蛋白或牛奶。不可含香菇或蔬菜碎。"
    },
    "food-36": {
        "food": "植物蛋白粉",
        "notes": "SCS。选不含添加纤维、水果或坚果碎的。"
    },
    "food-37": {
        "food": "营养补充品（需要时）",
        "notes": "百汇东岸医院。清真／纯素：许多含牛奶或明胶，请查看包装标签。"
    },
    "food-38": {
        "food": "幼滑坚果酱（薄涂，不含颗粒）",
        "notes": "只有医疗团队允许。只可薄薄一层。"
    },
    "food-39": {
        "food": "鱼丸／鱼饼／午餐肉",
        "notes": "医疗团队：没加蔬菜或种子就不会增加残渣，但不是健康的选择。清真：午餐肉多为猪肉。鱼饼可能含蔬菜碎。"
    },
    "food-40": {
        "food": "牛肉／羊肉（红肉）",
        "notes": "SCS 名单：避免。医疗团队对牛羊肉的说法不明确，请向医院确认。"
    },
    "food-41": {
        "food": "硬肉／油炸肉"
    },
    "food-42": {
        "food": "香肠、腊肠、萨拉米（加工肉）",
        "notes": "SCS 名单：避免。"
    },
    "food-43": {
        "food": "Tempeh 天贝"
    },
    "food-44": {
        "food": "豆类、扁豆、dhal 豆糊"
    },
    "food-45": {
        "food": "坚果和种子（整粒／带颗粒）"
    },
    "food-46": {
        "food": "酿了蔬菜的豆卜／豆腐"
    },
    "food-47": {
        "food": "牛奶",
        "notes": "SCS：依医院规定。百汇东岸医院：低脂／脱脂，份量要控制。医疗团队：可以。盛港综合医院：避免奶类。清流质日不可喝。"
    },
    "food-48": {
        "food": "芝士（原味）",
        "notes": "百汇东岸医院：低脂，份量要控制。盛港综合医院：避免。清真／素食：查看有没有动物凝乳酶。"
    },
    "food-49": {
        "food": "原味酸奶",
        "notes": "百汇东岸医院：低脂，份量要控制。盛港综合医院：避免。清真／素食：有些含明胶。不可有水果或坚果。"
    },
    "food-50": {
        "food": "冰淇淋（原味）",
        "notes": "SCS 名单允许（视医院而定）。清真／素食：查看有没有明胶。"
    },
    "food-51": {
        "food": "蛋奶糊（custard）",
        "notes": "SCS 名单允许（视医院而定）。含牛奶和鸡蛋。"
    },
    "food-52": {
        "food": "炼奶／淡奶／奶油",
        "notes": "医疗团队：没加坚果、种子、蔬菜或水果就没有限制。奶类方面请遵照医院的规定。"
    },
    "food-53": {
        "food": "美禄（Milo）",
        "notes": "SCS 和百汇东岸医院：可以。清流质日停喝。含牛奶。"
    },
    "food-54": {
        "food": "好立克（Horlicks）",
        "notes": "医疗团队：清流质日停喝。含牛奶。"
    },
    "food-55": {
        "food": "加奶咖啡／茶（kopi-C、teh-C、拉茶）",
        "notes": "医疗团队：清流质日停喝。"
    },
    "food-56": {
        "food": "豆浆（已过滤）",
        "notes": "SCS 和医疗团队：低渣日可以，清流质日不可以。"
    },
    "food-57": {
        "food": "椰浆",
        "notes": "医疗团队：可以。百汇东岸医院：叻沙因含椰浆而不适合。SCS 水果名单：避免椰子。"
    },
    "food-58": {
        "food": "调味／加水果／加坚果的奶制品",
        "notes": "SCS 名单：避免。"
    },
    "food-59": {
        "food": "过滤果汁，无果肉（苹果、梨、葡萄）",
        "notes": "选浅色的。避免红色、紫色、蓝色。"
    },
    "food-60": {
        "food": "小根熟香蕉",
        "notes": "SCS：允许。百汇东岸医院：不允许。"
    },
    "food-61": {
        "food": "小个牛油果",
        "notes": "SCS：允许。百汇东岸医院：不允许。"
    },
    "food-62": {
        "food": "带皮、带籽或有果肉的水果"
    },
    "food-63": {
        "food": "果干"
    },
    "food-64": {
        "food": "椰肉"
    },
    "food-65": {
        "food": "西梅汁",
        "notes": "医疗团队：含纤维。"
    },
    "food-66": {
        "food": "橙汁、番茄汁、甘蔗水、酸柑汁",
        "notes": "医疗团队：可能含果肉或籽。"
    },
    "food-67": {
        "food": "过滤蔬菜汤／蔬菜汁",
        "notes": "百汇东岸医院：允许。SCS 严格版本：不可吃蔬菜。"
    },
    "food-68": {
        "food": "洋葱、蒜、姜、香茅（调味用，看不见）",
        "notes": "医疗团队：尽量少用；看不见的份量一般没问题。部分佛教／印度素食者不吃葱蒜。"
    },
    "food-69": {
        "food": "去皮煮烂的蔬菜（少量）",
        "notes": "SCS：只有在病人想吃而且医院允许时才可以。百汇东岸医院：不可以。"
    },
    "food-70": {
        "food": "其他所有蔬菜（生的、带皮／带籽、玉米、叶菜）"
    },
    "food-71": {
        "food": "菇类",
        "notes": "医疗团队：纤维非常高。"
    },
    "food-72": {
        "food": "燕菜（agar-agar）／清果冻（不含果粒）",
        "notes": "不可是红色、紫色、蓝色或深色。"
    },
    "food-73": {
        "food": "明胶果冻（清澈、不含果粒）",
        "notes": "清真：明胶须有清真认证才可以。不可是红色、紫色、蓝色或深色。"
    },
    "food-74": {
        "food": "豆花（tau huay）",
        "notes": "只吃原味，只可加糖水。"
    },
    "food-75": {
        "food": "过滤糖水",
        "notes": "SCS。不可有渣料（不可有豆、种子、坚果、水果）。"
    },
    "food-76": {
        "food": "原味蛋糕",
        "notes": "含鸡蛋和牛油／牛奶，所以不是纯素。不可有水果、坚果、种子或全谷。"
    },
    "food-77": {
        "food": "雪葩（sorbet）",
        "notes": "纯素：有些含蛋白。不可是红色、紫色、蓝色。"
    },
    "food-78": {
        "food": "冰棒",
        "notes": "查看有没有明胶。不可是红色、紫色、蓝色。"
    },
    "food-79": {
        "food": "原味糖果",
        "notes": "许多含明胶。不可是红色、紫色、蓝色。"
    },
    "food-80": {
        "food": "原味巧克力",
        "notes": "纯素：选不含牛奶的黑巧克力。不可有坚果、水果或种子。"
    },
    "food-81": {
        "food": "水粿（chwee kueh）",
        "notes": "SCS：可以。百汇东岸医院：不适合。"
    },
    "food-82": {
        "food": "含水果、坚果、种子、全谷或椰子的甜点"
    },
    "food-83": {
        "food": "咖椰吐司（白面包）",
        "notes": "SCS 和百汇东岸医院：用白面包就可以。咖椰含鸡蛋和椰浆，所以不是纯素。"
    },
    "food-84": {
        "food": "Mee soto（去掉蔬菜、豆芽和配料）",
        "notes": "SCS：避免所有蔬菜。百汇东岸医院：经调整后可以接受。用鸡汤，所以不是素食。"
    },
    "food-85": {
        "food": "叻沙（laksa）",
        "notes": "百汇东岸医院：含椰浆、血蛤、豆芽。SCS：避免所有蔬菜。"
    },
    "food-86": {
        "food": "酱油／黑酱油",
        "notes": "医疗团队：没有看得见的蔬菜碎就可以。"
    },
    "food-87": {
        "food": "蚝油",
        "notes": "医疗团队：没有看得见的蔬菜碎就可以。由生蚝制成。"
    },
    "food-88": {
        "food": "蛋黄酱（mayonnaise）",
        "notes": "含鸡蛋。"
    },
    "food-89": {
        "food": "番茄酱",
        "notes": "不可有看得见的蔬菜碎。"
    },
    "food-90": {
        "food": "辣椒、参巴（sambal）、辣椒酱",
        "notes": "医疗团队：因为有籽和固体渣，最好避免。"
    },
    "food-91": {
        "food": "配料：炸葱、葱花、芫荽",
        "notes": "医疗团队：要去掉。"
    },
    "food-92": {
        "food": "水"
    },
    "food-93": {
        "food": "清茶／黑咖啡（kopi-O、teh-O）",
        "notes": "清流质日不可加奶。加糖可以。"
    },
    "food-94": {
        "food": "等渗／电解质饮料",
        "notes": "医疗团队：最好选无色的。不可是红色、紫色、蓝色。"
    },
    "food-95": {
        "food": "过滤薏米水",
        "notes": "医疗团队：要过滤、稀释，不可混浊，不可有薏米粒。"
    },
    "food-96": {
        "food": "清汤，已过滤（鸡肉／肉类）",
        "notes": "清真：须来自有清真认证的来源。不可有固体渣或油花。"
    },
    "food-97": {
        "food": "清汤，已过滤（蔬菜）",
        "notes": "要完全过滤，不可有固体渣。"
    },
    "food-98": {
        "food": "蜂蜜",
        "notes": "SCS。许多纯素者不吃蜂蜜；可改用糖或糖浆。"
    },
    "food-99": {
        "food": "含果肉的果汁"
    },
    "food-100": {
        "food": "牛奶、含奶饮料（kopi、teh、美禄、好立克）",
        "notes": "清流质日停止喝奶。"
    },
    "food-101": {
        "food": "豆浆",
        "notes": "医疗团队：低渣日可以，但清流质日不可以。"
    },
    "food-102": {
        "food": "红色、紫色、蓝色或深色的饮料／果冻",
        "notes": "在内镜检查时可能被误认为血。"
    },
    "food-103": {
        "food": "酒精饮料"
    }
},
  categories: {
    "Clear liquids": "清流质饮品",
    "Dairy & alternatives": "奶类及替代品",
    "Fruit & juice": "水果与果汁",
    "Grains & starches": "谷类与淀粉类",
    "Local dishes": "本地美食",
    "Meat & protein": "肉类与蛋白质",
    "Sauces & condiments": "酱料与调味品",
    "Snacks & desserts": "零食与甜点",
    "Vegetables": "蔬菜"
},
  statuses: {
    "Allowed": "可以食用",
    "Avoid": "避免",
    "Check hospital": "询问医院",
    "Check label": "查看标签"
},
}
