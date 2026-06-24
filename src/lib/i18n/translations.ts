export type Locale = "en" | "hi" | "es" | "fr" | "pt" | "de" | "ar" | "ja" | "zh" | "ko";

export interface Translations {
  // Hero
  heroBadge: string;
  heroH1: string;
  heroH1Accent: string;
  heroPara: string;
  heroDropTitle: string;
  heroDropHint: string;
  heroStat1Val: string;
  heroStat1Label: string;
  heroStat2Val: string;
  heroStat2Label: string;
  heroStat3Val: string;
  heroStat3Label: string;
  // Features
  featuresH2: string;
  // Steps
  stepsH2: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  // CTA
  ctaH2: string;
  ctaBtn: string;
  ctaPara: string;
  // Nav / misc
  getStarted: string;
  signIn: string;
  // Footer
  footerTagline: string;
  footerAiTools: string;
  footerTools: string;
  footerCompany: string;
  footerRights: string;
  footerLanguage: string;
  // FAQ
  faq1q: string;
  faq1a: string;
  faq2q: string;
  faq2a: string;
  // Pricing
  upgradeTitle: string;
  upgradeDesc: string;
  // Direction
  dir: "ltr" | "rtl";
}

const en: Translations = {
  dir: "ltr",
  heroBadge: "✨ AI-Powered Image Editing — Free to Start",
  heroH1: "Free AI Image Editor",
  heroH1Accent: "Edit with a Single Prompt",
  heroPara: "Remove backgrounds free, upscale photos to 4K, generate AI backgrounds, resize, and transform images — all in one place. No watermark, no software needed.",
  heroDropTitle: "Drop an image here to start editing",
  heroDropHint: "or click to browse · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "AI tools",
  heroStat2Val: "∞", heroStat2Label: "Edits / day",
  heroStat3Val: "Free", heroStat3Label: "To start",
  featuresH2: "Everything you need to edit images with AI",
  stepsH2: "Edit images in 3 simple steps",
  step1Title: "Upload your image", step1Desc: "Drag and drop, click to browse, or describe what you want in the prompt box.",
  step2Title: "Edit with AI", step2Desc: "Pick a tool from the sidebar or type a prompt — JPT AI handles the heavy lifting instantly.",
  step3Title: "Download the result", step3Desc: "Save your edited image in full quality. PNG or JPG, ready to use anywhere.",
  ctaH2: "Start editing for free",
  ctaBtn: "Try JPT AI — It's Free",
  ctaPara: "No credit card required. 10 free credits every day.",
  getStarted: "Get Started Free",
  signIn: "Sign in with Google",
  footerTagline: "All-in-one AI image editor. Remove backgrounds, upscale photos, and edit images with simple text prompts.",
  footerAiTools: "AI Tools",
  footerTools: "Tools",
  footerCompany: "Company",
  footerRights: "All rights reserved.",
  footerLanguage: "Language",
  faq1q: "Is JPT AI free to use?",
  faq1a: "Yes — sign in with your Google account and get 10 free AI credits instantly. No credit card required.",
  faq2q: "Will my results have a watermark?",
  faq2a: "No watermarks, ever. Every image you download is clean and ready to use commercially.",
  upgradeTitle: "Upgrade to Pro",
  upgradeDesc: "Get unlimited credits and access to all premium AI tools.",
};

