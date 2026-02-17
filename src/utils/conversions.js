/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(c) {
    return (c * 9/5) + 32;
  }
  
  /**
   * Format timestamp for display
   */
  export function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  /**
   * Get current date in YYYY-MM-DD format
   */
  export function getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
  }