// About 页的文案。先做中文；英文、日文版按同样的结构补一份即可。

export type Lang = 'zh';

type Project = {
  name: string;
  desc: string;
  href?: string;
  meta: string;
};

type Season = {
  season: string;
  name: string;
  href: string;
  thumb: string;
};

export type About = {
  htmlLang: string;
  title: string;
  description: string;
  name: string;
  lede: string;
  labels: { work: string; animations: string; why: string; contact: string };
  takeweave: Project;
  animations: { desc: string; seasons: Season[] };
  more: Project[];
  why: { paragraphs: string[]; quote: string[] };
  contact: { label: string; value: string; href: string }[];
  contactNote: string;
};

export const ABOUT: Record<Lang, About> = {
  zh: {
    htmlLang: 'zh-CN',
    title: 'Chen Yuxiang',
    description: '陈宇翔，现居日本新潟。学习商业，也在做软件、交互地图和网页动画。',
    name: 'Chen Yuxiang',
    lede: '我在日本新潟读商科，也做软件、交互地图和网页动画。这个网站用来放我做过的东西，以及还在尝试的想法。',
    labels: {
      work: '在做的事',
      animations: '新潟四季小动画',
      why: '关于我',
      contact: '联系',
    },
    takeweave: {
      name: 'Takeweave',
      href: '/takeweave',
      desc: '完全离线运行在 Apple Silicon Mac 上的生成式人声修复。试听室里有真实的处理前后对比，也能用你自己的录音测一测。',
      meta: '试听室 →',
    },
    animations: {
      desc: '每一季一段二十秒左右的竖屏短片，全部用网页代码画出来。点开就能播放。',
      seasons: [
        { season: '春', name: '高田夜樱', href: '/niigata/takada-yozakura.html', thumb: '/niigata/thumbs/takada-yozakura.webp' },
        { season: '夏', name: '长冈花火', href: '/niigata/nagaoka-hanabi.html', thumb: '/niigata/thumbs/nagaoka-hanabi.webp' },
        { season: '秋', name: '弥彦', href: '/niigata/yahiko.html', thumb: '/niigata/thumbs/yahiko.webp' },
        { season: '冬', name: '越后汤泽', href: '/niigata/yuzawa.html', thumb: '/niigata/thumbs/yuzawa.webp' },
      ],
    },
    more: [
      {
        name: '新潟 3D 冒险地图',
        desc: '把新潟县做成一张可以四处走动的立体地图。',
        meta: '制作中',
      },
      {
        name: '新潟数据档案',
        href: 'https://github.com/gitcyx93/niigata-data-archive',
        desc: '早期用公开统计数据画的新潟图表：大米、清酒、石油、观光、人口。',
        meta: '归档 →',
      },
    ],
    why: {
      paragraphs: [
        '我叫陈宇翔，现在住在日本新潟，读商科研究生。过去一段时间，我开始花更多精力自己做东西：离线音频工具、用代码制作的季节动画，以及一张可以探索的新潟地图。',
        '我对软件怎么做出来感兴趣，也想知道它为什么值得做、谁会用、实际用起来怎么样。所以我经常从一个小问题开始，查资料、找开源项目、动手试，再决定要不要继续。',
        '我希望这里能留住这些尝试的过程。做成的、做坏的、后来改变主意的，都比一份漂亮的自我介绍更能说明我在做什么。',
      ],
      quote: [],
    },
    contact: [
      { label: 'Email', value: 'chen@yuxiangchen.dev', href: 'mailto:chen@yuxiangchen.dev' },
      { label: 'GitHub', value: 'gitcyx93', href: 'https://github.com/gitcyx93' },
    ],
    contactNote: '不用注册，不用关注，直接写信就行。',
  },
};
