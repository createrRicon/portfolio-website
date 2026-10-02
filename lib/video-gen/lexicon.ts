// 本地词典：负责「找词」（Jev 只做判断，不抽取 span），同时是 Jev 不可用时的回退。
// 写法：同一组词用空格分隔；英文多词短语用下划线连接，例如 golden_hour。
// category 为 null 的是「占位词」，只占住位置防止误识别（例如「马上」里的「马」）。

import type { Category, Params, SettingKey, VideoSettings } from "./types";

export interface LexEntry {
  term: string;
  category: Category | null;
  subtype?: string;
  params?: Params;
}

const entries: LexEntry[] = [];

function add(category: Category | null, subtype: string | undefined, terms: string, params?: Params) {
  for (const raw of terms.trim().split(/\s+/)) {
    entries.push({ term: raw.replace(/_/g, " "), category, subtype, params });
  }
}

/** 带参数的一组词：[词, 参数] */
function addEach(category: Category, subtype: string | undefined, list: Array<[string, Params]>) {
  for (const [terms, params] of list) add(category, subtype, terms, params);
}

/* ---------------------------------- 颜色 ---------------------------------- */

const COLOR_HEX: Array<[string, string]> = [
  ["红色 鲜红 鲜红色 red", "#E5484D"],
  ["大红 大红色 正红", "#D62F2F"],
  ["火红 火红色 赤红 朱红 scarlet", "#E0301E"],
  ["酒红 酒红色 勃艮第红 burgundy", "#7E1E33"],
  ["暗红 暗红色", "#8E2C2C"],
  ["绯红 crimson", "#DC143C"],
  ["玫红 玫红色 玫瑰红 magenta", "#D6336C"],
  ["橙色 橘色 橘黄色 orange", "#F76B15"],
  ["橘红 橙红 橘红色", "#F05A28"],
  ["珊瑚色 珊瑚红 coral", "#FF7F6B"],
  ["金色 golden gold", "#D4A72C"],
  ["金黄 金黄色", "#E8B730"],
  ["香槟色 香槟金", "#E8D3A8"],
  ["琥珀色 amber", "#D98E04"],
  ["黄色 明黄 明黄色 yellow", "#F5D90A"],
  ["鹅黄 鹅黄色 奶黄色", "#FFF1A8"],
  ["柠檬黄", "#FAE13C"],
  ["绿色 green", "#30A46C"],
  ["翠绿 翠绿色 碧绿 碧绿色 emerald", "#1BA35B"],
  ["墨绿 墨绿色 森林绿", "#1F4D3A"],
  ["薄荷绿 薄荷色 mint", "#98E5C9"],
  ["草绿 草绿色 嫩绿", "#7CB342"],
  ["橄榄绿 军绿色 olive", "#6B7F2A"],
  ["荧光绿", "#8CFF3A"],
  ["青色 蓝绿色 孔雀绿 teal", "#12A594"],
  ["湖绿 湖绿色 turquoise", "#30C5B7"],
  ["蓝色 blue", "#3E63DD"],
  ["天蓝 天蓝色 浅蓝色 sky_blue", "#7CC4FA"],
  ["湖蓝 湖蓝色 蔚蓝 蔚蓝色 azure", "#2F7FD8"],
  ["宝蓝 宝蓝色 电光蓝", "#2B4FD8"],
  ["深蓝 深蓝色 海军蓝 navy", "#1F2A5C"],
  ["藏青 藏青色", "#1F2A44"],
  ["克莱因蓝", "#002FA7"],
  ["雾霾蓝", "#8AA1B1"],
  ["冰蓝 冰蓝色", "#A8D8EA"],
  ["青蓝色 cyan", "#12A5B4"],
  ["紫色 purple", "#8E4EC6"],
  ["紫罗兰 紫罗兰色 violet", "#7A4EC2"],
  ["薰衣草紫 薰衣草色 淡紫 淡紫色 lavender", "#B4A3E6"],
  ["葡萄紫 深紫色", "#5B2A86"],
  ["霓虹紫", "#B026FF"],
  ["粉色 pink", "#E93D82"],
  ["粉红 粉红色", "#F49AC1"],
  ["樱花粉 浅粉色 淡粉色 桃粉", "#F7C6D9"],
  ["霓虹粉 荧光粉", "#FF3EA5"],
  ["脏粉 脏粉色 豆沙色", "#C98B95"],
  ["棕色 褐色 brown", "#8B5A2B"],
  ["咖啡色 焦糖色", "#6F4E37"],
  ["卡其色 驼色 khaki", "#C3B091"],
  ["米色 米白 米白色 beige", "#E8DCC4"],
  ["奶油色 奶白色", "#FFF4DA"],
  ["白色 纯白 纯白色 雪白 white", "#F2F2F2"],
  ["象牙白 珍珠白 ivory", "#F6F1E3"],
  ["灰色 gray grey", "#8B8D98"],
  ["银灰 银灰色 浅灰 浅灰色", "#B8BCC4"],
  ["深灰 深灰色 炭灰 烟灰色", "#3F3F46"],
  ["黑色 纯黑 纯黑色 漆黑 墨黑 black", "#18181B"],
  ["银色 silver", "#C0C4CC"],
  ["古铜色 铜色 bronze", "#9C6B3C"],
  ["玫瑰金", "#B76E79"],
];
for (const [terms, hex] of COLOR_HEX) add("color", undefined, terms, { hex });

