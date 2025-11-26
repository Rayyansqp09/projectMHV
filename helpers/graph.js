module.exports = {

  normalize(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim().toLowerCase();
  },

  sortMatches(matches) {
    return matches.sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );
  },

  buildCumulative(arr, key) {
    let sum = 0;
    return arr.map(row => {
      sum += Number(row[key]) || 0;
      return sum;
    });
  },

  buildCumulativeGPlus(arr) {
    let sum = 0;
    return arr.map(row => {
      sum += (Number(row.goals) || 0) + (Number(row.assists) || 0);
      return sum;
    });
  },

  buildStats(matches) {
    const sorted = this.sortMatches(matches);

    return {
      goals: this.buildCumulative(sorted, "goals"),
      assists: this.buildCumulative(sorted, "assists"),
      gplus: this.buildCumulativeGPlus(sorted)
    };
  },

  applyFilter(matches, filter = {}) {
  const filterKeys = Object.keys(filter);

  return matches.filter(row => {
    return filterKeys.every(key => {

      // Skip empty conditions
      if (!filter[key]) return true;

      const rowVal = this.normalize(row[key]);
      const rawFilter = filter[key];

      // Split AND conditions using &
      const andGroups = rawFilter.split('&').map(g => g.trim());

      // Every AND group must pass
      return andGroups.every(group => {

        // Split OR conditions using ,
        const orParts = group.split(',').map(v => this.normalize(v.trim()));

        // At least ONE OR part must match exactly
        return orParts.some(expectedValue => rowVal === expectedValue);
      });

    });
  });
},

  /**
   * Supports:
   *  - One filter: returns { filtered, allTime }
   *  - Two filters: returns { filter1, filter2 }
   */
  buildMultiFilterStats(matches, filter1 = null, filter2 = null) {

    const allTimeStats = this.buildStats(matches);

    // No filters at all → return all time only twice
    if (!filter1 && !filter2) {
      return {
        filter1: allTimeStats,
        filter2: allTimeStats
      };
    }

    // Only one filter → filtered + allTime
    if (filter1 && !filter2) {
      const filteredMatches = this.applyFilter(matches, filter1);
      return {
        filter1: this.buildStats(filteredMatches),
        filter2: allTimeStats
      };
    }

    // Two filters → two filtered datasets
    const filtered1 = this.applyFilter(matches, filter1);
    const filtered2 = this.applyFilter(matches, filter2);

    return {
      filter1: this.buildStats(filtered1),
      filter2: this.buildStats(filtered2)
    };
  }

};