const hi: Translations = {
  dir: "ltr",
  heroBadge: "✨ AI-संचालित इमेज एडिटिंग — मुफ्त में शुरू करें",
  heroH1: "मुफ्त AI इमेज एडिटर",
  heroH1Accent: "एक प्रॉम्प्ट से एडिट करें",
  heroPara: "बैकग्राउंड मुफ्त हटाएं, फोटो को 4K में अपस्केल करें, AI बैकग्राउंड बनाएं — सब एक जगह। कोई वॉटरमार्क नहीं, कोई सॉफ्टवेयर नहीं।",
  heroDropTitle: "एडिट शुरू करने के लिए यहाँ इमेज छोड़ें",
  heroDropHint: "या ब्राउज़ करने के लिए क्लिक करें · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "AI टूल्स",
  heroStat2Val: "∞", heroStat2Label: "एडिट / दिन",
  heroStat3Val: "मुफ्त", heroStat3Label: "शुरू करें",
  featuresH2: "AI से इमेज एडिट करने के लिए सब कुछ",
  stepsH2: "3 आसान चरणों में इमेज एडिट करें",
  step1Title: "अपनी इमेज अपलोड करें", step1Desc: "ड्रैग-ड्रॉप करें, ब्राउज़ करें, या प्रॉम्प्ट बॉक्स में बताएं।",
  step2Title: "AI से एडिट करें", step2Desc: "साइडबार से टूल चुनें या प्रॉम्प्ट टाइप करें — JPT AI तुरंत काम करेगा।",
  step3Title: "परिणाम डाउनलोड करें", step3Desc: "पूर्ण गुणवत्ता में एडिटेड इमेज सेव करें। PNG या JPG, कहीं भी उपयोग करें।",
  ctaH2: "मुफ्त में एडिट करना शुरू करें",
  ctaBtn: "JPT AI आज़माएं — मुफ्त है",
  ctaPara: "कोई क्रेडिट कार्ड नहीं। हर दिन 10 मुफ्त क्रेडिट।",
  getStarted: "मुफ्त शुरू करें",
  signIn: "Google से साइन इन करें",
  footerTagline: "ऑल-इन-वन AI इमेज एडिटर। बैकग्राउंड हटाएं, फोटो अपस्केल करें।",
  footerAiTools: "AI टूल्स",
  footerTools: "टूल्स",
  footerCompany: "कंपनी",
  footerRights: "सर्वाधिकार सुरक्षित।",
  footerLanguage: "भाषा",
  faq1q: "क्या JPT AI मुफ्त है?",
  faq1a: "हाँ — Google से साइन इन करें और तुरंत 10 मुफ्त AI क्रेडिट पाएं। कोई क्रेडिट कार्ड नहीं।",
  faq2q: "क्या परिणाम में वॉटरमार्क होगा?",
  faq2a: "कभी नहीं। आप जो भी इमेज डाउनलोड करेंगे वो साफ होगी।",
  upgradeTitle: "Pro में अपग्रेड करें",
  upgradeDesc: "असीमित क्रेडिट और सभी प्रीमियम AI टूल्स पाएं।",
};

const es: Translations = {
  dir: "ltr",
  heroBadge: "✨ Edición de imágenes con IA — Gratis para empezar",
  heroH1: "Editor de imágenes IA gratuito",
  heroH1Accent: "Edita con un solo prompt",
  heroPara: "Elimina fondos gratis, mejora fotos a 4K, genera fondos IA, redimensiona y transforma imágenes — todo en un lugar. Sin marca de agua, sin software.",
  heroDropTitle: "Suelta una imagen aquí para empezar",
  heroDropHint: "o haz clic para explorar · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "Herramientas IA",
  heroStat2Val: "∞", heroStat2Label: "Ediciones / día",
  heroStat3Val: "Gratis", heroStat3Label: "Para empezar",
  featuresH2: "Todo lo que necesitas para editar imágenes con IA",
  stepsH2: "Edita imágenes en 3 pasos",
  step1Title: "Sube tu imagen", step1Desc: "Arrastra y suelta, haz clic para explorar o describe lo que quieres.",
  step2Title: "Edita con IA", step2Desc: "Elige una herramienta o escribe un prompt — JPT AI hace el trabajo.",
  step3Title: "Descarga el resultado", step3Desc: "Guarda tu imagen editada en máxima calidad. PNG o JPG, listo para usar.",
  ctaH2: "Empieza a editar gratis",
  ctaBtn: "Prueba JPT AI — Es gratis",
  ctaPara: "Sin tarjeta de crédito. 10 créditos gratis cada día.",
  getStarted: "Empezar gratis",
  signIn: "Iniciar sesión con Google",
  footerTagline: "Editor de imágenes IA todo en uno. Elimina fondos, mejora fotos y edita con prompts.",
  footerAiTools: "Herramientas IA",
  footerTools: "Herramientas",
  footerCompany: "Empresa",
  footerRights: "Todos los derechos reservados.",
  footerLanguage: "Idioma",
  faq1q: "¿Es gratuito JPT AI?",
  faq1a: "Sí — inicia sesión con Google y obtén 10 créditos gratis al instante. Sin tarjeta de crédito.",
  faq2q: "¿Los resultados tendrán marca de agua?",
  faq2a: "Nunca. Cada imagen que descargues estará limpia y lista para uso comercial.",
  upgradeTitle: "Actualizar a Pro",
  upgradeDesc: "Obtén créditos ilimitados y acceso a todas las herramientas IA premium.",
};

