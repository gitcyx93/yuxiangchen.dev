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
    description: '做离线的声音工具，也用网页给新潟画四季小动画。',
    name: 'Chen Yuxiang',
    lede: '做离线的声音工具，也用网页给新潟画四季小动画。这里是我自己的地方：没有登录，没有广告，没有算法推荐。',
    labels: {
      work: '在做的事',
      animations: '新潟四季小动画',
      why: '为什么有这个网站',
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
        '我受够了听歌软件要手机号，两分钟的视频配五十秒广告，标题说的事一个字没提、只会让你一键三连的“创作者”。也受够了做内容时有一万个话题不能碰，花了时间做的东西随时可能被下架。',
        '但这些东西没有一样是必须的。CSS、Email、GitHub，整个开放互联网的基础设施一直都在，只是平台花了十年让人忘了这件事。现在有了 AI，自建网站的门槛也没了。',
      ],
      quote: ['我们创造内容，是因为内容本身值得存在。', '不要做平台的产品。成为你自己的目的。'],
    },
    contact: [
      { label: 'Email', value: 'chen@yuxiangchen.dev', href: 'mailto:chen@yuxiangchen.dev' },
      { label: 'GitHub', value: 'gitcyx93', href: 'https://github.com/gitcyx93' },
    ],
    contactNote: '不用注册，不用关注，直接写信就行。',
  },
};
