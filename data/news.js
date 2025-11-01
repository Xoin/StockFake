// Historical news events - focusing on business/economic events with less public details
const stocks = require('./stocks');

const newsEvents = [
  // 1970s - Oil Crisis Era
  {
    id: 1,
    date: new Date('1970-01-01'),
    headline: 'New Decade Begins with Economic Optimism',
    body: 'As we enter the 1970s, economists predict steady growth despite some challenges in the financial markets. Manufacturing output remains strong.'
  },
  {
    id: 2,
    date: new Date('1970-06-01'),
    headline: 'Penn Central Railroad Files for Bankruptcy',
    body: 'In the largest corporate bankruptcy in U.S. history, Penn Central Transportation Company has filed for bankruptcy protection. The collapse raises concerns about the railroad industry.'
  },
  {
    id: 3,
    date: new Date('1971-02-08'),
    headline: 'NASDAQ Stock Market Opens',
    body: 'The National Association of Securities Dealers Automated Quotations opens for trading. This new electronic market could revolutionize stock trading.'
  },
  {
    id: 4,
    date: new Date('1971-08-15'),
    headline: 'Nixon Suspends Dollar Convertibility to Gold',
    body: 'President Nixon announces temporary suspension of dollar convertibility to gold. Economic advisors suggest this could lead to more flexible currency markets.'
  },
  {
    id: 5,
    date: new Date('1972-05-26'),
    headline: 'SALT Treaty Signed with Soviet Union',
    body: 'Strategic Arms Limitation Treaty signed in Moscow. Defense contractors express uncertainty about future government spending on weapons systems.'
  },
  {
    id: 6,
    date: new Date('1973-01-11'),
    headline: 'Price Controls Extended on Oil Products',
    body: 'Federal government extends price controls on petroleum products. Energy company executives warn this could discourage domestic production.'
  },
  {
    id: 7,
    date: new Date('1973-10-17'),
    headline: 'Arab Oil Producers Cut Exports',
    body: 'OPEC members announce production cuts and export restrictions following recent Middle East tensions. Initial impact on crude prices uncertain.'
  },
  {
    id: 8,
    date: new Date('1974-01-02'),
    headline: 'Federal Speed Limit Reduced to 55 MPH',
    body: 'Emergency Highway Energy Conservation Act goes into effect. Auto manufacturers concerned about impact on vehicle demand and fuel-efficiency requirements.'
  },
  {
    id: 9,
    date: new Date('1974-10-11'),
    headline: 'Franklin National Bank Collapses',
    body: 'Franklin National Bank, one of the largest U.S. banks, fails after foreign exchange trading losses. Federal regulators working to contain systemic risk.'
  },
  {
    id: 10,
    date: new Date('1975-03-29'),
    headline: 'Tax Rebate Program Announced',
    body: 'Congress passes tax rebate legislation to stimulate consumer spending. Retail sector anticipates increased activity in coming months.'
  },
  {
    id: 11,
    date: new Date('1975-12-22'),
    headline: 'Energy Policy Conservation Act Signed',
    body: 'New legislation establishes Corporate Average Fuel Economy standards. Auto industry faces mandatory fuel efficiency improvements by 1985.'
  },
  
  // 1976-1980 - Recovery and Inflation
  {
    id: 12,
    date: new Date('1976-07-20'),
    headline: 'Viking 1 Lands on Mars',
    body: 'NASA achieves first successful Mars landing. Aerospace contractors report strong order books for space exploration programs.'
  },
  {
    id: 13,
    date: new Date('1977-01-20'),
    headline: 'New Administration Proposes Economic Stimulus',
    body: 'Carter administration unveils economic package focusing on job creation. Business groups express mixed reactions to regulatory proposals.'
  },
  {
    id: 14,
    date: new Date('1978-10-24'),
    headline: 'Airline Deregulation Act Becomes Law',
    body: 'New legislation phases out federal control of airline routes and fares. Existing carriers warn of potential service disruptions while new entrants prepare to compete.'
  },
  {
    id: 15,
    date: new Date('1979-03-28'),
    headline: 'Nuclear Incident at Three Mile Island',
    body: 'Partial meltdown occurs at Pennsylvania nuclear plant. Utilities with nuclear assets face uncertain regulatory environment and potential retrofit costs.'
  },
  {
    id: 16,
    date: new Date('1979-07-15'),
    headline: 'Federal Reserve Chair Emphasizes Inflation Fight',
    body: 'Fed Chairman signals commitment to controlling inflation through monetary policy. Some economists warn tighter money supply could slow growth.'
  },
  {
    id: 17,
    date: new Date('1979-11-04'),
    headline: 'U.S. Embassy in Tehran Seized',
    body: 'Iranian militants take American diplomats hostage. Oil markets react nervously to deteriorating U.S.-Iran relations and potential supply disruptions.'
  },
  {
    id: 18,
    date: new Date('1980-01-04'),
    headline: 'Gold Prices Hit Record Highs',
    body: 'Gold trading above $800 per ounce as investors seek inflation hedge. Mining companies expanding operations to meet demand.'
  },
  {
    id: 19,
    date: new Date('1980-04-02'),
    headline: 'Crude Oil Decontrol Begins',
    body: 'Gradual phase-out of oil price controls begins. Domestic energy producers anticipate improved margins while consumers face higher costs.'
  },
  {
    id: 20,
    date: new Date('1980-12-08'),
    headline: 'Interest Rates Reach Historic Levels',
    body: 'Prime rate exceeds 20% as Federal Reserve maintains tight monetary policy. Borrowing costs affecting business investment and housing sector.'
  },
  
  // 1981-1985 - Tech Emergence
  {
    id: 21,
    date: new Date('1981-03-30'),
    headline: 'Attempted Assassination Shakes Markets',
    body: 'Markets close early following attack on President Reagan. Administration economic policies face uncertain implementation timeline.'
  },
  {
    id: 22,
    date: new Date('1981-08-12'),
    headline: 'IBM Enters Personal Computer Market',
    body: 'International Business Machines unveils PC using Intel processor and Microsoft operating system. Industry analysts debate whether mainframe giant can compete with specialized manufacturers.'
  },
  {
    id: 23,
    date: new Date('1982-08-17'),
    headline: 'Mexico Announces Debt Moratorium',
    body: 'Mexican government unable to service foreign debt. Major U.S. banks with Latin American exposure face potential loan losses.'
  },
  {
    id: 24,
    date: new Date('1982-10-13'),
    headline: 'Stock Market Rally Gains Momentum',
    body: 'Major indices show sustained gains as interest rates begin declining from peak levels. Some analysts suggest bear market may be ending.'
  },
  {
    id: 25,
    date: new Date('1983-01-03'),
    headline: 'AT&T Breakup Takes Effect',
    body: 'Telecommunications giant divests regional Bell operating companies. New competitive landscape creates uncertainty and opportunity in telecom sector.'
  },
  {
    id: 26,
    date: new Date('1984-01-24'),
    headline: 'Apple Introduces Macintosh Computer',
    body: 'Apple Computer launches personal computer with graphical interface. Company aims to differentiate from IBM PC standard emerging in business market.'
  },
  {
    id: 27,
    date: new Date('1984-08-12'),
    headline: 'Continental Illinois Requires Federal Rescue',
    body: 'Seventh-largest U.S. bank receives government assistance after deposit run. Regulators cite bad energy loans as contributing factor.'
  },
  {
    id: 28,
    date: new Date('1985-03-14'),
    headline: 'Plaza Accord Targets Dollar Strength',
    body: 'Major economies agree to coordinate currency intervention. Strong dollar has hurt U.S. exports; manufacturers hope for competitive relief.'
  },
  {
    id: 29,
    date: new Date('1985-09-01'),
    headline: 'Titanic Wreckage Located',
    body: 'Deep-sea exploration technology demonstrates new capabilities. Oceanographic equipment manufacturers report increased interest from research institutions.'
  },
  
  // 1986-1990 - Market Volatility
  {
    id: 30,
    date: new Date('1986-01-28'),
    headline: 'Space Shuttle Challenger Disaster',
    body: 'NASA mission ends in tragedy shortly after launch. Aerospace contractors face scrutiny over safety procedures and potential program delays.'
  },
  {
    id: 31,
    date: new Date('1986-04-26'),
    headline: 'Nuclear Accident in Soviet Union',
    body: 'Reports emerge of serious reactor incident at Chernobyl. Western nuclear power industry faces renewed safety concerns and regulatory pressure.'
  },
  {
    id: 32,
    date: new Date('1986-11-14'),
    headline: 'Insider Trading Scandal Rocks Wall Street',
    body: 'Major investment banker arrested on insider trading charges. Ongoing investigation creating uncertainty about trading practices at multiple firms.'
  },
  {
    id: 33,
    date: new Date('1987-02-20'),
    headline: 'Louvre Accord Aims to Stabilize Currencies',
    body: 'Finance ministers agree to stabilize exchange rates. Dollar depreciation since Plaza Accord has gone further than intended.'
  },
  {
    id: 34,
    date: new Date('1987-10-19'),
    headline: 'Stock Markets Experience Severe Decline',
    body: 'Dow Jones drops over 22% in single session. Program trading and portfolio insurance blamed for accelerating selling. Circuit breakers under consideration.'
  },
  {
    id: 35,
    date: new Date('1988-03-16'),
    headline: 'Fed Provides Liquidity After Market Drop',
    body: 'Federal Reserve signals willingness to support financial system. Banks reporting improved lending conditions for brokerages and market makers.'
  },
  {
    id: 36,
    date: new Date('1989-03-24'),
    headline: 'Exxon Valdez Oil Spill in Alaska',
    body: 'Tanker accident creates environmental disaster in Prince William Sound. Energy companies face potential regulatory changes and liability concerns.'
  },
  {
    id: 37,
    date: new Date('1989-08-09'),
    headline: 'Savings and Loan Crisis Deepens',
    body: 'Hundreds of thrift institutions insolvent. Federal bailout legislation under consideration could cost taxpayers tens of billions.'
  },
  {
    id: 38,
    date: new Date('1989-11-09'),
    headline: 'Berlin Wall Opens',
    body: 'East Germany opens border crossings. Reunification speculation raises questions about European economic integration and German competitiveness.'
  },
  {
    id: 39,
    date: new Date('1990-08-02'),
    headline: 'Iraq Invades Kuwait',
    body: 'Military action disrupts Middle East stability. Oil markets react to supply concerns; defense contractors anticipate increased government spending.'
  },
  
  // 1991-1995 - Tech Growth
  {
    id: 40,
    date: new Date('1991-01-17'),
    headline: 'Operation Desert Storm Begins',
    body: 'Coalition forces commence air campaign. Early reports suggest advanced weapons systems performing better than expected in combat conditions.'
  },
  {
    id: 41,
    date: new Date('1992-02-07'),
    headline: 'European Union Treaty Signed',
    body: 'Maastricht Treaty establishes framework for European integration. Multinational corporations evaluate opportunities and challenges in unified market.'
  },
  {
    id: 42,
    date: new Date('1993-01-20'),
    headline: 'New Administration Focuses on Economy',
    body: 'Clinton takes office emphasizing deficit reduction and technology investment. Healthcare reform also on agenda, concerning insurance and pharmaceutical sectors.'
  },
  {
    id: 43,
    date: new Date('1993-08-10'),
    headline: 'Budget Deficit Reduction Plan Passes',
    body: 'Congress narrowly approves tax increases and spending cuts. Technology investments included; some sectors face higher tax burden.'
  },
  {
    id: 44,
    date: new Date('1994-02-04'),
    headline: 'Federal Reserve Raises Interest Rates',
    body: 'First rate increase in five years surprises markets. Fed citing early inflation signals; bond investors face potential losses.'
  },
  {
    id: 45,
    date: new Date('1994-12-20'),
    headline: 'Mexico Currency Crisis Emerges',
    body: 'Peso devaluation creates financial turmoil. U.S. companies with Mexican operations and banks with emerging market exposure face headwinds.'
  },
  {
    id: 46,
    date: new Date('1995-03-20'),
    headline: 'Nerve Gas Attack in Tokyo Subway',
    body: 'Terrorist incident raises security concerns globally. Chemical detection and security equipment manufacturers see increased demand.'
  },
  {
    id: 47,
    date: new Date('1995-08-24'),
    headline: 'Microsoft Launches Windows 95',
    body: 'New operating system generates consumer excitement. Software company transitions from licensing to retail dominance strategy.'
  },
  
  // 1996-2000 - Dot-Com Era
  {
    id: 48,
    date: new Date('1996-04-03'),
    headline: 'Telecommunications Reform Act Signed',
    body: 'Deregulation allows phone companies, cable firms, and broadcasters to compete in each other\'s markets. Industry consolidation expected.'
  },
  {
    id: 49,
    date: new Date('1997-05-11'),
    headline: 'Computer Defeats Chess Champion',
    body: 'IBM\'s Deep Blue defeats Kasparov in chess match. Artificial intelligence applications gaining commercial attention from technology investors.'
  },
  {
    id: 50,
    date: new Date('1997-07-02'),
    headline: 'Asian Currency Crisis Begins',
    body: 'Thai baht collapse spreads to other Asian economies. Multinational corporations with Asian manufacturing face currency volatility and demand uncertainty.'
  },
  {
    id: 51,
    date: new Date('1998-08-17'),
    headline: 'Russian Financial Crisis Deepens',
    body: 'Russia defaults on domestic debt and devalues ruble. Global credit markets tightening as investors reassess emerging market risks.'
  },
  {
    id: 52,
    date: new Date('1998-09-23'),
    headline: 'Long-Term Capital Management Rescued',
    body: 'Major hedge fund collapse threatens financial system. Federal Reserve coordinates private sector bailout to prevent market disruption.'
  },
  {
    id: 53,
    date: new Date('1999-01-01'),
    headline: 'Euro Currency Launches',
    body: 'Eleven European nations adopt common currency for electronic transactions. Businesses evaluating pricing and treasury management implications.'
  },
  {
    id: 54,
    date: new Date('1999-03-24'),
    headline: 'NATO Begins Yugoslavia Campaign',
    body: 'Air strikes commence over Kosovo conflict. Defense contractors with precision munitions capabilities receiving new orders.'
  },
  {
    id: 55,
    date: new Date('1999-11-12'),
    headline: 'Financial Modernization Act Passed',
    body: 'Glass-Steagall repeal allows banks, securities firms, and insurers to consolidate. Financial sector anticipates merger wave.'
  },
  {
    id: 56,
    date: new Date('2000-01-01'),
    headline: 'Y2K Transition Proceeds Smoothly',
    body: 'Computer systems handle millennium date change without major disruptions. Technology spending may decline after Y2K preparation surge.'
  },
  {
    id: 57,
    date: new Date('2000-03-10'),
    headline: 'Technology Stocks Reach New Heights',
    body: 'NASDAQ Composite index exceeds 5,000 for first time. Some analysts question valuations of unprofitable internet companies.'
  },
  {
    id: 58,
    date: new Date('2000-04-03'),
    headline: 'Microsoft Antitrust Ruling Issued',
    body: 'Federal judge rules software giant violated antitrust laws. Potential breakup or restrictions on business practices could affect technology sector.'
  },
  
  // 2001-2005 - Post-Bubble Recovery
  {
    id: 59,
    date: new Date('2001-01-03'),
    headline: 'Federal Reserve Cuts Interest Rates',
    body: 'Surprise rate reduction signals concern about economic slowdown. Technology sector particularly weak after investment boom.'
  },
  {
    id: 60,
    date: new Date('2001-04-01'),
    headline: 'U.S. Reconnaissance Plane Incident',
    body: 'Collision with Chinese fighter creates diplomatic tension. Defense electronics manufacturers report increased government interest in surveillance capabilities.'
  },
  {
    id: 61,
    date: new Date('2001-09-11'),
    headline: 'Terrorist Attacks Strike U.S.',
    body: 'Markets closed as nation responds to unprecedented attacks. Defense, security, and insurance sectors face major changes.'
  },
  {
    id: 62,
    date: new Date('2001-12-02'),
    headline: 'Enron Files for Bankruptcy',
    body: 'Energy trading giant collapses after accounting fraud revealed. Auditing practices and corporate governance facing intense scrutiny.'
  },
  {
    id: 63,
    date: new Date('2002-07-21'),
    headline: 'WorldCom Bankruptcy Largest in History',
    body: 'Telecommunications company files Chapter 11 after accounting scandal. Telecom sector faces overcapacity and investor skepticism.'
  },
  {
    id: 64,
    date: new Date('2002-07-30'),
    headline: 'Corporate Accountability Legislation Signed',
    body: 'Sarbanes-Oxley Act imposes new audit requirements and executive certifications. Compliance costs concern smaller public companies.'
  },
  {
    id: 65,
    date: new Date('2003-03-20'),
    headline: 'Iraq War Begins',
    body: 'Coalition forces invade Iraq. Oil prices volatile; defense contractors securing reconstruction and security contracts.'
  },
  {
    id: 66,
    date: new Date('2004-02-04'),
    headline: 'Social Networking Site Launches',
    body: 'Facebook opens to college students. Social media platform business models still unproven but attracting venture capital attention.'
  },
  {
    id: 67,
    date: new Date('2004-08-19'),
    headline: 'Google Announces Initial Public Offering',
    body: 'Search engine company prices shares at $85 using unusual auction process. Some investors skeptical of advertising-based revenue model sustainability.'
  },
  {
    id: 68,
    date: new Date('2005-08-29'),
    headline: 'Hurricane Katrina Makes Landfall',
    body: 'Devastating storm hits Gulf Coast. Energy production disrupted; insurance companies face billions in claims; construction firms anticipate rebuilding demand.'
  },
  
  // 2006-2010 - Financial Crisis
  {
    id: 69,
    date: new Date('2006-01-01'),
    headline: 'Housing Market Shows Signs of Cooling',
    body: 'Home price appreciation slowing in some markets. Mortgage lenders and homebuilders remain optimistic about long-term demand.'
  },
  {
    id: 70,
    date: new Date('2007-02-27'),
    headline: 'Subprime Mortgage Concerns Emerge',
    body: 'Several subprime lenders report losses and tighten standards. Analysts debate extent of problems in mortgage-backed securities.'
  },
  {
    id: 71,
    date: new Date('2007-08-09'),
    headline: 'Credit Markets Experience Disruption',
    body: 'Banks reluctant to lend to each other amid mortgage security uncertainty. Federal Reserve monitoring liquidity conditions closely.'
  },
  {
    id: 72,
    date: new Date('2008-03-16'),
    headline: 'Bear Stearns Acquired in Emergency Sale',
    body: 'Investment bank sold to JPMorgan with Federal Reserve assistance. Other financial institutions face scrutiny over mortgage exposure.'
  },
  {
    id: 73,
    date: new Date('2008-07-14'),
    headline: 'IndyMac Bank Seized by Regulators',
    body: 'Large mortgage lender fails after deposit run. FDIC managing bank closure; other regional banks face deposit pressure.'
  },
  {
    id: 74,
    date: new Date('2008-09-07'),
    headline: 'Fannie Mae and Freddie Mac in Conservatorship',
    body: 'Government takes control of mortgage finance giants. Housing market support uncertain; banks holding agency securities face questions.'
  },
  {
    id: 75,
    date: new Date('2008-09-15'),
    headline: 'Lehman Brothers Files Bankruptcy',
    body: 'Major investment bank collapses as government declines rescue. Credit markets freezing; other financial institutions face potential counterparty losses.'
  },
  {
    id: 76,
    date: new Date('2008-09-16'),
    headline: 'AIG Receives Emergency Federal Loan',
    body: 'Insurance giant near failure gets $85 billion credit line. Derivatives exposure threatened financial system stability.'
  },
  {
    id: 77,
    date: new Date('2008-10-03'),
    headline: 'Emergency Economic Stabilization Act Passes',
    body: 'Congress authorizes $700 billion for troubled asset purchases. Banks may receive capital injections; effectiveness of program debated.'
  },
  {
    id: 78,
    date: new Date('2009-02-17'),
    headline: 'Stimulus Package Enacted',
    body: 'American Recovery and Reinvestment Act provides $787 billion for economy. Infrastructure, renewable energy, and healthcare IT sectors targeted for spending.'
  },
  {
    id: 79,
    date: new Date('2009-03-09'),
    headline: 'Stock Markets Reach Crisis Lows',
    body: 'Major indices hit multi-year lows amid recession fears. Some analysts suggest valuations becoming attractive for long-term investors.'
  },
  {
    id: 80,
    date: new Date('2009-06-01'),
    headline: 'General Motors Files for Bankruptcy',
    body: 'Iconic automaker enters Chapter 11 with government support. Restructuring eliminates dealerships and brands; suppliers face uncertainty.'
  },
  {
    id: 81,
    date: new Date('2010-04-20'),
    headline: 'Deepwater Horizon Oil Rig Explodes',
    body: 'Offshore drilling disaster creates massive Gulf spill. Energy companies face tighter regulation and higher liability exposure.'
  },
  {
    id: 82,
    date: new Date('2010-05-06'),
    headline: 'Flash Crash Hits Stock Market',
    body: 'Dow Jones drops nearly 1,000 points in minutes before recovering. High-frequency trading and market structure under investigation.'
  },
  {
    id: 83,
    date: new Date('2010-07-21'),
    headline: 'Financial Reform Legislation Signed',
    body: 'Dodd-Frank Act imposes new regulations on financial sector. Banks face capital requirements, derivatives rules, and consumer protection agency oversight.'
  },
  
  // 2011-2015 - Recovery and Tech
  {
    id: 84,
    date: new Date('2011-03-11'),
    headline: 'Earthquake and Tsunami Strike Japan',
    body: 'Disaster damages Fukushima nuclear plant and disrupts manufacturing. Global supply chains affected; companies reassessing production concentration.'
  },
  {
    id: 85,
    date: new Date('2011-08-05'),
    headline: 'U.S. Credit Rating Downgraded',
    body: 'S&P lowers sovereign rating after debt ceiling impasse. Treasury market impact unclear; investors watch for borrowing cost changes.'
  },
  {
    id: 86,
    date: new Date('2012-05-18'),
    headline: 'Facebook Initial Public Offering',
    body: 'Social network prices shares at $38 in largest tech IPO. Trading glitches mar debut; mobile advertising strategy questioned by analysts.'
  },
  {
    id: 87,
    date: new Date('2012-10-29'),
    headline: 'Hurricane Sandy Hits Northeast',
    body: 'Superstorm causes widespread damage and flooding. Utilities, insurers, and construction companies affected; markets closed for two days.'
  },
  {
    id: 88,
    date: new Date('2013-05-22'),
    headline: 'Federal Reserve Signals Taper Timeline',
    body: 'Central bank indicates eventual reduction in bond purchases. Interest-sensitive sectors like utilities and REITs face headwinds from rising rates.'
  },
  {
    id: 89,
    date: new Date('2014-06-01'),
    headline: 'European Central Bank Introduces Negative Rates',
    body: 'ECB cuts deposit rate below zero. Unprecedented monetary policy; effects on European banks and global capital flows uncertain.'
  },
  {
    id: 90,
    date: new Date('2014-11-27'),
    headline: 'OPEC Maintains Production Despite Price Drop',
    body: 'Oil cartel declines to cut output as crude falls below $70. U.S. shale producers face profitability pressure; energy sector volatility expected.'
  },
  {
    id: 91,
    date: new Date('2015-08-11'),
    headline: 'China Devalues Yuan Currency',
    body: 'Unexpected policy change roils global markets. Multinational companies face earnings translation headwinds; emerging markets under pressure.'
  },
  {
    id: 92,
    date: new Date('2015-12-16'),
    headline: 'Fed Raises Rates for First Time Since 2006',
    body: 'Federal Reserve increases target rate by quarter point. Gradual normalization expected; financial sector may benefit from wider interest margins.'
  },
  
  // 2016-2020 - Political Change and Pandemic
  {
    id: 93,
    date: new Date('2016-06-23'),
    headline: 'UK Votes to Leave European Union',
    body: 'Brexit referendum result surprises markets. Pound plunges; multinational corporations with UK operations face regulatory and trade uncertainty.'
  },
  {
    id: 94,
    date: new Date('2016-11-09'),
    headline: 'Presidential Election Results Surprise Markets',
    body: 'Unexpected outcome creates policy uncertainty. Infrastructure, defense, and domestic energy sectors anticipate favorable treatment; healthcare and trade-sensitive industries cautious.'
  },
  {
    id: 95,
    date: new Date('2017-12-22'),
    headline: 'Major Tax Reform Legislation Enacted',
    body: 'Corporate tax rate reduced to 21% from 35%. Companies with primarily domestic earnings benefit most; repatriation provisions affect multinationals with overseas cash.'
  },
  {
    id: 96,
    date: new Date('2018-03-22'),
    headline: 'Tariffs Announced on Chinese Imports',
    body: 'Administration imposes duties on $50 billion of goods. Trade war concerns affect manufacturers with complex supply chains; domestic producers may benefit.'
  },
  {
    id: 97,
    date: new Date('2018-10-10'),
    headline: 'Interest Rate Concerns Trigger Volatility',
    body: 'Tech stocks lead market decline on rate worries. Federal Reserve continuing gradual tightening; high-growth companies face higher discount rates.'
  },
  {
    id: 98,
    date: new Date('2019-08-14'),
    headline: 'Yield Curve Inverts Briefly',
    body: 'Two-year Treasury yield exceeds 10-year rate. Historically reliable recession indicator; some economists argue different factors at play this time.'
  },
  {
    id: 99,
    date: new Date('2020-01-30'),
    headline: 'WHO Declares Health Emergency',
    body: 'Coronavirus outbreak in China declared international concern. Travel and manufacturing disruptions possible; pharmaceutical companies developing diagnostics and treatments.'
  },
  {
    id: 100,
    date: new Date('2020-03-11'),
    headline: 'Pandemic Declared as Virus Spreads Globally',
    body: 'COVID-19 reaches pandemic status. Economic activity faces unprecedented disruption; remote work technology and healthcare sectors seeing urgent demand.'
  },
  {
    id: 101,
    date: new Date('2020-03-16'),
    headline: 'Federal Reserve Cuts Rates to Zero',
    body: 'Emergency action as pandemic threatens economy. Unlimited bond purchases announced; markets seeking stability after severe volatility.'
  },
  {
    id: 102,
    date: new Date('2020-03-27'),
    headline: 'Massive Stimulus Package Signed',
    body: 'CARES Act provides $2 trillion in relief. Direct payments to individuals, small business loans, and unemployment extensions; airlines and other industries receive targeted aid.'
  },
  {
    id: 103,
    date: new Date('2020-11-09'),
    headline: 'Vaccine Development Shows Promising Results',
    body: 'Pharmaceutical company reports 90% efficacy in trials. Multiple candidates in late-stage testing; distribution and manufacturing challenges remain.'
  },
  
  // 2021-2025 - Recovery and New Challenges
  {
    id: 104,
    date: new Date('2021-01-27'),
    headline: 'Trading Volatility in Retail-Focused Stocks',
    body: 'Social media-driven trading creates extreme price swings. Brokerages restrict certain transactions; market structure questions raised about retail participation.'
  },
  {
    id: 105,
    date: new Date('2021-03-11'),
    headline: 'Infrastructure Spending Plan Proposed',
    body: 'Administration unveils $2 trillion infrastructure package. Construction, materials, and clean energy sectors anticipate increased spending over coming years.'
  },
  {
    id: 106,
    date: new Date('2021-11-10'),
    headline: 'Inflation Reaches Three-Decade High',
    body: 'Consumer prices up 6.2% year-over-year. Federal Reserve maintains "transitory" view but markets pricing in earlier rate hikes; companies facing margin pressure.'
  },
  {
    id: 107,
    date: new Date('2022-02-24'),
    headline: 'Russia Invades Ukraine',
    body: 'Military action creates humanitarian crisis and economic uncertainty. Energy and agricultural commodity prices surge; sanctions affect multinational operations.'
  },
  {
    id: 108,
    date: new Date('2022-03-16'),
    headline: 'Federal Reserve Begins Rate Hiking Cycle',
    body: 'First of expected series of increases to combat inflation. Aggressive tightening path anticipated; technology and other growth sectors face valuation pressure.'
  },
  {
    id: 109,
    date: new Date('2022-09-13'),
    headline: 'Inflation Persists Above Expectations',
    body: 'Core CPI remains elevated despite rate increases. Fed officials signal commitment to restoring price stability even at cost of slower growth.'
  },
  {
    id: 110,
    date: new Date('2023-03-10'),
    headline: 'Silicon Valley Bank Closed by Regulators',
    body: 'Tech-focused lender fails after deposit run. Uninsured depositors rescued by government action; other regional banks face scrutiny over interest rate risk.'
  },
  {
    id: 111,
    date: new Date('2023-05-03'),
    headline: 'Banking Stress Tests Announced',
    body: 'First Republic Bank acquired after collapse. Regulators proposing stricter capital and liquidity requirements for regional institutions.'
  },
  {
    id: 112,
    date: new Date('2023-11-30'),
    headline: 'AI Technology Adoption Accelerating',
    body: 'Generative AI tools achieving mainstream business adoption. Technology companies investing billions in capabilities; productivity implications debated by economists.'
  },
  {
    id: 113,
    date: new Date('2024-03-20'),
    headline: 'Federal Reserve Maintains Higher Rates',
    body: 'Central bank keeps policy restrictive as inflation moderates gradually. Labor market remains resilient; officials emphasize data-dependent approach.'
  },
  {
    id: 114,
    date: new Date('2024-07-11'),
    headline: 'Semiconductor Export Controls Expanded',
    body: 'New restrictions limit advanced chip technology transfers. Manufacturers with international operations face compliance complexity; domestic production incentives continue.'
  },
  {
    id: 115,
    date: new Date('2025-01-15'),
    headline: 'Climate Technology Investment Surges',
    body: 'Public and private funding for carbon capture and renewable energy reaching record levels. Traditional energy companies diversifying; new entrants attracting capital.'
  },
  {
    id: 116,
    date: new Date('2025-06-01'),
    headline: 'Quantum Computing Breakthrough Reported',
    body: 'Research lab demonstrates error correction milestone. Commercial applications still years away but technology companies accelerating development programs.'
  },
  {
    id: 117,
    date: new Date('2025-10-01'),
    headline: 'Global Supply Chain Restructuring Continues',
    body: 'Companies reshoring and nearshoring manufacturing operations. Automation and regional trade agreements changing logistics and industrial real estate demand patterns.'
  }
];

