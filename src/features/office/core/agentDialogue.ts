import type { OfficeAgent } from "@/features/office/core/agents";

export type AgentRole =
  | "frontend"
  | "backend"
  | "fullstack"
  | "ceo"
  | "manager"
  | "finance"
  | "secretary"
  | "coordinator"
  | "hospitality"
  | "guest"
  | "break"
  | "general";

export type DialogueTurn = {
  speaker: "a" | "b";
  text: string;
};

const ROLE_ALIASES: Array<{ role: AgentRole; patterns: RegExp[] }> = [
  { role: "frontend", patterns: [/فرانت|frontend|front[\s-]?end|ui|ux/i] },
  { role: "backend", patterns: [/بک.?اند|backend|back[\s-]?end|api|سرور/i] },
  {
    role: "fullstack",
    patterns: [/دولوپر|fullstack|full[\s-]?stack|برنامه.?نویس|developer/i],
  },
  { role: "ceo", patterns: [/مدیرعامل|ceo|chief/i] },
  { role: "manager", patterns: [/^مدیر$|مدیریت|manager|lead/i] },
  { role: "finance", patterns: [/مالی|finance|حسابدار|cfo/i] },
  { role: "secretary", patterns: [/منشی|secretary|دستیار/i] },
  {
    role: "coordinator",
    patterns: [/هماهنگ|coordinator|pm|اسکرام|scrum/i],
  },
  {
    role: "hospitality",
    patterns: [/مهماندار|آبدارچی|barista|hospitality/i],
  },
  { role: "guest", patterns: [/مهمان|guest|client|مشتری/i] },
  { role: "break", patterns: [/استراحت|break|قهوه/i] },
];

export function resolveAgentRole(name: string): AgentRole {
  for (const entry of ROLE_ALIASES) {
    if (entry.patterns.some((pattern) => pattern.test(name))) {
      return entry.role;
    }
  }
  return "general";
}

