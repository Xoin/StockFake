// Historical market events with dates
// These events are only shown AFTER they occur in game time to prevent players from using future knowledge

const historicalEvents = [
  // 1970s
  {
    id: 'recession-1970',
    date: new Date('1970-12-01'),
    title: 'Recession of 1970',
    category: 'Economic',
    severity: 'moderate',
    description: 'The United States enters a recession lasting until November 1970, the first major economic downturn of the decade. This recession was triggered by tight monetary policy implemented by the Federal Reserve to combat inflation, combined with reduced government spending as the Vietnam War began to wind down. Unemployment rose to 6.1%, and the economy contracted for the first time since the early 1960s. The recession marked the beginning of a turbulent economic decade characterized by stagflation—a combination of stagnant growth and high inflation previously thought impossible by economists.',
    impact: 'Stock market declined approximately 35% from peak to trough. Industrial and manufacturing stocks particularly hard hit. Bond yields volatile as investors struggled to assess inflation risks. Consumer discretionary stocks suffered as unemployment rose. Market volatility increased significantly compared to the 1960s. Blue-chip dividend stocks provided relative safety during downturn.'
  },
  {
    id: 'bretton-woods-1971',
    date: new Date('1971-08-15'),
    title: 'End of Bretton Woods System',
    category: 'Regulatory',
    severity: 'major',
    description: 'President Nixon announces the suspension of dollar convertibility to gold, unilaterally ending the Bretton Woods system that had governed international monetary relations since 1944. This "Nixon Shock" was prompted by growing U.S. trade deficits and declining gold reserves as other nations exchanged dollars for gold. The decision marked the end of the gold standard and the beginning of the modern era of floating exchange rates. This fundamentally transformed global finance, allowing currencies to fluctuate based on market forces rather than fixed parities.',
    impact: 'Initial market uncertainty and currency volatility across global markets. Dollar weakened significantly against major currencies. Gold prices surged as investors sought hedges against inflation and currency instability. Multinational corporations faced new foreign exchange risks. Commodities became more attractive as inflation hedges. Banking sector benefited from increased foreign exchange trading volumes. Long-term shift toward floating exchange rates created new derivatives markets.'
  },
  {
    id: 'oil-crisis-1973',
    date: new Date('1973-10-17'),
    title: '1973 Oil Crisis',
    category: 'Geopolitical',
    severity: 'severe',
    description: 'OPEC member nations, led by Arab states, impose an oil embargo on nations supporting Israel during the Yom Kippur War. The embargo causes oil prices to quadruple from $3 to nearly $12 per barrel within months, triggering the first global energy crisis. This event fundamentally shifts the global balance of economic power, demonstrating the vulnerability of industrialized economies to energy supply disruptions. The crisis leads to widespread fuel shortages, long lines at gas stations, and rationing in many countries. It also triggers a period of "stagflation"—simultaneous high inflation and economic stagnation—that would plague Western economies throughout the 1970s.',
    impact: 'Stock market experienced severe decline of 45% over two years. Energy sector stocks initially surged but then faced regulatory pressures and windfall profit taxes. Automotive sector severely impacted as consumers shifted from large cars to fuel-efficient vehicles, benefiting foreign manufacturers. Airlines and transportation stocks plummeted on rising fuel costs. Inflation accelerated to double digits. Interest rates rose sharply as Federal Reserve fought inflation. Alternative energy and coal mining stocks gained attention. Consumer spending contracted significantly. Industrial production declined. Recession began, lasting until 1975. Gold and commodities served as inflation hedges.'
  },
  {
    id: 'recession-1973',
    date: new Date('1973-11-01'),
    title: '1973-1975 Recession',
    category: 'Economic',
    severity: 'severe',
    description: 'The most severe recession since the Great Depression begins, lasting 16 months until March 1975. Triggered by the oil crisis and exacerbated by tight monetary policy, the recession sees GDP contract by 3.2% and unemployment rise to 9%. The combination of high unemployment and high inflation—termed "stagflation"—challenges conventional economic theory, which assumed these conditions were mutually exclusive. Industrial production falls sharply, corporate profits decline, and consumer confidence reaches historic lows. The recession forces policymakers to rethink economic management strategies.',
    impact: 'Stock market suffered devastating losses, with S&P 500 declining nearly 50% from peak to trough. Dow Jones fell below 600, erasing years of gains. Small-cap stocks hit hardest with many becoming insolvent. Real estate and construction sectors collapsed. Unemployment reached 9%, highest in decades. Corporate bankruptcies increased significantly. Dividend cuts became common as earnings plummeted. Retail and consumer discretionary stocks declined sharply. Industrial stocks severely impacted. Financial sector struggled with loan defaults. Only gold, commodities, and select defensive stocks provided protection. Bond yields volatile as inflation persisted. Market recovery extremely slow and painful.'
  },
  {
    id: 'may-day-1975',
    date: new Date('1975-05-01'),
    title: 'May Day: Deregulation of Commissions',
    category: 'Regulatory',
    severity: 'moderate',
    description: 'The Securities and Exchange Commission eliminates fixed commission rates, allowing brokers to negotiate fees with clients for the first time since 1792. This landmark deregulation, known as "May Day" on Wall Street, fundamentally transforms the brokerage industry. Prior to this, commissions were set by NYSE rules regardless of trade size, making trading expensive for institutional investors. The change leads to dramatic commission reductions, particularly for large institutional trades, and enables the rise of discount brokers serving individual investors. This democratizes investing by making it more affordable for retail investors.',
    impact: 'Full-service brokerages forced to compete on price, many merged or downsized. Discount brokers like Charles Schwab emerged and thrived. Trading commissions fell dramatically, especially for institutional investors. Trading volumes increased as lower costs enabled more active trading strategies. Research and advisory services bundled separately from execution. Financial sector underwent consolidation. Individual investors gained better access to markets. Market structure evolved toward higher volume, lower-margin business model. Innovation in electronic trading accelerated. Mutual funds and institutional investors benefited from lower costs.'
  },
  {
    id: 'recession-1980',
    date: new Date('1980-01-01'),
    title: '1980 Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'A brief but sharp recession begins in early 1980 as the Federal Reserve, under Chairman Paul Volcker, implements extraordinarily tight monetary policy to combat spiraling inflation that had reached 14.8%. The Fed raises the federal funds rate to unprecedented levels near 20%, deliberately inducing a recession to break the back of inflation. This marks a dramatic shift in Fed policy, prioritizing price stability over short-term economic growth. The recession lasts only six months (January to July 1980) but is followed by an even more severe recession in 1981-1982. This period represents one of the most aggressive monetary tightening cycles in U.S. history.',
    impact: 'Stock market volatile with sharp declines in interest-sensitive sectors. Housing and automotive sectors crushed by high interest rates. Homebuilders saw activity plummet. Savings & Loan institutions struggled with rising rates. Utility stocks declined due to high borrowing costs. Consumer discretionary spending fell sharply. Gold prices surged to $850/oz as inflation hedge. T-bills yielded over 15%, attracting safe-haven flows. Corporate borrowing costs skyrocketed. Small-cap stocks particularly vulnerable. Unemployment rose to 7.8%. Recession brief but painful. Market began pricing in eventual inflation victory. Value stocks outperformed growth. Defensive sectors relatively stable.'
  },
  {
    id: 'recession-1981',
    date: new Date('1981-07-01'),
    title: 'Early 1980s Recession',
    category: 'Economic',
    severity: 'severe',
    description: 'The United States enters the deepest recession since the Great Depression, lasting from July 1981 to November 1982 (16 months). Federal Reserve Chairman Paul Volcker continues aggressive interest rate hikes, pushing the federal funds rate above 20% to crush persistent inflation. Unemployment peaks at 10.8% in December 1982, the highest since the 1930s. GDP contracts 2.7%. The "Rust Belt" is devastated as manufacturing industries collapse under high interest rates and foreign competition. However, Volcker\'s painful medicine works—inflation falls from 13.5% in 1980 to 3.2% by 1983, setting the stage for two decades of stable growth and the great bull market of the 1980s and 1990s.',
    impact: 'Stock market declined 27% from peak to trough in vicious bear market. Small-cap stocks crashed over 40%. Cyclical sectors devastated—automotive, steel, manufacturing collapsed. Chrysler required government bailout. Savings & Loan crisis began with hundreds of failures. Real estate market froze with 15%+ mortgage rates. Construction industry imploded. Unemployment hit 10.8%, highest in 40 years. Farm sector crisis deepened. Energy sector struggled post-oil boom. Latin American debt crisis emerged. Bond yields peaked above 15%. Money market funds offered double-digit yields. Defensive stocks and T-bills only safe havens. Market bottom in August 1982 marked start of 18-year bull market. Technology stocks began to emerge. Eventually inflation conquered, enabling future growth.'
  },
  {
    id: 'bull-market-1982',
    date: new Date('1982-08-12'),
    title: 'Beginning of Great Bull Market',
    category: 'Market',
    severity: 'positive',
    description: 'The stock market begins an extraordinary 18-year bull market run that will see the Dow Jones rise from 776 in August 1982 to over 11,000 by January 2000—a gain of over 1,300%. This historic rally is driven by multiple factors: declining inflation and interest rates after Volcker\'s successful campaign, strong economic growth, technological innovation, favorable tax policies under Reagan, deregulation of industries, the fall of the Soviet Union removing geopolitical uncertainty, and the rise of 401(k) retirement accounts channeling billions into stocks. This period sees the emergence of legendary investors like Warren Buffett and Peter Lynch achieving spectacular returns.',
    impact: 'Longest and strongest bull market in history begins. All sectors participated in sustained growth. Technology sector emerged as market leader. Financial deregulation benefited banks and brokerages. Retail investors returned to market after 1970s trauma. Mutual fund industry exploded with assets under management soaring. Indexing became popular investment strategy. Dividend yields declined as capital appreciation dominated. Leveraged buyouts and corporate restructuring drove M&A activity. Small-cap stocks outperformed early in rally. Consumer discretionary stocks thrived on economic growth. Real estate recovered strongly. Only brief corrections in 1987 and 1990. Wealth effect boosted consumer spending. 401(k) plans drove consistent buying. Market valuations expanded significantly.'
  },
  {
    id: 'black-monday-1987',
    date: new Date('1987-10-19'),
    title: 'Black Monday',
    category: 'Crash',
    severity: 'severe',
    description: 'Stock markets around the world experience the largest single-day percentage decline in history. The Dow Jones Industrial Average plummets 22.6% (508 points) in a single day, with global markets following suit. Hong Kong fell 45.8%, Australia 41.8%, and London 26.4% in the following days. The crash was triggered by a combination of factors: program trading and portfolio insurance strategies that automatically sold stocks as prices fell, creating a feedback loop; rising interest rates that made stocks less attractive; and concerns about the federal budget deficit and trade imbalances. Unlike 1929, the crash did not lead to a prolonged depression, partly due to coordinated central bank intervention.',
    impact: 'Immediate market panic with Dow falling 508 points in single day, losing $500 billion in value. S&P 500 futures trading halted multiple times. Trading systems overwhelmed, with many stocks unable to trade. Margin calls forced widespread liquidation. Portfolio insurance strategies exacerbated selling. All market sectors declined simultaneously. Financial sector stocks particularly hard hit. Trading volumes shattered records. Federal Reserve quickly provided liquidity to prevent banking crisis. Interest rates cut to support economy. Despite crash, economy avoided recession. Market recovered within two years. Led to implementation of circuit breakers and trading halts. Computerized trading strategies came under scrutiny. Options and derivatives markets experienced extreme volatility.'
  },
  
  // 1990s
  {
    id: 'recession-1990',
    date: new Date('1990-07-01'),
    title: 'Early 1990s Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'The U.S. economy enters an eight-month recession triggered by multiple factors: an oil price shock following Iraq\'s invasion of Kuwait that sent prices from $17 to $36 per barrel, tight monetary policy to combat inflation, and the continuing fallout from the Savings & Loan crisis. The recession also marks the end of the 1980s debt-fueled expansion as overleveraged companies and real estate projects collapse. Unemployment rises to 7.8%, and commercial real estate markets crash. The recession is relatively brief but the recovery is sluggish, dubbed a "jobless recovery" as businesses remain cautious about hiring.',
    impact: 'Stock market declined 20% in three months leading to recession. Financial sector hit hard by S&L crisis with over 1,000 thrift failures. Real estate and construction sectors collapsed. Commercial real estate values plummeted. REIT sector devastated. Defense stocks declined as Cold War ended reducing military spending. Oil stocks volatile on Gulf War uncertainty. Retail sector struggled as consumer confidence plummeted. Technology sector relatively resilient, beginning to emerge as growth driver. Small regional banks failed in waves. Unemployment reached 7.8%. Corporate restructuring and downsizing accelerated. Flight to quality benefited large-cap stocks and treasuries. Market recovery began in 1991 and accelerated through 1990s.'
  },
  {
    id: 'dotcom-boom-1995',
    date: new Date('1995-01-01'),
    title: 'Dot-com Boom Begins',
    category: 'Market',
    severity: 'positive',
    description: 'The commercialization of the internet and World Wide Web sparks an unprecedented speculative boom in technology stocks. The Netscape IPO in August 1995, which sees shares double on the first day, marks the beginning of internet mania. Venture capital floods into any company with a ".com" in its name, often valuing businesses with no revenue or path to profitability at billions of dollars. The prevailing belief is that the internet represents a "new economy" where traditional valuation metrics don\'t apply. Companies prioritize growth and "user acquisition" over profits, burning through cash with lavish spending on marketing, parties, and offices. The NASDAQ, heavy with tech stocks, begins a meteoric rise.',
    impact: 'Technology stocks entered explosive growth phase. NASDAQ began historic rally from 1,000 to eventual peak of 5,048. Internet and software companies IPO\'d at astronomical valuations. Venture capital investment surged 10-fold. Stock options made thousands of employees millionaires on paper. Traditional retailers and media companies scrambled to create internet strategies. E-commerce pioneers like Amazon and eBay emerged. Telecommunications infrastructure stocks boomed on bandwidth demand. Traditional value stocks underperformed dramatically. Mutual funds launched dedicated internet funds. Day trading became popular hobby. Financial media coverage of tech intensified. Dot-com startups proliferated in every sector. IPO market red-hot with shares doubling, tripling on first day. Later stages showed increasingly speculative excess.'
  },
  {
    id: 'asian-crisis-1997',
    date: new Date('1997-07-02'),
    title: 'Asian Financial Crisis',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Financial crisis spreads across Asian economies, affecting global markets.',
    impact: 'Emerging market decline, flight to quality'
  },
  {
    id: 'ltcm-1998',
    date: new Date('1998-09-23'),
    title: 'LTCM Collapse',
    category: 'Financial',
    severity: 'major',
    description: 'Long-Term Capital Management hedge fund collapses, requiring Federal Reserve intervention.',
    impact: 'Market volatility, concerns about systemic risk'
  },
  
  // 2000s
  {
    id: 'dotcom-bubble-2000',
    date: new Date('2000-03-10'),
    title: 'Dot-com Bubble Bursts',
    category: 'Crash',
    severity: 'severe',
    description: 'The technology-heavy NASDAQ Composite reaches its peak of 5,048 points before beginning a catastrophic decline that would wipe out $5 trillion in market value over the next two years. The bubble had been fueled by speculation in internet companies, many of which had never turned a profit but commanded astronomical valuations based on "eyeballs" and "clicks" rather than earnings. Easy capital from venture capitalists and IPO-hungry investment banks allowed hundreds of unprofitable companies to burn through cash while pursuing growth at any cost. The collapse begins as rising interest rates and concerns about valuations cause investors to flee high-flying tech stocks. Companies like Pets.com, Webvan, and eToys.com become symbols of irrational exuberance.',
    impact: 'NASDAQ crashed 78% from peak, falling from 5,048 to 1,114 over 2.5 years. Technology sector devastated with hundreds of dot-com companies going bankrupt. Telecommunications sector collapsed under massive debt from infrastructure buildout. Former high-flyers like Cisco, Intel, and Microsoft lost 70-80% of value. Venture capital funding dried up almost completely. IPO market shut down for years. Unemployment in tech sector soared. Traditional economy stocks held value better. Mutual funds focused on technology suffered catastrophic losses. Margin calls forced widespread selling. Many individual investors lost retirement savings. Conservative value stocks outperformed. Flight to quality benefited bonds and blue-chip stocks. Market cap-weighted indices heavily impacted. Eventually triggered broader economic recession. Recovery took years for tech sector.'
  },
  {
    id: 'recession-2001',
    date: new Date('2001-03-01'),
    title: '2001 Recession',
    category: 'Economic',
    severity: 'moderate',
    description: 'The U.S. economy enters recession following the collapse of the dot-com bubble, marking the end of the longest economic expansion in American history. The recession is initially mild, triggered by the unwinding of excess technology investment and the bursting of the stock market bubble. However, the September 11 terrorist attacks severely deepen the downturn, causing consumer confidence to plummet and business investment to freeze. The Federal Reserve responds aggressively, cutting interest rates from 6.5% to 1.75% and eventually to 1% by 2003. This creates the conditions for a housing boom that will have its own consequences later in the decade.',
    impact: 'Stock market already declining from dot-com crash fell further. S&P 500 declined 49% from peak to trough. Technology sector particularly devastated with continued bankruptcies. Telecommunications sector collapsed with massive debt defaults. Airlines severely impacted requiring government assistance. Travel and hospitality sectors crashed. Defense and security stocks rallied. Insurance sector hit by 9/11 claims. Corporate scandals (Enron, WorldCom) eroded investor confidence. Accounting and auditing standards tightened. Federal Reserve cut rates to 1%, lowest in decades. Bond yields plummeted. Gold began long-term rally as safe haven. Real estate benefited from low rates. Unemployment rose to 6.3%. Corporate spending on technology froze. Energy stocks showed relative strength. Dividend-paying stocks gained favor over growth stocks.'
  },
  {
    id: '911-2001',
    date: new Date('2001-09-11'),
    title: 'September 11 Attacks',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Terrorist attacks on the World Trade Center and Pentagon shock the nation and world. U.S. stock markets close for four trading days, the longest closure since the Great Depression. When markets reopen on September 17, the Dow Jones plunges 684 points (7.1%), its largest single-day point decline at the time. Insurance companies face billions in claims, airlines teeter on bankruptcy, and the entire travel and tourism industry collapses. The attacks reshape geopolitical landscape, leading to wars in Afghanistan and Iraq, massive increases in defense and security spending, and fundamental changes in how Americans view safety and risk. The economic impact accelerates the 2001 recession.',
    impact: 'Markets closed for four days, longest shutdown since 1933. Dow fell 684 points (7.1%) on reopening, record point decline. S&P 500 declined 11.6% in week after reopening. Airlines lost 40% of value immediately, several bankruptcies followed. Travel, hotel, and tourism stocks crashed. Insurance sector faced massive claims, stocks plummeted. Defense contractors saw surge in orders and stock prices. Security technology companies rallied. Oil prices spiked on supply concerns. Gold surged as safe haven. Treasury bonds rallied sharply. Put/call ratios hit extremes showing panic. VIX volatility index spiked. Federal Reserve emergency rate cuts. Government provided airline bailout. Consumer confidence plummeted to decade lows. Real estate near World Trade Center devalued. Long-term shift toward homeland security spending. Market eventually recovered but recession deepened.'
  },
  {
    id: 'housing-boom-2003',
    date: new Date('2003-01-01'),
    title: 'Housing Boom',
    category: 'Market',
    severity: 'positive',
    description: 'U.S. housing market begins rapid appreciation, fueled by low interest rates and lax lending.',
    impact: 'Real estate sector surge, financial sector growth'
  },
  {
    id: 'bear-stearns-2008',
    date: new Date('2008-03-16'),
    title: 'Bear Stearns Collapse',
    category: 'Financial',
    severity: 'major',
    description: 'Bear Stearns is sold to JPMorgan Chase in a fire sale orchestrated by the Federal Reserve.',
    impact: 'Banking sector panic, credit crisis intensifies'
  },
  {
    id: 'lehman-2008',
    date: new Date('2008-09-15'),
    title: 'Lehman Brothers Bankruptcy',
    category: 'Crash',
    severity: 'severe',
    description: 'Lehman Brothers Holdings Inc., a 158-year-old investment bank and the fourth-largest in the United States, files for Chapter 11 bankruptcy protection with $639 billion in assets and $619 billion in debt. This is the largest bankruptcy filing in U.S. history. The collapse comes after the firm\'s massive exposure to subprime mortgages and mortgage-backed securities became untenable, and efforts to find a buyer or government rescue failed. Unlike Bear Stearns months earlier, the government chose not to bail out Lehman, sending shockwaves through global financial markets. The failure triggered the most severe phase of the financial crisis, causing credit markets to freeze, money market funds to "break the buck," and threatening the entire global financial system with collapse.',
    impact: 'Global financial markets went into freefall. Dow Jones plunged 504 points (4.4%) on bankruptcy announcement. Credit markets completely froze as banks stopped lending to each other. Commercial paper market seized up, threatening corporate funding. Money market fund Reserve Primary Fund broke the buck, causing investor panic and run on money funds. Counterparty risk became paramount concern. European banks with Lehman exposure faced crisis. S&P 500 ultimately fell 57% from peak. Financial sector stocks crashed with many banks failing. AIG required government bailout. Global recession ensued. Unemployment reached 10%. Housing market collapsed further. Auto industry required rescue. TARP program created. Federal Reserve emergency measures unprecedented. Short selling temporarily banned on financial stocks. Volatility index (VIX) hit record highs. Only Treasury bonds provided safe haven. Gold eventually rallied. Recovery took years.'
  },
  {
    id: 'financial-crisis-2008',
    date: new Date('2008-10-01'),
    title: 'Global Financial Crisis',
    category: 'Crash',
    severity: 'severe',
    description: 'Worst financial crisis since the Great Depression, requiring massive government intervention.',
    impact: 'Market crash, bank failures, Great Recession'
  },
  
  // 2010s
  {
    id: 'flash-crash-2010',
    date: new Date('2010-05-06'),
    title: 'Flash Crash',
    category: 'Market',
    severity: 'moderate',
    description: 'U.S. stock market experiences a trillion-dollar flash crash, recovering within minutes.',
    impact: 'Temporary market disruption, concerns about algorithmic trading'
  },
  {
    id: 'european-debt-2011',
    date: new Date('2011-07-01'),
    title: 'European Debt Crisis',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Sovereign debt crisis threatens the eurozone, particularly Greece, Spain, and Italy.',
    impact: 'Market volatility, concerns about European banking system'
  },
  {
    id: 'bull-market-2013',
    date: new Date('2013-03-28'),
    title: 'Bull Market Milestone',
    category: 'Market',
    severity: 'positive',
    description: 'S&P 500 surpasses its pre-financial crisis peak, marking recovery from 2008.',
    impact: 'Investor confidence returns, sustained market growth'
  },
  {
    id: 'oil-crash-2014',
    date: new Date('2014-06-01'),
    title: 'Oil Price Collapse',
    category: 'Economic',
    severity: 'major',
    description: 'Global oil prices collapse from over $100 to below $30 per barrel.',
    impact: 'Energy sector decline, emerging market stress'
  },
  {
    id: 'china-crash-2015',
    date: new Date('2015-08-24'),
    title: 'China Stock Market Crash',
    category: 'Geopolitical',
    severity: 'major',
    description: 'Chinese stock market bubble bursts, causing global market turmoil.',
    impact: 'Global market sell-off, concerns about Chinese economy'
  },
  
  // 2020s
  {
    id: 'covid-crash-2020',
    date: new Date('2020-02-19'),
    title: 'COVID-19 Market Crash',
    category: 'Crash',
    severity: 'severe',
    description: 'The global COVID-19 pandemic triggers the fastest bear market in history as markets realize the economic impact of a worldwide public health crisis. The S&P 500 plunges 34% in just 23 trading days from its February 19 peak to March 23 trough—the quickest descent into a bear market ever recorded. Governments worldwide implement unprecedented lockdowns, closing businesses, schools, and borders. Global supply chains seize up. Unemployment claims surge to record levels with over 20 million Americans filing in a single month. Oil prices briefly turn negative for the first time in history as demand evaporates. Unlike previous crashes, this was not caused by financial system problems but by an external shock—a pandemic—that forced the simultaneous shutdown of major economies worldwide.',
    impact: 'Markets experienced fastest crash in history with S&P 500 falling 34% in weeks. Circuit breakers triggered multiple times. Volatility index (VIX) hit all-time high of 82. All sectors declined simultaneously except video conferencing and delivery. Travel, hospitality, and entertainment sectors devastated with many bankruptcies. Airlines required government support. Retail apocalypse accelerated. Oil prices briefly negative. Cruise lines and theme parks lost 80%+ of value. Stay-at-home stocks like Zoom, Peloton, Netflix surged. E-commerce boomed. Federal Reserve cut rates to zero and launched unlimited QE. Government stimulus reached trillions. Gold rallied. Tech stocks recovered fastest. Work-from-home technology thrived. Grocery and essential retail strong. Real estate sector mixed. Biotech and healthcare gained focus. Market V-shaped recovery unprecedented due to massive stimulus. Speculative trading surged among retail investors.'
  },
  {
    id: 'covid-recovery-2020',
    date: new Date('2020-08-18'),
    title: 'Rapid V-Shaped Recovery',
    category: 'Market',
    severity: 'positive',
    description: 'Markets recover to new highs within months, driven by massive fiscal and monetary stimulus.',
    impact: 'Technology sector boom, meme stock phenomenon'
  },
  {
    id: 'inflation-surge-2021',
    date: new Date('2021-05-01'),
    title: 'Inflation Surge',
    category: 'Economic',
    severity: 'major',
    description: 'Inflation reaches highest levels in 40 years, driven by supply chain issues and stimulus.',
    impact: 'Rising interest rates, market volatility'
  },
  {
    id: 'rate-hikes-2022',
    date: new Date('2022-03-16'),
    title: 'Aggressive Rate Hikes Begin',
    category: 'Regulatory',
    severity: 'major',
    description: 'Federal Reserve begins most aggressive rate hiking cycle in decades to combat inflation.',
    impact: 'Market decline, bond market volatility, tech sector weakness'
  },
  {
    id: 'banking-crisis-2023',
    date: new Date('2023-03-10'),
    title: 'Regional Banking Crisis',
    category: 'Financial',
    severity: 'major',
    description: 'Silicon Valley Bank and Signature Bank fail, triggering concerns about banking system.',
    impact: 'Banking sector stress, flight to safety, regulatory response'
  }
];

