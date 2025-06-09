// ===========================================
// 6. Performance monitoring
// ===========================================

// src/utils/searchPerformance.ts
export class SearchPerformanceMonitor {
  private static measurements: Array<{
    query: string;
    searchTime: number;
    indexTime: number;
    resultsCount: number;
    timestamp: number;
  }> = [];

  static startMeasurement() {
    return performance.now();
  }

  static endMeasurement(
    startTime: number,
    query: string,
    resultsCount: number,
    indexTime = 0
  ) {
    const searchTime = performance.now() - startTime;
    
    this.measurements.push({
      query,
      searchTime,
      indexTime,
      resultsCount,
      timestamp: Date.now()
    });

    // Garder seulement les 1000 dernières mesures
    if (this.measurements.length > 1000) {
      this.measurements = this.measurements.slice(-1000);
    }

    // Log des performances lentes
    if (searchTime > 1000) {
      console.warn(`Recherche lente détectée: "${query}" - ${searchTime.toFixed(2)}ms`);
    }

    return searchTime;
  }

  static getPerformanceStats() {
    if (this.measurements.length === 0) return null;

    const searchTimes = this.measurements.map(m => m.searchTime);
    const avg = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
    const sorted = [...searchTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    return {
      totalMeasurements: this.measurements.length,
      averageTime: avg,
      medianTime: median,
      p95Time: p95,
      slowestQuery: this.measurements.reduce((prev, curr) => 
        prev.searchTime > curr.searchTime ? prev : curr
      ),
      fastestQuery: this.measurements.reduce((prev, curr) => 
        prev.searchTime < curr.searchTime ? prev : curr
      )
    };
  }
}
