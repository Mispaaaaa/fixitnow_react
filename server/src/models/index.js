import sequelize from '../config/db.js';
import User from './user.model.js';
import RefreshToken from './refreshToken.model.js';
import PasswordResetToken from './passwordResetToken.model.js';
import SavedAddress from './savedAddress.model.js';
import ServiceCategory from './category.model.js';
import {
  TechnicianProfile,
  TechnicianDocument,
  TechnicianSkill,
  TechnicianArea,
  TechnicianAvailability,
} from './technician.model.js';
import { ServiceRequest, RequestPhoto, RequestStatusHistory } from './request.model.js';
import { Conversation, Message, LocationShare } from './chat.model.js';
import Review from './review.model.js';
import { Notification, PushSubscription } from './notification.model.js';
import { Announcement, SiteContent, AuditLog } from './content.model.js';

// ---- User associations -----------------------------------------------------
User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
PasswordResetToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(SavedAddress, { foreignKey: 'userId', as: 'addresses' });
SavedAddress.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(TechnicianProfile, { foreignKey: 'userId', as: 'technicianProfile' });
TechnicianProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ServiceRequest, { foreignKey: 'customerId', as: 'customerRequests' });
User.hasMany(ServiceRequest, { foreignKey: 'technicianId', as: 'technicianRequests' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(PushSubscription, { foreignKey: 'userId', as: 'pushSubscriptions' });
PushSubscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ---- Technician ------------------------------------------------------------
TechnicianProfile.hasMany(TechnicianDocument, {
  foreignKey: 'technicianProfileId',
  as: 'documents',
});
TechnicianDocument.belongsTo(TechnicianProfile, {
  foreignKey: 'technicianProfileId',
  as: 'profile',
});

TechnicianProfile.belongsToMany(ServiceCategory, {
  through: TechnicianSkill,
  foreignKey: 'technicianProfileId',
  otherKey: 'categoryId',
  as: 'skills',
});
ServiceCategory.belongsToMany(TechnicianProfile, {
  through: TechnicianSkill,
  foreignKey: 'categoryId',
  otherKey: 'technicianProfileId',
  as: 'technicians',
});

TechnicianProfile.hasMany(TechnicianArea, { foreignKey: 'technicianProfileId', as: 'areas' });
TechnicianArea.belongsTo(TechnicianProfile, { foreignKey: 'technicianProfileId', as: 'profile' });

TechnicianProfile.hasMany(TechnicianAvailability, {
  foreignKey: 'technicianProfileId',
  as: 'availability',
});
TechnicianAvailability.belongsTo(TechnicianProfile, {
  foreignKey: 'technicianProfileId',
  as: 'profile',
});

// ---- Requests --------------------------------------------------------------
ServiceCategory.hasMany(ServiceRequest, { foreignKey: 'categoryId', as: 'requests' });
ServiceRequest.belongsTo(ServiceCategory, { foreignKey: 'categoryId', as: 'category' });
ServiceRequest.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
ServiceRequest.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

ServiceRequest.hasMany(RequestPhoto, { foreignKey: 'requestId', as: 'photos' });
RequestPhoto.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });

ServiceRequest.hasMany(RequestStatusHistory, {
  foreignKey: 'requestId',
  as: 'history',
});
RequestStatusHistory.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });
RequestStatusHistory.belongsTo(User, { foreignKey: 'changedBy', as: 'changedByUser' });

// ---- Chat ------------------------------------------------------------------
ServiceRequest.hasOne(Conversation, { foreignKey: 'requestId', as: 'conversation' });
Conversation.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });
Conversation.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Conversation.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(LocationShare, { foreignKey: 'locationShareId', as: 'locationShare' });

Conversation.hasMany(LocationShare, { foreignKey: 'conversationId', as: 'locationShares' });
LocationShare.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
LocationShare.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });
LocationShare.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LocationShare.hasOne(Message, { foreignKey: 'locationShareId', as: 'message' });

// ---- Reviews ---------------------------------------------------------------
ServiceRequest.hasOne(Review, { foreignKey: 'requestId', as: 'review' });
Review.belongsTo(ServiceRequest, { foreignKey: 'requestId', as: 'request' });
Review.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });
Review.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });
User.hasMany(Review, { foreignKey: 'technicianId', as: 'receivedReviews' });

// ---- Content / audit -------------------------------------------------------
Announcement.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
SiteContent.belongsTo(User, { foreignKey: 'updatedBy', as: 'editor' });
AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

export {
  sequelize,
  User,
  RefreshToken,
  PasswordResetToken,
  SavedAddress,
  ServiceCategory,
  TechnicianProfile,
  TechnicianDocument,
  TechnicianSkill,
  TechnicianArea,
  TechnicianAvailability,
  ServiceRequest,
  RequestPhoto,
  RequestStatusHistory,
  Conversation,
  Message,
  LocationShare,
  Review,
  Notification,
  PushSubscription,
  Announcement,
  SiteContent,
  AuditLog,
};