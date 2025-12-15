import 'dotenv/config'
import { DataSource, DataSourceOptions } from 'typeorm'

import { User } from '../modules/auth/entities/user.entity'
import { Client } from '../modules/clients/entities/client.entity'
import { Session } from '../modules/sessions/entities/session.entity'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Client, Session],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  logging: process.env.NODE_ENV === 'development',
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