const fr: Translations = {
  dir: "ltr",
  heroBadge: "✨ Édition d'images par IA — Gratuit pour commencer",
  heroH1: "Éditeur d'images IA gratuit",
  heroH1Accent: "Modifiez avec une seule invite",
  heroPara: "Supprimez les arrière-plans gratuitement, améliorez les photos en 4K, générez des arrière-plans IA — tout en un endroit. Sans filigrane, sans logiciel.",
  heroDropTitle: "Déposez une image ici pour commencer",
  heroDropHint: "ou cliquez pour parcourir · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "Outils IA",
  heroStat2Val: "∞", heroStat2Label: "Modifications / jour",
  heroStat3Val: "Gratuit", heroStat3Label: "Pour commencer",
  featuresH2: "Tout ce dont vous avez besoin pour éditer des images avec l'IA",
  stepsH2: "Modifiez des images en 3 étapes simples",
  step1Title: "Téléchargez votre image", step1Desc: "Glissez-déposez, cliquez pour parcourir ou décrivez ce que vous voulez.",
  step2Title: "Modifiez avec l'IA", step2Desc: "Choisissez un outil ou tapez une invite — JPT AI s'occupe du reste.",
  step3Title: "Téléchargez le résultat", step3Desc: "Enregistrez votre image modifiée en pleine qualité. PNG ou JPG, prêt à utiliser.",
  ctaH2: "Commencez à modifier gratuitement",
  ctaBtn: "Essayez JPT AI — C'est gratuit",
  ctaPara: "Aucune carte de crédit requise. 10 crédits gratuits chaque jour.",
  getStarted: "Commencer gratuitement",
  signIn: "Se connecter avec Google",
  footerTagline: "Éditeur d'images IA tout-en-un. Supprimez les arrière-plans, améliorez les photos.",
  footerAiTools: "Outils IA",
  footerTools: "Outils",
  footerCompany: "Entreprise",
  footerRights: "Tous droits réservés.",
  footerLanguage: "Langue",
  faq1q: "JPT AI est-il gratuit?",
  faq1a: "Oui — connectez-vous avec Google et obtenez 10 crédits IA gratuitement. Aucune carte requise.",
  faq2q: "Les résultats auront-ils un filigrane?",
  faq2a: "Jamais. Chaque image téléchargée est propre et prête pour un usage commercial.",
  upgradeTitle: "Passer à Pro",
  upgradeDesc: "Obtenez des crédits illimités et accédez à tous les outils IA premium.",
};

