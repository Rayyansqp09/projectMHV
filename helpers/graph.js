module.exports = {

  /* ------------------------------------------
      1. Sort matches chronologically (ASC)
     ------------------------------------------ */
  sortMatches(matches) {
    return matches.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  },

  /* ------------------------------------------
      2. Build cumulative array for any key
     ------------------------------------------ */
  buildCumulative(arr, key) {
    let sum = 0;
    return arr.map(row => {
      sum += Number(row[key]) || 0;
      return sum;
    });
  },

  /* ------------------------------------------
      3. Build GOALS + ASSISTS cumulative
     ------------------------------------------ */
  buildCumulativeGPlus(arr) {
    let sum = 0;
    return arr.map(row => {
      sum += (Number(row.goals) || 0) + (Number(row.assists) || 0);
      return sum;
    });
  },

  /* ------------------------------------------
      4. Filter matches for a specific season
         Example: season = "2025-26"
     ------------------------------------------ */
  filterBySeason(matches, seasonCode) {
    return matches.filter(row => row.season === seasonCode);
  },

  /* ------------------------------------------
      5. Build season stats (Goals, Assists, G+)
     ------------------------------------------ */
  buildSeasonStats(matches) {
    const sorted = this.sortMatches(matches);

    return {
      goals: this.buildCumulative(sorted, "goals"),
      assists: this.buildCumulative(sorted, "assists"),
      gplus: this.buildCumulativeGPlus(sorted)
    };
  },

  /* ------------------------------------------
      6. Build all-time stats (entire table)
     ------------------------------------------ */
  buildAllTimeStats(matches) {
    const sorted = this.sortMatches(matches);

    return {
      goals: this.buildCumulative(sorted, "goals"),
      assists: this.buildCumulative(sorted, "assists"),
      gplus: this.buildCumulativeGPlus(sorted)
    };
  },

  /* ------------------------------------------
      7. MAIN FUNCTION:
         Takes ALL raw matches & returns:
         { season: {...}, allTime: {...} }
     ------------------------------------------ */
  buildPlayerStats(rawMatches, seasonCode) {

    const allTime = this.buildAllTimeStats(rawMatches);

    const seasonMatches = this.filterBySeason(rawMatches, seasonCode);
    const season = this.buildSeasonStats(seasonMatches);

    return {
      season,
      allTime
    };
  }

};
