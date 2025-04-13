export const poemData = {
  title: "静夜思",
  lines: [
    {
      chinese: "床前明月光",
      pinyin: "Chuáng qián míng yuè guāng",
      translation: "Bright moonlight before my bed",
      explanation: "描绘了诗人床前洒满皎洁月光的景象",
    },
    {
      chinese: "疑是地上霜",
      pinyin: "Yí shì dì shàng shuāng",
      translation: "Seems like frost on the ground",
      explanation: "通过比喻手法表现月光的清冷皎洁",
    },
    {
      chinese: "举头望明月",
      pinyin: "Jǔ tóu wàng míng yuè",
      translation: "Raising my head to gaze at the moon",
      explanation: "通过动作描写展现思乡之情",
    },
    {
      chinese: "低头思故乡",
      pinyin: "Dī tóu sī gù xiāng",
      translation: "Lowering my head, I miss my homeland",
      explanation: "直抒胸臆表达深切的思乡情怀",
    },
  ],
  author: "李白",
  dynasty: "唐",
  explanation:
    "这首五言绝句通过简洁明快的语言，描绘了秋夜望月思乡的情景。诗人运用对比手法，将月光比作白霜，通过'举头'与'低头'的动作变化，生动刻画了游子思乡的心理活动，展现了李白诗歌清新自然、意境深远的艺术特色。",
  historicalCulturalContext:
    "创作于盛唐时期，反映了当时文人漫游求仕的社会风气。唐代交通不便，文人离乡背井求取功名成为常态，思乡主题在唐诗中极为常见。李白此诗以寻常景物寄寓深沉情感，成为千古传诵的思乡名篇。",
  imageryAndSymbolism: {
    moonlight: "月光象征着纯洁与遥远，既是自然现象，也是唤起诗人思乡情怀的触发点。",
    frost: "霜象征冷清寂寞的心境，通过自然景象折射诗人内心的孤独。",
  },
  aiPoweredAnalysis: {
    emotionalTone: {
      "en-US": "The poem conveys a deep sense of nostalgia and longing through the interplay of moonlight and reflection. The emotional progression moves from quiet observation to profound homesickness.",
      "zh-CN": "这首诗通过月光与思考的互动传达出深深的乡愁。情感从平静的观察逐渐过渡到深切的思乡之情。"
    },
    literaryTechniques: {
      "en-US": "Li Bai masterfully employs imagery, metaphor, and contrasting perspectives to create a profound emotional impact with remarkable economy of language.",
      "zh-CN": "李白巧妙地运用意象、比喻和对比视角，以简练的语言创造出深刻的情感效果。"
    },
    modernRelevance: {
      "en-US": "The themes of separation and longing resonate strongly in our modern world of global mobility and digital connection.",
      "zh-CN": "在全球流动性和数字连接的现代世界中，离别和思念的主题引起强烈共鸣。"
    },
    rhythmPattern: {
      structure: "五言绝句",
      lines: [
        {
          text: "床前明月光",
          tones: ["平", "平", "平", "仄", "平"],
          annotation: "First line establishes the scene with a balanced tonal pattern"
        },
        {
          text: "疑是地上霜",
          tones: ["平", "仄", "仄", "平", "平"],
          annotation: "Second line uses contrasting tones to create tension"
        },
        {
          text: "举头望明月",
          tones: ["仄", "平", "仄", "平", "仄"],
          annotation: "Third line shifts the rhythm to mirror the upward gaze"
        },
        {
          text: "低头思故乡",
          tones: ["平", "平", "平", "仄", "平"],
          annotation: "Final line returns to a balanced pattern for closure"
        }
      ],
      rules: {
        "en-US": [
          "Each line contains exactly five characters",
          "Tonal pattern alternates between level (平) and oblique (仄) tones",
          "Key positions (end of lines) typically use level tones for stability"
        ],
        "zh-CN": [
          "每句均为五字",
          "平仄交替使用",
          "关键位置（句末）多用平声以求稳定"
        ]
      }
    },
    emotionalJourney: [
      {
        name: {
          "en-US": "Observation",
          "zh-CN": "观察"
        },
        lines: "1-2",
        intensity: 40,
        color: "#4A90E2",
        explanation: {
          "en-US": "The poem opens with quiet, contemplative observation of natural phenomena",
          "zh-CN": "诗歌以对自然现象的平静、沉思的观察开篇"
        }
      },
      {
        name: {
          "en-US": "Connection",
          "zh-CN": "联系"
        },
        lines: "3",
        intensity: 70,
        color: "#9B51E0",
        explanation: {
          "en-US": "The act of looking up at the moon creates a bridge between the poet and home",
          "zh-CN": "抬头望月的动作在诗人与家乡之间架起一座桥梁"
        }
      },
      {
        name: {
          "en-US": "Longing",
          "zh-CN": "思念"
        },
        lines: "4",
        intensity: 90,
        color: "#E24A4A",
        explanation: {
          "en-US": "The poem culminates in an expression of profound homesickness",
          "zh-CN": "诗歌以深切的思乡之情达到高潮"
        }
      }
    ],
    literaryDevices: [
      {
        name: {
          "en-US": "Visual Metaphor",
          "zh-CN": "视觉比喻"
        },
        description: {
          "en-US": "Moonlight is compared to frost, creating a visual parallel between celestial and terrestrial elements",
          "zh-CN": "将月光比作霜，在天空与大地之间创造视觉平行"
        },
        color: "#F5A623",
        lines: ["疑是地上霜"]
      },
      {
        name: {
          "en-US": "Spatial Contrast",
          "zh-CN": "空间对比"
        },
        description: {
          "en-US": "Juxtaposition of upward and downward gazes creates emotional depth",
          "zh-CN": "举头与低头的对比创造情感深度"
        },
        color: "#4A90E2",
        lines: ["举头望明月", "低头思故乡"]
      }
    ],
    structure: {
      form: {
        "en-US": "Five-character quatrain (Wuyan Jueju)",
        "zh-CN": "五言绝句"
      },
      characteristics: [
        {
          "en-US": "Compact four-line structure with precise rhythm",
          "zh-CN": "简洁的四行结构，节奏准确"
        },
        {
          "en-US": "Traditional tonal pattern following Tang dynasty rules",
          "zh-CN": "遵循唐代格律的传统声调模式"
        },
        {
          "en-US": "Symmetrical composition with parallel imagery",
          "zh-CN": "对称的构图，意象平行"
        }
      ]
    },
    historicalComparisons: [
      {
        aspect: {
          "en-US": "Communication Methods",
          "zh-CN": "通讯方式"
        },
        then: {
          "en-US": "Letters and physical messages",
          "zh-CN": "书信和实物信息"
        },
        now: {
          "en-US": "Instant digital messaging",
          "zh-CN": "即时数字通讯"
        }
      },
      {
        aspect: {
          "en-US": "Travel Capabilities",
          "zh-CN": "旅行能力"
        },
        then: {
          "en-US": "Limited by physical constraints",
          "zh-CN": "受物理条件限制"
        },
        now: {
          "en-US": "Global mobility and accessibility",
          "zh-CN": "全球流动性和可达性"
        }
      }
    ],
    culturalSignificance: {
      "en-US": "The moon serves as a universal symbol connecting separated loved ones, particularly resonant in Chinese culture where the Moon Festival celebrates family reunion.",
      "zh-CN": "月亮作为连接分离亲人的普遍象征，在中国文化中尤其具有意义，中秋节庆祝家人团圆就体现了这一点。"
    }
  },
  vocabulary: [
    { word: "床", pinyin: "chuáng", meaning: "bed", level: "HSK1" },
    { word: "前", pinyin: "qián", meaning: "before, in front", level: "HSK1" },
    { word: "明月", pinyin: "míng yuè", meaning: "bright moon", level: "HSK3" },
    { word: "光", pinyin: "guāng", meaning: "light", level: "HSK2" },
    { word: "疑", pinyin: "yí", meaning: "to doubt, to suspect", level: "HSK4" },
    { word: "是", pinyin: "shì", meaning: "to be", level: "HSK1" },
    { word: "地", pinyin: "dì", meaning: "ground, earth", level: "HSK1" },
    { word: "上", pinyin: "shàng", meaning: "on, above", level: "HSK1" },
    { word: "霜", pinyin: "shuāng", meaning: "frost", level: "HSK5" },
    { word: "举头", pinyin: "jǔ tóu", meaning: "to raise one's head", level: "HSK4" },
    { word: "望", pinyin: "wàng", meaning: "to gaze at, to look at", level: "HSK3" },
    { word: "低头", pinyin: "dī tóu", meaning: "to lower one's head", level: "HSK3" },
    { word: "思", pinyin: "sī", meaning: "to think of, to miss", level: "HSK3" },
    { word: "故乡", pinyin: "gù xiāng", meaning: "hometown, native place", level: "HSK4" },
  ],
}

