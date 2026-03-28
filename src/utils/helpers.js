export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const regex = /^[6-9]\d{9}$/; // Indian phone numbers
  return regex.test(phone);
};

export const validateAge = (age) => {
  const num = parseInt(age);
  return !isNaN(num) && num > 0 && num < 150;
};

export const validateNotEmpty = (value) => {
  return value && value.trim().length > 0;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time) => {
  return new Date(time).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDistance = (km) => {
  return `${km} km`;
};