// Get events that have occurred by a given date
function getEventsUpToDate(currentGameDate) {
  const gameDate = new Date(currentGameDate);
  return historicalEvents
    .filter(event => event.date <= gameDate)
    .sort((a, b) => b.date - a.date); // Most recent first
}

// Get events by category
function getEventsByCategory(category, currentGameDate) {
  const availableEvents = getEventsUpToDate(currentGameDate);
  return availableEvents.filter(event => event.category === category);
}

// Get events by severity
function getEventsBySeverity(severity, currentGameDate) {
  const availableEvents = getEventsUpToDate(currentGameDate);
  return availableEvents.filter(event => event.severity === severity);
}

// Get all categories
function getCategories() {
  return ['Economic', 'Market', 'Crash', 'Regulatory', 'Geopolitical', 'Financial'];
}

// Get upcoming events (for admin/debug purposes only - not shown to players)
function getUpcomingEvents(currentGameDate, daysAhead = 365) {
  const gameDate = new Date(currentGameDate);
  const futureDate = new Date(gameDate.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return historicalEvents
    .filter(event => event.date > gameDate && event.date <= futureDate)
    .sort((a, b) => a.date - b.date); // Chronological order
}

module.exports = {
  historicalEvents,
  getEventsUpToDate,
  getEventsByCategory,
  getEventsBySeverity,
  getCategories,
  getUpcomingEvents
};
