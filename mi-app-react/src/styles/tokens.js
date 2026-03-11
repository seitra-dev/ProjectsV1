export const DESIGN_TOKENS = {
  // Colores principales
  primary: {
    base: '#0066FF',      
    dark: '#0052CC',
    light: '#3D8EFF',
    lighter: '#A8CFFF',
    lightest: 'rgba(0, 102, 255, 0.06)'
  },
  
  // Escala de grises
  neutral: {
    50: '#FAFBFC',        
    100: '#F4F6F8',
    200: '#E4E7EB',
    300: '#CBD2D9',
    400: '#9AA5B1',       
    500: '#7B8794',
    600: '#616E7C',
    700: '#52606D',
    800: '#3E4C59',       
    900: '#1F2933'
  },
  
  success: {
    base: '#00D68F',
    light: 'rgba(0, 214, 143, 0.1)',
    dark: '#00A86B'
  },
  
  warning: {
    base: '#FFAB00',
    light: 'rgba(255, 171, 0, 0.1)',
    dark: '#FF8B00'
  },
  
  danger: {
    base: '#FF3D71',
    light: 'rgba(255, 61, 113, 0.1)',
    dark: '#E6294B'
  },
  
  info: {
    base: '#0095FF',
    light: 'rgba(0, 149, 255, 0.1)',
    dark: '#006FCC'
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #0066FF 0%, #0095FF 100%)',
    primaryHover: 'linear-gradient(135deg, #0052CC 0%, #006FCC 100%)',
    subtle: 'linear-gradient(180deg, #FFFFFF 0%, #F4F6F8 100%)',
    success: 'linear-gradient(135deg, #00D68F 0%, #0095FF 100%)',
    card: 'linear-gradient(145deg, #FFFFFF 0%, #FAFBFC 100%)'
  },
  
  shadows: {
    xs: '0 1px 2px rgba(31, 41, 51, 0.04)',
    sm: '0 2px 4px rgba(31, 41, 51, 0.04), 0 1px 2px rgba(31, 41, 51, 0.06)',
    md: '0 4px 8px rgba(31, 41, 51, 0.04), 0 2px 4px rgba(31, 41, 51, 0.08)',
    lg: '0 8px 16px rgba(31, 41, 51, 0.08), 0 4px 8px rgba(31, 41, 51, 0.08)',
    xl: '0 16px 32px rgba(31, 41, 51, 0.12), 0 8px 16px rgba(31, 41, 51, 0.08)',
    inner: 'inset 0 1px 2px rgba(31, 41, 51, 0.06)'
  },
  
  border: {
    color: {
      subtle: 'rgba(31, 41, 51, 0.06)',
      normal: 'rgba(31, 41, 51, 0.12)',
      strong: 'rgba(31, 41, 51, 0.24)',
      primary: 'rgba(0, 102, 255, 0.24)'
    },
    width: {
      thin: '0.5px',
      normal: '1px',
      thick: '2px'
    },
    radius: {
      xs: '6px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px'
    }
  },
  
  typography: {
    
    fontFamily: "'Figtree', sans-serif",
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 800
    },
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px', 
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '38px'
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0em',
      wide: '0.02em'
    }
  }, 
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px'
  },
  
  blur: {
    light: 'blur(8px)',
    medium: 'blur(16px)',
    heavy: 'blur(24px)',
    sidebar: 'blur(40px)'
  },
  
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

export const STORAGE_KEYS = {
  ACTIVITY_LOG: 'taskflow_activity_log'
};

// Funciones de utilidad de Storage (sin cambios, funcionan bien)
export const storageGet = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

export const storageSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
};

export const storageDelete = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};