export interface SlackUser {
  id: string
  name: string
  real_name?: string
  display_name?: string
  email?: string
  status?: string
  deleted?: boolean
}

export class UserService {
  private static instance: UserService
  private users: Map<string, SlackUser> = new Map()

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService()
    }
    return UserService.instance
  }

  async loadUsers(workspacePath: string): Promise<void> {
    try {
      console.log('Loading users from:', workspacePath)
      const jsonPath = workspacePath.replace('members.csv', 'users.json')
      const response = await fetch(jsonPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${jsonPath}: ${response.status} ${response.statusText}`)
      }
      const users = await response.json()
      
      users.forEach((user: any) => {
        if (user.id && user.name) {
          this.users.set(user.id, {
            id: user.id,
            name: user.name,
            real_name: user.real_name || undefined,
            display_name: user.profile?.display_name || undefined,
            email: user.profile?.email || undefined,
            status: user.profile?.status_text || undefined,
            deleted: user.deleted || false
          })
        }
      })

      console.log(`Loaded ${this.users.size} users from ${jsonPath}`)
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  getUserName(userId: string): string {
    const user = this.users.get(userId);
    if (!user) {
      console.log(`No user found for ID: ${userId}`);
      return userId;
    }

    // Don't log all user details in production
    console.log(`Found user: ${user.id}`);

    const displayName = user.display_name || 
                       user.real_name || 
                       user.name || 
                       userId;
    
    // Add (deleted) suffix for deleted users
    const suffix = user.deleted ? ' (deleted)' : '';
    const finalName = displayName + suffix;
    
    console.log(`Resolved display name for ${userId}: ${finalName}`);
    return finalName;
  }

  getUser(userId: string): SlackUser | undefined {
    return this.users.get(userId)
  }

  getAllUsers(): SlackUser[] {
    return Array.from(this.users.values())
  }
} 