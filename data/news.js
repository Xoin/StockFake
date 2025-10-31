// Historical news events (major events only)

const newsEvents = [
  {
    id: 1,
    date: new Date('1970-01-01'),
    headline: 'New Decade Begins with Economic Optimism',
    body: 'As we enter the 1970s, economists predict steady growth despite some challenges in the financial markets.'
  },
  {
    id: 2,
    date: new Date('1970-04-11'),
    headline: 'Apollo 13 Returns Safely After Crisis',
    body: 'NASA successfully brings Apollo 13 astronauts home after an oxygen tank explosion threatened the mission.'
  },
  {
    id: 3,
    date: new Date('1971-08-15'),
    headline: 'President Nixon Ends Gold Standard',
    body: 'In a historic move, President Nixon announces the end of dollar convertibility to gold, marking a major shift in monetary policy.'
  },
  {
    id: 4,
    date: new Date('1973-01-27'),
    headline: 'Vietnam War Peace Agreement Signed',
    body: 'The Paris Peace Accords are signed, marking the end of direct U.S. military involvement in Vietnam.'
  },
  {
    id: 5,
    date: new Date('1973-10-17'),
    headline: 'Oil Crisis Begins as OPEC Cuts Production',
    body: 'OPEC announces oil embargo, leading to energy crisis and significant impact on stock markets worldwide.'
  },
  {
    id: 6,
    date: new Date('1974-08-09'),
    headline: 'President Nixon Resigns',
    body: 'President Richard Nixon resigns amid Watergate scandal, Gerald Ford becomes President.'
  },
  {
    id: 7,
    date: new Date('1975-04-30'),
    headline: 'Fall of Saigon Ends Vietnam War',
    body: 'North Vietnamese forces capture Saigon, marking the end of the Vietnam War.'
  }
];

function getNews(currentTime) {
  // Return all news up to current game time
  return newsEvents
    .filter(news => news.date <= currentTime)
    .sort((a, b) => b.date - a.date); // Most recent first
}

function getLatestNews(currentTime, limit = 5) {
  return getNews(currentTime).slice(0, limit);
}

module.exports = {
  getNews,
  getLatestNews
};