/* ---------------------------------- 风格 ---------------------------------- */

addEach("style", undefined, [
  ["赛博朋克 赛博 cyberpunk", { preset: "cyberpunk" }],
  ["胶片写实 胶片 胶片感 胶片质感 复古胶片 35mm胶片 film_grain", { preset: "film" }],
  ["吉卜力 宫崎骏 ghibli", { preset: "ghibli" }],
  ["水墨 水墨画 水墨风 ink_wash", { preset: "ink" }],
  ["黑色电影 黑白电影 黑白 noir film_noir", { preset: "noir" }],
  ["蒸汽波 vaporwave", { preset: "vaporwave" }],
  ["定格动画 黏土 粘土 黏土动画 粘土动画 claymation stop_motion", { preset: "claymation" }],
  ["皮克斯 迪士尼 3D动画 三维动画 pixar", { preset: "pixar" }],
]);
add(
  "style",
  undefined,
  "蒸汽朋克 柴油朋克 废土 末日废土 新海诚 日系动画 日漫 二次元 动漫 动画风 国风 中国风 工笔 写实 超写实 照片级 " +
    "电影感 电影级 史诗感 史诗 纪录片 纪实 广告片 音乐录影带 王家卫 韦斯·安德森 韦斯安德森 诺兰 岩井俊二 是枝裕和 " +
    "油画 水彩 素描 版画 浮世绘 像素风 低多边形 极简 极简主义 未来主义 复古 港风 港片 90年代 80年代 千禧年 Y2K VHS " +
    "录像带 故障风 故障艺术 哥特 梦幻 梦核 超现实 超现实主义 赛璐璐 美漫 漫画 卡通 手绘 剪纸 皮影 " +
    "steampunk synthwave cinematic anime watercolor oil_painting pixel_art photorealistic documentary " +
    "wes_anderson retro minimalist surreal ukiyo-e low_poly",
);

/* ---------------------------------- 角色 ---------------------------------- */

add(
  "character",
  "human",
  "女孩 男孩 少女 少年 女人 男人 女性 男性 女子 男子 姑娘 小伙子 老人 老奶奶 老爷爷 奶奶 爷爷 老婆婆 老头 " +
    "小孩 孩子 小朋友 儿童 婴儿 宝宝 宇航员 航天员 武士 忍者 骑士 侦探 舞者 芭蕾舞者 歌手 吉他手 鼓手 乐手 战士 " +
    "公主 王子 国王 女王 巫师 魔法师 女巫 厨师 警察 士兵 学生 上班族 情侣 恋人 新娘 新郎 一家人 母亲 父亲 妈妈 爸爸 " +
    "外卖员 快递员 黑客 赛车手 滑板少年 僧人 和尚 道士 侠客 剑客 刺客 海盗 牛仔 科学家 医生 护士 老师 画家 摄影师 " +
    "渔夫 农夫 游客 旅人 旅行者 流浪汉 拳击手 运动员 模特 主角 女主角 男主角 人群 行人 熊孩子 " +
    "girl boy woman man old_man old_woman child kid baby astronaut samurai ninja knight detective dancer " +
    "warrior princess prince king queen wizard witch soldier chef couple",
);
add(
  "character",
  "animal",
  "猫 小猫 猫咪 黑猫 白猫 橘猫 狸花猫 狗 小狗 狗狗 柴犬 柯基 金毛 哈士奇 边牧 狐狸 狼 鹿 小鹿 熊 棕熊 熊猫 大熊猫 " +
    "老虎 狮子 豹子 猎豹 大象 长颈鹿 斑马 兔子 小兔 松鼠 刺猬 猫头鹰 老鹰 雄鹰 鸟 小鸟 鸟群 鸽子 白鸽 乌鸦 海鸥 天鹅 " +
    "仙鹤 孔雀 火烈鸟 鲸鱼 鲸 座头鲸 海豚 鲨鱼 水母 金鱼 锦鲤 鱼群 章鱼 海龟 乌龟 蝴蝶 萤火虫 蜜蜂 马 骏马 白马 " +
    "企鹅 北极熊 猴子 青蛙 蛇 恐龙 霸王龙 " +
    "cat kitten dog puppy corgi golden_retriever shiba fox wolf deer bear panda tiger lion elephant rabbit owl " +
    "eagle bird birds whale dolphin shark jellyfish butterfly horse penguin",
);
add("character", "robot", "机器人 机器狗 机械狗 机甲 仿生人 赛博格 人造人 robot android cyborg mech");
add(
  "character",
  "creature",
  "龙 巨龙 东方龙 飞龙 凤凰 独角兽 精灵 妖精 小精灵 怪兽 怪物 外星人 幽灵 鬼魂 天使 恶魔 美人鱼 人鱼 狐妖 九尾狐 " +
    "麒麟 雪人 巨人 小怪物 史莱姆 狮鹫 狼人 dragon phoenix unicorn alien ghost angel demon mermaid",
);