const pt: Translations = {
  dir: "ltr",
  heroBadge: "✨ Edição de imagens com IA — Grátis para começar",
  heroH1: "Editor de imagens IA gratuito",
  heroH1Accent: "Edite com um único prompt",
  heroPara: "Remova fundos grátis, melhore fotos para 4K, gere fundos IA, redimensione e transforme imagens — tudo em um lugar. Sem marca d'água, sem software.",
  heroDropTitle: "Solte uma imagem aqui para começar",
  heroDropHint: "ou clique para procurar · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "Ferramentas IA",
  heroStat2Val: "∞", heroStat2Label: "Edições / dia",
  heroStat3Val: "Grátis", heroStat3Label: "Para começar",
  featuresH2: "Tudo que você precisa para editar imagens com IA",
  stepsH2: "Edite imagens em 3 etapas simples",
  step1Title: "Faça upload da sua imagem", step1Desc: "Arraste e solte, clique para procurar ou descreva o que você quer.",
  step2Title: "Edite com IA", step2Desc: "Escolha uma ferramenta ou digite um prompt — JPT AI faz o trabalho.",
  step3Title: "Baixe o resultado", step3Desc: "Salve sua imagem editada em qualidade total. PNG ou JPG, pronto para usar.",
  ctaH2: "Comece a editar gratuitamente",
  ctaBtn: "Experimente JPT AI — É grátis",
  ctaPara: "Sem cartão de crédito. 10 créditos grátis todo dia.",
  getStarted: "Começar grátis",
  signIn: "Entrar com Google",
  footerTagline: "Editor de imagens IA tudo-em-um. Remova fundos, melhore fotos e edite com prompts.",
  footerAiTools: "Ferramentas IA",
  footerTools: "Ferramentas",
  footerCompany: "Empresa",
  footerRights: "Todos os direitos reservados.",
  footerLanguage: "Idioma",
  faq1q: "JPT AI é gratuito?",
  faq1a: "Sim — entre com o Google e ganhe 10 créditos IA instantaneamente. Sem cartão de crédito.",
  faq2q: "Os resultados terão marca d'água?",
  faq2a: "Nunca. Cada imagem baixada está limpa e pronta para uso comercial.",
  upgradeTitle: "Atualizar para Pro",
  upgradeDesc: "Obtenha créditos ilimitados e acesso a todas as ferramentas IA premium.",
};

const de: Translations = {
  dir: "ltr",
  heroBadge: "✨ KI-gestützte Bildbearbeitung — Kostenlos starten",
  heroH1: "Kostenloser KI-Bildeditor",
  heroH1Accent: "Bearbeiten mit einem Prompt",
  heroPara: "Hintergründe kostenlos entfernen, Fotos auf 4K hochskalieren, KI-Hintergründe generieren — alles an einem Ort. Kein Wasserzeichen, keine Software.",
  heroDropTitle: "Bild hier ablegen um zu starten",
  heroDropHint: "oder klicken zum Durchsuchen · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "KI-Tools",
  heroStat2Val: "∞", heroStat2Label: "Bearbeitungen / Tag",
  heroStat3Val: "Gratis", heroStat3Label: "Zum Starten",
  featuresH2: "Alles was Sie für KI-Bildbearbeitung brauchen",
  stepsH2: "Bilder in 3 einfachen Schritten bearbeiten",
  step1Title: "Bild hochladen", step1Desc: "Drag & Drop, klicken zum Durchsuchen oder beschreiben was Sie wollen.",
  step2Title: "Mit KI bearbeiten", step2Desc: "Tool auswählen oder Prompt eingeben — JPT AI erledigt den Rest.",
  step3Title: "Ergebnis herunterladen", step3Desc: "Bearbeitetes Bild in voller Qualität speichern. PNG oder JPG, fertig zum Verwenden.",
  ctaH2: "Kostenlos mit dem Bearbeiten beginnen",
  ctaBtn: "JPT AI ausprobieren — Kostenlos",
  ctaPara: "Keine Kreditkarte erforderlich. 10 kostenlose Credits täglich.",
  getStarted: "Kostenlos starten",
  signIn: "Mit Google anmelden",
  footerTagline: "All-in-one KI-Bildeditor. Hintergründe entfernen, Fotos hochskalieren und mit Prompts bearbeiten.",
  footerAiTools: "KI-Tools",
  footerTools: "Tools",
  footerCompany: "Unternehmen",
  footerRights: "Alle Rechte vorbehalten.",
  footerLanguage: "Sprache",
  faq1q: "Ist JPT AI kostenlos?",
  faq1a: "Ja — mit Google anmelden und sofort 10 kostenlose KI-Credits erhalten. Keine Kreditkarte.",
  faq2q: "Haben die Ergebnisse ein Wasserzeichen?",
  faq2a: "Nie. Jedes heruntergeladene Bild ist sauber und für kommerzielle Nutzung bereit.",
  upgradeTitle: "Auf Pro upgraden",
  upgradeDesc: "Unbegrenzte Credits und Zugang zu allen Premium-KI-Tools.",
};

