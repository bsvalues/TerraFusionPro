import React, { createContext, useContext, useState, forwardRef } from 'react';
import { 
  Snackbar, 
  Alert as MuiAlert, 
  Stack, 
  Typography 
} from '@mui/material';

// Custom styled Alert component
const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Create a context for the toast system
const ToastContext = createContext({
  showToast: () => {},
  closeToast: () => {}
});

// Hook to use the toast system
export const useToast = () => useContext(ToastContext);

// Main Toast Provider component
export const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('info'); // 'error', 'warning', 'info', 'success'
  const [duration, setDuration] = useState(5000);
  
  // Function to show a toast notification
  const showToast = (message, options = {}) => {
    setMessage(message);
    setSeverity(options.severity || 'info');
    setTitle(options.title || '');
    setDuration(options.duration || 5000);
    setOpen(true);
  };
  
  // Function to close the toast
  const closeToast = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  
  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={closeToast} 
          severity={severity}
          sx={{ width: '100%' }}
        >
          <Stack spacing={0.5}>
            {title && (
              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
            )}
            <Typography variant="body2" component="span">
              {message}
            </Typography>
          </Stack>
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export default ToastProvider;