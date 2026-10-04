// Built-in catalog of launch platforms and listing directories.
// "Refresh with AI" in the app searches the web for new ones and the link
// checker flags dead entries, so this list is a starting point, not the ceiling.
//
// tier: 1 = highest authority / traffic, 2 = solid, 3 = long-tail backlink
// manualOnly: the platform's rules or anti-bot checks mean the final click (and
//   account creation) must be done by a human; LaunchPilot still prepares
//   everything and fills the form.
// launch: true = a time-boxed "launch day" platform where scheduling matters.

const CATALOG_VERSION = '2026-10';

function d(slug, name, url, submitUrl, category, pricing, tier, extra = {}) {
  return { slug, name, url, submitUrl, category, pricing, tier, launch: false, manualOnly: false, catalogVersion: CATALOG_VERSION, ...extra };
}

export const CATEGORIES = {
  launch: 'Launch platforms',
  ai: 'AI tool directories',
  review: 'Software review sites',
  startup: 'Startup directories',
  dev: 'Developer communities',
  community: 'Communities & forums',
  business: 'Business profiles',
};

export const CATALOG = [
  // Launch platforms
  d('product-hunt', 'Product Hunt', 'https://www.producthunt.com', 'https://www.producthunt.com/posts/new', 'launch', 'free', 1, {
    launch: true, manualOnly: true, signupUrl: 'https://www.producthunt.com/login', loginUrl: 'https://www.producthunt.com/login',
    limits: { tagline: 60, description: 260 },
    launchTips: 'Launch Tue-Thu at 12:01 AM PT (the day resets at midnight Pacific). You can schedule up to a month ahead from the post form. Post a maker first comment right after going live. Never ask for upvotes directly.',
  }),
  d('hacker-news', 'Hacker News (Show HN)', 'https://news.ycombinator.com', 'https://news.ycombinator.com/submit', 'launch', 'free', 1, {
    launch: true, manualOnly: true, loginUrl: 'https://news.ycombinator.com/login', limits: { tagline: 80 },
    launchTips: 'Title starts with "Show HN:". Weekdays 8-10 AM US Eastern work well. Link to something people can try without signing up, and stay in the comments.',
  }),
  d('betalist', 'BetaList', 'https://betalist.com', 'https://betalist.com/submit', 'launch', 'freemium', 1, {
    launch: true, launchTips: 'Free queue is weeks long; the paid option jumps it. Submit early, before your main launch.',
  }),
  d('peerlist-launchpad', 'Peerlist Launchpad', 'https://peerlist.io', 'https://peerlist.io/launchpad', 'launch', 'free', 2, {
    launch: true, launchTips: 'Weekly launch cycle starting Monday. Needs a Peerlist profile.',
  }),
  d('uneed', 'Uneed', 'https://www.uneed.best', 'https://www.uneed.best/submit-a-tool', 'launch', 'freemium', 2, { launch: true, launchTips: 'Daily launches; free slots book out, paid skips the line.' }),
  d('microlaunch', 'Microlaunch', 'https://microlaunch.net', 'https://microlaunch.net/submit', 'launch', 'freemium', 2, { launch: true, launchTips: 'Month-long launch window; pick a start week.' }),
  d('fazier', 'Fazier', 'https://fazier.com', 'https://fazier.com/submit', 'launch', 'freemium', 2, { launch: true }),
  d('devhunt', 'DevHunt', 'https://devhunt.org', 'https://devhunt.org/', 'launch', 'freemium', 2, { launch: true, launchTips: 'Developer tools only. Weekly launches.' }),
  d('tinylaunch', 'TinyLaunch', 'https://www.tinylaunch.com', 'https://www.tinylaunch.com/submit', 'launch', 'freemium', 3, { launch: true }),
  d('launching-next', 'Launching Next', 'https://www.launchingnext.com', 'https://www.launchingnext.com/submit/', 'launch', 'free', 3),
  d('indie-hackers', 'Indie Hackers', 'https://www.indiehackers.com', 'https://www.indiehackers.com/products', 'launch', 'free', 2, { manualOnly: true }),
  d('startupbase', 'StartupBase', 'https://startupbase.io', 'https://startupbase.io/submit', 'launch', 'free', 3),
  d('betapage', 'BetaPage', 'https://betapage.co', 'https://betapage.co/submit-startup', 'launch', 'freemium', 3),
  d('10words', '10words', 'https://10words.io', 'https://10words.io/submit', 'launch', 'free', 3),
  d('sideprojectors', 'SideProjectors', 'https://www.sideprojectors.com', 'https://www.sideprojectors.com/project/new', 'launch', 'free', 3),

  // AI tool directories
  d('theresanaiforthat', "There's An AI For That", 'https://theresanaiforthat.com', 'https://theresanaiforthat.com/submit/', 'ai', 'paid', 1),
  d('futurepedia', 'Futurepedia', 'https://www.futurepedia.io', 'https://www.futurepedia.io/submit-tool', 'ai', 'paid', 1),
  d('toolify', 'Toolify.ai', 'https://www.toolify.ai', 'https://www.toolify.ai/submit', 'ai', 'freemium', 1),
  d('futuretools', 'FutureTools', 'https://www.futuretools.io', 'https://www.futuretools.io/submit-a-tool', 'ai', 'free', 1),
  d('topai-tools', 'TopAI.tools', 'https://topai.tools', 'https://topai.tools/submit', 'ai', 'freemium', 2),
  d('aitoolsdirectory', 'AI Tools Directory', 'https://aitoolsdirectory.com', 'https://aitoolsdirectory.com/submit', 'ai', 'freemium', 2),
  d('aitoolhunt', 'AI Tool Hunt', 'https://www.aitoolhunt.com', 'https://www.aitoolhunt.com/submit-tool', 'ai', 'freemium', 2),
  d('easywithai', 'Easy With AI', 'https://easywithai.com', 'https://easywithai.com/submit-ai-tools/', 'ai', 'freemium', 2),
  d('aitoolmall', 'AI Tool Mall', 'https://www.aitoolmall.com', 'https://www.aitoolmall.com/submit', 'ai', 'free', 3),
  d('insidr', 'Insidr AI Tools', 'https://www.insidr.ai', 'https://www.insidr.ai/submit-tool/', 'ai', 'free', 3),
  d('aiscout', 'AI Scout', 'https://aiscout.net', 'https://aiscout.net/submit-tool/', 'ai', 'free', 3),
  d('aicenter', 'AI Center', 'https://aicenter.ai', 'https://aicenter.ai/submit', 'ai', 'free', 3),
  d('allthingsai', 'AllThingsAI', 'https://allthingsai.com', 'https://allthingsai.com/submit', 'ai', 'freemium', 3),
  d('dang-ai', 'Dang.ai', 'https://dang.ai', 'https://dang.ai/submit', 'ai', 'freemium', 2),
  d('aitoptools', 'AI Top Tools', 'https://aitoptools.com', 'https://aitoptools.com/submit-tool/', 'ai', 'freemium', 3),
  d('openfuture', 'OpenFuture', 'https://openfuture.ai', 'https://openfuture.ai/submit-tool', 'ai', 'freemium', 3),
  d('toolpilot', 'Toolpilot', 'https://www.toolpilot.ai', 'https://www.toolpilot.ai/pages/submit-tool', 'ai', 'paid', 3),
  d('aicyclopedia', 'AIcyclopedia', 'https://www.aicyclopedia.com', 'https://www.aicyclopedia.com/submit-ai-tool/', 'ai', 'free', 3),
  d('saasaitools', 'SaaS AI Tools', 'https://saasaitools.com', 'https://saasaitools.com/submit/', 'ai', 'freemium', 3),
  d('ainavigator', 'AI Navigator', 'https://ainavigator.com', 'https://ainavigator.com/submit', 'ai', 'free', 3),

  // Software review / comparison sites
  d('g2', 'G2', 'https://www.g2.com', 'https://www.g2.com/products/new', 'review', 'free', 1),
  d('capterra', 'Capterra (+ GetApp, Software Advice)', 'https://www.capterra.com', 'https://www.capterra.com/vendors/sign-up', 'review', 'free', 1, { launchTips: 'One Gartner Digital Markets vendor account lists you on Capterra, GetApp and Software Advice.' }),
  d('alternativeto', 'AlternativeTo', 'https://alternativeto.net', 'https://alternativeto.net/manage-app/', 'review', 'free', 1, { launchTips: 'List yourself as an alternative to the 3-5 best-known competitors.' }),
  d('saashub', 'SaaSHub', 'https://www.saashub.com', 'https://www.saashub.com/submit', 'review', 'freemium', 1),
  d('saasworthy', 'SaaSworthy', 'https://www.saasworthy.com', 'https://www.saasworthy.com/submit-product', 'review', 'free', 2),
  d('sourceforge', 'SourceForge', 'https://sourceforge.net', 'https://sourceforge.net/software/vendors/new', 'review', 'free', 1),
  d('trustradius', 'TrustRadius', 'https://www.trustradius.com', 'https://www.trustradius.com/vendors', 'review', 'free', 2),
  d('crozdesk', 'Crozdesk', 'https://crozdesk.com', 'https://vendor.crozdesk.com/', 'review', 'free', 2),
  d('slashdot', 'Slashdot Software', 'https://slashdot.org/software/', 'https://slashdot.org/software/vendors/new', 'review', 'free', 2),
  d('stackshare', 'StackShare', 'https://stackshare.io', 'https://stackshare.io/tools/new', 'review', 'free', 2),
  d('softwaresuggest', 'SoftwareSuggest', 'https://www.softwaresuggest.com', 'https://www.softwaresuggest.com/vendors', 'review', 'free', 2),
  d('saasgenius', 'SaaS Genius', 'https://www.saasgenius.com', 'https://www.saasgenius.com/vendors', 'review', 'free', 3),
  d('trustpilot', 'Trustpilot', 'https://www.trustpilot.com', 'https://business.trustpilot.com/signup', 'review', 'freemium', 1),

  // Startup directories
  d('startup-stash', 'Startup Stash', 'https://startupstash.com', 'https://startupstash.com/add-listing/', 'startup', 'freemium', 2),
  d('crunchbase', 'Crunchbase', 'https://www.crunchbase.com', 'https://www.crunchbase.com/add-new', 'startup', 'free', 1),
  d('wellfound', 'Wellfound (AngelList)', 'https://wellfound.com', 'https://wellfound.com/recruit/startup/new', 'startup', 'free', 1),
  d('f6s', 'F6S', 'https://www.f6s.com', 'https://www.f6s.com/company/new', 'startup', 'free', 2),
  d('startupbuffer', 'Startup Buffer', 'https://startupbuffer.com', 'https://startupbuffer.com/site/submit', 'startup', 'freemium', 3),
  d('startupranking', 'Startup Ranking', 'https://www.startupranking.com', 'https://www.startupranking.com/startup/create', 'startup', 'free', 3),
  d('allstartups', 'AllStartups', 'https://allstartups.info', 'https://allstartups.info/Startups/Submit', 'startup', 'free', 3),
  d('startuplister', 'StartupLister', 'https://startuplister.com', 'https://startuplister.com', 'startup', 'paid', 3, { launchTips: 'Paid service that submits you to ~100 directories; useful as a comparison point.' }),
  d('saas-directory', 'SaaS Directory', 'https://saasdirectory.io', 'https://saasdirectory.io/submit', 'startup', 'free', 3),
  d('launched', 'Launched', 'https://launched.io', 'https://launched.io/submit', 'startup', 'free', 3),
  d('startupinspire', 'Startup Inspire', 'https://www.startupinspire.com', 'https://www.startupinspire.com/submit', 'startup', 'free', 3),

  // Developer communities
  d('github-awesome', 'GitHub awesome-lists', 'https://github.com/topics/awesome', 'https://github.com/topics/awesome', 'dev', 'free', 1, { manualOnly: true, launchTips: 'Open small PRs adding your product to relevant awesome-* lists. High-authority links.' }),
  d('devto', 'DEV Community', 'https://dev.to', 'https://dev.to/new', 'dev', 'free', 2, { manualOnly: true, launchTips: 'Write a build story, not an ad.' }),
  d('hashnode', 'Hashnode', 'https://hashnode.com', 'https://hashnode.com/onboard', 'dev', 'free', 3, { manualOnly: true }),
  d('lobsters', 'Lobsters', 'https://lobste.rs', 'https://lobste.rs/stories/new', 'dev', 'free', 2, { manualOnly: true, launchTips: 'Invite-only; use the "show" tag.' }),

  // Communities & forums
  d('reddit-sideproject', 'Reddit r/SideProject', 'https://www.reddit.com/r/SideProject/', 'https://www.reddit.com/r/SideProject/submit', 'community', 'free', 1, { launch: true, manualOnly: true, launchTips: 'Read each subreddit\'s rules first. Also try r/InternetIsBeautiful, r/alphaandbetausers, r/startups (weekly threads).' }),
  d('reddit-imadethis', 'Reddit r/IMadeThis', 'https://www.reddit.com/r/imadethis/', 'https://www.reddit.com/r/imadethis/submit', 'community', 'free', 3, { manualOnly: true }),
  d('quora', 'Quora', 'https://www.quora.com', 'https://www.quora.com', 'community', 'free', 2, { manualOnly: true, launchTips: 'Answer existing questions where your product genuinely helps.' }),
  d('growthhackers', 'GrowthHackers', 'https://growthhackers.com', 'https://growthhackers.com', 'community', 'free', 3, { manualOnly: true }),

  // Business profiles
  d('google-business', 'Google Business Profile', 'https://www.google.com/business/', 'https://business.google.com/create', 'business', 'free', 1, { manualOnly: true }),
  d('bing-places', 'Bing Places', 'https://www.bingplaces.com', 'https://www.bingplaces.com', 'business', 'free', 2, { manualOnly: true }),
  d('linkedin-page', 'LinkedIn Company Page', 'https://www.linkedin.com', 'https://www.linkedin.com/company/setup/new/', 'business', 'free', 1, { manualOnly: true }),
];
