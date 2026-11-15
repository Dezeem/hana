import type { WorkStatus, WorkType } from "@/site.config";
import type { WorkMeta } from "./types";

export type SeedEntry = {
  type: WorkType;
  title: string;
  originalTitle: string;
  creator: string;
  year: number;
  rating: number;
  status: WorkStatus;
  featured?: boolean;
  tags: string[];
  summary: string;
  review: string;
  finishedOn: string;
  meta?: WorkMeta;
};

/**
 * Demo archive. Every review below is written for the demo and describes a
 * real work — replace them with your own once you start using Hana.
 */
export const SEED_ENTRIES: SeedEntry[] = [
  {
    type: "movie",
    title: "牯岭街少年杀人事件",
    originalTitle: "A Brighter Summer Day",
    creator: "杨德昌",
    year: 1991,
    rating: 4.9,
    status: "done",
    featured: true,
    tags: ["台湾新电影", "青春", "长镜头", "六十年代"],
    summary:
      "1960 年代的台北，建国中学夜间部的少年小四，在一场关于帮派、爱情与时代的漫长青春期里，慢慢失去了对这个世界的信任。",
    review:
      "四个小时，像把整个六十年代的台北装进一只玻璃罐。小四最后那几刀不是杀人，是把一个孩子对成人世界的最后一点期待割断。杨德昌的镜头永远退后半步，让你自己看见光是怎么一点一点熄灭的。",
    finishedOn: "2024-03-16",
    meta: { runtime: "237 分钟", region: "中国台湾", director: ["杨德昌"] },
  },
  {
    type: "movie",
    title: "一一",
    originalTitle: "Yi Yi",
    creator: "杨德昌",
    year: 2000,
    rating: 5,
    status: "done",
    featured: true,
    tags: ["家庭", "台湾新电影", "人生", "重看"],
    summary:
      "一个台北中产家庭在一年之内经历婚礼、满月、病危与葬礼，八岁的洋洋拿着相机，拍下所有大人看不见的后脑勺。",
    review:
      "每年重看一次。NJ 在东京街头对初恋说「我从来没有爱过另外一个人」的时候，我总想起洋洋那句「我也老了」。杨德昌把人的一生讲完了，然后把它交给一个小孩去拍。",
    finishedOn: "2023-12-31",
    meta: { runtime: "173 分钟", region: "中国台湾", director: ["杨德昌"] },
  },
  {
    type: "book",
    title: "百年孤独",
    originalTitle: "Cien años de soledad",
    creator: "加西亚·马尔克斯",
    year: 1967,
    rating: 4.9,
    status: "done",
    featured: true,
    tags: ["拉美文学", "魔幻现实主义", "重读"],
    summary:
      "布恩迪亚家族七代人在马孔多小镇的兴衰，从吉普赛人带来的冰块，一直写到一场把整个镇子抹去的飓风。",
    review:
      "十年前读它只记得冰块和飞毯，今年重读才发现全是政治：香蕉公司、大屠杀、被官方否认的记忆。马尔克斯写的不是魔幻，是拉美人把现实讲成魔幻的那种方式。",
    finishedOn: "2024-01-28",
    meta: { publisher: "南海出版公司", language: "西班牙语" },
  },
  {
    type: "music",
    title: "范特西",
    originalTitle: "Fantasy",
    creator: "周杰伦",
    year: 2001,
    rating: 4.9,
    status: "done",
    featured: true,
    tags: ["华语流行", "千禧年", "编曲", "童年"],
    summary:
      "周杰伦的第二张专辑，从《爱在西元前》的楔形文字唱到《双截棍》的哼哼哈兮，把华语流行乐的听觉习惯整体改写了一遍。",
    review:
      "二十多年后听《安静》还是会起鸡皮疙瘩。这张专辑最厉害的地方不是旋律，是编曲里那些不守规矩的声音：打字机、乒乓球、京剧锣鼓。",
    finishedOn: "2023-11-08",
    meta: { artist: "周杰伦", tracks: 10, albumType: "录音室专辑" },
  },
  {
    type: "movie",
    title: "花样年华",
    originalTitle: "In the Mood for Love",
    creator: "王家卫",
    year: 2000,
    rating: 4.8,
    status: "done",
    tags: ["香港", "王家卫", "暧昧", "旗袍"],
    summary:
      "1962 年的香港，两个邻居在发现各自的配偶有染之后，于狭窄的楼道与面摊之间，克制地走完了一段没有发生的爱情。",
    review:
      "所有的情欲都藏在没有拍到的部分里。张曼玉的旗袍换了二十几套，但真正在动的是走廊的灯、雨，和那句「如果多一张船票，你会不会跟我一起走」。",
    finishedOn: "2024-04-19",
    meta: { runtime: "98 分钟", region: "中国香港", director: ["王家卫"] },
  },
  {
    type: "book",
    title: "看不见的城市",
    originalTitle: "Le città invisibili",
    creator: "伊塔洛·卡尔维诺",
    year: 1972,
    rating: 4.8,
    status: "doing",
    tags: ["意大利文学", "城市", "短篇", "睡前"],
    summary:
      "马可·波罗向忽必烈讲述他旅途中见过的五十五座城市，每一座都由记忆、欲望、符号或死亡构成。",
    review:
      "睡前读一座城市，像含一颗糖。它其实是一本关于「如何描述一个地方」的书——所有城市最后都变回你待过的那一座。",
    finishedOn: "2024-08-20",
    meta: { publisher: "译林出版社", language: "意大利语" },
  },
  {
    type: "music",
    title: "Blonde",
    originalTitle: "Blonde",
    creator: "Frank Ocean",
    year: 2016,
    rating: 5,
    status: "done",
    tags: ["R&B", "氛围", "深夜", "神作"],
    summary:
      "一张很难被归类的专辑：灵魂、福音、氛围与卧室录音混在一起，讲的是男性气质、青春和一去不回的爱。",
    review:
      "《White Ferrari》最后那段变调的合声，是我听过最接近「时间在你面前流走」的声音。它不是用来播放的，是用来在深夜里被淹一次的。",
    finishedOn: "2024-02-14",
    meta: { artist: "Frank Ocean", tracks: 17, albumType: "录音室专辑" },
  },
  {
    type: "movie",
    title: "燃烧女子的肖像",
    originalTitle: "Portrait de la jeune fille en feu",
    creator: "瑟琳·席安玛",
    year: 2019,
    rating: 4.7,
    status: "done",
    tags: ["法国", "女性", "凝视", "古典"],
    summary:
      "十八世纪的布列塔尼孤岛，一位女画家受托为即将出嫁的贵族小姐绘制肖像，在被注视与注视之间，两个人短暂地拥有了自由。",
    review:
      "结尾那一分多钟的长镜头，她听着维瓦尔第的《四季》，眼泪一层层涌上来却不发出声音。整部片子都在讲「看」这件事：被画下来的人，才真正存在过。",
    finishedOn: "2023-09-30",
    meta: { runtime: "122 分钟", region: "法国", director: ["瑟琳·席安玛"] },
  },
  {
    type: "book",
    title: "我们仨",
    originalTitle: "We Three",
    creator: "杨绛",
    year: 2003,
    rating: 4.6,
    status: "done",
    tags: ["中国文学", "回忆录", "家庭"],
    summary:
      "杨绛在丈夫钱锺书与女儿钱瑗相继离世后，以梦境般的笔调写下一个三口之家六十年的相聚与走散。",
    review:
      "语言干净得几乎没有形容词，可越往后读越不敢翻页。「我一个人，怀念我们仨」——她把最难写的丧亲之痛，写成了很轻的日常。",
    finishedOn: "2023-06-18",
    meta: { publisher: "生活·读书·新知三联书店", language: "中文" },
  },
  {
    type: "movie",
    title: "四百击",
    originalTitle: "Les quatre cents coups",
    creator: "弗朗索瓦·特吕弗",
    year: 1959,
    rating: 4.6,
    status: "done",
    tags: ["法国新浪潮", "童年", "黑白"],
    summary:
      "十三岁的安托万在冷漠的家庭与严苛的学校里一再出逃，最终被送进少管所，跑向海边时，镜头第一次也是最后一次停在他茫然的脸上。",
    review:
      "那个定格是电影史上最著名的一次回头。特吕弗没有控诉谁，他只是把镜头放低到孩子的高度，然后发现大人全都太高了。",
    finishedOn: "2023-04-22",
    meta: { runtime: "99 分钟", region: "法国", director: ["弗朗索瓦·特吕弗"] },
  },
  {
    type: "book",
    title: "繁花",
    originalTitle: "Blossoms",
    creator: "金宇澄",
    year: 2012,
    rating: 4.5,
    status: "doing",
    tags: ["中国文学", "上海", "方言", "九十年代"],
    summary:
      "从六十年代的上海弄堂到九十年代的黄河路饭局，阿宝、沪生、小毛三个男人与一大群女人，把一座城市的兴衰说成了一场长长的闲话。",
    review:
      "句子短，语气碎，像在茶馆里听人讲话。它最好的地方是不解释，上海话的节奏自己就把时代带出来了。改天要去黄河路吃一碗排骨年糕。",
    finishedOn: "2024-09-12",
    meta: { publisher: "上海文艺出版社", language: "中文" },
  },
  {
    type: "music",
    title: "冀西南林路行",
    originalTitle: "Inside the Cable Temple",
    creator: "万能青年旅店",
    year: 2020,
    rating: 4.8,
    status: "wish",
    tags: ["独立摇滚", "石家庄", "铜管", "十年"],
    summary:
      "万能青年旅店时隔十年发行的第二张专辑，用铜管、吉他噪音与太行山的矿石意象，写了一代人的迁徙与沉默。",
    review:
      "《山雀》里那句「如此生活三十年」，唱的是所有人都知道却说不出口的事。整张专辑像一列开进隧道的绿皮车，出来时天已经黑了。",
    finishedOn: "2024-10-06",
    meta: { artist: "万能青年旅店", tracks: 8, albumType: "录音室专辑" },
  },
  {
    // 剧集并入电影分类，形态由标签表达（import 脚本同样把 tv 映射为 movie）。
    type: "movie",
    title: "我的天才女友",
    originalTitle: "L'amica geniale",
    creator: "萨维里奥·科斯坦佐",
    year: 2018,
    rating: 4.9,
    status: "done",
    featured: true,
    tags: ["意大利", "女性友谊", "那不勒斯", "文学改编"],
    summary:
      "那不勒斯贫民区的两个女孩莱农与莉拉，从小学教室一路纠缠到各自的中年，友谊里混着爱、嫉妒与不肯认输。",
    review:
      "它拍出了我读过的最准确的一种关系：你最好的朋友既是你想成为的人，也是你一辈子都想赢的人。第三季结尾莉拉把孩子递出去的那个镜头，我停了很久。",
    finishedOn: "2024-06-02",
    meta: { episodes: 8, region: "意大利" },
  },
  {
    type: "movie",
    title: "漫长的季节",
    originalTitle: "The Long Season",
    creator: "辛爽",
    year: 2023,
    rating: 4.8,
    status: "done",
    tags: ["国产剧", "悬疑", "东北", "时代"],
    summary:
      "1997 年的桦林，一桩碎尸案把钢厂司机王响的人生劈成两半；十八年后，他还站在原地等着一个答案。",
    review:
      "国产剧里少见的文学性：玉米地、火车、KTV 里跑调的歌，还有王响那句「往前看，别回头」。它拍的是下岗潮，落点却是一个父亲怎么跟自己的失败和解。",
    finishedOn: "2024-07-11",
    meta: { episodes: 12, region: "中国大陆" },
  },
  {
    type: "movie",
    title: "四重奏",
    originalTitle: "カルテット",
    creator: "土井裕泰",
    year: 2017,
    rating: 4.5,
    status: "done",
    tags: ["日剧", "坂元裕二", "群像", "冬天"],
    summary:
      "四个在东京郊区偶然「相遇」的弦乐手组成四重奏乐团，每个人都在隐瞒一段过去，也都在偷偷留住同一个冬天。",
    review:
      "坂元裕二把台词写成了生活本身：炸鸡上要不要挤柠檬，是可以吵一整集的大事。它温柔地告诉你，不完美的人也可以组成一个完整的和弦。",
    finishedOn: "2024-01-05",
    meta: { episodes: 10, region: "日本" },
  },
];
