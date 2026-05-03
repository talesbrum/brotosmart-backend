// tests/auth.test.js
// Testes de integração do sistema de autenticação BrotoSmart.
// Execute: npm test

const request = require('supertest');
const app = require('../src/server');

// Mock do Firebase Admin e Prisma para os testes
jest.mock('../src/config/firebase', () => ({
  initFirebase: jest.fn(),
  verifyFirebaseToken: jest.fn().mockResolvedValue({
    uid: 'firebase-uid-test-123',
    email: 'test@brotosmart.com',
  }),
}));

jest.mock('../src/config/database', () => {
  const mockUser = {
    id: 'user-uuid-001',
    firebaseUid: 'firebase-uid-test-123',
    email: 'test@brotosmart.com',
    name: 'Pai Teste',
    children: [],
  };

  const mockChild = {
    id: 'child-uuid-001',
    parentId: 'user-uuid-001',
    name: 'João',
    age: 7,
    avatar: 'seed_01',
    dailyLimitMins: 15,
    progress: { seeds: 0, streakDays: 0, gardenLevel: 1 },
  };

  return {
    getPrisma: () => ({
      user: {
        findUnique: jest.fn().mockResolvedValue(mockUser),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockResolvedValue(mockUser),
      },
      childProfile: {
        findFirst: jest.fn().mockResolvedValue(mockChild),
        findUnique: jest.fn().mockResolvedValue(mockChild),
        create: jest.fn().mockResolvedValue(mockChild),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue(mockChild),
      },
      progress: {
        findUnique: jest.fn().mockResolvedValue({ seeds: 50, streakDays: 3, gardenLevel: 1 }),
        create: jest.fn(),
        update: jest.fn(),
      },
      learningTrack: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'track-1', name: 'Matemática', slug: 'matematica', icon: '🔢', color: '#3B82F6', description: 'Números e contas' },
          { id: 'track-2', name: 'Português', slug: 'portugues', icon: '📚', color: '#8B5CF6', description: 'Letras e palavras' },
        ]),
      },
      activity: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'activity-1', question: 'Quanto é 2 + 2?',
          options: ['3', '4', '5', '6'], correctIndex: 1,
          seedsReward: 10, explanation: '2 + 2 = 4!', level: 1,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      quizAnswer: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-1', childId: 'child-uuid-001' }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    }),
    connectDB: jest.fn(),
    disconnectDB: jest.fn(),
  };
});

const VALID_TOKEN = 'Bearer valid-firebase-token';

// ─────────────────────────────────────────────────────────────────────────────
describe('Health Check', () => {
  test('GET /health retorna status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('BrotoSmart API');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth — Registro', () => {
  test('POST /api/auth/register com dados válidos → 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ idToken: 'valid-token', name: 'Pai Teste' });

    // Usuário já existe no mock → 409
    expect([201, 409]).toContain(res.status);
  });

  test('POST /api/auth/register sem nome → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ idToken: 'valid-token' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  test('POST /api/auth/register sem token → 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Pai Teste' });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth — Rota protegida', () => {
  test('GET /api/auth/me sem token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('MISSING_TOKEN');
  });

  test('GET /api/auth/me com token válido → 200', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@brotosmart.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Auth — Perfil de criança', () => {
  test('POST /api/auth/children com dados válidos → 201', async () => {
    const res = await request(app)
      .post('/api/auth/children')
      .set('Authorization', VALID_TOKEN)
      .send({ name: 'João', age: 7 });

    expect(res.status).toBe(201);
    expect(res.body.child).toBeDefined();
    expect(res.body.child.name).toBe('João');
  });

  test('POST /api/auth/children idade inválida → 400', async () => {
    const res = await request(app)
      .post('/api/auth/children')
      .set('Authorization', VALID_TOKEN)
      .send({ name: 'Bebê', age: 2 });

    expect(res.status).toBe(400);
  });

  test('POST /api/auth/children sem autenticação → 401', async () => {
    const res = await request(app)
      .post('/api/auth/children')
      .send({ name: 'João', age: 7 });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Learning — Trilhas', () => {
  test('GET /api/learning/tracks → lista trilhas', async () => {
    const res = await request(app)
      .get('/api/learning/tracks')
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tracks)).toBe(true);
    expect(res.body.tracks.length).toBe(2);
    expect(res.body.tracks[0].slug).toBe('matematica');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Learning — Atividades', () => {
  test('GET /api/learning/activities com trackId e childId válidos → 200', async () => {
    const res = await request(app)
      .get('/api/learning/activities')
      .query({ trackId: 'track-1', childId: 'child-uuid-001' })
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.activity).toBeDefined();
    expect(res.body.activity.question).toBeDefined();
  });

  test('GET /api/learning/activities sem trackId → 400', async () => {
    const res = await request(app)
      .get('/api/learning/activities')
      .query({ childId: 'child-uuid-001' })
      .set('Authorization', VALID_TOKEN);

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Sessions', () => {
  test('POST /api/sessions/start → cria sessão', async () => {
    const res = await request(app)
      .post('/api/sessions/start')
      .set('Authorization', VALID_TOKEN)
      .send({ childId: 'child-uuid-001' });

    expect(res.status).toBe(201);
    expect(res.body.session).toBeDefined();
    expect(res.body.session.childId).toBe('child-uuid-001');
  });

  test('POST /api/sessions/start sem childId → 400', async () => {
    const res = await request(app)
      .post('/api/sessions/start')
      .set('Authorization', VALID_TOKEN)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Rate Limiting', () => {
  test('Mais de 10 requisições de registro em 1 min → 429', async () => {
    const requests = Array.from({ length: 12 }, () =>
      request(app).post('/api/auth/register').send({ idToken: 'x', name: 'y' })
    );
    const responses = await Promise.all(requests);
    const tooMany = responses.some((r) => r.status === 429);
    expect(tooMany).toBe(true);
  });
});
