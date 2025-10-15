import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCar, FaUsers, FaMoneyBillWave, FaSpinner, FaCheckCircle, FaClock, FaTimes, FaTruck } from 'react-icons/fa';
import { deliveryAPI, vehicleAPI, authAPI } from '../utils/api';
import { useToast } from './Toast';
import { StatsSkeleton } from './LoadingSkeleton';
import { getVehicleLabel } from '../utils/vehicleIcons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/AdminStats.css';

const AdminStats = () => {
  const { showToast } = useToast(); // Initialize Toast
  const [stats, setStats] = useState({
    totalRides: 0,
    totalVehicles: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    totalUsers: 0,
    activeDrivers: 0
  });
  const [rides, setRides] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ridesData, vehiclesData, usersData] = await Promise.all([
        deliveryAPI.getAll(),
        vehicleAPI.getAll(),
        authAPI.getUsers({})
      ]);

      setRides(ridesData);
      setVehicles(vehiclesData);
      setUsers(usersData);

      const totalRevenue = ridesData
        .filter(r => r.status === 'delivered')
        .reduce((sum, r) => sum + (r.fare || 0), 0);

      const pendingApprovals = vehiclesData.filter(v => v.approvalStatus === 'pending').length;
      const activeDrivers = usersData.filter(u => u.role === 'driver' && u.isActive).length;

      setStats({
        totalRides: ridesData.length,
        totalVehicles: vehiclesData.length,
        totalRevenue,
        pendingApprovals,
        totalUsers: usersData.length,
        activeDrivers
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      showToast('Failed to load statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <StatsSkeleton />; // Replaced with StatsSkeleton
  }

  // Prepare chart data
  const rideStatusData = [
    { name: 'Completed', value: rides.filter(r => r.status === 'delivered').length, color: '#4caf50' },
    { name: 'Pending', value: rides.filter(r => r.status === 'pending').length, color: '#ff9800' },
    { name: 'In Progress', value: rides.filter(r => r.status === 'accepted' || r.status === 'on_route').length, color: '#2196f3' },
    { name: 'Cancelled', value: rides.filter(r => r.status === 'cancelled').length, color: '#f44336' }
  ];

  const vehicleTypeData = [
    { name: 'Bike', value: vehicles.filter(v => v.type === 'bike').length, color: '#9c27b0' },
    { name: 'Auto', value: vehicles.filter(v => v.type === 'auto').length, color: '#ff5722' },
    { name: 'Mini Truck', value: vehicles.filter(v => v.type === 'mini_truck').length, color: '#00bcd4' },
    { name: 'Lorry', value: vehicles.filter(v => v.type === 'lorry').length, color: '#8bc34a' }
  ];

  const userRoleData = [
    { name: 'Customers', value: users.filter(u => u.role === 'customer').length, color: '#3f51b5' },
    { name: 'Drivers', value: users.filter(u => u.role === 'driver').length, color: '#ff9800' },
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#e91e63' }
  ];

  // Revenue trend (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const revenueTrendData = getLast7Days().map(date => {
    const dayRides = rides.filter(r => {
      const rideDate = new Date(r.createdAt).toISOString().split('T')[0];
      return rideDate === date && r.status === 'delivered';
    });
    const revenue = dayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
      rides: dayRides.length
    };
  });

  const statCards = [
    {
      title: 'Total Rides',
      value: stats.totalRides,
      icon: <FaChartLine />,
      color: 'primary',
      gradient: 'var(--gradient-primary)'
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: <FaCar />,
      color: 'success',
      gradient: 'var(--gradient-success)'
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: 'info',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      title: 'Active Drivers',
      value: stats.activeDrivers,
      icon: <FaUsers />,
      color: 'warning',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    }
  ];

  return (
    <motion.div
      className="admin-stats-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            className="stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="stat-icon" style={{ background: stat.gradient }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="charts-section">
        {/* Revenue Trend Chart */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3><FaMoneyBillWave /> Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} name="Revenue (₹)" />
              <Line type="monotone" dataKey="rides" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Rides" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Ride Status Distribution */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3><FaChartLine /> Ride Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rideStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {rideStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {rideStatusData.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ background: item.color }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Vehicle Type Distribution */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3><FaTruck /> Vehicle Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vehicleTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]}>
                {vehicleTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* User Role Distribution */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3><FaUsers /> User Distribution by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {userRoleData.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ background: item.color }}></span>
                <span>{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminStats;