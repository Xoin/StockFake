// Email generation system - investment opportunities, spam, and scams

// Generate investment opportunity emails based on stock performance
function generateInvestmentOpportunities(gameTime, stocks) {
  const emails = [];
  const year = gameTime.getFullYear();
  const month = gameTime.getMonth();
  
  // Investment tips based on historical hindsight
  const opportunities = [
    {
      date: new Date('1975-03-01'),
      from: 'advisor@investmentgroup.com',
      subject: 'Post-Recession Investment Opportunities',
      body: 'Dear Investor,\n\nThe market has bottomed out after the 1973-74 recession. Our analysts believe this presents a unique buying opportunity, especially in the energy and industrial sectors.\n\nConsider: Oil companies are undervalued. Manufacturing stocks are poised for recovery.\n\nBest regards,\nMarket Advisory Team'
    },
    {
      date: new Date('1980-12-01'),
      from: 'tips@wallstreetweekly.com',
      subject: 'Technology Stocks on the Rise',
      body: 'Dear Subscriber,\n\nPersonal computers are becoming the next big thing. IBM and emerging tech companies show strong potential. Our recommendation: Consider adding technology stocks to your portfolio.\n\nThe PC revolution is just beginning!\n\n- Wall Street Weekly'
    },
    {
      date: new Date('1986-01-15'),
      from: 'analyst@futuretech.com',
      subject: 'Microsoft IPO Alert',
      body: 'URGENT: Microsoft is going public this year. This software company has tremendous potential in the emerging PC market. Recommended action: Monitor MSFT closely.\n\nDon\'t miss this opportunity!\n\nTech Analyst Team'
    },
    {
      date: new Date('1990-06-01'),
      from: 'advisor@smartinvest.com',
      subject: 'Recession Ahead - Defensive Strategy',
      body: 'Dear Valued Client,\n\nEconomic indicators suggest a slowdown. We recommend:\n- Reduce exposure to cyclical stocks\n- Increase positions in consumer staples\n- Consider defensive sectors like utilities\n\nWeather the storm with smart positioning.\n\nBest,\nSmart Invest Advisors'
    },
    {
      date: new Date('1995-08-01'),
      from: 'hotpicks@dotcom.com',
      subject: 'The Internet Revolution - Get In Now!',
      body: 'Dear Investor,\n\nThe World Wide Web is transforming business. Internet stocks are the future!\n\nCompanies to watch:\n- Netscape (browsing)\n- Yahoo (search)\n- Amazon (online retail - just launched!)\n\nThis is bigger than PCs. Act now!\n\n- DotCom Picks'
    },
    {
      date: new Date('1999-03-01'),
      from: 'techguru@daytrader.net',
      subject: 'Y2K Tech Stocks - Explosive Growth!',
      body: 'ATTENTION INVESTORS!\n\nTech stocks are SOARING! The internet bubble shows no signs of stopping. Our hot picks:\n\n- Any company with ".com" in the name\n- Tech infrastructure plays\n- E-commerce platforms\n\nGet rich quick! The Nasdaq is going to the moon!\n\n$$$ Day Trader Alert $$$'
    },
    {
      date: new Date('2001-04-01'),
      from: 'recovery@valueinvest.com',
      subject: 'Post-Bubble Value Opportunities',
      body: 'Dear Investor,\n\nThe dot-com crash has created value opportunities. Quality companies are trading at discounts:\n\n- Established tech: MSFT, ORCL, CSCO\n- Strong fundamentals matter again\n- Return to value investing principles\n\nPatience will be rewarded.\n\nValue Investment Partners'
    },
    {
      date: new Date('2004-08-01'),
      from: 'ipo@techventures.com',
      subject: 'Google IPO - Search Engine Opportunity',
      body: 'BREAKING: Google is going public!\n\nThis search engine company dominates its market. The IPO is priced around $85/share. Our analysis:\n\n- Clear market leadership\n- Strong revenue growth\n- Innovation-focused\n\nThis could be the next Microsoft.\n\nTech Ventures Research'
    },
    {
      date: new Date('2007-06-01'),
      from: 'warning@marketwatch.com',
      subject: 'Housing Market Concerns',
      body: 'Dear Subscriber,\n\nSubprime mortgage issues are emerging. We see risks in:\n- Financial sector exposure\n- Housing-related stocks\n- High-leverage companies\n\nRecommendation: Review your portfolio risk.\n\nStay vigilant,\nMarket Watch Team'
    },
    {
      date: new Date('2009-03-01'),
      from: 'opportunity@bargainhunter.com',
      subject: 'Once in a Lifetime Buying Opportunity',
      body: 'Dear Investor,\n\nThe market is at multi-year lows. Fear is extreme. This is when fortunes are made.\n\n"Be fearful when others are greedy, greedy when others are fearful." - Warren Buffett\n\nQuality stocks at depression prices:\n- Banks (if they survive)\n- Blue chip industrials\n- Tech giants\n\nBuy the dip!\n\nBargain Hunter Research'
    },
    {
      date: new Date('2012-05-01'),
      from: 'social@newmedia.com',
      subject: 'Facebook IPO - Social Media Investment',
      body: 'Facebook is going public!\n\n1 billion users. Advertising potential is enormous. Social media is the future of internet.\n\nIPO price: ~$38/share\n\nRisks: Unproven business model, mobile concerns\nReward: Massive user base, network effects\n\nYour call.\n\nNew Media Analysis'
    },
    {
      date: new Date('2020-04-01'),
      from: 'pandemic@emergencyinvest.com',
      subject: 'COVID-19 Market Crash - Tech Opportunity',
      body: 'Dear Investor,\n\nPandemic has crashed markets -35%. But certain sectors will thrive:\n\n✓ Remote work technology\n✓ E-commerce\n✓ Streaming services\n✓ Cloud computing\n\nThe world is going digital faster than ever.\n\nCrisis = Opportunity\n\nEmergency Investment Advisory'
    }
  ];
  
  return opportunities.filter(email => email.date <= gameTime);
}