/* ---------------------------------- 场景 ---------------------------------- */

add(
  "scene",
  "urban",
  "东京街头 东京 涩谷 新宿 纽约 时代广场 巴黎 伦敦 上海 外滩 香港 九龙 重庆 洪崖洞 北京 胡同 弄堂 街头 街道 大街 " +
    "小街 老街 街角 小巷 巷子 马路 十字路口 斑马线 人行天桥 天桥 城市 都市 城市夜景 天台 屋顶 地铁站 车站 火车站 " +
    "站台 便利店 夜市 集市 菜市场 广场 霓虹街道 唐人街 商场 港口 码头 停车场 隧道 高架桥 立交桥 摩天大楼 高楼 " +
    "写字楼 古镇 小镇 村庄 未来城市 赛博城市 废墟 公园 花园 游乐园 摩天轮 加油站 公路 高速公路 大桥 灯塔 " +
    "tokyo new_york paris london street streets alley city rooftop downtown",
);
add(
  "scene",
  "nature",
  "森林 树林 丛林 雨林 竹林 松林 雪山 山顶 山谷 峡谷 山间 高山 群山 草原 草地 草坪 沙漠 戈壁 海边 海滩 沙滩 大海 " +
    "海面 海上 海底 深海 珊瑚礁 湖边 湖面 湖泊 湖畔 河边 河流 小溪 溪流 瀑布 冰川 冰原 雪原 雪地 火山 花田 花海 " +
    "麦田 稻田 田野 梯田 樱花林 樱花树下 悬崖 洞穴 山洞 荒野 海岛 岛屿 小岛 极地 苔原 湿地 芦苇荡 山路 林间小路 " +
    "乡间小路 forest jungle mountain mountains valley desert beach ocean sea lake river waterfall glacier " +
    "meadow field cave island",
);
add(
  "scene",
  "interior",
  "咖啡馆 咖啡店 茶馆 图书馆 书店 书房 教室 卧室 房间 客厅 厨房 浴室 实验室 工厂 车间 仓库 走廊 电梯 酒吧 餐厅 " +
    "面馆 居酒屋 剧场 剧院 舞台 电影院 博物馆 美术馆 画廊 教堂 寺庙 宫殿 城堡 地下室 阁楼 温室 录音棚 办公室 车厢 " +
    "地铁 地铁车厢 机舱 驾驶舱 游戏厅 网吧 健身房 体育馆 医院 病房 大厅 酒店 旅馆 公寓 出租屋 阳台 窗边 " +
    "cafe library bedroom kitchen classroom laboratory warehouse temple castle palace bar",
);
add(
  "scene",
  "cosmic",
  "太空 宇宙 外太空 星际 月球 月球表面 火星 空间站 飞船内部 外星球 星球 黑洞 星云 异世界 梦境 仙境 天宫 天堂 地狱 " +
    "平行宇宙 虚拟世界 space outer_space moon mars space_station galaxy nebula",
);

/* -------------------------------- 时间天气 -------------------------------- */

