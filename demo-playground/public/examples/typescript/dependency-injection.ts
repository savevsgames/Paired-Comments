// Dependency Injection Container Pattern
// Type-safe DI for managing application dependencies

interface Constructor<T = any> {
  new (...args: any[]): T;
}

type Token<T> = Constructor<T> | symbol;

interface Provider<T> {
  token: Token<T>;
  factory: () => T;
  singleton?: boolean;
  instance?: T;
}

class DIContainer {
  private providers = new Map<Token<any>, Provider<any>>();

  register<T>(
    token: Token<T>,
    factory: () => T,
    options: { singleton?: boolean } = {}
  ): void {
    this.providers.set(token, {
      token,
      factory,
      singleton: options.singleton ?? false,
    });
  }

  resolve<T>(token: Token<T>): T {
    const provider = this.providers.get(token);

    if (!provider) {
      throw new Error(`No provider registered for ${String(token)}`);
    }

    if (provider.singleton) {
      if (!provider.instance) {
        provider.instance = provider.factory();
      }
      return provider.instance;
    }

    return provider.factory();
  }

  has(token: Token<any>): boolean {
    return this.providers.has(token);
  }
}

// Example usage: Service layer with dependency injection

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

interface Database {
  query<T>(sql: string): Promise<T[]>;
}

class PostgresDatabase implements Database {
  constructor(private logger: Logger) {}

  async query<T>(sql: string): Promise<T[]> {
    this.logger.log(`Executing query: ${sql}`);
    return [] as T[];
  }
}

class UserService {
  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  async getUser(id: string) {
    this.logger.log(`Fetching user ${id}`);
    const users = await this.db.query(`SELECT * FROM users WHERE id = '${id}'`);
    return users[0];
  }
}

// Setup DI container
const container = new DIContainer();

container.register(ConsoleLogger, () => new ConsoleLogger(), { singleton: true });

container.register(
  PostgresDatabase,
  () => new PostgresDatabase(container.resolve(ConsoleLogger)),
  { singleton: true }
);

container.register(
  UserService,
  () => new UserService(
    container.resolve(PostgresDatabase),
    container.resolve(ConsoleLogger)
  )
);

const userService = container.resolve(UserService);
