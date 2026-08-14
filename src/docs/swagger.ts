import swaggerJSDoc from 'swagger-jsdoc';

const serverUrl = 'https://dev.kiddoapp.in/api/v1';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KidDo API',
      version: '1.0.0',
      description: 'REST API for KidDo mobile and admin applications.',
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'Health', description: 'Service health endpoints' },
      { name: 'Auth', description: 'Authentication and account bootstrapping' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Rewards', description: 'Reward management and redemption' },
      { name: 'Users', description: 'User profile and family member management' },
      { name: 'Leaderboard', description: 'Family leaderboard' },
      { name: 'Admin', description: 'Admin-only moderation endpoints' },
      { name: 'Games', description: 'Game reward claim endpoints' },
      { name: 'Activity', description: 'Family activity feed' },
      { name: 'Powerups', description: 'Educational power-ups (Focus Timer, Brain Breaks, Knowledge Quests)' },
      { name: 'Interactions', description: 'High-fives and cheers between family members' },
      { name: 'Wallet', description: 'Reward Points, Redeem Coins, and wallet management' },
      { name: 'Reward Store', description: 'Browse and purchase items from the Reward Store' },
      { name: 'Reward Admin', description: 'Admin control over the reward economy' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            details: {},
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'parent', 'child'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', nullable: true },
            username: { type: 'string', nullable: true },
            childLoginCode: { type: 'string', nullable: true },
            avatar: { type: 'string', nullable: true },
            standard: { type: 'number' },
            points: { type: 'number' },
            streak: { type: 'number' },
            chessWins: { type: 'number' },
            chessGamesPlayed: { type: 'number' },
            memoryWins: { type: 'number' },
            memoryGamesPlayed: { type: 'number' },
            mathWins: { type: 'number' },
            mathGamesPlayed: { type: 'number' },
            patternWins: { type: 'number' },
            patternGamesPlayed: { type: 'number' },
            lastChessRewardAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/AuthTokens' },
            {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
              },
            },
          ],
        },
        ParentRegisterRequest: {
          type: 'object',
          required: ['firstName', 'familyName', 'email', 'password'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            familyName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'parent'] },
          },
        },
        ChildCodeLoginRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
        GoogleMobileLoginRequest: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string' },
          },
        },
        CreateChildRequest: {
          type: 'object',
          required: ['firstName', 'standard'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string' },
            standard: { type: 'number', minimum: 1, maximum: 12 },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string' },
            createdBy: { type: 'string' },
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'approved'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        TaskCreateRequest: {
          type: 'object',
          required: ['assignedTo', 'title', 'points'],
          properties: {
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            dueDate: { type: 'string', format: 'date-time' },
            rewardUnlockThreshold: { type: 'number' },
          },
        },
        TaskUpdateRequest: {
          type: 'object',
          properties: {
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'approved'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Reward: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        RewardCreateRequest: {
          type: 'object',
          required: ['title', 'pointsCost'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
          },
        },
        RewardUpdateRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        UpdateMeRequest: {
          type: 'object',
          properties: {
            avatar: { type: 'string' },
            notificationToken: { type: 'string' },
          },
        },
        NotificationTokenRequest: {
          type: 'object',
          required: ['notificationToken'],
          properties: {
            notificationToken: { type: 'string' },
          },
        },
        UpdateChildRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string' },
            standard: { type: 'number', minimum: 1, maximum: 12 },
            isActive: { type: 'boolean' },
          },
        },
        WalletResponse: {
          type: 'object',
          properties: {
            childId: { type: 'string' },
            rewardPoints: { type: 'number' },
            redeemCoins: { type: 'number' },
            lifetimeRewardPointsEarned: { type: 'number' },
            lifetimeRedeemCoinsEarned: { type: 'number' },
            lifetimeCoinsSpent: { type: 'number' },
            totalConversions: { type: 'number' },
            pendingConversions: { type: 'number' },
            pointsConverted: { type: 'number' },
            currentLevel: { type: 'number' },
            experience: { type: 'number' },
            status: { type: 'string', enum: ['active', 'frozen', 'suspended'] },
            dailyConversionUsed: { type: 'number' },
            weeklyConversionUsed: { type: 'number' },
            monthlyConversionUsed: { type: 'number' },
          },
        },
        ConvertPointsRequest: {
          type: 'object',
          required: ['pointsToConvert'],
          properties: {
            pointsToConvert: { type: 'number', description: 'Must be in multiples of 1000' },
          },
        },
        ConversionResponse: {
          type: 'object',
          properties: {
            conversionId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            rewardPoints: { type: 'number' },
            redeemCoins: { type: 'number' },
            coinsAwarded: { type: 'number' },
          },
        },
        RewardTransactionResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            actionType: { type: 'string' },
            rewardPoints: { type: 'number' },
            redeemCoins: { type: 'number' },
            balanceBefore: {
              type: 'object',
              properties: { rewardPoints: { type: 'number' }, redeemCoins: { type: 'number' } },
            },
            balanceAfter: {
              type: 'object',
              properties: { rewardPoints: { type: 'number' }, redeemCoins: { type: 'number' } },
            },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        GiftPointsRequest: {
          type: 'object',
          required: ['receiverId', 'amount'],
          properties: {
            receiverId: { type: 'string' },
            amount: { type: 'number' },
            message: { type: 'string' },
          },
        },
        GiftCoinsRequest: {
          type: 'object',
          required: ['childId', 'amount'],
          properties: {
            childId: { type: 'string' },
            amount: { type: 'number' },
            message: { type: 'string' },
          },
        },
        RewardStoreItemResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            category: { type: 'object' },
            coinCost: { type: 'number' },
            rarity: { type: 'string', enum: ['common', 'rare', 'epic', 'legendary', 'mythic'] },
            isOwned: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            unlockLevel: { type: 'number' },
            isLimitedEdition: { type: 'boolean' },
          },
        },
        PurchaseItemRequest: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string' },
          },
        },
        RewardCategoryResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            type: { type: 'string', enum: ['avatar_customization', 'goodies', 'physical_rewards'] },
            icon: { type: 'string' },
            sortOrder: { type: 'number' },
          },
        },
        RewardRuleResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            actionType: { type: 'string' },
            name: { type: 'string' },
            basePoints: { type: 'number' },
            isActive: { type: 'boolean' },
            frequency: { type: 'string' },
            maxPerDay: { type: 'number' },
            maxPerWeek: { type: 'number' },
            maxPerMonth: { type: 'number' },
          },
        },
        CreateRewardRuleRequest: {
          type: 'object',
          required: ['actionType', 'name', 'basePoints'],
          properties: {
            actionType: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            basePoints: { type: 'number' },
            frequency: { type: 'string', enum: ['once_per_day', 'once_per_week', 'once_per_month', 'unlimited'] },
            maxPerDay: { type: 'number' },
            maxPerWeek: { type: 'number' },
            maxPerMonth: { type: 'number' },
          },
        },
        AdjustBalanceRequest: {
          type: 'object',
          properties: {
            pointsDelta: { type: 'number', description: 'Can be negative to deduct' },
            coinsDelta: { type: 'number', description: 'Can be negative to deduct' },
            reason: { type: 'string' },
          },
        },
        InventoryResponse: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            itemId: { type: 'string' },
            itemName: { type: 'string' },
            coinCost: { type: 'number' },
            rarity: { type: 'string' },
            isEquipped: { type: 'boolean' },
            purchasedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Check backend health',
          security: [],
          responses: {
            '200': {
              description: 'Backend is healthy',
            },
          },
        },
      },
      '/auth/parent/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a parent and create a family',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ParentRegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Parent account created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login as admin or parent',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/children/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login as a child using access code',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChildCodeLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/google/mobile': {
        post: {
          tags: ['Auth'],
          summary: 'Login or register a parent via Google mobile token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoogleMobileLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user profile',
          responses: {
            '200': {
              description: 'Current user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/auth/children': {
        post: {
          tags: ['Auth'],
          summary: 'Create a child account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateChildRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Child account created',
            },
          },
        },
      },
      '/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'List tasks for the current family or child',
          responses: {
            '200': {
              description: 'Task list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a task',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskCreateRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Task created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
      },
      '/tasks/{taskId}': {
        patch: {
          tags: ['Tasks'],
          summary: 'Update a task',
          parameters: [
            {
              in: 'path',
              name: 'taskId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskUpdateRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Task updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          parameters: [
            {
              in: 'path',
              name: 'taskId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Task deleted',
            },
          },
        },
      },
      '/rewards': {
        get: {
          tags: ['Rewards'],
          summary: 'List rewards',
          responses: {
            '200': {
              description: 'Reward list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reward' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Rewards'],
          summary: 'Create a reward',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RewardCreateRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Reward created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reward' },
                },
              },
            },
          },
        },
      },
      '/rewards/{rewardId}': {
        patch: {
          tags: ['Rewards'],
          summary: 'Update a reward',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RewardUpdateRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Reward updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reward' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Rewards'],
          summary: 'Delete a reward',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Reward deleted',
            },
          },
        },
      },
      '/rewards/{rewardId}/redeem': {
        post: {
          tags: ['Rewards'],
          summary: 'Redeem a reward as a child',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Reward redeemed',
            },
          },
        },
      },
      '/users/me': {
        patch: {
          tags: ['Users'],
          summary: 'Update current user avatar or notification token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMeRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'User updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/users/me/notification-token': {
        post: {
          tags: ['Users'],
          summary: 'Register push notification token for current user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationTokenRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Notification token saved',
            },
          },
        },
      },
      '/users/family': {
        get: {
          tags: ['Users'],
          summary: 'List users in the current family',
          responses: {
            '200': {
              description: 'Family users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      '/users/all': {
        get: {
          tags: ['Users'],
          summary: 'List all users as admin',
          responses: {
            '200': {
              description: 'All users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      '/users/{userId}': {
        patch: {
          tags: ['Users'],
          summary: 'Update a child user',
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateChildRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Child updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/users/{userId}/regenerate-code': {
        post: {
          tags: ['Users'],
          summary: 'Regenerate child login code',
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Child code regenerated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/leaderboard': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Get family leaderboard',
          responses: {
            '200': {
              description: 'Leaderboard response',
            },
          },
        },
      },
      '/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin dashboard data',
          responses: {
            '200': {
              description: 'Dashboard response',
            },
          },
        },
      },
      '/admin/tasks': {
        get: {
          tags: ['Admin'],
          summary: 'Moderate tasks as admin',
          responses: {
            '200': {
              description: 'Admin task moderation response',
            },
          },
        },
      },
      '/admin/rewards': {
        get: {
          tags: ['Admin'],
          summary: 'Moderate rewards as admin',
          responses: {
            '200': {
              description: 'Admin reward moderation response',
            },
          },
        },
      },
      '/games/chess/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim chess game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/memory/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim memory game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/math/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim math game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/pattern/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim pattern game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/puzzle/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim jigsaw puzzle game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/activity': {
        get: {
          tags: ['Activity'],
          summary: 'List family activity feed',
          responses: {
            '200': {
              description: 'Activity feed response',
            },
          },
        },
      },
      '/powerups/brain-break/tip': {
        get: {
          tags: ['Powerups'],
          summary: 'Get a random mindfulness tip',
          responses: {
            '200': {
              description: 'Random tip',
            },
          },
        },
      },
      '/powerups/brain-break/complete': {
        post: {
          tags: ['Powerups'],
          summary: 'Complete a brain break and earn points',
          responses: {
            '200': {
              description: 'Points awarded',
            },
          },
        },
      },
      '/powerups/focus/complete': {
        post: {
          tags: ['Powerups'],
          summary: 'Complete a focus session and earn points',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    durationSeconds: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Points awarded',
            },
          },
        },
      },
      '/powerups/knowledge-quest': {
        get: {
          tags: ['Powerups'],
          summary: 'Get a random trivia question',
          responses: {
            '200': {
              description: 'Question data',
            },
          },
        },
      },
      '/powerups/knowledge-quest/answer': {
        post: {
          tags: ['Powerups'],
          summary: 'Submit an answer to a knowledge quest',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    questionId: { type: 'number' },
                    answer: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Result of the answer',
            },
          },
        },
      },
      '/interactions': {
        post: {
          tags: ['Interactions'],
          summary: 'Send a high-five or cheer to a family member',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    receiverId: { type: 'string' },
                    type: { type: 'string', enum: ['high_five', 'cheer', 'well_done'] },
                    activityId: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Interaction sent',
            },
          },
        },
      },
      '/interactions/me': {
        get: {
          tags: ['Interactions'],
          summary: 'Get interactions received by current user',
          responses: {
            '200': {
              description: 'List of interactions',
            },
          },
        },
      },
      '/wallet/me': {
        get: {
          tags: ['Wallet'],
          summary: 'Get own wallet with current Reward Points and Redeem Coins',
          responses: { '200': { description: 'Wallet data', content: { 'application/json': { schema: { $ref: '#/components/schemas/WalletResponse' } } } } },
        },
      },
      '/wallet/transactions': {
        get: {
          tags: ['Wallet'],
          summary: 'Get transaction history',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
            { in: 'query', name: 'actionType', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Paginated transaction list' } },
        },
      },
      '/wallet/convert': {
        post: {
          tags: ['Wallet'],
          summary: 'Convert Reward Points to Redeem Coins (child)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ConvertPointsRequest' } } } },
          responses: { '200': { description: 'Conversion result', content: { 'application/json': { schema: { $ref: '#/components/schemas/ConversionResponse' } } } } },
        },
      },
      '/wallet/convert/request': {
        post: {
          tags: ['Wallet'],
          summary: 'Request conversion with parent approval (child)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ConvertPointsRequest' } } } },
          responses: { '200': { description: 'Pending conversion created' } },
        },
      },
      '/wallet/conversions/pending': {
        get: {
          tags: ['Wallet'],
          summary: 'Get pending conversions for family (parent)',
          responses: { '200': { description: 'List of pending conversions' } },
        },
      },
      '/wallet/conversions/{id}/approve': {
        post: {
          tags: ['Wallet'],
          summary: 'Approve a pending conversion (parent)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Conversion approved' } },
        },
      },
      '/wallet/conversions/{id}/reject': {
        post: {
          tags: ['Wallet'],
          summary: 'Reject a pending conversion (parent)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } } },
          responses: { '200': { description: 'Conversion rejected, points restored' } },
        },
      },
      '/wallet/gift/points': {
        post: {
          tags: ['Wallet'],
          summary: 'Gift Reward Points to a child (parent/teacher)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GiftPointsRequest' } } } },
          responses: { '200': { description: 'Points gifted' } },
        },
      },
      '/wallet/gift/coins': {
        post: {
          tags: ['Wallet'],
          summary: 'Gift Redeem Coins to a child (parent)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GiftCoinsRequest' } } } },
          responses: { '200': { description: 'Coins gifted' } },
        },
      },
      '/wallet/child/{childId}': {
        get: {
          tags: ['Wallet'],
          summary: 'View a child wallet (parent/admin)',
          parameters: [{ in: 'path', name: 'childId', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Child wallet data' } },
        },
      },
      '/store/categories': {
        get: {
          tags: ['Reward Store'],
          summary: 'List reward store categories',
          parameters: [{ in: 'query', name: 'type', schema: { type: 'string', enum: ['avatar_customization', 'goodies', 'physical_rewards'] } }],
          responses: { '200': { description: 'Category list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RewardCategoryResponse' } } } } } },
        },
        post: {
          tags: ['Reward Admin'],
          summary: 'Create a new store category (admin)',
          responses: { '201': { description: 'Category created' } },
        },
      },
      '/store/items': {
        get: {
          tags: ['Reward Store'],
          summary: 'List store items with filters',
          parameters: [
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'rarity', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Item list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RewardStoreItemResponse' } } } } } },
        },
        post: {
          tags: ['Reward Admin'],
          summary: 'Create a new store item (admin)',
          responses: { '201': { description: 'Item created' } },
        },
      },
      '/store/items/featured': {
        get: {
          tags: ['Reward Store'],
          summary: 'Get featured items carousel',
          responses: { '200': { description: 'Featured items' } },
        },
      },
      '/store/items/recent': {
        get: {
          tags: ['Reward Store'],
          summary: 'Get recently added items',
          responses: { '200': { description: 'Recent items' } },
        },
      },
      '/store/items/{id}': {
        get: {
          tags: ['Reward Store'],
          summary: 'Get item details',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Item detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/RewardStoreItemResponse' } } } } },
        },
      },
      '/store/purchase': {
        post: {
          tags: ['Reward Store'],
          summary: 'Purchase an item using Redeem Coins (child)',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/PurchaseItemRequest' } } } },
          responses: { '200': { description: 'Purchase successful' } },
        },
      },
      '/store/inventory': {
        get: {
          tags: ['Reward Store'],
          summary: 'Get purchased inventory',
          parameters: [{ in: 'query', name: 'categoryType', schema: { type: 'string' } }],
          responses: { '200': { description: 'Inventory list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/InventoryResponse' } } } } } },
        },
      },
      '/store/inventory/{id}/equip': {
        post: {
          tags: ['Reward Store'],
          summary: 'Toggle equip/unequip an owned item',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Equip status toggled' } },
        },
      },
      '/admin/economy/rules': {
        get: {
          tags: ['Reward Admin'],
          summary: 'List all reward point rules',
          responses: { '200': { description: 'Rule list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RewardRuleResponse' } } } } } },
        },
        post: {
          tags: ['Reward Admin'],
          summary: 'Create a new reward point rule',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRewardRuleRequest' } } } },
          responses: { '201': { description: 'Rule created' } },
        },
      },
      '/admin/economy/rules/{id}': {
        patch: {
          tags: ['Reward Admin'],
          summary: 'Update a reward point rule',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRewardRuleRequest' } } } },
          responses: { '200': { description: 'Rule updated' } },
        },
      },
      '/admin/economy/transactions': {
        get: {
          tags: ['Reward Admin'],
          summary: 'View all transaction logs',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'number' } },
            { in: 'query', name: 'limit', schema: { type: 'number' } },
            { in: 'query', name: 'actionType', schema: { type: 'string' } },
            { in: 'query', name: 'userId', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Paginated transaction logs' } },
        },
      },
      '/admin/economy/stats': {
        get: {
          tags: ['Reward Admin'],
          summary: 'Get economy analytics and stats',
          responses: { '200': { description: 'Economy stats' } },
        },
      },
      '/admin/economy/wallet/{userId}/adjust': {
        post: {
          tags: ['Reward Admin'],
          summary: 'Adjust user balance (add/deduct points or coins)',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AdjustBalanceRequest' } } } },
          responses: { '200': { description: 'Balance adjusted' } },
        },
      },
      '/admin/economy/wallet/{userId}/freeze': {
        post: {
          tags: ['Reward Admin'],
          summary: 'Freeze a child wallet to disable spending',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Wallet frozen' } },
        },
      },
      '/admin/economy/wallet/{userId}/unfreeze': {
        post: {
          tags: ['Reward Admin'],
          summary: 'Unfreeze a child wallet',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Wallet unfrozen' } },
        },
      },
      '/admin/economy/campaigns': {
        get: {
          tags: ['Reward Admin'],
          summary: 'List all reward campaigns',
          responses: { '200': { description: 'Campaign list' } },
        },
        post: {
          tags: ['Reward Admin'],
          summary: 'Create a reward campaign or seasonal event',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['seasonal', 'limited_time', 'promotional'] }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' }, bonusPointsMultiplier: { type: 'number' }, bonusCoinsMultiplier: { type: 'number' } } } } } },
          responses: { '201': { description: 'Campaign created' } },
        },
      },
      '/admin/economy/campaigns/{id}': {
        patch: {
          tags: ['Reward Admin'],
          summary: 'Update a campaign',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Campaign updated' } },
        },
      },
    },
  },
  apis: [],
});
