export type Lang = 'zh' | 'en';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
];

/** 跟随访问者的系统 / 浏览器语言，中文以外一律英文 */
export function detectLang(): Lang {
  if (typeof navigator === 'undefined') return 'zh';
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of list) {
    if (!raw) continue;
    const tag = raw.toLowerCase();
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

type Dict = {
  nav: { listen: string; own: string; limits: string; lang: string };
  hero: {
    kicker: string;
    title: string;
    lede: string;
    ctaListen: string;
    ctaOwn: string;
    facts: { k: string; v: string }[];
    factsNote: string;
  };
  listen: {
    num: string;
    eyebrow: string;
    title: string;
    lede: string;
    samples: string;
    before: string;
    after: string;
    reference: string;
    beforeHint: string;
    afterHint: string;
    referenceHint: string;
    play: string;
    pause: string;
    blind: string;
    blindOn: string;
    guessQ: string;
    guessPick: string;
    guessRight: string;
    guessWrong: string;
    guessReveal: (a: string, b: string) => string;
    keys: string;
    loudness: string;
    meta: (sec: string) => string;
    loadError: string;
  };
  own: {
    num: string;
    eyebrow: string;
    title: string;
    lede: string;
    tabUpload: string;
    tabRecord: string;
    privacy: string;
    dropTitle: string;
    dropSub: string;
    dropPick: string;
    recIdle: string;
    recStart: string;
    recStop: string;
    recTip: string;
    empty: string;
    errDecode: string;
    errSize: string;
    errMic: string;
    mDuration: string;
    mRate: string;
    mChannels: string;
    mPeak: string;
    mFloor: string;
    mClip: string;
    sec: string;
    vClip: string;
    vShort: string;
    vLowSnr: (n: string) => string;
    vTypical: (n: string) => string;
    vClean: (n: string) => string;
    nextT: string;
    nextS: string;
    nextSend: string;
    nextDownload: string;
  };
  limits: {
    num: string;
    eyebrow: string;
    title: string;
    lede: string;
    items: { h: string; p: string }[];
  };
  cta: { title: string; lede: string; button: string };
  foot: string;
};

const zh: Dict = {
  nav: { listen: '对比试听', own: '自带素材', limits: '已知限制', lang: '语言' },
  hero: {
    kicker: 'Takeweave · 离线人声修复 · Apple Silicon',
    title: '把糟糕的录音重新织一遍',
    lede:
      'Takeweave 读取原录音里的内容、语气和说话人身份，重新合成一段人声，用来处理混响、设备染色、带宽损失和背景噪声。它不是降噪器。所有计算在你的 Mac 上完成，音频不上传。',
    ctaListen: '开始试听',
    ctaOwn: '用我自己的录音',
    facts: [
      { k: '处理位置', v: '本机离线' },
      { k: '本页修复强度', v: '100%' },
      { k: '上下文窗口', v: '20 秒' },
      { k: '输出格式', v: '48 kHz 单声道' },
    ],
    factsNote:
      '产品默认强度为 85%，可在 75% 到 100% 之间以 5% 为步长调整。本页样本一律使用 100%。',
  },
  listen: {
    num: '01',
    eyebrow: '对比试听',
    title: '同一段录音，处理前后',
    lede:
      '素材来自 DR-VCTK 公开数据集：同一句话既有设备录音版本，也有录音棚原版。「处理前」是设备录音，「处理后」由 Takeweave 实际跑出，「数据集原版」是录音棚版本，只作参照，不是产品输出。',
    samples: '测试样本',
    before: '处理前',
    after: '处理后',
    reference: '数据集原版',
    beforeHint: '办公室环境下的设备录音',
    afterHint: 'Takeweave 100% 强度输出',
    referenceHint: '录音棚原版，参照用',
    play: '播放',
    pause: '暂停',
    blind: '盲听',
    blindOn: '盲听中',
    guessQ: '哪一条是处理后的？',
    guessPick: '选',
    guessRight: '猜对了。',
    guessWrong: '这条其实是处理前。',
    guessReveal: (a, b) => `A 是${a}，B 是${b}。`,
    keys: '空格播放或暂停，左右方向键切换。切换时播放位置保持不变。',
    loudness:
      '三条都是各自的真实电平，没有做响度统一。生成结果通常比输入轻几个 LU，这是当前已知的产品缺口，不是听感差异。',
    meta: (sec) => `48 kHz 单声道 · ${sec} 秒 · 真实电平`,
    loadError: '音频加载失败。请检查网络后刷新页面重试。',
  },
  own: {
    num: '02',
    eyebrow: '自带素材',
    title: '先看看你的录音是什么状况',
    lede:
      '上传一个文件，或直接在这里录一段。浏览器会在本地算出时长、峰值、噪声底和削波比例，用来判断这段录音适不适合做生成式修复。',
    tabUpload: '上传文件',
    tabRecord: '当场录音',
    privacy: '文件不会离开这台设备。解码和分析全部在浏览器里完成，没有任何上传。',
    dropTitle: '把音频拖到这里',
    dropSub: 'WAV / MP3 / M4A / FLAC / OGG，最大 40 MB',
    dropPick: '选择文件',
    recIdle: '待机',
    recStart: '开始录音',
    recStop: '停止并分析',
    recTip:
      '已关闭浏览器自带的降噪和自动增益，录到的就是麦克风原始状态。说 5 到 10 秒完整句子效果最好。',
    empty: '还没有素材。上传或录一段之后，这里会显示时长、峰值、噪声底和是否削波。',
    errDecode: '无法解码这个文件。支持 WAV、MP3、M4A、FLAC、OGG，请确认文件没有损坏。',
    errSize: '文件超过 40 MB。分析在你的浏览器里本地进行，过大的文件会卡住页面。',
    errMic: '无法访问麦克风。请在浏览器的权限设置里允许本站使用麦克风，然后重试。',
    mDuration: '时长',
    mRate: '采样率',
    mChannels: '声道',
    mPeak: '峰值',
    mFloor: '噪声底',
    mClip: '削波样本',
    sec: '秒',
    vClip: '存在削波失真。削掉的波形无法还原，建议降低输入增益后重录。',
    vShort: '素材偏短。模型依赖上下文，建议提供 5 秒以上的连续语句。',
    vLowSnr: (n) => `信噪比约 ${n} dB，噪声与人声过于接近，重建难度高。`,
    vTypical: (n) => `信噪比约 ${n} dB，属于典型的问题录音，正是主要处理对象。`,
    vClean: (n) => `信噪比约 ${n} dB，本身已经比较干净，提升空间有限。`,
    nextT: '下一步',
    nextS:
      '实际修复在 Mac 上离线运行，网页无法调用本地模型。把这段素材连同录制环境的描述发过来，我们处理后把结果回给你。',
    nextSend: '发送样本',
    nextDownload: '下载这段录音',
  },
  limits: {
    num: '03',
    eyebrow: '已知限制',
    title: '这套方法有明确的边界',
    lede: '高频细节是模型生成的，不是从原录音里找回来的。这决定了它能做什么、不能做什么。',
    items: [
      {
        h: '可能出现的失真',
        p: '部分素材会有音色变化、金属感、齿音异常或吞字。长音频在段落接缝附近可能出现生成式痕迹。遇到这些情况，正确的做法是降低修复强度，或者直接保留原始文件。',
      },
      {
        h: '不在能力范围内',
        p: '多人重叠说话、音乐、复杂环境声和立体声空间关系，目前都处理不好。当前版本只针对单个主要说话人。',
      },
      {
        h: '响度还没做好',
        p: '系统目前不固定输出响度，很轻的素材处理后仍然会偏轻。本页刻意不做响度统一，你听到的电平差是真实存在的。',
      },
      {
        h: '关于这个名字',
        p: 'Takeweave 是当前的工作名，原名 Transmute。名称检索只是初步的，不构成商标或可用性保证。',
      },
    ],
  },
  cta: {
    title: '现在缺的不是测试，是你的录音',
    lede:
      '内部盲听和客观指标已经做了很多轮。真正不知道的是：换成你的麦克风、你的房间、你的语言和音量，它还成不成立。',
    button: '参与内测',
  },
  foot: 'Takeweave · 离线人声修复',
};

const en: Dict = {
  nav: { listen: 'Compare', own: 'Your audio', limits: 'Limits', lang: 'Language' },
  hero: {
    kicker: 'Takeweave · Offline voice restoration · Apple Silicon',
    title: 'Reweave a recording that went wrong',
    lede:
      'Takeweave reads the words, delivery and speaker identity in the original take, then resynthesises the voice — dealing with room reflections, microphone colouration, lost bandwidth and background noise. It is not a denoiser. Everything runs on your Mac; no audio is uploaded.',
    ctaListen: 'Start listening',
    ctaOwn: 'Use my own recording',
    facts: [
      { k: 'Processing', v: 'On device, offline' },
      { k: 'Strength on this page', v: '100%' },
      { k: 'Context window', v: '20 s' },
      { k: 'Output', v: '48 kHz mono' },
    ],
    factsNote:
      'The product default is 85%, adjustable from 75% to 100% in steps of 5. Every sample on this page uses 100%.',
  },
  listen: {
    num: '01',
    eyebrow: 'Compare',
    title: 'One recording, before and after',
    lede:
      'Material comes from the public DR-VCTK set, where the same sentence exists as a device recording and as a studio original. "Before" is the device recording, "After" was produced by Takeweave, and "Dataset original" is the studio version — shown for reference only, not as product output.',
    samples: 'Test samples',
    before: 'Before',
    after: 'After',
    reference: 'Dataset original',
    beforeHint: 'Device recording in an office',
    afterHint: 'Takeweave output at 100%',
    referenceHint: 'Studio original, for reference',
    play: 'Play',
    pause: 'Pause',
    blind: 'Blind',
    blindOn: 'Blind on',
    guessQ: 'Which one was processed?',
    guessPick: 'Pick',
    guessRight: 'Correct.',
    guessWrong: 'That one was actually the before take.',
    guessReveal: (a, b) => `A is ${a}, B is ${b}.`,
    keys: 'Space plays or pauses; arrow keys switch tracks. Position is preserved across switches.',
    loudness:
      'All three play at their own real levels, with no loudness matching. Output is usually a few LU quieter than the input — a known gap in the product, not a difference in how it sounds.',
    meta: (sec) => `48 kHz mono · ${sec} s · real levels`,
    loadError: 'Audio failed to load. Check your connection and reload the page.',
  },
  own: {
    num: '02',
    eyebrow: 'Your audio',
    title: 'First, see what shape your recording is in',
    lede:
      'Upload a file, or record something right here. Your browser works out duration, peak, noise floor and clipping locally, which tells you whether the take is a good candidate for generative repair.',
    tabUpload: 'Upload a file',
    tabRecord: 'Record now',
    privacy:
      'Nothing leaves this device. Decoding and analysis happen entirely in your browser, with no upload.',
    dropTitle: 'Drop audio here',
    dropSub: 'WAV / MP3 / M4A / FLAC / OGG, up to 40 MB',
    dropPick: 'Choose a file',
    recIdle: 'Idle',
    recStart: 'Start recording',
    recStop: 'Stop and analyse',
    recTip:
      'Browser noise suppression and auto gain are switched off, so you capture the microphone as it really is. Five to ten seconds of continuous speech works best.',
    empty:
      'Nothing loaded yet. Once you upload or record something, duration, peak, noise floor and clipping appear here.',
    errDecode:
      'That file could not be decoded. WAV, MP3, M4A, FLAC and OGG are supported — check that the file is intact.',
    errSize:
      'That file is over 40 MB. Analysis runs locally in your browser, and files this large will stall the page.',
    errMic:
      'Microphone access was refused. Allow this site to use the microphone in your browser settings, then try again.',
    mDuration: 'Duration',
    mRate: 'Sample rate',
    mChannels: 'Channels',
    mPeak: 'Peak',
    mFloor: 'Noise floor',
    mClip: 'Clipped samples',
    sec: 's',
    vClip:
      'This take is clipped. Clipped waveforms cannot be recovered — lower the input gain and record again.',
    vShort:
      'This take is short. The model relies on context, so five seconds or more of continuous speech is better.',
    vLowSnr: (n) =>
      `Signal-to-noise is roughly ${n} dB. Noise sits too close to the voice, which makes reconstruction hard.`,
    vTypical: (n) =>
      `Signal-to-noise is roughly ${n} dB — a typical problem recording, and exactly what this is built for.`,
    vClean: (n) =>
      `Signal-to-noise is roughly ${n} dB. This is already fairly clean, so there is less to gain.`,
    nextT: 'Next',
    nextS:
      'The actual repair runs offline on a Mac; a web page cannot call the local model. Send the take along with a note about how it was recorded, and we will process it and send the result back.',
    nextSend: 'Send this sample',
    nextDownload: 'Download this take',
  },
  limits: {
    num: '03',
    eyebrow: 'Limits',
    title: 'The method has clear boundaries',
    lede:
      'High-frequency detail is generated by the model, not recovered from the original. That governs what this can and cannot do.',
    items: [
      {
        h: 'Artefacts you may hear',
        p: 'Some material comes back with a shifted timbre, a metallic edge, odd sibilance or a dropped word. Longer files can show generative seams near segment boundaries. When that happens, lower the strength or keep the original file.',
      },
      {
        h: 'Out of scope',
        p: 'Overlapping speakers, music, complex ambience and stereo imaging are all handled badly today. The current version targets a single main speaker.',
      },
      {
        h: 'Loudness is unfinished',
        p: 'Output loudness is not fixed, so a very quiet take stays quiet after processing. This page deliberately skips loudness matching: the level difference you hear is real.',
      },
      {
        h: 'About the name',
        p: 'Takeweave is the current working name; it was previously Transmute. Name searches are preliminary and are not a trademark or availability guarantee.',
      },
    ],
  },
  cta: {
    title: 'What is missing is not more testing — it is your recording',
    lede:
      'Internal blind listening and objective metrics have been run many times over. What nobody knows yet is whether it holds up with your microphone, your room, your language and your levels.',
    button: 'Join the beta',
  },
  foot: 'Takeweave · Offline voice restoration',
};

export const DICT: Record<Lang, Dict> = { zh, en };
