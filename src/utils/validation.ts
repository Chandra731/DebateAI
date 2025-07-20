// Input validation utilities
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  name: (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 50;
  },
  
  school: (school: string): boolean => {
    return school.trim().length >= 2 && school.trim().length <= 100;
  },
  
  debateTopic: (topic: string): boolean => {
    return topic.trim().length >= 10 && topic.trim().length <= 200;
  }
};

// Sanitization utilities
export const sanitizers = {
  text: (text: string): string => {
    return text.trim().replace(/\s+/g, ' ');
  },
  
  email: (email: string): string => {
    return email.trim().toLowerCase();
  },
  
  html: (html: string): string => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
};

// Form validation hook
export const useFormValidation = <TFieldValues extends Record<string, any>>(
  initialValues: TFieldValues,
  validationRules: { [K in keyof TFieldValues]?: (value: TFieldValues[K]) => string | null }
) => {
  const [values, setValues] = useState<TFieldValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TFieldValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof TFieldValues, boolean>>>({});

  const validateField = <TKey extends keyof TFieldValues>(name: TKey, value: TFieldValues[TKey]): string | null => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  };

  const handleChange = <TKey extends keyof TFieldValues>(name: TKey, value: TFieldValues[TKey]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = <TKey extends keyof TFieldValues>(name: TKey) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: Partial<Record<keyof TFieldValues, string>> = {};
    let isValid = true;

    (Object.keys(validationRules) as Array<keyof TFieldValues>).forEach(key => {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched((Object.keys(validationRules) as Array<keyof TFieldValues>).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Partial<Record<keyof TFieldValues, boolean>>));

    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.values(errors).every(error => !error)
  };
};