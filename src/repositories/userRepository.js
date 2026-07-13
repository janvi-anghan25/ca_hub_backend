import User from '../models/User.js';
import BaseRepository from './baseRepository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, withPassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query.lean(false);
  }

  async findByEmailWithSecrets(email) {
    return User.findOne({ email: email.toLowerCase() })
      .select('+password +twoFactorSecret +passwordResetToken +passwordResetExpires')
      .lean(false);
  }

  async findActiveUsers(officeId) {
    return User.find({ office: officeId, isActive: true }).select('-password').lean();
  }
}

export default new UserRepository();
