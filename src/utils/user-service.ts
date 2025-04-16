export interface SlackUser {
  id: string
  name: string
  real_name?: string
  display_name?: string
  email?: string
  status?: string
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

  async loadUsers(csvPath: string): Promise<void> {
    try {
      console.log('Loading users from:', csvPath)
      const response = await fetch(csvPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${csvPath}: ${response.status} ${response.statusText}`)
      }
      const csvText = await response.text()
      
      // Parse CSV, skip header row
      const rows = csvText.split('\n').slice(1)
      
      rows.forEach(row => {
        if (!row.trim()) return // Skip empty rows
        
        // Split on commas, but handle quoted values
        const values = row.split(',').map(value => 
          value.startsWith('"') && value.endsWith('"') 
            ? value.slice(1, -1) 
            : value
        )

        const [username, email, status, , , , userid, fullname, displayname] = values
        
        if (userid && username) {
          this.users.set(userid, {
            id: userid,
            name: username,
            real_name: fullname || undefined,
            display_name: displayname || undefined,
            email: email || undefined,
            status: status || undefined
          })
        }
      })

      console.log(`Loaded ${this.users.size} users from ${csvPath}`)
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

    console.log('Found user:', {
      id: userId,
      name: user.name,
      real_name: user.real_name,
      display_name: user.display_name
    });

    const displayName = user.display_name || 
                       user.real_name || 
                       user.name || 
                       userId;
    
    console.log(`Resolved display name for ${userId}: ${displayName}`);
    return displayName;
  }

  getUser(userId: string): SlackUser | undefined {
    return this.users.get(userId)
  }

  getAllUsers(): SlackUser[] {
    return Array.from(this.users.values())
  }
} 