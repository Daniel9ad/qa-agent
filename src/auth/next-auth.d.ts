declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      user: string;
      firstName: string;
      lastName: string;
    };
  }

  interface User {
    id: string;
    user: string;
    firstName: string;
    lastName: string;
  }
}

import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    user?: string;
    firstName?: string;
    lastName?: string;
  }
}
