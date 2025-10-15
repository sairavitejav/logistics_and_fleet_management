import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaRupeeSign, FaCalendarDay, FaCalendarAlt, FaCar, FaSun, FaCalendarWeek, FaCalendar, FaCalendarPlus } from 'react-icons/fa';
import { deliveryAPI } from '../utils/api';
import { useToast } from './Toast';
import '../styles/Statistics.css';

const DriverStatistics = () => {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('month');

  useEffect(() => {
    fetchStatistics();
  }, [activePeriod]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await deliveryAPI.getDriverStatistics(activePeriod);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatMonth = (monthString) => {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getPeriodIcon = (period) => {
    switch (period) {
      case 'day':
        return <FaSun />;
      case 'week':
        return <FaCalendarWeek />;
      case 'month':
        return <FaCalendar />;
      case 'year':
        return <FaCalendarPlus />;
      default:
        return <FaCar />;
    }
  };

  if (loading) {
    return (
      <div className="statistics-container">
        <div className="stats-loading">
          <div className="loading-spinner"></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics-container">
        <div className="no-stats">
          <FaChartLine size={64} color="var(--gray)" />
          <h3>No statistics available</h3>
          <p>Complete some rides to see your statistics</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="statistics-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Period Selector */}
      <div className="stats-header">
        <h2><FaChartLine /> My Statistics</h2>
        <div className="period-selector">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              className={`period-btn ${activePeriod === period ? 'active' : ''}`}
              onClick={() => setActivePeriod(period)}
            >
              {getPeriodIcon(period)}
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-summary">
        <motion.div
          className="stat-card primary"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="stat-icon">
            {getPeriodIcon(activePeriod)}
          </div>
          <div className="stat-content">
            <h3>{stats.currentPeriodRides}</h3>
            <p>Rides this {activePeriod}</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-icon">
            <FaRupeeSign />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.currentPeriodEarnings)}</h3>
            <p>Earnings this {activePeriod}</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card info"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="stat-icon">
            <FaCalendarDay />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRides}</h3>
            <p>Total rides</p>
          </div>
        </motion.div>

        <motion.div
          className="stat-card warning"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalEarnings)}</h3>
            <p>Total earnings</p>
          </div>
        </motion.div>
      </div>

      {/* Daily Breakdown */}
      {activePeriod === 'day' && stats.dailyStats && stats.dailyStats.length > 0 && (
        <div className="stats-breakdown">
          <h3>Daily Breakdown</h3>
          <div className="stats-list">
            {stats.dailyStats.map((day, index) => (
              <motion.div
                key={day.date}
                className="stat-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="stat-date">{formatDate(day.date)}</span>
                <div className="stat-details">
                  <span className="stat-rides">{day.rides} rides</span>
                  <span className="stat-earnings">{formatCurrency(day.earnings)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {activePeriod === 'year' && stats.monthlyStats && stats.monthlyStats.length > 0 && (
        <div className="stats-breakdown">
          <h3>Monthly Breakdown</h3>
          <div className="stats-list">
            {stats.monthlyStats.map((month, index) => (
              <motion.div
                key={month.month}
                className="stat-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <span className="stat-date">{formatMonth(month.month)}</span>
                <div className="stat-details">
                  <span className="stat-rides">{month.rides} rides</span>
                  <span className="stat-earnings">{formatCurrency(month.earnings)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {((activePeriod === 'day' && (!stats.dailyStats || stats.dailyStats.length === 0)) ||
        (activePeriod === 'year' && (!stats.monthlyStats || stats.monthlyStats.length === 0))) && (
        <div className="no-breakdown">
          <FaChartLine size={48} color="var(--gray)" />
          <p>No data available for this period</p>
        </div>
      )}
    </motion.div>
  );
};

export default DriverStatistics;