export function roleLabelFa(role: AgentRole): string {
  switch (role) {
    case "frontend":
      return "فرانت‌اند";
    case "backend":
      return "بک‌اند";
    case "fullstack":
      return "توسعه‌دهنده";
    case "ceo":
      return "مدیرعامل";
    case "manager":
      return "مدیر";
    case "finance":
      return "مالی";
    case "secretary":
      return "منشی";
    case "coordinator":
      return "هماهنگ‌کننده";
    case "hospitality":
      return "مهماندار";
    case "guest":
      return "مهمان";
    case "break":
      return "استراحت";
    case "general":
      return "همکار";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function pairKey(a: AgentRole, b: AgentRole): string {
  return [a, b].sort().join("|");
}

type ScriptFactory = (aName: string, bName: string) => DialogueTurn[];

/** Long specialty dialogues keyed by sorted role pair. */
const PAIR_SCRIPTS: Record<string, ScriptFactory[]> = {
  [`${"backend"}|${"frontend"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، روی endpoint پروفایل هنوز pagination و filter سمت سرور نداریم؛ الان کل لیست رو می‌کشم و کلاینت فیلتر می‌کنه.`,
      },
      {
        speaker: "b",
        text: `آره، برای جدول کاربران سنگین می‌شه. من cursor-based می‌ذارم با limit و sort ثابت؛ contract رو در OpenAPI آپدیت می‌کنم.`,
      },
      {
        speaker: "a",
        text: `عالی. فقط فیلد avatarUrl رو nullable نگه دار؛ اسکلتون UI بدون شکست رندر بشه. برای error هم کد ۴۲۹ و ۵۰۳ جدا باشه.`,
      },
      {
        speaker: "b",
        text: `روی ۴۲۹ Retry-After می‌فرستم. کش Redis هم برای لیست اول صفحه یک دقیقه TTL داره؛ invalidation بعد از PATCH پروفایل.`,
      },
      {
        speaker: "a",
        text: `پس من React Query رو با staleTime هم‌تراز می‌کنم و optimistic update فقط روی نام و ایمیل می‌مونه، نه روی نقش‌ها.`,
      },
      {
        speaker: "b",
        text: `اوکی. امشب قبل از merge یک contract test با Pact هم می‌زنم تا اسکیمای response نشکند.`,
      },
      {
        speaker: "a",
        text: `دمَت گرم. اگر تا ساعت ۵ آماده شد، من PR فرانت رو وصل می‌کنم به staging.`,
      },
      {
        speaker: "b",
        text: `حتماً. اگر گلوگاه query بود، ایندکس (tenant_id, updated_at) رو هم اضافه می‌کنم.`,
      },
    ],
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، SSR صفحه داشبورد LCP رو بالا برده. می‌تونیم دادهٔ ویجت‌های سنگین رو به CSR موکول کنیم؟`,
      },
      {
        speaker: "b",
        text: `آره. یک BFF سبک با GraphQL gateway می‌ذارم؛ فقط summary در SSR و جزئیات با lazy query.`,
      },
      {
        speaker: "a",
        text: `برای hydration mismatch هم باید تاریخ‌ها UTC بمونن. من timezone رو فقط در فرمت نمایش اعمال می‌کنم.`,
      },
      {
        speaker: "b",
        text: `درسته. لاگ‌های API هم correlation-id می‌گیرن تا تو Sentry فرانت و بک به هم بچسبن.`,
      },
      {
        speaker: "a",
        text: `پس من error boundary مخصوص ویجت‌ها می‌ذارم که یک ویجت کل صفحه رو نندازه.`,
      },
      {
        speaker: "b",
        text: `و من rate limit روی summary رو شل‌تر می‌کنم چون SSR همزمان چند instance می‌زنه.`,
      },
      {
        speaker: "a",
        text: `جمعه برای performance budget روی Lighthouse CI هم آستانه LCP رو ۹۰ می‌ذاریم؟`,
      },
      {
        speaker: "b",
        text: `موافقم. اگر رد شد، pipeline قرمز بشه تا رجعت نکنیم.`,
      },
    ],
  ],
  [`${"backend"}|${"fullstack"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، تراکنش پرداخت هنوز بدون idempotency-key تکرار می‌شه وقتی کلاینت retry می‌کنه.`,
      },
      {
        speaker: "b",
        text: `کلید رو از هدر می‌خونم و در جدول payments یکتاش می‌کنم. پاسخ تکراری همون ۲۰۱ قبلی برمی‌گرده.`,
      },
      {
        speaker: "a",
        text: `برای outbox هم event PaymentCaptured رو بعد از commit بفرست، نه وسط تراکنش؛ وگرنه double-charge می‌گیریم.`,
      },
      {
        speaker: "b",
        text: `آره، transactional outbox با worker جدا. DLQ هم برای eventهای fail گذاشتم.`,
      },
      {
        speaker: "a",
        text: `روی webhook بانک signature HMAC رو harden کن؛ clock skew بیشتر از ۳۰ ثانیه reject.`,
      },
      {
        speaker: "b",
        text: `انجام می‌دم. متریک success-rate پرداخت رو هم تو Grafana با alert زیر ۹۹٪ می‌ذارم.`,
      },
      {
        speaker: "a",
        text: `عالی. بعدش با هم chaos تست قطع Redis رو یک دور می‌ریم.`,
      },
      {
        speaker: "b",
        text: `حتماً — fallback باید صف محلی باشه، نه silent fail.`,
      },
    ],
  ],
  [`${"frontend"}|${"fullstack"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، design system دکمه‌ها variant خطرناک داره ولی تو فرم حذف هنوز secondary استفاده شده.`,
      },
      {
        speaker: "b",
        text: `اوکی، به destructive تغییر می‌دم و confirm modal با focus trap درست می‌کنم برای a11y.`,
      },
      {
        speaker: "a",
        text: `برای موبایل هم hit-area حداقل ۴۴ باشه. استوری Storybook رو هم برای حالت loading و disabled آپدیت کن.`,
      },
      {
        speaker: "b",
        text: `می‌ذارم. روی virtualized لیست هم overscan رو کم می‌کنم چون روی لپ‌تاپ‌های ضعیف jank داریم.`,
      },
      {
        speaker: "a",
        text: `اگر React Compiler هشدار pure نبودن داد، side-effect رو از render بیرون بکش.`,
      },
      {
        speaker: "b",
        text: `آره، analytics رو به useEffectEvent منتقل کردم. PR تا عصر آمادهٔ review است.`,
      },
      {
        speaker: "a",
        text: `من هم visual regression با Playwright screenshot می‌گیرم روی dark/light.`,
      },
      {
        speaker: "b",
        text: `دمَت گرم. اگر flaky شد، wait برای font load رو اضافه کن.`,
      },
    ],
  ],
  [`${"ceo"}|${"manager"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، برای Q3 باید burn rate رو نگه داریم زیر سقف. کدوم initiative رو می‌تونیم یک اسپرینت عقب بندازیم؟`,
      },
      {
        speaker: "b",
        text: `ماژول گزارش پیشرفته کمتر از CRM روی درآمد اثر داره. پیشنهاد می‌کنم CRM و onboarding رو اولویت نگه داریم.`,
      },
      {
        speaker: "a",
        text: `موافتم. فقط یک demo قابل‌فروش تا پایان ماه لازم داریم برای دو مشتری enterprise.`,
      },
      {
        speaker: "b",
        text: `اسکوپ demo رو به سه فلو کلیدی می‌بندم: ساخت workspace، دعوت عضو، و داشبورد وضعیت.`,
      },
      {
        speaker: "a",
        text: `ریسک قانونی ذخیره‌سازی داده در منطقهٔ ما چطوره؟ حقوقی چیزی گفته؟`,
      },
      {
        speaker: "b",
        text: `باید DPA رو قبل از go-live امضا کنیم و لاگ دسترسی ادمین را ۹۰ روز نگه داریم.`,
      },
      {
        speaker: "a",
        text: `پس تو برد اجرایی این هفته یک ستون Compliance هم اضافه کن.`,
      },
      {
        speaker: "b",
        text: `انجام می‌شه. فردا وضعیت hiring بک‌اند ارشد را هم می‌فرستم.`,
      },
    ],
  ],
  [`${"ceo"}|${"finance"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، runway با هزینه‌های فعلی چند ماهه؟ می‌خوام قبل از board بدونم.`,
      },
      {
        speaker: "b",
        text: `با burn فعلی حدود ۱۴ ماه. اگر hiring دو نقش ارشد جلو بیفته، می‌ره روی ۱۱ ماه.`,
      },
      {
        speaker: "a",
        text: `حاشیهٔ ناخالص SaaS ما بعد از infra چقدر شده؟`,
      },
      {
        speaker: "b",
        text: `۷۲٪. هزینهٔ GPU inference هنوز outlier است؛ پیشنهاد می‌کنم مدل کوچک‌تر برای tier رایگان.`,
      },
      {
        speaker: "a",
        text: `اوکی. forecast درآمد ARR تا پایان سال را با سناریوی پایه و بدبینانه بده.`,
      },
      {
        speaker: "b",
        text: `تا فردا دو سناریو با churn ۳٪ و ۵٪ و جدول cohort می‌فرستم.`,
      },
      {
        speaker: "a",
        text: `و لطفاً هزینهٔ SOC2 رو هم در CapEx/OpEx جدا کن برای شفافیت board.`,
      },
      {
        speaker: "b",
        text: `جدا می‌کنم؛ audit fee در OpEx و ابزارهای کنترل در CapEx سبک.`,
      },
    ],
  ],
  [`${"ceo"}|${"secretary"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، جلسهٔ سرمایه‌گذار پنجشنبه را فشرده کنیم؛ فقط ۴۵ دقیقه.`,
      },
      {
        speaker: "b",
        text: `بله. دستور جلسه: متریک رشد، وضعیت محصول، و ask مالی. اسلایدها را تا فردا ظهر قفل می‌کنم.`,
      },
      {
        speaker: "a",
        text: `یک صفحهٔ یک‌برگی هم برای اعداد کلیدی بگذار؛ کسی حوصلهٔ ۲۰ اسلاید ندارد.`,
      },
      {
        speaker: "b",
        text: `می‌سازم. اتاق جلسه شیشه‌ای رزرو است و پذیرایی سبک هم هماهنگ شده.`,
      },
      {
        speaker: "a",
        text: `یادآوری NDA برای مهمان جدید را هم چک کن.`,
      },
      {
        speaker: "b",
        text: `امضا شده و در پوشهٔ امن است. کالِ یادآوری ۳۰ دقیقه قبل هم ست می‌کنم.`,
      },
      {
        speaker: "a",
        text: `عالی. بعد از جلسه خلاصهٔ action itemها را همان روز بفرست.`,
      },
      {
        speaker: "b",
        text: `حتماً؛ با owner و due date در Notion و ایمیل.`,
      },
    ],
  ],
  [`${"manager"}|${"finance"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، بودجهٔ ابزارهای observability این فصل تمام شده. می‌تونیم از ردیف training جابه‌جا کنیم؟`,
      },
      {
        speaker: "b",
        text: `تا ۱۵٪ بله، ولی باید در سیستم با کد هزینهٔ جدا ثبت بشه تا audit گیج نشه.`,
      },
      {
        speaker: "a",
        text: `Vendor جدید APM رو هم ارزیابی کردیم؛ هزینهٔ سالانه از فعلی ۱۸٪ کمتره.`,
      },
      {
        speaker: "b",
        text: `اگر SLA و data residency اوکی باشه، PO را این هفته باز می‌کنم.`,
      },
      {
        speaker: "a",
        text: `خروجی ROI را هم بر اساس کاهش MTTR می‌نویسم برای تأیید.`,
      },
      {
        speaker: "b",
        text: `عالی. پرداخت را Quarterly نگه داریم تا cashflow فشار نبینه.`,
      },
      {
        speaker: "a",
        text: `موافقم. من مقایسهٔ feature matrix را تا فردا می‌فرستم.`,
      },
      {
        speaker: "b",
        text: `من هم مالیات بر ارزش افزوده و قرارداد را چک می‌کنم.`,
      },
    ],
  ],
  [`${"coordinator"}|${"guest"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، خوش اومدید. جلسهٔ کشف نیازسنجی را با محور integration و امنیت شروع می‌کنیم.`,
      },
      {
        speaker: "b",
        text: `مرسی. برای ما SSO با SAML و نگهداری لاگ حداقل ۱۸۰ روز الزامی است.`,
      },
      {
        speaker: "a",
        text: `هر دو در roadmap نزدیک است. امروز یک POC سبک از webhook و نقش‌های دسترسی نشان می‌دهیم.`,
      },
      {
        speaker: "b",
        text: `اگر export CSV و API rate limit شفاف باشد، تیم دادهٔ ما سریع‌تر onboard می‌شود.`,
      },
      {
        speaker: "a",
        text: `یادداشت می‌کنم. بعد از جلسه یک خلاصهٔ نیازها با اولویت MoSCoW می‌فرستم.`,
      },
      {
        speaker: "b",
        text: `عالی. تصمیم خرید داخلی ما تا دو هفتهٔ دیگر جمع می‌شود.`,
      },
      {
        speaker: "a",
        text: `هر سوال فنی را مستقیم به کانال مشترک بفرستید؛ SLA پاسخ یک روز کاری.`,
      },
      {
        speaker: "b",
        text: `حتماً. ممنون بابت نظم جلسه.`,
      },
    ],
  ],
  [`${"hospitality"}|${"break"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، دان قهوهٔ جدید اسیدیته‌اش پایین‌تره؛ برای جلسهٔ عصر بهتره.`,
      },
      {
        speaker: "b",
        text: `عالی، من یک V60 می‌گیرم. شیر بادوم هم هست؟`,
      },
      {
        speaker: "a",
        text: `هست. یخچال سمت چپ. اگر خواستی matcha هم آماده می‌کنم.`,
      },
      {
        speaker: "b",
        text: `مرسی. امروز تیم بک‌اند عجله داره؛ دو تا دبل اسپرسو هم بذار روی پیشخوان.`,
      },
      {
        speaker: "a",
        text: `الان می‌کشم. لیوان‌های دردار برای بردن به میز هم هست.`,
      },
      {
        speaker: "b",
        text: `دمَت گرم. کافه‌آرایی دفتر امروز نجات‌بخشه.`,
      },
      {
        speaker: "a",
        text: `خواهش می‌کنم. اگر میوه تمام شد بگو تا سفارش بدم.`,
      },
      {
        speaker: "b",
        text: `حتماً — موز و کمی مغز برای میان‌وعده کم داریم.`,
      },
    ],
  ],
  [`${"manager"}|${"frontend"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، برای دمو مشتری، فلو onboarding نباید بیشتر از ۹۰ ثانیه طول بکشه.`,
      },
      {
        speaker: "b",
        text: `اسکیپ تور و progressive disclosure می‌ذارم؛ فقط سه فیلد اول اجباری می‌مونه.`,
      },
      {
        speaker: "a",
        text: `آنالیتیکس funnel هم لازم داریم: drop-off هر استپ.`,
      },
      {
        speaker: "b",
        text: `با eventهای typed می‌فرستم. داشبورد موقت در Metabase تا فردا ظهر.`,
      },
      {
        speaker: "a",
        text: `اگر موبایل خراب بود، دمو را روی دسکتاپ قفل می‌کنیم؛ ولی سعی کن breakpoint تبلت سالم باشه.`,
      },
      {
        speaker: "b",
        text: `امشب تست دستی روی دو عرض می‌گیرم و باگ‌های P0 را می‌بندم.`,
      },
      {
        speaker: "a",
        text: `خوبه. فردا ساعت ۱۰ یک dry-run با منشی هم داریم.`,
      },
      {
        speaker: "b",
        text: `حاضرم. اسکریپت کلیک‌ها را هم می‌نویسم تا کسی گیج نشود.`,
      },
    ],
  ],
  [`${"manager"}|${"backend"}`]: [
    (a, b) => [
      {
        speaker: "a",
        text: `${b}، incident دیشب p95 رو برد بالا. root cause چی بود؟`,
      },
      {
        speaker: "b",
        text: `قفل روی جدول sessions و N+1 در سرویس presence. ایندکس و batch query امروز merge می‌شه.`,
      },
      {
        speaker: "a",
        text: `برای مشتری‌ها status page گذاشتی؟`,
      },
      {
        speaker: "b",
        text: `بله، و postmortem تا فردا با timeline و action item آماده است.`,
      },
      {
        speaker: "a",
        text: `لطفاً error budget ماه را هم آپدیت کن؛ اگر قرمز شد فیچر فریز می‌کنیم.`,
      },
      {
        speaker: "b",
        text: `الان روی ۸۶٪ SLO هستیم. با فیکس باید برگرده بالای ۹۹.`,
      },
      {
        speaker: "a",
        text: `عالی. یک review کوتاه با فرانت برای timeoutهای کلاینت هم بگذار.`,
      },
      {
        speaker: "b",
        text: `هماهنگ می‌کنم؛ retry با jitter را هم استاندارد می‌کنیم.`,
      },
    ],
  ],
};

const GENERIC_SCRIPTS: ScriptFactory[] = [
  (a, b) => [
    {
      speaker: "a",
      text: `${b}، روی اولویت این اسپرینت هنوز هم‌تراز نیستیم؛ من بدهی فنی auth را جلو می‌کشم.`,
    },
    {
      speaker: "b",
      text: `موافقم. اگر scope جدید مشتری آمد، اول impact/effort را با هم امتیاز بدهیم.`,
    },
    {
      speaker: "a",
      text: `برای review هم لطفاً چک‌لیست امنیتی را قبل از approve رد کن؛ خصوصاً ورودی‌های کاربر.`,
    },
    {
      speaker: "b",
      text: `انجام می‌دم. تست‌های قرارداد و یک smoke روی staging را هم در CI سبز نگه می‌داریم.`,
    },
    {
      speaker: "a",
      text: `اگر بلاکر خوردی زود escalate کن؛ بهتر از این است که آخر اسپرینت غافلگیر شویم.`,
    },
    {
      speaker: "b",
      text: `حتماً. عصر یک sync کوتاه ۱۵ دقیقه‌ای می‌گذاریم و بورد را تمیز می‌کنیم.`,
    },
    {
      speaker: "a",
      text: `عالی. من entrieهای Done را با acceptance criteria واقعی می‌بندم.`,
    },
    {
      speaker: "b",
      text: `من هم ریسک‌ها را در کانال تیم می‌نویسم تا شفاف بماند.`,
    },
  ],
  (a, b) => [
    {
      speaker: "a",
      text: `${b}، داک معماری سرویس اعلان‌ها قدیمی شده؛ schema eventها عوض شده.`,
    },
    {
      speaker: "b",
      text: `امروز یک ADR کوتاه می‌نویسم و نسخهٔ contract را bump می‌کنم.`,
    },
    {
      speaker: "a",
      text: `مصرف‌کننده‌های قدیمی را هم با period سازگاری دو نسخه‌ای نگه داریم.`,
    },
    {
      speaker: "b",
      text: `آره، dual-publish برای یک هفته. متریک lag صف را هم می‌پايم.`,
    },
    {
      speaker: "a",
      text: `اگر poison message دیدی، به DLQ برو نه retry بی‌نهایت.`,
    },
    {
      speaker: "b",
      text: `حداکثر ۵ تلاش با backoff نمایی ست می‌کنم.`,
    },
    {
      speaker: "a",
      text: `بعد از پایدار شدن، runbook را در wiki به‌روز کن.`,
    },
    {
      speaker: "b",
      text: `حتماً — با دستور rollback یک‌خطی.`,
    },
  ],
];

function pickScript(
  roleA: AgentRole,
  roleB: AgentRole,
  nameA: string,
  nameB: string,
): DialogueTurn[] {
  const key = pairKey(roleA, roleB);
  const factories = PAIR_SCRIPTS[key] ?? GENERIC_SCRIPTS;
  const factory = factories[Math.floor(Math.random() * factories.length)]!;

  // pairKey sorts roles alphabetically — remap speakers so "a" is always the
  // first agent passed in (nameA), not the alphabetically-first role.
  const sorted = [roleA, roleB].sort() as [AgentRole, AgentRole];
  const swapped = sorted[0] === roleB && roleA !== roleB;

  const turns = factory(
    swapped ? nameB : nameA,
    swapped ? nameA : nameB,
  );

  if (!swapped) return turns;
  return turns.map((turn) => ({
    ...turn,
    speaker: turn.speaker === "a" ? "b" : "a",
  }));
}

/**
 * Build a long, role-aware hallway conversation between two agents.
 */
export function buildPeerDialogue(
  agentA: Pick<OfficeAgent, "name">,
  agentB: Pick<OfficeAgent, "name">,
): DialogueTurn[] {
  const roleA = resolveAgentRole(agentA.name);
  const roleB = resolveAgentRole(agentB.name);
  return pickScript(roleA, roleB, agentA.name, agentB.name);
}

const ROLE_REPLY: Record<
  AgentRole,
  {
    greet: (name: string) => string;
    work: (working: boolean) => string;
    fallback: (text: string) => string;
  }
> = {
  frontend: {
    greet: (name) =>
      `سلام! من ${name} از تیم فرانت‌اند هستم — UI، دسترس‌پذیری و perf سمت کلاینت.`,
    work: (working) =>
      working
        ? "دارم state و اسکلتون لودینگ یک فلو سنگین را جمع می‌کنم؛ hydration و LCP را هم می‌سنجم."
        : "آزادتره؛ می‌تونم روی design tokenها، Storybook یا باگ layout کمک کنم.",
    fallback: (text) =>
      `از زاویهٔ فرانت: «${text.slice(0, 70)}» را یا به component contract می‌برم یا به performance budget. جزئیات بیشتری از رفتار مورد انتظار بده.`,
  },
  backend: {
    greet: (name) =>
      `سلام، ${name} از بک‌اند. API، داده و پایداری سرویس دست منه.`,
    work: (working) =>
      working
        ? "روی schema، ایندکس و idempotency یک endpoint حساس کار می‌کنم."
        : "الان برای طراحی contract، صف‌ها یا incident review در خدمتم.",
    fallback: (text) =>
      `بک‌اندیاً به «${text.slice(0, 70)}» نگاه می‌کنم: consistency، latency و failure mode. SLA یا حجم ترافیک تقریبی را بگو.`,
  },
  fullstack: {
    greet: (name) =>
      `سلام! ${name} هستم — فول‌استک؛ از UI تا سرویس را یک‌جا می‌بندم.`,
    work: (working) =>
      working
        ? "دارم یک فیچر end-to-end را از API تا صفحه می‌رسانم."
        : "می‌تونم بین فرانت و بک پل بزنم یا spike فنی بردارم.",
    fallback: (text) =>
      `برای «${text.slice(0, 70)}» یک برش عمودی پیشنهاد می‌دم: API کوچک + UI مینیمال + تست قرارداد.`,
  },
  ceo: {
    greet: (name) =>
      `سلام، ${name} هستم. روی استراتژی، اولویت‌ها و نتیجهٔ کسب‌وکار تمرکز دارم.`,
    work: (working) =>
      working
        ? "دارم تصمیم‌های اولویت و ریسک را برای برد اجرایی جمع می‌کنم."
        : "بگو اثر این کار روی مشتری، درآمد یا ریسک چیه تا اولویت‌بندی کنیم.",
    fallback: (text) =>
      `از دید اجرایی: «${text.slice(0, 70)}» چه خروجی قابل‌اندازه‌گیری در ۳۰ روز می‌ده؟ همان را معیار می‌کنیم.`,
  },
  manager: {
    greet: (name) =>
      `سلام، من ${name} — هماهنگی تیم، اسکوپ و تحویل.`,
    work: (working) =>
      working
        ? "دارم بورد و بلاکرها را برای اسپرینت مرتب می‌کنم."
        : "اگر بلاکر داری بگو؛ یا کمک می‌کنم impact/effort را امتیاز بدهیم.",
    fallback: (text) =>
      `«${text.slice(0, 70)}» را به یک ticket با acceptance criteria و owner تبدیل کنیم تا گم نشود.`,
  },
  finance: {
    greet: (name) =>
      `سلام، ${name} از مالی. بودجه، runway و واحد اقتصادی محصول.`,
    work: (working) =>
      working
        ? "دارم forecast و تخصیص هزینه را برای این فصل می‌بندم."
        : "برای PO، جابه‌جایی بودجه یا مدل هزینه در خدمتم.",
    fallback: (text) =>
      `از منظر مالی، «${text.slice(0, 70)}» را با هزینهٔ ماهانه، ROI و ریسک cashflow می‌سنجم. عدد تقریبی داری؟`,
  },
  secretary: {
    greet: (name) =>
      `سلام، ${name} هستم — برنامه‌ها، جلسه و پیگیری action item.`,
    work: (working) =>
      working
        ? "دارم دستور جلسه و رزرو اتاق را نهایی می‌کنم."
        : "می‌تونم وقت جلسه، یادآوری یا خلاصهٔ تصمیم‌ها را تنظیم کنم.",
    fallback: (text) =>
      `یادداشت کردم: «${text.slice(0, 70)}». بگو owner و مهلت تا در پیگیری بگذارم.`,
  },
  coordinator: {
    greet: (name) =>
      `سلام، ${name} — هماهنگ‌کننده. کشف نیاز، زمان‌بندی و هم‌ترازی ذی‌نفعان.`,
    work: (working) =>
      working
        ? "دارم دستور کار جلسه و اولویت MoSCoW را آماده می‌کنم."
        : "برای facilitation، صورت‌جلسه یا هم‌راستایی اسکوپ کمک می‌کنم.",
    fallback: (text) =>
      `«${text.slice(0, 70)}» را در قالب نیاز/فرض/ریسک ثبت می‌کنم تا با تیم فنی جمع‌بندی شود.`,
  },
  hospitality: {
    greet: (name) =>
      `سلام! من ${name}ام؛ پذیرایی و راحت بودن تیم اینجاست.`,
    work: (working) =>
      working
        ? "دارم سفارش نوشیدنی و میان‌وعدهٔ جلسه را آماده می‌کنم."
        : "قهوه، چای یا چیزی برای مهمان می‌خواهی؟",
    fallback: (text) =>
      `گرفتم: «${text.slice(0, 70)}». اگر برای پذیرایی یا آسایش دفتر است، همین الان هماهنگ می‌کنم.`,
  },
  guest: {
    greet: (name) =>
      `سلام، ${name} هستم — مهمان/ذی‌نفع. دنبال شفافیت در قابلیت و امنیت محصول شما.`,
    work: () =>
      "برای ارزیابی خرید اینجام؛ هرچه integration و compliance روشن‌تر باشد بهتر است.",
    fallback: (text) =>
      `از سمت ما: «${text.slice(0, 70)}» باید با نیاز امنیتی و timeline داخلی‌مان جور شود. جزئیات SLA را می‌خواهیم.`,
  },
  break: {
    greet: (name) =>
      `سلام، ${name} — یک استراحت کوتاه. گاهی بهترین ایده کنار قهوه می‌آید.`,
    work: () => "فعلاً در حال شارژم؛ اگر موضوع سبک است بگو، وگرنه بعد از استراحت.",
    fallback: (text) =>
      `باشه، «${text.slice(0, 70)}» را می‌شنوم — بگذار یک دقیقه با آرامش فکر کنیم بعد جمع‌بندی می‌کنیم.`,
  },
  general: {
    greet: (name) => `سلام! من ${name} هستم؛ همکارت در دفتر.`,
    work: (working) =>
      working
        ? "الان روی تسک جاری‌ام متمرکزم؛ چند دقیقه دیگر آزادتر می‌شوم."
        : "بگو چطور می‌تونم کمک کنم — فنی، هماهنگی یا پیگیری.",
    fallback: (text) =>
      `متوجه شدم: «${text.slice(0, 70)}${text.length > 70 ? "…" : ""}». اگر محدودیت زمانی یا اولویت داری بگو تا دقیق‌تر جلو برویم.`,
  },
};

/** Specialized local replies for the agent chat panel. */
export function buildSpecializedReply(
  agent: OfficeAgent,
  userText: string,
): string {
  const role = resolveAgentRole(agent.name);
  const pack = ROLE_REPLY[role];
  const lower = userText.trim();

  if (/سلام|درود|hello|hi/i.test(lower)) {
    return pack.greet(agent.name);
  }
  if (/نقش|تخصص|چیکار|چه کار|role|specialty/i.test(lower)) {
    return `تخصص من ${roleLabelFa(role)} است. ${pack.greet(agent.name)}`;
  }
  if (/کجا|where|وضعیت|state/i.test(lower)) {
    return `موقعیت تقریبی من (${agent.x.toFixed(1)}, ${agent.z.toFixed(1)}) و وضعیت «${agent.state}» است. از دید ${roleLabelFa(role)} آماده‌ام ادامه بدهیم.`;
  }
  if (/کار|وظیفه|task|اسپرینت|sprint/i.test(lower)) {
    return pack.work(agent.state === "working");
  }
  if (lower.length < 8) {
    return `اوکی. از زاویهٔ ${roleLabelFa(role)} آماده‌ام؛ کمی بیشتر توضیح بده تا دقیق جواب بدهم.`;
  }
  return pack.fallback(lower);
}