addEach("atmosphere", undefined, [
  ["雨夜 rainy_night", { time: 22, weather: "雨" }],
  ["雪夜", { time: 22, weather: "雪" }],
  ["夜晚 夜里 夜色 夜间 黑夜 月夜 夏夜 night", { time: 21.5 }],
  ["晚上", { time: 20 }],
  ["深夜 午夜 midnight", { time: 0.5 }],
  ["凌晨", { time: 4 }],
  ["黄昏 日落 落日 晚霞 魔幻时刻 dusk sunset", { time: 18.5 }],
  ["傍晚 夕阳", { time: 18 }],
  ["日出 朝霞 sunrise", { time: 6 }],
  ["黎明 破晓 dawn", { time: 5.5 }],
  ["清晨", { time: 6.5 }],
  ["早晨 morning", { time: 7.5 }],
  ["正午 中午 noon", { time: 12 }],
  ["午后 下午 afternoon", { time: 15 }],
  ["白天 白昼", { time: 13 }],
  ["蓝调时刻 blue_hour", { time: 19 }],
  ["阴天 多云 雨后 overcast", { weather: "多云" }],
  ["雨天 下雨 大雨 暴雨 小雨 细雨 毛毛雨 雨中 梅雨 rain rainy", { weather: "雨" }],
  ["雷雨 雷暴 暴风雨 风暴 暴风雪 龙卷风 沙尘暴 狂风 storm", { weather: "风暴" }],
  ["下雪 大雪 小雪 雪天 飘雪 雪花 snow snowy", { weather: "雪" }],
  ["大雾 雾气 薄雾 浓雾 雾天 fog foggy mist misty", { weather: "雾" }],
  ["晨雾", { time: 6.5, weather: "雾" }],
  ["晴天 晴朗 万里无云 sunny", { weather: "晴" }],
  ["阳光明媚", { time: 11, weather: "晴" }],
  ["星空 满天繁星 繁星 银河 starry_sky", { time: 23, weather: "晴" }],
  ["满月 极光 aurora", { time: 23 }],
  ["彩虹 rainbow", { time: 16, weather: "晴" }],
]);
add("atmosphere", undefined, "春天 春日 初春 夏天 夏日 盛夏 秋天 秋日 深秋 冬天 冬日 寒冬 winter summer autumn");

/* ---------------------------------- 光线 ---------------------------------- */

addEach("lighting", undefined, [
  ["逆光 背光 侧逆光 剪影 轮廓光 边缘光 丁达尔效应 丁达尔光 耶稣光 体积光 backlight backlit silhouette rim_light god_rays volumetric_light", { position: "逆光" }],
  ["侧光", { position: "侧光" }],
  ["顶光", { position: "顶光" }],
  ["底光", { position: "底光" }],
  ["顺光", { position: "顺光" }],
  ["柔光 软光 soft_light", { hardness: 15 }],
  ["硬光 hard_light", { hardness: 85 }],
  ["霓虹灯 霓虹灯光 霓虹 霓虹光 neon neon_lights", { kelvin: 8000, hardness: 45 }],
  ["路灯 街灯", { kelvin: 2700 }],
  ["台灯 暖光 暖光灯", { kelvin: 3000 }],
  ["烛光 蜡烛光 candlelight", { kelvin: 1900, hardness: 25 }],
  ["火光 火花 篝火 炉火 firelight", { kelvin: 2000 }],
  ["月光 moonlight", { kelvin: 7500, hardness: 30 }],
  ["冷光", { kelvin: 7500 }],
  ["阳光 sunlight", { kelvin: 5500 }],
  ["日光 自然光 natural_light", { kelvin: 5600, hardness: 30 }],
  ["晨光", { kelvin: 4500, hardness: 25 }],
  ["暮光 余晖", { kelvin: 3200, position: "侧光" }],
  ["黄金时刻 黄金时段 golden_hour", { kelvin: 3200, position: "侧光" }],
  ["闪光灯 flash", { kelvin: 5600, hardness: 90 }],
  ["日光灯 荧光灯", { kelvin: 6500 }],
  ["聚光灯 舞台灯光 spotlight", { hardness: 85, position: "顶光" }],
]);
add("lighting", undefined, "灯光 光束 光柱 光斑 光晕 光影 阴影");

/* ---------------------------------- 镜头 ---------------------------------- */