// Dynamic news generation based on market movements

// Track stock price history for dynamic news generation
let priceHistory = {};
let sortedDateCache = []; // Cache of sorted dates for performance
let dynamicNewsEvents = [];
let nextDynamicNewsId = 10000; // Start dynamic IDs high to avoid conflicts

// Thresholds for news generation - Made less frequent for important events only
const SIGNIFICANT_MOVE_THRESHOLD = 8.0; // 8% single-day move (increased to reduce frequency)
const MAJOR_MOVE_THRESHOLD = 12; // 12% single-day move (increased for truly major events)
const VOLATILITY_WINDOW = 5; // Track 5 periods for volatility
const VOLATILITY_THRESHOLD = 4.0; // Average volatility threshold (increased significantly)
const NEWS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 day cooldown per stock (increased from 1 day)

// Maximum quarters to process when catching up on dividends
const MAX_DIVIDEND_QUARTERS_TO_PROCESS = 40; // Safety limit to prevent processing too many quarters at once

// Cleanup thresholds to prevent memory leaks
const MAX_PRICE_HISTORY_DAYS = 90; // Keep only last 90 days of price history
const MAX_DYNAMIC_NEWS_ITEMS = 1000; // Maximum dynamic news items to retain

// Track when we last generated news for each stock
let lastNewsGenerated = {};

