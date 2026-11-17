import type { BrandProfile, Dish, KnowledgeFile } from "./types";

export const MODEL_NAME = "sz-ai-pro";

export interface CopyInput {
  channel: string;
  contentType: string;
  topic: string;
  audience: string;
  tone: string;
  length: string;
  constraints: string;
  dishIds: string[];
}

export interface VideoInput {
  duration: string;
  videoType: string;
  topic: string;
  voiceover: string;
  shooting: string;
  dishIds: string[];
}

export interface CampaignInput {
  goal: string;
  startDate: string;
  endDate: string;
  budget: string;
  audience: string;
  dishIds: string[];
  limits: string;
}

const CHANNELS: Record<string, string> = {
  wechat_moments: "朋友圈",
  wechat_official: "公众号",
  douyin: "抖音",
  xiaohongshu: "小红书",
  website: "官网",
  offline: "线下物料",
};

const channelName = (v: string) => CHANNELS[v] ?? "企业渠道";

const priceText = (n: number) => n.toLocaleString("zh-CN");

function dishLine(d: Dish) {
  return `${d.name}（${priceText(d.price)} 元 / ${d.spec || "套"}）`;
}

function pickDishes(all: Dish[], ids: string[]) {
  const selected = all.filter((d) => ids.includes(d.id) && d.status === "on");
  if (selected.length) return selected;
  return all.filter((d) => d.status === "on").slice(0, 3);
}

function constraintLine(brand: BrandProfile, extra: string) {
  const items = [...brand.constraints, extra].filter(Boolean);
  return items.length ? items.join("；") : "价格、优惠与服务范围以正式报价为准";
}

function firstSentence(text: string) {
  return text.split("。")[0];
}

export interface CopyResult {
  title: string;
  versions: { label: string; title: string; body: string; tags: string; cta: string }[];
  notes: string;
}

export function generateCopy(brand: BrandProfile, allDishes: Dish[], input: CopyInput): CopyResult {
  const dishes = pickDishes(allDishes, input.dishIds);
  const channel = channelName(input.channel);
  const main = dishes[0];
  const second = dishes[1];
  const audience = input.audience || brand.audience[0] || "企业客户";
  const topic = input.topic || "企业服务与产品介绍";
  const tone = input.tone || brand.tone;
  const highlight = brand.highlights[0] || "本地化交付";
  const long = input.length === "long";
  const categoryShort = brand.category.split(" / ")[0];

  const bodyA = [
    `【${topic}】`,
    "",
    `${brand.brandName}专注${brand.category}。${firstSentence(brand.description)}。`,
    main
      ? `${main.name}是我们重点推荐的产品：${main.description} ${dishLine(main)}，适合${main.recommendedFor}。`
      : "",
    second ? `如果需求更完整，可以把${dishLine(second)}一起纳入方案。` : "",
    `我们的底气是${brand.highlights.slice(0, 3).join("、")}。服务时间 ${brand.businessHours}，地址在${brand.address}。`,
    long ? `最近不少${audience}在咨询，欢迎预约一次 30 分钟需求沟通：${brand.phone}。` : "",
    "",
    `（${constraintLine(brand, input.constraints)}）`,
  ]
    .filter(Boolean)
    .join("\n");

  const bodyB = [
    `${topic}，先把话说明白。`,
    "",
    `${brand.brandName}：${firstSentence(brand.description)}。`,
    main ? `${main.name}，${main.description} ${dishLine(main)}。` : "",
    `${highlight}，是我们服务${categoryShort}客户的日常标准。`,
    second ? `需要配套时，${second.name}可以一起评估。` : "",
    `地址：${brand.address}｜服务时间：${brand.businessHours}｜电话：${brand.phone}`,
    `来电或留言备注「${channel}」，获取产品手册与正式报价单。`,
    "",
    `（${constraintLine(brand, input.constraints)}）`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: `${channel} · ${topic}`,
    versions: [
      {
        label: "版本 A · 价值叙述",
        title: `${brand.brandName}｜${topic}`,
        body: bodyA,
        tags: `#${brand.brandName} #${categoryShort} #企业服务`,
        cta: `电话 ${brand.phone}，预约 30 分钟需求沟通。`,
      },
      {
        label: "版本 B · 直接行动",
        title: `${topic}，从${brand.brandName}开始`,
        body: bodyB,
        tags: `#企业数字化 #${main?.name ?? categoryShort} #${audience}`,
        cta: `访问官网或致电 ${brand.phone}，获取产品手册与报价单。`,
      },
    ],
    notes:
      "以上内容由 AI 依据企业品牌资料与产品资料生成。发布前请人工核对产品价格、服务范围与交付周期，不承诺未确认的优惠或效果。",
  };
}