addEach("camera", "shot", [
  ["大特写 extreme_close-up", { size: "大特写" }],
  ["特写 面部特写 close-up closeup", { size: "特写" }],
  ["近景 中近景 过肩镜头 第一人称 第一视角 主观视角 pov", { size: "近景" }],
  ["中景 半身 medium_shot", { size: "中景" }],
  ["全景 全身 full_shot", { size: "全景" }],
  ["远景 大远景 wide_shot", { size: "远景" }],
  ["鸟瞰 航拍 无人机航拍 上帝视角 aerial aerial_shot drone_shot", { angle: "鸟瞰", size: "远景" }],
  ["俯拍 俯视 高角度 high_angle", { angle: "俯拍" }],
  ["仰拍 仰视 低角度 low_angle", { angle: "仰拍" }],
  ["平视", { angle: "平视" }],
]);
addEach("camera", "movement", [
  ["推镜头 推镜 推近 镜头推进 缓慢推进 希区柯克变焦 dolly_in push_in dolly_zoom", { move: "推进" }],
  ["拉镜头 拉镜 拉远 镜头拉远 pull_back", { move: "拉远" }],
  ["摇镜头 摇镜 横摇 pan", { move: "横摇" }],
  ["甩镜", { move: "横摇", speed: 90 }],
  ["环绕 环绕镜头 环绕拍摄 360度环绕 orbit", { move: "环绕" }],
  ["移镜头 跟拍 跟镜头 跟随镜头 一镜到底 长镜头 滑轨 tracking_shot", { move: "跟随" }],
  ["升降镜头 摇臂 crane_shot", { move: "升降" }],
  ["手持 手持镜头 手持摄影 handheld", { move: "手持" }],
]);
addEach("camera", "lens", [
  ["广角 广角镜头 wide-angle wide_angle", { focal: 20 }],
  ["超广角", { focal: 14 }],
  ["鱼眼 鱼眼镜头 fisheye", { focal: 12 }],
  ["长焦 长焦镜头 telephoto", { focal: 135 }],
  ["微距 macro", { focal: 100, dof: 85 }],
  ["移轴 tilt-shift", { focal: 45, dof: 80 }],
  ["浅景深 大光圈 背景虚化 虚化 散景 bokeh shallow_depth_of_field", { dof: 85 }],
  ["景深 depth_of_field", { dof: 70 }],
  ["24mm", { focal: 24 }],
  ["35mm", { focal: 35 }],
  ["50mm", { focal: 50 }],
  ["85mm", { focal: 85 }],
]);
addEach("camera", "tempo", [
  ["慢镜头 慢动作 升格 slow_motion slow-motion", { speed: "0.5×" }],
  ["超级慢动作 子弹时间", { speed: "0.25×" }],
  ["延时摄影 延时 缩时 timelapse time-lapse", { speed: "延时" }],
  ["快进 快镜头", { speed: "2×" }],
]);

/* ---------------------------------- 物件 ---------------------------------- */

add(
  "object",
  "clothing",
  "风衣 外套 大衣 长大衣 夹克 皮衣 皮夹克 西装 礼服 晚礼服 衬衫 白衬衫 毛衣 卫衣 连帽衫 T恤 连衣裙 裙子 长裙 短裙 " +
    "百褶裙 婚纱 旗袍 和服 汉服 校服 制服 军装 斗篷 披风 雨衣 盔甲 铠甲 宇航服 潜水服 围巾 丝巾 帽子 礼帽 草帽 贝雷帽 " +
    "渔夫帽 棒球帽 头巾 面纱 运动鞋 高跟鞋 靴子 皮靴 眼镜 墨镜 太阳镜 面具 口罩 耳机 背包 手套 项链 耳环 戒指 领带 " +
    "coat jacket trench_coat trenchcoat dress suit kimono hat scarf hoodie sneakers boots",
);
add(
  "object",
  "vehicle",
  "汽车 小汽车 轿车 跑车 老爷车 出租车 的士 摩托车 机车 自行车 单车 电动车 电车 有轨电车 公交车 巴士 火车 蒸汽火车 " +
    "列车 高铁 飞船 宇宙飞船 飞碟 飞机 客机 战斗机 直升机 热气球 帆船 小船 木船 渔船 游艇 轮船 邮轮 潜水艇 潜艇 " +
    "马车 滑板 无人机 坦克 卡车 吉普车 房车 赛车 皮划艇 雪橇 " +
    "car motorcycle bicycle bike train tram bus spaceship airplane helicopter boat ship sailboat submarine",
);
add(
  "object",
  "prop",
  "雨伞 伞 油纸伞 灯笼 孔明灯 蜡烛 吉他 电吉他 钢琴 小提琴 大提琴 萨克斯 书 旧书 书本 信封 情书 咖啡 咖啡杯 茶杯 " +
    "酒杯 红酒 剑 长剑 武士刀 弓箭 魔杖 相机 胶片相机 手机 电视 电视机 收音机 磁带 唱片 黑胶唱片 气球 风筝 纸飞机 " +
    "怀表 闹钟 时钟 镜子 地图 钥匙 花束 礼物 礼盒 蛋糕 霓虹招牌 招牌 路牌 电话亭 自动售货机 秋千 水晶球 烟花 烟火 " +
    "行李箱 手提箱 椅子 沙发 窗户 楼梯 钟楼 雕像 水龙头 花瓶 马克杯 热狗 降落伞 圣诞树 " +
    "umbrella lantern candle guitar piano violin book coffee sword katana phone balloon kite fireworks",
);
add(
  "object",
  "flora",
  "花 花朵 鲜花 野花 玫瑰 红玫瑰 樱花 向日葵 薰衣草 荷花 莲花 睡莲 郁金香 梅花 桃花 梨花 菊花 牡丹 百合 雏菊 " +
    "蒲公英 银杏 银杏叶 枫叶 红叶 落叶 树叶 树枝 竹子 树 大树 古树 老树 松树 柳树 樱花树 枫树 椰子树 棕榈树 仙人掌 " +
    "藤蔓 苔藓 芦苇 麦穗 稻穗 野草 " +
    "flower flowers rose roses cherry_blossom cherry_blossoms sunflower sunflowers tree trees leaves",
);