function cleanupOldData(currentTime) {
  // Clean up old price history
  const cutoffDate = new Date(currentTime.getTime() - (MAX_PRICE_HISTORY_DAYS * 24 * 60 * 60 * 1000));
  const cutoffKey = cutoffDate.toISOString().split('T')[0];
  
  Object.keys(priceHistory).forEach(dateKey => {
    if (dateKey < cutoffKey) {
      delete priceHistory[dateKey];
    }
  });
  
  // Rebuild sorted date cache after cleanup
  sortedDateCache = Object.keys(priceHistory).sort();
  
  // Clean up old dynamic news events (keep only most recent)
  if (dynamicNewsEvents.length > MAX_DYNAMIC_NEWS_ITEMS) {
    dynamicNewsEvents.sort((a, b) => b.date - a.date);
    dynamicNewsEvents = dynamicNewsEvents.slice(0, MAX_DYNAMIC_NEWS_ITEMS);
  }
  
  // Clean up old news generation timestamps
  const timestamps = Object.keys(lastNewsGenerated);
  if (timestamps.length > 500) {
    timestamps.forEach(key => {
      if (currentTime.getTime() - lastNewsGenerated[key].getTime() > 30 * 24 * 60 * 60 * 1000) { // 30 days
        delete lastNewsGenerated[key];
      }
    });
  }
}