const ar: Translations = {
  dir: "rtl",
  heroBadge: "✨ تحرير الصور بالذكاء الاصطناعي — ابدأ مجاناً",
  heroH1: "محرر صور ذكاء اصطناعي مجاني",
  heroH1Accent: "حرّر بأمر واحد فقط",
  heroPara: "أزل الخلفيات مجاناً، حسّن الصور إلى 4K، أنشئ خلفيات بالذكاء الاصطناعي — كل ذلك في مكان واحد. بدون علامة مائية، بدون برنامج.",
  heroDropTitle: "أسقط صورة هنا للبدء",
  heroDropHint: "أو انقر للتصفح · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "أدوات ذكاء اصطناعي",
  heroStat2Val: "∞", heroStat2Label: "تعديلات / يوم",
  heroStat3Val: "مجاني", heroStat3Label: "للبدء",
  featuresH2: "كل ما تحتاجه لتحرير الصور بالذكاء الاصطناعي",
  stepsH2: "حرّر الصور في 3 خطوات بسيطة",
  step1Title: "ارفع صورتك", step1Desc: "اسحب وأفلت، انقر للتصفح، أو صف ما تريد في مربع الأوامر.",
  step2Title: "حرّر بالذكاء الاصطناعي", step2Desc: "اختر أداة أو اكتب أمراً — JPT AI يتولى الباقي فوراً.",
  step3Title: "نزّل النتيجة", step3Desc: "احفظ صورتك المحررة بجودة كاملة. PNG أو JPG، جاهزة للاستخدام.",
  ctaH2: "ابدأ التحرير مجاناً",
  ctaBtn: "جرّب JPT AI — إنه مجاني",
  ctaPara: "لا حاجة لبطاقة ائتمان. 10 رصيد مجاني كل يوم.",
  getStarted: "ابدأ مجاناً",
  signIn: "تسجيل الدخول بـ Google",
  footerTagline: "محرر صور ذكاء اصطناعي متكامل. أزل الخلفيات، حسّن الصور، وحررها بأوامر نصية.",
  footerAiTools: "أدوات الذكاء الاصطناعي",
  footerTools: "الأدوات",
  footerCompany: "الشركة",
  footerRights: "جميع الحقوق محفوظة.",
  footerLanguage: "اللغة",
  faq1q: "هل JPT AI مجاني؟",
  faq1a: "نعم — سجّل الدخول بـ Google واحصل على 10 رصيد مجاني فوراً. بدون بطاقة ائتمان.",
  faq2q: "هل ستحتوي النتائج على علامة مائية؟",
  faq2a: "أبداً. كل صورة تنزّلها ستكون نظيفة وجاهزة للاستخدام التجاري.",
  upgradeTitle: "الترقية إلى Pro",
  upgradeDesc: "احصل على رصيد غير محدود والوصول إلى جميع أدوات الذكاء الاصطناعي المميزة.",
};

