async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = Object.assign(
      new Error(result.error || `Request failed with status ${response.status}.`),
      { status: response.status }
    );
    throw error;
  }
  return result;
}

function post(path, body = {}) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

function createEntityClient(entity) {
  return {
    filter: (query = {}, options = {}) => post(`/api/entities/${entity}/filter`, { query, options }),
    list: (options = {}) => post(`/api/entities/${entity}/list`, { options }),
    get: (id) => post(`/api/entities/${entity}/get`, { id }),
    count: (query = {}) => post(`/api/entities/${entity}/count`, { query }),
    aggregate: ({ query = {}, groupBy }) => post(`/api/entities/${entity}/aggregate`, { query, groupBy }),
    create: (data) => post(`/api/entities/${entity}/create`, { data }),
    update: (id, data) => post(`/api/entities/${entity}/update`, { id, data }),
    delete: (id) => post(`/api/entities/${entity}/delete`, { id }),
  };
}

const entityNames = [
  'Assignment',
  'Availability',
  'Service',
  'ServiceTime',
  'Setlist',
  'SignupInterest',
  'Song',
  'SwapRequest',
  'TeamMember',
];

const entities = Object.fromEntries(entityNames.map((name) => [name, createEntityClient(name)]));

export const api = {
  auth: {
    me: async () => (await request('/api/auth/me')).user,
    loginViaEmailPassword: (email, password) => post('/api/auth/login', { email, password }),
    register: (email, password) => post('/api/auth/register', { email, password }),
    verifyRegistration: (email, code) =>
      post('/api/auth/register/verify', { email, code }),
    resendRegistrationCode: (email) => post('/api/auth/register/resend', { email }),
    loginWithProvider: (provider, returnTo = '/') => {
      if (provider !== 'google') throw new Error('Unsupported sign-in provider.');
      const params = new URLSearchParams({ returnTo });
      window.location.assign(`/api/auth/google?${params}`);
    },
    redirectToLogin: (returnTo = window.location.href) => {
      const destination = new URL('/login', window.location.origin);
      if (returnTo !== `${window.location.origin}/`) {
        destination.searchParams.set('returnTo', returnTo);
      }
      window.location.assign(destination);
    },
    logout: () => post('/api/auth/logout'),
    resetPasswordRequest: (email) => post('/api/auth/forgot-password', { email }),
    resetPassword: ({ resetToken, newPassword }) =>
      post('/api/auth/reset-password', { resetToken, newPassword }),
  },
  entities,
};