export interface VideoResult {
  title: string;
  totalSeconds: number;
  scenes: {
    no: number;
    time: string;
    visual: string;
    line: string;
    subtitle: string;
    transition: string;
  }[];
  notes: string;
}

export function generateVideo(brand: BrandProfile, allDishes: Dish[], input: VideoInput): VideoResult {
  const dishes = pickDishes(allDishes, input.dishIds);
  const main = dishes[0];
  const second = dishes[1];
  const total = Number(input.duration) || 30;
  const topic = input.topic || "核心产品价值";
  const segments = total <= 15 ? [3, 4, 4, 4] : total <= 30 ? [5, 7, 8, 6, 4] : [6, 10, 12, 12, 10, 10];
  const lines = [
    `一句话：${topic}，用 ${total} 秒讲清楚。`,
    `口播：${brand.brandName}，${brand.category}，服务时间 ${brand.businessHours}。`,
    main ? `口播：${main.name}，${main.description}` : `口播：${brand.highlights.join("、")}。`,
    second ? `口播：再配套${second.name}，${second.description}` : `口播：${firstSentence(brand.description)}。`,
    `口播：${brand.audience[0] ?? "企业客户"}的真实使用场景，是我们持续迭代的依据。`,
    `口播：${brand.brandName}，${brand.phone}，欢迎预约产品演示。`,
  ];
  let start = 0;
  const used = segments.slice(0, 5);
  const scenes = used.map((seg, i) => {
    const from = start;
    start += seg;
    const last = i === used.length - 1;
    return {
      no: i + 1,
      time: `${from}-${start} 秒`,
      visual: [
        `企业 LOGO 与产品界面动效入画，标题：${topic}`,
        `办公 / 生产场景空镜，团队在系统中协作`,
        main ? `${main.name} 产品演示，关键功能特写` : "核心产品演示",
        main ? `交付与实施过程：${main.ingredients}` : "实施与交付过程",
        `客户访谈或真实使用场景的自然反应`,
      ][i] ?? "企业环境空镜",
      line: input.voiceover === "yes" ? lines[i] : "",
      subtitle: [
        topic,
        `${brand.category} · ${brand.address}`,
        main ? `${main.name} ¥${priceText(main.price)}` : "核心产品",
        brand.highlights.slice(0, 3).join(" · "),
        last ? `${brand.brandName}｜${brand.businessHours}` : "预约产品演示",
      ][i] ?? "",
      transition: i === used.length - 1 ? "定格 + 企业信息" : i % 2 === 0 ? "硬切" : "叠化",
    };
  });
  scenes[scenes.length - 1].time = `${start - segments[used.length - 1]}-${total} 秒`;
  return {
    title: `${total} 秒 ${input.videoType || "产品介绍"} · ${topic}`,
    totalSeconds: total,
    scenes,
    notes: `镜头时长合计 ${total} 秒，与所选时长一致。拍摄条件：${input.shooting || "手机横屏，自然光"}。发布前请核对产品价格、案例授权与服务范围。`,
  };
}

export interface CampaignResult {
  title: string;
  theme: string;
  rules: string[];
  steps: string[];
  copy: string;
  risks: string[];
  notes: string;
}

