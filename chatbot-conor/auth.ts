import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const auth = betterAuth({
   emailAndPassword: {    
        enabled: true
    },
    database: new Pool({
    connectionString: process.env.SUPA_CONNECTION_STRING,
  }),
});

