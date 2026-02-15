import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST, GET } from 'node:https'

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
