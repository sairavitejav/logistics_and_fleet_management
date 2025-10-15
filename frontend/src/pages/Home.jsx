import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaCar, FaMapMarkedAlt, FaShieldAlt, FaClock } from 'react-icons/fa';
import '../styles/Home.css';

const Home = () => {
  const features = [
    {
      icon: <FaCar />,
      title: 'Multiple Vehicle Options',
      description: 'Choose from bikes, autos, cars, and vans'
    },
    {
      icon: <FaMapMarkedAlt />,
      title: 'Real-time Tracking',
      description: 'Track your ride in real-time on the map'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Safe & Secure',
      description: 'Verified drivers and secure payments'
    },
    {
      icon: <FaClock />,
      title: '24/7 Available',
      description: 'Book rides anytime, anywhere'
    }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Your Ride, Your Way</h1>
          <p>Book rides instantly with real-time tracking and multiple vehicle options</p>
          <div className="hero-buttons">
            <Link to="/register">
              <motion.button
                className="btn btn-primary btn-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button
                className="btn btn-outline btn-large"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="hero-image"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <FaCar size={200} />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why Choose Us?
        </motion.h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Animated Background */}
      <div className="home-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
    </div>
  );
};

export default Home;