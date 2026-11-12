import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/index.js';

/** Verifies the Bearer access token, then reloads the user so bans/deletes apply immediately. */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw ApiError.unauthorized('Access token is invalid or expired');
    }

    const user = await User.findByPk(payload.sub, {
      include: [{ association: 'technicianProfile' }],
    });
    if (!user || !user.isActive) throw ApiError.unauthorized('Account is not active');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/** Allows the request through with req.user when a valid token is present. */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Your role cannot access this resource'));
    }
    return next();
  };
}

/** Only the owner or an admin may continue. */
export function allowOwnerOrAdmin(getOwnerId) {
  return (req, res, next) => {
    const ownerId = getOwnerId(req);
    if (req.user.role === 'admin' || Number(ownerId) === Number(req.user.id)) return next();
    return next(ApiError.forbidden('You do not own this resource'));
  };
}