const ja: Translations = {
  dir: "ltr",
  heroBadge: "✨ AI画像編集 — 無料で始める",
  heroH1: "無料AIイメージエディター",
  heroH1Accent: "ひとつのプロンプトで編集",
  heroPara: "背景を無料で削除、写真を4Kにアップスケール、AI背景を生成 — すべて一か所で。透かしなし、ソフト不要。",
  heroDropTitle: "ここに画像をドロップして編集開始",
  heroDropHint: "またはクリックして参照 · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "AIツール",
  heroStat2Val: "∞", heroStat2Label: "編集/日",
  heroStat3Val: "無料", heroStat3Label: "開始",
  featuresH2: "AI画像編集に必要なすべて",
  stepsH2: "3ステップで画像を編集",
  step1Title: "画像をアップロード", step1Desc: "ドラッグ＆ドロップ、クリックで参照、またはプロンプトボックスで説明。",
  step2Title: "AIで編集", step2Desc: "ツールを選択するかプロンプトを入力 — JPT AIがすぐに処理します。",
  step3Title: "結果をダウンロード", step3Desc: "編集した画像を最高品質で保存。PNG またはJPG、どこでも使用可能。",
  ctaH2: "無料で編集を始める",
  ctaBtn: "JPT AIを試す — 無料です",
  ctaPara: "クレジットカード不要。毎日10クレジット無料。",
  getStarted: "無料で始める",
  signIn: "Googleでサインイン",
  footerTagline: "オールインワンAI画像エディター。背景削除、写真アップスケール、テキストプロンプトで編集。",
  footerAiTools: "AIツール",
  footerTools: "ツール",
  footerCompany: "会社",
  footerRights: "全著作権所有。",
  footerLanguage: "言語",
  faq1q: "JPT AIは無料ですか？",
  faq1a: "はい — Googleでサインインして今すぐ10クレジットを無料で取得。クレジットカード不要。",
  faq2q: "結果に透かしが入りますか？",
  faq2a: "絶対にありません。ダウンロードするすべての画像はクリーンで商用利用可能です。",
  upgradeTitle: "Proにアップグレード",
  upgradeDesc: "無制限のクレジットとすべてのプレミアムAIツールへのアクセスを取得。",
};

const zh: Translations = {
  dir: "ltr",
  heroBadge: "✨ AI图像编辑 — 免费开始",
  heroH1: "免费AI图像编辑器",
  heroH1Accent: "一个提示词完成编辑",
  heroPara: "免费删除背景，将照片升级到4K，生成AI背景，调整大小并变换图像 — 一站式解决。无水印，无需软件。",
  heroDropTitle: "将图像拖放到此处开始编辑",
  heroDropHint: "或点击浏览 · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "AI工具",
  heroStat2Val: "∞", heroStat2Label: "编辑/天",
  heroStat3Val: "免费", heroStat3Label: "开始",
  featuresH2: "AI图像编辑所需的一切",
  stepsH2: "3步编辑图像",
  step1Title: "上传您的图像", step1Desc: "拖放、点击浏览或在提示框中描述您想要的内容。",
  step2Title: "用AI编辑", step2Desc: "从侧边栏选择工具或输入提示词 — JPT AI立即处理。",
  step3Title: "下载结果", step3Desc: "以完整质量保存编辑后的图像。PNG或JPG，可随处使用。",
  ctaH2: "免费开始编辑",
  ctaBtn: "试用JPT AI — 免费",
  ctaPara: "无需信用卡。每天10个免费积分。",
  getStarted: "免费开始",
  signIn: "使用Google登录",
  footerTagline: "一站式AI图像编辑器。删除背景、升级照片并用文字提示编辑图像。",
  footerAiTools: "AI工具",
  footerTools: "工具",
  footerCompany: "公司",
  footerRights: "版权所有。",
  footerLanguage: "语言",
  faq1q: "JPT AI是免费的吗？",
  faq1a: "是的 — 用Google登录立即获得10个免费AI积分。无需信用卡。",
  faq2q: "结果会有水印吗？",
  faq2a: "绝不。您下载的每张图像都是干净的，可用于商业用途。",
  upgradeTitle: "升级到Pro",
  upgradeDesc: "获得无限积分并访问所有高级AI工具。",
};

