import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{
 code:text('code').primaryKey(),body:text('body').notNull(),revision:integer('revision').notNull().default(0),expires:integer('expires').notNull()
});
export const roomLimits=sqliteTable('room_limits',{id:text('id').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});