function updatePriceHistory(currentTime) {
  const currentStocks = stocks.getStockData(currentTime);
  const dateKey = currentTime.toISOString().split('T')[0]; // Daily granularity
  
  if (!priceHistory[dateKey]) {
    priceHistory[dateKey] = {};
    // Insert new date in sorted position (dates are typically added chronologically)
    if (sortedDateCache.length === 0 || dateKey > sortedDateCache[sortedDateCache.length - 1]) {
      // Most common case: append to end
      sortedDateCache.push(dateKey);
    } else {
      // Less common: insert in sorted position
      const insertPos = sortedDateCache.findIndex(d => d > dateKey);
      if (insertPos === -1) {
        sortedDateCache.push(dateKey);
      } else {
        sortedDateCache.splice(insertPos, 0, dateKey);
      }
    }
  }
  
  currentStocks.forEach(stock => {
    // Always update to latest price for the day (in case of multiple calls per day)
    priceHistory[dateKey][stock.symbol] = {
      price: stock.price,
      change: stock.change,
      name: stock.name,
      sector: stock.sector
    };
  });
  
  // Generate dynamic news based on significant movements
  generateDynamicNews(currentTime, currentStocks, dateKey);
  
  // Periodically clean up old data to prevent memory leaks
  cleanupOldData(currentTime);
}

