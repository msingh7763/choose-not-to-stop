import { motion } from 'framer-motion';

const FadeIn = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1],
        delay 
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