export function generateCampaign(
  brand: BrandProfile,
  allDishes: Dish[],
  input: CampaignInput,
): CampaignResult {
  const dishes = pickDishes(allDishes, input.dishIds);
  const main = dishes[0];
  const audience = input.audience || brand.audience[0] || "企业客户";
  const goal = input.goal || "获取高质量销售线索";
  const risk = [
    "不擅自承诺具体折扣、效果指标或交付周期，最终以正式报价与合同为准。",
    "活动期间控制接待与演示资源，避免线索跟进不及时。",
    "客户案例与数据需取得授权后方可对外使用。",
  ];
  return {
    title: `活动方案 · ${goal}`,
    theme: `${brand.brandName}「${main ? main.name : "核心产品"}」${audience}体验日`,
    rules: [
      `活动时间：${input.startDate || "待定"} 至 ${input.endDate || "待定"}，线上报名 + 线下专场。`,
      main
        ? `主推产品：${dishLine(main)}，可搭配${dishes[1] ? dishLine(dishes[1]) : "现有服务包"}。`
        : "主推企业现有在售产品与服务组合。",
      `目标人群：${audience}；预算范围：${input.budget || "待定"} 元。`,
      `参与方式：报名审核通过后确认席位，现场或线上完成 30 分钟产品演示。`,
      `限制条件：${input.limits || "同一企业限报名一次；权益以活动页公示为准。"}`,
    ],
    steps: [
      "第 1 天：负责人确认产品、报价口径与活动时间，团队统一话术。",
      "第 2 天：准备产品手册、演示环境与 1 条 30 秒预热视频。",
      "第 3 天：公众号、朋友圈与行业社群同步发布，开启报名表单。",
      "活动期间：每日记录报名与到场线索，48 小时内完成首轮跟进。",
      "活动结束：统计线索质量与转化，保留表现最好的内容形式。",
    ],
    copy: `${brand.brandName}这次把${main ? main.name : "核心产品"}带到台前。${firstSentence(brand.description)}。\n\n${audience}可通过活动页报名，或致电 ${brand.phone} 预约 30 分钟产品演示。\n\n地址：${brand.address}\n服务时间：${brand.businessHours}\n（具体权益以活动页公示为准）`,
    risks: risk,
    notes: "预算与优惠需负责人确认后执行；AI 不自动承诺任何效果或折扣。",
  };
}

export interface RetrievedChunk {
  id: string;
  title: string;
  kind: "dish" | "file";
  content: string;
  score: number;
}

const STOP = new Set([
  "我们",
  "什么",
  "多少",
  "怎么",
  "可以",
  "请问",
  "一下",
  "哪些",
  "有哪",
  "的是",
  "价格",
  "钱吗",
  "少钱",
  "产品",
  "服务",
  "公司",
  "企业",
  "你们",
  "帮我",
  "告诉",
  "一个",
  "这个",
  "那个",
]);

function grams(text: string): string[] {
  const clean = text.replace(/[\s，。！？、,.!?；;：:（）()「」【】]/g, "");
  const set = new Set<string>();
  for (let i = 0; i < clean.length - 1; i++) {
    const g = clean.slice(i, i + 2);
    if (!STOP.has(g)) set.add(g);
  }
  return [...set];
}

export function retrieve(
  query: string,
  dishes: Dish[],
  files: KnowledgeFile[],
): RetrievedChunk[] {
  const q = grams(query);
  const chunks: RetrievedChunk[] = [];
  for (const d of dishes) {
    if (d.status !== "on") continue;
    const text = `${d.name} ${d.category} ${d.description} 价格 ${d.price} 元 ${d.ingredients} ${d.recommendedFor} ${d.spec}`;
    let score = 0;
    for (const g of q) if (text.includes(g)) score += g.length >= 2 ? 1 : 0;
    if (q.some((g) => d.name.includes(g))) score += 3;
    if (score > 0) {
      chunks.push({
        id: d.id,
        title: d.name,
        kind: "dish",
        content: `${d.name}：${priceText(d.price)} 元 / ${d.spec}。${d.description}`,
        score,
      });
    }
  }
  for (const f of files) {
    if (f.status !== "ready") continue;
    let score = 0;
    for (const g of q) if (f.content.includes(g)) score += 1;
    if (f.name.includes(query.trim())) score += 2;
    if (score > 0) {
      chunks.push({
        id: f.id,
        title: f.name,
        kind: "file",
        content: f.content,
        score,
      });
    }
  }
  return chunks.sort((a, b) => b.score - a.score).slice(0, 4);
}

export interface ChatAnswer {
  answer: string;
  sources: { id: string; title: string; kind: "dish" | "file" }[];
  found: boolean;
}