/* ---------------------------------- 动作 ---------------------------------- */

add(
  "action",
  undefined,
  "奔跑 跑步 狂奔 飞奔 奔向 漫步 散步 行走 走路 踱步 徘徊 跳舞 起舞 舞蹈 旋转 转圈 转身 回头 回眸 飞翔 飞行 翱翔 " +
    "盘旋 漂浮 悬浮 游泳 潜水 坠落 下坠 跌落 跳跃 跳起 微笑 大笑 哭泣 流泪 拥抱 亲吻 牵手 握手 挥手 追逐 打斗 战斗 " +
    "搏斗 对决 射击 弹奏 演奏 弹吉他 弹钢琴 唱歌 歌唱 喝咖啡 读书 看书 骑车 骑行 驾驶 开车 冲浪 滑雪 滑冰 攀登 爬山 " +
    "凝视 注视 眺望 仰望 沉思 发呆 睡觉 入睡 醒来 燃烧 爆炸 崩塌 坍塌 绽放 盛开 融化 飘落 飘散 升起 冉冉升起 穿过 " +
    "穿梭 穿行 奔腾 流淌 闪烁 摇曳 等待 开花 " +
    "running walking dancing flying floating swimming falling jumping spinning turning_around smiling laughing " +
    "crying hugging kissing fighting chasing driving riding surfing exploding burning melting blooming",
);

/* --------------------------------- 占位词 --------------------------------- */

add(
  null,
  undefined,
  "马上 马虎 马达 车水马龙 熊熊 狼狈 猫腻 狗血 龙头 鼓励 书法 秘书 证书 书记 剑桥 花费 花钱 花了 花纹 浪花 草稿 " +
    "树立 建树 马尾 高马尾 马尾辫 花白 花甲 鸟巢 风格 画面 视频 镜头 感觉 氛围 质感 效果 颜色 色调 色彩",
);

export const LEXICON: readonly LexEntry[] = entries;

/* ------------------------------ 常驻设置的线索 ------------------------------ */

export interface SettingHint {
  terms: string[];
  key: SettingKey;
  value: VideoSettings[SettingKey];
}

const hint = (terms: string, key: SettingKey, value: VideoSettings[SettingKey]): SettingHint => ({
  terms: terms.split(/\s+/).map((t) => t.replace(/_/g, " ")),
  key,
  value,
});

export const SETTING_HINTS: SettingHint[] = [
  hint("竖屏 竖版 竖构图 手机竖屏 抖音 短视频 快手 小红书 reels tiktok vertical", "aspect", "9:16"),
  hint("方形 正方形 方图 square", "aspect", "1:1"),
  hint("宽银幕 超宽 宽画幅 变形宽银幕 cinemascope anamorphic ultrawide", "aspect", "21:9"),
  hint("老电视 复古电视 录像带 VHS", "aspect", "4:3"),
  hint("慢动作 慢镜头 升格 超级慢动作 子弹时间 高帧率 slow_motion slow-motion", "fps", 60),
  hint("4K 超高清 8K", "resolution", "4K"),
  hint("一镜到底 长镜头", "duration", 15),
];