function generateDynamicNews(currentTime, currentStocks, dateKey) {
  // Get previous day's data for comparison
  const yesterday = new Date(currentTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split('T')[0];
  
  if (!priceHistory[yesterdayKey]) return;
  
  currentStocks.forEach(stock => {
    const yesterdayData = priceHistory[yesterdayKey][stock.symbol];
    if (!yesterdayData) return;
    
    // Calculate actual daily change
    const dailyChange = ((stock.price - yesterdayData.price) / yesterdayData.price) * 100;
    
    // Check cooldown - use consistent key format
    const movementKey = `stock:${stock.symbol}`;
    const lastNews = lastNewsGenerated[movementKey];
    if (lastNews && (currentTime.getTime() - lastNews.getTime()) < NEWS_COOLDOWN_MS) {
      return;
    }
    
    // Generate news for significant movements
    if (Math.abs(dailyChange) >= SIGNIFICANT_MOVE_THRESHOLD) {
      const newsItem = createMarketMovementNews(stock, dailyChange, currentTime);
      if (newsItem) {
        dynamicNewsEvents.push(newsItem);
        lastNewsGenerated[movementKey] = currentTime;
      }
    }
    
    // Check for volatility patterns (multiple days of high movement)
    const volatility = calculateVolatility(stock.symbol, dateKey);
    const volatilityKey = `volatility:${stock.symbol}`;
    if (volatility > VOLATILITY_THRESHOLD && !lastNewsGenerated[volatilityKey]) {
      const newsItem = createVolatilityNews(stock, volatility, currentTime);
      if (newsItem) {
        dynamicNewsEvents.push(newsItem);
        lastNewsGenerated[volatilityKey] = currentTime;
      }
    }
  });
  
  // Sector-wide movements
  generateSectorNews(currentTime, currentStocks, yesterdayKey);
}

function calculateVolatility(symbol, currentDateKey) {
  // Use cached sorted dates for better performance
  const recentDates = sortedDateCache
    .filter(d => d <= currentDateKey)
    .reverse()
    .slice(0, VOLATILITY_WINDOW);
  
  let totalChange = 0;
  let count = 0;
  
  for (let i = 0; i < recentDates.length - 1; i++) {
    const today = priceHistory[recentDates[i]][symbol];
    const yesterday = priceHistory[recentDates[i + 1]][symbol];
    
    if (today && yesterday) {
      const change = Math.abs((today.price - yesterday.price) / yesterday.price * 100);
      totalChange += change;
      count++;
    }
  }
  
  return count > 0 ? totalChange / count : 0;
}

function createMarketMovementNews(stock, change, date) {
  const direction = change > 0 ? 'surges' : 'plunges';
  const action = change > 0 ? 'gains' : 'losses';
  const absChange = Math.abs(change).toFixed(1);
  
  const headlines = [
    `${stock.name} ${direction} ${absChange}% in Heavy Trading`,
    `${stock.name} Shares ${change > 0 ? 'Jump' : 'Drop'} ${absChange}% on Market Activity`,
    `Investors ${change > 0 ? 'Rush Into' : 'Flee From'} ${stock.name} as Stock Moves ${absChange}%`,
    `${stock.name} Experiences ${absChange}% ${change > 0 ? 'Rally' : 'Decline'}`
  ];
  
  const reasons = [
    'Market analysts cite changing investor sentiment and sector rotation.',
    'Trading volume significantly elevated compared to recent averages.',
    'Institutional investors appear to be repositioning portfolios.',
    'Technical factors and momentum trading contributing to the move.',
    'Broader market trends affecting investor appetite for the sector.',
    'Analysts note shifting economic conditions influencing valuations.'
  ];
  
  const isMajor = Math.abs(change) >= MAJOR_MOVE_THRESHOLD;
  const bodies = isMajor ? [
    `${stock.name} (${stock.symbol}) experienced dramatic price movement today, ${change > 0 ? 'gaining' : 'losing'} ${absChange}%. ${reasons[Math.floor(Math.random() * reasons.length)]} Traders watch closely for potential continuation or reversal.`,
    `Shares of ${stock.name} saw exceptional volatility, ending the session ${change > 0 ? 'up' : 'down'} ${absChange}%. ${reasons[Math.floor(Math.random() * reasons.length)]} ${stock.sector} sector showing mixed signals.`,
    `${stock.name} stock ${change > 0 ? 'surged' : 'tumbled'} ${absChange}% in active trading. ${reasons[Math.floor(Math.random() * reasons.length)]} Options traders betting on continued movement.`
  ] : [
    `${stock.name} (${stock.symbol}) ${change > 0 ? 'advanced' : 'declined'} ${absChange}% today. ${reasons[Math.floor(Math.random() * reasons.length)]} Watch for potential trend development.`,
    `${stock.name} shares moved ${absChange}% ${change > 0 ? 'higher' : 'lower'}. ${reasons[Math.floor(Math.random() * reasons.length)]} Company fundamentals under review by analysts.`
  ];
  
  return {
    id: nextDynamicNewsId++,
    date: new Date(date),
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    body: bodies[Math.floor(Math.random() * bodies.length)],
    isDynamic: true,
    symbol: stock.symbol
  };
}

function createVolatilityNews(stock, volatility, date) {
  const headlines = [
    `${stock.name} Trading Shows Increased Volatility`,
    `${stock.name} Shares Experience Choppy Price Action`,
    `Market Uncertainty Drives ${stock.name} Swings`
  ];
  
  const bodies = [
    `${stock.name} (${stock.symbol}) has exhibited elevated price volatility in recent sessions. Market participants uncertain about near-term direction as trading patterns suggest indecision.`,
    `Shares of ${stock.name} showing erratic price behavior with wide intraday swings. Technical traders watching key support and resistance levels for directional clues.`
  ];
  
  return {
    id: nextDynamicNewsId++,
    date: new Date(date),
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    body: bodies[Math.floor(Math.random() * bodies.length)],
    isDynamic: true,
    symbol: stock.symbol
  };
}

function generateSectorNews(currentTime, currentStocks, yesterdayKey) {
  // Group stocks by sector and calculate average movement
  const sectorMoves = {};
  const sectorCounts = {};
  
  currentStocks.forEach(stock => {
    const yesterdayData = priceHistory[yesterdayKey][stock.symbol];
    if (!yesterdayData) return;
    
    const dailyChange = ((stock.price - yesterdayData.price) / yesterdayData.price) * 100;
    
    if (!sectorMoves[stock.sector]) {
      sectorMoves[stock.sector] = 0;
      sectorCounts[stock.sector] = 0;
    }
    
    sectorMoves[stock.sector] += dailyChange;
    sectorCounts[stock.sector]++;
  });
  
  // Generate news for significant sector movements
  Object.keys(sectorMoves).forEach(sector => {
    const avgMove = sectorMoves[sector] / sectorCounts[sector];
    
    // Only generate if sector has significant average movement and we haven't recently
    if (Math.abs(avgMove) >= 1.5 && sectorCounts[sector] >= 3) {
      const sectorKey = `sector:${sector}`;
      const lastNews = lastNewsGenerated[sectorKey];
      
      if (!lastNews || (currentTime.getTime() - lastNews.getTime()) >= NEWS_COOLDOWN_MS * 3) { // 3-day cooldown for sectors
        const newsItem = createSectorNews(sector, avgMove, sectorCounts[sector], currentTime);
        if (newsItem) {
          dynamicNewsEvents.push(newsItem);
          lastNewsGenerated[sectorKey] = currentTime;
        }
      }
    }
  });
}

function createSectorNews(sector, avgChange, stockCount, date) {
  const direction = avgChange > 0 ? 'Rally' : 'Decline';
  const action = avgChange > 0 ? 'Strength' : 'Weakness';
  const absChange = Math.abs(avgChange).toFixed(1);
  
  const headlines = [
    `${sector} Sector Shows ${action} with ${absChange}% Average Move`,
    `Broad ${direction} in ${sector} Stocks`,
    `${sector} Companies ${avgChange > 0 ? 'Gain Ground' : 'Under Pressure'}`
  ];
  
  const bodies = [
    `${sector} sector experiencing widespread ${avgChange > 0 ? 'gains' : 'losses'} averaging ${absChange}%. ${stockCount} major companies in the sector showing similar price patterns. Analysts attribute movement to sector-specific factors and broader market dynamics.`,
    `Market seeing coordinated movement in ${sector} stocks, with average change of ${absChange}% across ${stockCount} tracked companies. Investors ${avgChange > 0 ? 'rotating into' : 'moving away from'} the sector amid changing market conditions.`
  ];
  
  return {
    id: nextDynamicNewsId++,
    date: new Date(date),
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    body: bodies[Math.floor(Math.random() * bodies.length)],
    isDynamic: true,
    sector: sector
  };
}

function getNews(currentTime) {
  // Update price history and generate new dynamic news if needed
  updatePriceHistory(currentTime);
  
  // Combine historical and dynamic news
  const allNews = [...newsEvents, ...dynamicNewsEvents];
  
  // Return all news up to current game time
  return allNews
    .filter(news => news.date <= currentTime)
    .sort((a, b) => b.date - a.date); // Most recent first
}

function getLatestNews(currentTime, limit = 5) {
  return getNews(currentTime).slice(0, limit);
}

// Reset function for testing
function resetDynamicNews() {
  priceHistory = {};
  sortedDateCache = [];
  dynamicNewsEvents = [];
  nextDynamicNewsId = 10000;
  lastNewsGenerated = {};
}

module.exports = {
  getNews,
  getLatestNews,
  resetDynamicNews
};
