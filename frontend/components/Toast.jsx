import React, { useState, forwardRef } from 'react';
import { 
  Snackbar, 
  Alert as MuiAlert, 
  IconButton, 
  Typography,
  Box 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

// Custom Alert component
const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Toast Context
export const ToastContext = React.createContext({
  showToast: () => {},
  hideToast: () => {}
});

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [duration, setDuration] = useState(6000);
  const [title, setTitle] = useState('');

  const showToast = (newMessage, options = {}) => {
    setMessage(newMessage);
    setSeverity(options.severity || 'info');
    setDuration(options.duration || 6000);
    setTitle(options.title || '');
    setOpen(true);
  };

  const hideToast = () => {
    setOpen(false);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    hideToast();
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity}
          sx={{ 
            width: '100%',
            '& .MuiAlert-icon': {
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem'
            }
          }}
        >
          <Box>
            {title && (
              <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {title}
              </Typography>
            )}
            <Typography variant="body2">{message}</Typography>
          </Box>
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast component to be used directly
const Toast = ({ 
  open, 
  message, 
  severity = 'info', 
  duration = 6000, 
  onClose,
  title,
  position = { vertical: 'top', horizontal: 'right' } 
}) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) onClose();
  };

  // Icon mapping
  const iconMapping = {
    success: <CheckCircleIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={position}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity}
        iconMapping={iconMapping}
        sx={{ 
          width: '100%',
          '& .MuiAlert-icon': {
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.5rem'
          }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          {title && (
            <Typography variant="subtitle2" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {title}
            </Typography>
          )}
          <Typography variant="body2">{message}</Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default Toast;