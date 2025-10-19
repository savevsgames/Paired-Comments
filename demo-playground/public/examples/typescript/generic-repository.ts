// Generic Repository Pattern with TypeScript
// Type-safe database access layer

interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QueryOptions<T> {
  where?: Partial<T>;
  orderBy?: keyof T;
  limit?: number;
  offset?: number;
}

class Repository<T extends Entity> {
  constructor(
    private tableName: string,
    private db: DatabaseConnection
  ) {}

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query<T>(query, [id]);
    return result.rows[0] || null;
  }

  async findMany(options: QueryOptions<T> = {}): Promise<T[]> {
    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (options.where) {
      const whereClause = Object.entries(options.where)
        .map(([key, _], index) => `${key} = $${index + 1}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(options.where));
    }

    if (options.orderBy) {
      query += ` ORDER BY ${String(options.orderBy)}`;
    }

    if (options.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(options.limit);
    }

    const result = await this.db.query<T>(query, params);
    return result.rows;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const fields = Object.keys(data);
    const values = Object.values(data);

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${this.tableName}
      (${fields.join(', ')}, created_at, updated_at)
      VALUES (${placeholders}, $${values.length + 1}, $${values.length + 2})
      RETURNING *
    `;

    const result = await this.db.query<T>(query, [...values, now, now]);
    return result.rows[0];
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<T | null> {
    const updates = Object.entries(data)
      .map(([key, _], index) => `${key} = $${index + 1}`)
      .join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${updates}, updated_at = $${Object.keys(data).length + 1}
      WHERE id = $${Object.keys(data).length + 2}
      RETURNING *
    `;

    const result = await this.db.query<T>(
      query,
      [...Object.values(data), new Date(), id]
    );

    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }
}

interface User extends Entity {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

const userRepo = new Repository<User>('users', db);
