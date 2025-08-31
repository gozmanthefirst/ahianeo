export const authExamples = {
  signUpValErrs: {
    name: "Too small: expected string to have >=1 characters",
    email: "Invalid email address",
    image: "Invalid URL",
    password: "Too small: expected string to have >=8 characters",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  signInValErrs: {
    email: "Invalid email address",
    password: "Too small: expected string to have >=8 characters",
    rememberMe: "Invalid input: expected boolean, received string",
  },
  resetPwdValErrs: {
    newPassword: "Too small: expected string to have >=8 characters",
    token: "Too small: expected string to have >=1 characters",
  },
  changePwdValErrs: {
    newPassword: "Too small: expected string to have >=8 characters",
    currentPassword: "Too small: expected string to have >=8 characters",
  },
  emailValErr: {
    email: "Invalid email address",
  },
  uuidValErr: {
    id: "Invalid UUID",
  },
  jwtValErr: {
    token: "Invalid JWT",
  },
  token: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
  jwt: "eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Imdvem1hbnN1bmRheUBnbWFpbC5jb20iLCJpYXQiOjE3NTU1NjU2NjYsImV4cCI6MTc1NTU2OTI2Nn0.SHriShYEjHKz5aQYTfBUSJPvbzWd9aYBY_T2RI-tWyQ",
};

export const userExamples = {
  smallUser: {
    id: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    email: "newuser@example.com",
    name: "New User",
    image: "https://example.com/image.png",
    emailVerified: false,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  user: {
    id: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    email: "newuser@example.com",
    name: "New User",
    image: "https://example.com/image.png",
    emailVerified: false,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
  },
  createUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
    email: "Invalid email address",
    role: 'Invalid option: expected one of "user"|"admin"',
  },
  banUserValErrs: {
    userId: "Too small: expected string to have >=1 characters",
    banReason: "Too small: expected string to have >=1 characters",
    banExpiresIn: "Too small: expected number to be >=3600",
  },
  userIdValErrs: {
    userId: "Too small: expected string to have >=1 characters",
  },
  updateUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
    image: "Invalid URL",
  },
};
