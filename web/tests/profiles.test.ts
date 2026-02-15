import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from 'node:https'

// Types for request functions
interface RequestInfo {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: BodyInit | Record<string, string | number[]>;
}

// Mock fetch globally for testing
async function request(
  method: string,
  path: string,
  options?: RequestInfo
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json: () => Promise<any>;
}> {
  const baseUrl = 'http://localhost:3000'
  const url = `${baseUrl}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers
  }

  const init: RequestInit = {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined
  }

  const response = await fetch(url, init)

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    json: async () => response.json()
  }
}

// Export request functions to global scope for tests
export const GET = request.bind(null, 'GET')
export const POST = request.bind(null, 'POST')


// Types for request functions
type RequestOptions = RequestInfo & {
  headers?: Record<string, string>;
  body?: BodyInit | Record<string, string | number[]>;
}

// Mock fetch globally for testing
async function request(
  method: string,
  path: string,
  options?: RequestOptions
): Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json: () => Promise<any>;
}> {
  const baseUrl = 'http://localhost:3000'
  const url = `${baseUrl}${path}`

  const headers: {
    'Content-Type': 'application/json',
    ...options?.headers
  }

  const init: RequestInit = {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined
  }

  const response = await fetch(url, init)

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    json: async () => response.json()
  }
}

// Export request functions to global scope for tests
export const GET = request.bind(null, 'GET')
export const POST = request.bind(null, 'POST')


// Mock Supabase for testing
const mockDb = {
  profiles: [
    { id: 'child_01', name: 'Child 01', mac_addresses: ['AA:BB:CC:DD:EE:FF'] }
  ],
}

describe('Profile API', () => {
  beforeEach(async () => {
    // Reset mock before each test
    mockDb.profiles = [
      { id: 'child_01', name: 'Child 01', mac_addresses: ['AA:BB:CC:DD:EE:FF'] }
    ]
  })

  describe('GET /api/profiles - List all profiles', async () => {
    const response = await GET('http://localhost:3000/api/profiles')

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('application/json')

    const profiles = await response.json()
    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toHaveProperty('id', 'child_01')
    expect(profiles[0]).toHaveProperty('name', 'Child 01')
  })

  describe('POST /api/profiles - Create new profile', async () => {
    const newProfile = {
      id: 'test-' + Date.now(),
      name: 'Test Profile ' + Date.now(),
      description: 'Created via test',
      mac_addresses: ['AA:BB:CC:DD:EE:FF']
    }

    const response = await POST('http://localhost:3000/api/profiles', newProfile)

    expect(response.statusCode).toBe(201)
    expect(response.headers['content-type']).toBe('application/json')

    const created = await response.json()
    expect(created).toHaveProperty('id', newProfile.id)
    expect(created).toHaveProperty('name', newProfile.name)
  })

  describe('GET /api/profiles/:id - Get single profile', async () => {
    const response = await GET('http://localhost:3000/api/profiles/child_01')

    if (response.statusCode === 404) {
      expect(await response.text()).toContain('Profile not found')
      return
    }

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toBe('application/json')

    const profile = await response.json()
    expect(profile).toHaveProperty('id', 'child_01')
    expect(profile).toHaveProperty('name', 'Child 01')
  })
})
