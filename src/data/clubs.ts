export interface Club {
  id: string;
  nameZh: string;
  nameTw: string;
  nameEn: string;
  groupNameZh: string;
  groupNameTw: string;
  groupNameEn: string;
  directorZh: string;
  directorTw: string;
  directorEn: string;
  directorEmail?: string;
  directorEmailAlt?: string;
  descZh: string;
  descTw: string;
  descEn: string;
  notesZh?: string;
  notesTw?: string;
  notesEn?: string;
  icon: string;
  emoji: string;
  colorBadge: string;
  route: string;
  memberCount?: string;
}

export const CLUBS_DATA: Club[] = [
  {
    id: 'guandan',
    nameZh: '掼蛋俱乐部',
    nameTw: '掼蛋俱樂部',
    nameEn: 'Guandan Club',
    groupNameZh: '华州西雅图掼蛋俱乐部',
    groupNameTw: '華州西雅圖掼蛋俱樂部',
    groupNameEn: 'Greater Seattle Guandan Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '定期举办线上线下掼蛋友谊赛与智力赛事，以牌会友，切磋牌艺，增进校友情谊。',
    descTw: '定期舉辦線上線下掼蛋友誼賽與智力賽事，以牌會友，切磋牌藝，增進校友情誼。',
    descEn: 'Regular online and offline Guandan tournaments, friendly matches, and strategic card game socials.',
    icon: 'fa-solid fa-layer-group',
    emoji: '🎴',
    colorBadge: 'bg-purple-600/10 text-purple-400 border-purple-500/20',
    route: '/guandan/'
  },
  {
    id: 'hike',
    nameZh: '健行俱乐部',
    nameTw: '健行俱樂部',
    nameEn: 'Hiking Club',
    groupNameZh: '华州西雅图追风健行群',
    groupNameTw: '華州西雅圖追風健行群',
    groupNameEn: 'Greater Seattle ChaseWind Hiking Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '组织华盛顿州及大西雅图周边国家公园、自然保护区周末爬山、步道健行与户外拓展。',
    descTw: '組織華盛頓州及大西雅圖周邊國家公園、自然保護區週末爬山、步道健行與戶外拓展。',
    descEn: 'Weekly hikes, trail running, mountain treks, and outdoor excursions across Greater Seattle and Washington State.',
    icon: 'fa-solid fa-person-hiking',
    emoji: '🥾',
    colorBadge: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20',
    route: '/hike/'
  },
  {
    id: 'pickleball',
    nameZh: '匹克球俱乐部',
    nameTw: '匹克球俱樂部',
    nameEn: 'Pickleball Club',
    groupNameZh: '华州西雅图匹克球俱乐部',
    groupNameTw: '華州西雅圖匹克球俱樂部',
    groupNameEn: 'Greater Seattle Pickleball Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '推广热门匹克球运动，组织初学者零基础教学、双打畅打与校友匹克球联赛。',
    descTw: '推廣熱門匹克球運動，組織初學者零基礎教學、雙打暢打與校友匹克球聯賽。',
    descEn: 'Promoting pickleball with beginner coaching, open doubles play, and cross-alumni tournaments.',
    icon: 'fa-solid fa-table-tennis-paddle-ball',
    emoji: '🏓',
    colorBadge: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
    route: '/pickleball/'
  },
  {
    id: 'golf',
    nameZh: '高尔夫俱乐部',
    nameTw: '高爾夫俱樂部',
    nameEn: 'Golf Club',
    groupNameZh: '华州西雅图高尔夫俱乐部',
    groupNameTw: '華州西雅圖高爾夫俱樂部',
    groupNameEn: 'Greater Seattle Golf Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '汇聚大西雅图地区高尔夫球友，组织练习场交流、18洞球场畅打与校友高尔夫邀请赛。',
    descTw: '彙聚大西雅圖地區高爾夫球友，組織練習場交流、18洞球場暢打與校友高爾夫邀請賽。',
    descEn: 'Gathering Greater Seattle golf enthusiasts for driving range practice, 18-hole outings, and alumni golf invitationals.',
    icon: 'fa-solid fa-golf-ball-tee',
    emoji: '🏌️‍♂️',
    colorBadge: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20',
    route: '/golf/'
  },
  {
    id: 'tennis',
    nameZh: '网球俱乐部',
    nameTw: '網球俱樂部',
    nameEn: 'Tennis Club',
    groupNameZh: '华州西雅图网球俱乐部',
    groupNameTw: '華州西雅圖網球俱樂部',
    groupNameEn: 'Greater Seattle Tennis Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '汇聚大西雅图网球爱好者，定期组织拉球练习、友谊比赛与校友双打联谊。',
    descTw: '彙聚大西雅圖網球愛好者，定期組織拉球練習、友誼比賽與校友雙打聯誼。',
    descEn: 'Bringing together Greater Seattle tennis lovers for drills, friendly sparring, and doubles games.',
    icon: 'fa-solid fa-baseball',
    emoji: '🎾',
    colorBadge: 'bg-cyan-600/10 text-cyan-400 border-cyan-500/20',
    route: '/tennis/'
  },
  {
    id: 'music',
    nameZh: '音乐玩乐俱乐部',
    nameTw: '音樂玩樂俱樂部',
    nameEn: 'Music Fun Club',
    groupNameZh: '华州西雅图音乐玩乐群',
    groupNameTw: '華州西雅圖音樂玩樂群',
    groupNameEn: 'Greater Seattle Music & Fun Group',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '用音乐温暖生活！主打卡拉OK、唱歌、乐器演奏、合唱与线下音乐聚会。',
    descTw: '用音樂溫暖生活！主打卡拉OK、唱歌、樂器演奏、合唱與線下音樂聚會。',
    descEn: 'Warm up life with music! Featuring karaoke, group singing, live instruments, and music socials.',
    notesZh: '主打卡拉 OK、唱歌、聚会',
    notesTw: '主打卡拉 OK、唱歌、聚會',
    notesEn: 'Focuses on karaoke, singing, and socials',
    icon: 'fa-solid fa-music',
    emoji: '🎵',
    colorBadge: 'bg-pink-600/10 text-pink-400 border-pink-500/20',
    route: '/music/'
  },
  {
    id: 'garden',
    nameZh: '园艺团购俱乐部',
    nameTw: '園藝團購俱樂部',
    nameEn: 'Garden Club',
    groupNameZh: '华州西雅图园艺团购交流群',
    groupNameTw: '華州西雅圖園藝團購交流群',
    groupNameEn: 'Greater Seattle Garden & Group Buying Group',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '交流花卉种植、蔬菜瓜果培育、庭院设计及精选团购，共筑绿色家园。',
    descTw: '交流花卉種植、蔬菜瓜果培育、庭院設計及精選團購，共築綠色家園。',
    descEn: 'Community of gardening lovers sharing plant care, backyard farming, and group orders.',
    icon: 'fa-solid fa-seedling',
    emoji: '🌱',
    colorBadge: 'bg-lime-600/10 text-lime-400 border-lime-500/20',
    route: '/garden/'
  },
  {
    id: 'ai',
    nameZh: 'AI创业公益俱乐部',
    nameTw: 'AI創業公益俱樂部',
    nameEn: 'AI Venture & Impact Club',
    groupNameZh: '华州西雅图AI创业公益俱乐部',
    groupNameTw: '華州西雅圖AI創業公益俱樂部',
    groupNameEn: 'Greater Seattle AI Venture & Impact Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '推动前沿AI技术与智能体落地，举办大模型讲座、创业实操工作坊、路演及公益孵化。',
    descTw: '推動前沿AI技術與智能體落地，舉辦大模型講座、創業實操工作坊、路演及公益孵化。',
    descEn: 'Empowering AI builders, tech talks, startup workshops, VC matching, and nonprofit impact.',
    icon: 'fa-solid fa-brain',
    emoji: '🤖',
    colorBadge: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    route: '/ai/'
  },
  {
    id: 'aimedia',
    nameZh: 'AI影音创意俱乐部',
    nameTw: 'AI影音創意俱樂部',
    nameEn: 'AI Creative Media Club',
    groupNameZh: '华州西雅图AI影音创意俱乐部',
    groupNameTw: '華州西雅圖AI影音創意俱樂部',
    groupNameEn: 'Greater Seattle AI Creative Media Club',
    directorZh: '分会会长：Ashley Qi (戚霄)',
    directorTw: '分會會長：戚霄 (Ashley Qi)',
    directorEn: 'President: Ashley Qi',
    directorEmail: 'ashley@nacuaa.ai',
    descZh: '专注于AI视频生成、AI音频剪辑、数字人多媒体与创意内容创作（独立发展，不和音乐玩乐群合并）。',
    descTw: '專注於AI視頻生成、AI音頻剪輯、數字人多媒體與創意內容創作（獨立發展，不與音樂玩樂群合併）。',
    descEn: 'Dedicated to generative AI video, audio editing, digital avatars, and creative media production.',
    notesZh: '不和音乐玩乐群合并',
    notesTw: '不和音樂玩樂群合併',
    notesEn: 'Separate from Music Club',
    icon: 'fa-solid fa-video',
    emoji: '🎬',
    colorBadge: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    route: '/aimedia/'
  }
];
