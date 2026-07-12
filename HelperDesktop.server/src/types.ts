export type { User, UserRow, DataRecord, SessionRow, TokenResponse, Note } from '../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: import('../../shared/types').UserRow;
    }
  }
}