// Generate spam and scam emails based on era
function generateSpamEmails(gameTime) {
  const emails = [];
  const year = gameTime.getFullYear();
  
  // 90s spam
  const nineties = [
    {
      date: new Date('1994-06-01'),
      from: 'richquick@aol.com',
      subject: 'MAKE MONEY FAST!!!',
      body: 'MAKE $$$$ FAST!!!\n\nThis is NOT a scam! Simply send this email to 10 friends and send $5 to the name at the top of the list. Add your name to the bottom. IN JUST WEEKS you will receive THOUSANDS OF DOLLARS!\n\nThis is LEGAL! People are making $50,000 a month!\n\nACT NOW!!!',
      spam: true
    },
    {
      date: new Date('1996-03-15'),
      from: 'internationalbusiness@invest.com',
      subject: 'URGENT BUSINESS PROPOSAL',
      body: 'Dear Sir/Madam,\n\nI am Prince Abacha of Nigeria. I have $45 MILLION that I need to transfer out of my country. I need your help to transfer these funds. You will receive 30% ($13.5 MILLION) for your assistance.\n\nPlease send your bank account details.\n\nThis is legitimate business.\n\nPrince Abacha',
      spam: true
    },
    {
      date: new Date('1997-09-01'),
      from: 'webmaster@free-prizes.net',
      subject: 'YOU\'VE WON!!! Claim Your Prize Now!',
      body: '🎉 CONGRATULATIONS!!! 🎉\n\nYou have been selected to receive a FREE LAPTOP COMPUTER!\n\nTo claim your prize:\n1. Click here (not a real link)\n2. Enter your credit card for "shipping and handling" ($99.99)\n3. Receive your FREE laptop!\n\nACT NOW! Offer expires in 24 hours!\n\nFree Prizes Inc.',
      spam: true
    },
    {
      date: new Date('1998-11-01'),
      from: 'pharmacy@cheapmeds.biz',
      subject: 'V1agra - 50% OFF! No Prescription Needed!',
      body: 'Buy V1agra Online! No prescription required!\n\n💊 50% DISCOUNT\n💊 Fast shipping\n💊 100% satisfaction guaranteed\n💊 Completely legal (not really)\n\nOrder now!!!\n\nInternational Pharmacy Solutions',
      spam: true
    }
  ];
  
  // 2000s spam
  const twothousands = [
    {
      date: new Date('2000-05-01'),
      from: 'investment@getrichonline.com',
      subject: 'Turn $100 into $10,000 in 30 days!',
      body: 'SECRET INVESTMENT STRATEGY REVEALED!\n\nWall Street doesn\'t want you to know about this!\n\nOur proprietary trading system makes $10,000/month on autopilot!\n\nLimited time: Only $99 for the complete system!\n\nTestimonials:\n"I made $50,000 in my first month!" - John D.\n"This changed my life!" - Sarah M.\n\nOrder now before we close enrollment!\n\nGet Rich Online LLC',
      spam: true
    },
    {
      date: new Date('2003-08-01'),
      from: 'account-verify@paypa1.com',
      subject: 'URGENT: Your PayPal Account Will Be Suspended',
      body: 'Dear PayPal User,\n\nWe have detected suspicious activity on your account. Your account will be SUSPENDED within 24 hours unless you verify your information.\n\nClick here to verify your account: [fake link]\n\nYou will need to provide:\n- Username and password\n- Credit card number\n- Social security number\n\nFailure to verify will result in permanent account closure.\n\nPayPal Security Team\n(This is a phishing scam)',
      spam: true
    },
    {
      date: new Date('2005-03-01'),
      from: 'lottery@uklotto.co.uk',
      subject: 'You Won £1,000,000 in UK Lottery!',
      body: 'CONGRATULATIONS!\n\nYour email address won £1,000,000 in the UK National Lottery! Your ticket number was randomly selected from 2 million email addresses.\n\nTo claim your prize, please send:\n- Full name\n- Address\n- Phone number\n- Bank account details\n- Processing fee: $500\n\nPrizes must be claimed within 14 days.\n\nUK Lottery Commission',
      spam: true
    },
    {
      date: new Date('2007-11-01'),
      from: 'security@bank0famerica.com',
      subject: 'Security Alert: Unusual Activity Detected',
      body: 'Dear Valued Customer,\n\nWe have detected unusual activity on your Bank of America account.\n\nFor your security, please verify your identity:\n\nClick here: [fake link]\n\nEnter:\n- Account number\n- Social Security Number\n- PIN code\n- Security questions\n\nYour account will be locked until verification is complete.\n\nBank of America Security\n(PHISHING ATTEMPT)',
      spam: true
    },
    {
      date: new Date('2009-06-01'),
      from: 'irs-refund@taxrebate.com',
      subject: 'IRS Tax Refund: $1,847.93 - Claim Now!',
      body: 'INTERNAL REVENUE SERVICE\n\nYou are eligible for a tax refund of $1,847.93\n\nTo receive your refund, please click the link below and enter:\n- Social Security Number\n- Date of Birth\n- Bank Account for Direct Deposit\n\nProcessing time: 3-5 business days\n\nThis is an automated message from the IRS.\n\n[This is a scam - IRS never contacts via email]',
      spam: true
    }
  ];
  
  // 2010s spam
  const twentytens = [
    {
      date: new Date('2012-04-01'),
      from: 'bitcoin-double@crypto.biz',
      subject: 'Double Your Bitcoin in 48 Hours - Guaranteed!',
      body: 'BITCOIN DOUBLING SERVICE\n\nSend us any amount of Bitcoin and get back DOUBLE in 48 hours!\n\nHow it works:\n- Send 1 BTC, get 2 BTC back\n- Send 10 BTC, get 20 BTC back\n- 100% guaranteed returns\n\nOur trading algorithm cannot lose!\n\nBitcoin address: [scam address]\n\n"I sent 5 BTC and got 10 back!" - Anonymous\n\nLimited time offer!',
      spam: true
    },
    {
      date: new Date('2014-09-01'),
      from: 'apple-security@app1e.com',
      subject: 'Your Apple ID Has Been Locked',
      body: 'Dear Apple Customer,\n\nYour Apple ID has been locked due to suspicious activity.\n\nTo unlock your account:\n1. Click verification link\n2. Enter Apple ID and password\n3. Verify payment method\n\nAccount will be permanently disabled if not verified within 24 hours.\n\nApple Security Team\n\n[Phishing - note the "app1e.com" with number 1 instead of letter l]',
      spam: true
    },
    {
      date: new Date('2017-05-01'),
      from: 'cryptoinvestor@ico-millions.com',
      subject: 'ICO Alert: 10000% Returns Possible!',
      body: '🚀 NEW ICO LAUNCHING! 🚀\n\nGet in early on the next Bitcoin!\n\nSuperCoin ICO:\n- Pre-sale price: $0.01\n- Expected listing: $1.00 (100x returns!)\n- Revolutionary blockchain technology\n- Experienced team (anonymous)\n\nInvest now before public sale!\n\nMinimum investment: $500\nMaximum upside: UNLIMITED\n\nThis is your chance to become a crypto millionaire!\n\n[Most ICOs are scams]',
      spam: true
    },
    {
      date: new Date('2018-12-01'),
      from: 'amazon-prize@amaz0n.com',
      subject: 'Amazon Customer Satisfaction Survey - Win $500!',
      body: 'Dear Amazon Customer,\n\nYou have been selected for our customer satisfaction survey!\n\nComplete our 2-minute survey and receive a $500 Amazon gift card!\n\nClick here: [malicious link]\n\nHurry! Only 5 gift cards remaining!\n\nThank you for being an Amazon Prime member.\n\nAmazon Customer Service\n\n[Scam - Amazon doesn\'t give away money for surveys]',
      spam: true
    }
  ];
  
  // 2020s spam
  const twentytwenties = [
    {
      date: new Date('2020-06-01'),
      from: 'covid-relief@stimulus.gov',
      subject: 'COVID-19 Stimulus Payment - Action Required',
      body: 'U.S. TREASURY DEPARTMENT\n\nYou are eligible for a COVID-19 stimulus payment of $1,200.\n\nTo receive your payment, verify your information:\n- Social Security Number\n- Bank account number\n- Routing number\n\nClick here to claim: [phishing link]\n\nPayments will be processed within 48 hours.\n\n[SCAM - Government doesn\'t request info via email]',
      spam: true
    },
    {
      date: new Date('2021-03-01'),
      from: 'nft-mint@opensea-official.com',
      subject: 'Exclusive NFT Drop - Guaranteed Profit!',
      body: '🎨 EXCLUSIVE NFT COLLECTION 🎨\n\nMint OUR NFTs and flip for 10x profit!\n\n- 10,000 unique apes/punks/whatever\n- Mint price: 0.1 ETH\n- Floor price will be 1 ETH (trust us bro)\n- Roadmap: Metaverse, gaming, moon\n\nCelebrity endorsements (paid)!\nCommunity discord (mostly bots)!\n\nConnect your wallet now!\n\n[Most NFT projects are pump and dumps]',
      spam: true
    },
    {
      date: new Date('2022-11-01'),
      from: 'ftx-recovery@crypto-recovery.com',
      subject: 'FTX Bankruptcy - Recover Your Funds!',
      body: 'URGENT: FTX Bankruptcy Recovery Service\n\nWe can help you recover your funds from FTX!\n\nOur legal team has insider access to the bankruptcy proceedings.\n\nFee: Only 20% of recovered amount\n\nProvide:\n- Your FTX username/password\n- Proof of holdings\n- $500 retainer fee\n\nAct fast! Recovery window is closing!\n\n[Scam targeting FTX victims]',
      spam: true
    },
    {
      date: new Date('2023-04-01'),
      from: 'chatgpt-premium@0penai.com',
      subject: 'ChatGPT Plus - 50% Discount!',
      body: 'LIMITED TIME OFFER!\n\nChatGPT Plus at 50% OFF!\n\nNormal price: $20/month\nToday only: $10/month\n\nClick here to upgrade: [phishing link]\n\nEnter your OpenAI credentials to activate discount.\n\nOffer expires in 24 hours!\n\nOpenAI Team\n\n[Phishing - note "0penai.com" with zero instead of O]',
      spam: true
    }
  ];
  
  const allSpam = [...nineties, ...twothousands, ...twentytens, ...twentytwenties];
  return allSpam.filter(email => email.date <= gameTime);
}

module.exports = {
  generateInvestmentOpportunities,
  generateSpamEmails
};