const ko: Translations = {
  dir: "ltr",
  heroBadge: "✨ AI 이미지 편집 — 무료로 시작",
  heroH1: "무료 AI 이미지 에디터",
  heroH1Accent: "하나의 프롬프트로 편집",
  heroPara: "배경 무료 제거, 사진을 4K로 업스케일, AI 배경 생성 — 모두 한 곳에서. 워터마크 없음, 소프트웨어 불필요.",
  heroDropTitle: "여기에 이미지를 드래그해서 편집 시작",
  heroDropHint: "또는 클릭해서 찾아보기 · JPG · PNG · WEBP",
  heroStat1Val: "6", heroStat1Label: "AI 도구",
  heroStat2Val: "∞", heroStat2Label: "편집 / 일",
  heroStat3Val: "무료", heroStat3Label: "시작",
  featuresH2: "AI로 이미지를 편집하는 데 필요한 모든 것",
  stepsH2: "3단계로 이미지 편집",
  step1Title: "이미지 업로드", step1Desc: "드래그 앤 드롭, 클릭하여 찾아보기, 또는 프롬프트 박스에 설명.",
  step2Title: "AI로 편집", step2Desc: "도구를 선택하거나 프롬프트 입력 — JPT AI가 즉시 처리합니다.",
  step3Title: "결과 다운로드", step3Desc: "편집된 이미지를 최고 품질로 저장. PNG 또는 JPG, 어디서든 사용 가능.",
  ctaH2: "무료로 편집 시작",
  ctaBtn: "JPT AI 사용해보기 — 무료",
  ctaPara: "신용카드 불필요. 매일 10 무료 크레딧.",
  getStarted: "무료로 시작",
  signIn: "Google로 로그인",
  footerTagline: "올인원 AI 이미지 에디터. 배경 제거, 사진 업스케일, 텍스트 프롬프트로 편집.",
  footerAiTools: "AI 도구",
  footerTools: "도구",
  footerCompany: "회사",
  footerRights: "모든 권리 보유.",
  footerLanguage: "언어",
  faq1q: "JPT AI는 무료인가요?",
  faq1a: "네 — Google로 로그인하고 즉시 10 무료 AI 크레딧 획득. 신용카드 불필요.",
  faq2q: "결과에 워터마크가 있나요?",
  faq2a: "절대 없습니다. 다운로드하는 모든 이미지는 깨끗하고 상업적 사용이 가능합니다.",
  upgradeTitle: "Pro로 업그레이드",
  upgradeDesc: "무제한 크레딧과 모든 프리미엄 AI 도구 접근 권한 획득.",
};

export const TRANSLATIONS: Record<Locale, Translations> = { en, hi, es, fr, pt, de, ar, ja, zh, ko };

export const LANGUAGES: { code: Locale; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English",    nativeName: "English",    flag: "🇺🇸" },
  { code: "hi", name: "Hindi",      nativeName: "हिन्दी",      flag: "🇮🇳" },
  { code: "es", name: "Spanish",    nativeName: "Español",    flag: "🇪🇸" },
  { code: "fr", name: "French",     nativeName: "Français",   flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", nativeName: "Português",  flag: "🇧🇷" },
  { code: "de", name: "German",     nativeName: "Deutsch",    flag: "🇩🇪" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",    flag: "🇸🇦" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",      flag: "🇯🇵" },
  { code: "zh", name: "Chinese",    nativeName: "中文",        flag: "🇨🇳" },
  { code: "ko", name: "Korean",     nativeName: "한국어",      flag: "🇰🇷" },
];
