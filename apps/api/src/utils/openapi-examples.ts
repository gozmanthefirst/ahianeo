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
  session: {
    id: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    expiresAt: "2025-08-11T18:26:20.296Z",
    token: authExamples.token,
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
    ipAddress: "192.168.1.1",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    userId: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    impersonatedBy: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
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
  sessionTokenValErrs: {
    sessionToken: "Too small: expected string to have >=1 characters",
  },
  userIdValErrs: {
    userId: "Too small: expected string to have >=1 characters",
  },
  updateUserValErrs: {
    name: "Too small: expected string to have >=1 characters",
    image: "Invalid URL",
  },
};

export const productsExamples = {
  category: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Category",
    slug: "category",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  product: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "Product",
    slug: "product",
    description: "Product description",
    price: "19.99",
    stockQuantity: 100,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Red", "Green", "Blue"],
    createdBy: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
    createdAt: "2025-08-11T18:26:20.296Z",
    updatedAt: "2025-08-11T18:26:20.296Z",
  },
  createCategoryValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};
