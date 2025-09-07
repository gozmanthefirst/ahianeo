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

const product = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Product",
  slug: "product",
  description: "Product description",
  price: "19.99",
  stockQuantity: 100,
  sizes: [
    { name: "S", inStock: true },
    { name: "M", inStock: true },
    { name: "L", inStock: true },
  ],
  colors: [
    { name: "Red", inStock: true },
    { name: "Green", inStock: true },
  ],
  images: [
    { url: "https://example.com/image1.png", key: "products/image1.png" },
    { url: "https://example.com/image2.png", key: "products/image2.png" },
  ],
  createdBy: "aBCDEF0gHijkLM1NO2PqrsTuVwXyzaBc",
  createdAt: "2025-08-11T18:26:20.296Z",
  updatedAt: "2025-08-11T18:26:20.296Z",
};

const category = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Category",
  slug: "category",
  createdAt: "2025-08-11T18:26:20.296Z",
  updatedAt: "2025-08-11T18:26:20.296Z",
};

export const categoriesExamples = {
  category,
  categoryExtended: {
    ...category,
    products: [product],
  },
  createCategoryValErrs: {
    name: "Too small: expected string to have >=1 characters",
  },
};

export const productsExamples = {
  product,
  productExtended: {
    ...product,
    categories: [categoriesExamples.category],
    creator: userExamples.user,
  },
  createProductValErrs: {
    name: "Too small: expected string to have >=1 characters",
    description: "Too small: expected string to have >=1 characters",
    price: "Too small: expected string to have >=1 characters",
    stockQuantity: "Expected number, received string",
    sizes: "Sizes must be valid JSON",
    colors: "Colors must be valid JSON",
    categoryIds: "Category IDs must be valid JSON",
    createdBy: "Too small: expected string to have >=1 characters",
  },
};

export const cartExamples = {
  emptyCart: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "user_123456789",
    cartItems: [],
    totalItems: 0,
    totalAmount: "0.00",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  cartWithItems: {
    id: "123e4567-e89b-12d3-a456-426614174000",
    userId: "user_123456789",
    cartItems: [
      {
        id: "456e7890-e12b-34c5-d678-901234567890",
        cartId: "123e4567-e89b-12d3-a456-426614174000",
        productId: "789e0123-e45f-67a8-b901-234567890123",
        quantity: 2,
        subAmount: "39.98",
        product,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ],
    totalItems: 2,
    totalAmount: "39.98",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  addToCartValErrs: {
    productId: "Invalid UUID",
    quantity: "Too small: expected number to be >=1",
  },
  updateCartItemValErrs: {
    quantity: "Too small: expected number to be >=1",
  },
};

const order = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  orderNumber: "ORD-2024-847392",
  userId: "user_123456789",
  email: "user@example.com",
  status: "pending",
  paymentStatus: "pending",
  totalAmount: "39.98",
  stripeCheckoutSessionId: "cs_1234567890abcdef",
  paymentMethod: null,
  orderItems: [
    {
      id: "456e7890-e12b-34c5-d678-901234567890",
      orderId: "123e4567-e89b-12d3-a456-426614174000",
      productId: "789e0123-e45f-67a8-b901-234567890123",
      quantity: 2,
      unitPrice: "19.99",
      subTotal: "39.98",
      product: product,
      createdAt: "2024-01-01T00:00:00Z",
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

export const orderExamples = {
  createCheckoutResponse: {
    order: order,
    checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_1234567890abcdef",
    checkoutSessionId: "cs_1234567890abcdef",
    stripePublishableKey: "pk_test_abc123def456ghi789jkl012mno345pqr678stu901",
  },
  orderWithCustomer: {
    ...order,
    customer: userExamples.user,
  },
};