export function answerQuestion(
  query: string,
  brand: BrandProfile | undefined,
  dishes: Dish[],
  files: KnowledgeFile[],
): ChatAnswer {
  const hits = retrieve(query, dishes, files);
  const onSale = dishes.filter((d) => d.status === "on");
  const asksPrice = /价格|多少钱|多少元|几块|贵不贵|报价/.test(query);
  const asksHours = /服务时间|营业|几点|上班|工作时间|值班/.test(query);
  const asksAddress = /地址|在哪|位置|怎么走|公司在哪里/.test(query);
  const asksSignature = /核心产品|主推|推荐|特色|优势|方案|产品有哪些/.test(query);

  if (asksHours) {
    const snippet = files.find((f) => f.status === "ready" && /服务时间|支持时间/.test(f.content));
    return {
      answer: `根据企业资料，${brand?.brandName ?? "本企业"}的服务时间为 ${brand?.businessHours ?? "资料未提供"}。${snippet ? `（来源：${snippet.name}）` : ""}节假日安排以企业实际公告为准。`,
      sources: [
        ...(snippet ? [{ id: snippet.id, title: snippet.name, kind: "file" as const }] : []),
      ],
      found: true,
    };
  }
  if (asksAddress) {
    const snippet = files.find((f) => f.status === "ready" && /地址/.test(f.content));
    return {
      answer: `公司地址：${brand?.address ?? "资料未提供"}。${snippet ? `来访与路线可参考「${snippet.name}」。` : ""}`,
      sources: snippet ? [{ id: snippet.id, title: snippet.name, kind: "file" as const }] : [],
      found: true,
    };
  }

  if (hits.length === 0) {
    return {
      answer:
        "抱歉，当前企业知识库中没有找到相关资料，无法确认。请补充产品、报价或服务资料后再提问，或直接核对企业的实际信息。",
      sources: [],
      found: false,
    };
  }

  if (asksPrice) {
    const dishHits = hits.filter((h) => h.kind === "dish");
    if (dishHits.length === 0) {
      return {
        answer:
          "知识库中没有找到这个产品的确切价格，无法确认。请不要依据推测报价，建议核对「产品与报价手册」或询问负责人。",
        sources: hits.filter((h) => h.kind === "file").map((h) => ({ id: h.id, title: h.title, kind: h.kind })),
        found: false,
      };
    }
    const list = dishHits.map((h) => `· ${h.content}`).join("\n");
    return {
      answer: `根据本企业产品资料：\n${list}\n\n以上价格来自企业资料，最终报价以正式报价单为准。`,
      sources: dishHits.map((h) => ({ id: h.id, title: h.title, kind: h.kind })),
      found: true,
    };
  }

  if (asksSignature) {
    const recommended = (hits.filter((h) => h.kind === "dish").length
      ? hits.filter((h) => h.kind === "dish")
      : onSale.slice(0, 3).map((d) => ({
          id: d.id,
          title: d.name,
          kind: "dish" as const,
          content: `${d.name}：${priceText(d.price)} 元 / ${d.spec}。${d.description}`,
        }))
    ).slice(0, 4);
    const list = recommended.map((h) => `· ${h.content}`).join("\n");
    return {
      answer: `根据产品与知识库资料，重点产品包括：\n${list}\n\n以上信息来自本企业知识库，报价以正式报价单为准。`,
      sources: [
        ...recommended.map((h) => ({ id: h.id, title: h.title, kind: "dish" as const })),
        ...hits
          .filter((h) => h.kind === "file")
          .slice(0, 2)
          .map((h) => ({ id: h.id, title: h.title, kind: h.kind })),
      ],
      found: true,
    };
  }

  const top = hits[0];
  const extra = hits
    .slice(1, 3)
    .map((h) => `· ${h.content}`)
    .join("\n");
  return {
    answer: `根据知识库资料：\n\n${top.content}\n${extra ? `\n相关补充：\n${extra}` : ""}\n\n以上内容来自企业资料，涉及价格与优惠请以正式报价为准。`,
    sources: hits.slice(0, 3).map((h) => ({ id: h.id, title: h.title, kind: h.kind })),
    found: true,
  };
}

export function estimateUsage(type: string, prompt: string, output: string) {
  const inputTokens = Math.round(prompt.length * 1.4) + 120;
  const outputTokens = Math.round(output.length * 1.2);
  return {
    inputTokens,
    outputTokens,
    cost: Number(((inputTokens * 0.000002 + outputTokens * 0.000004) * 10000).toFixed(4)),
  };
}