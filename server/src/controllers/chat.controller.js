import { Op } from 'sequelize';
import {
  Conversation,
  LocationShare,
  Message,
  ServiceRequest,
  TechnicianProfile,
} from '../models/index.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, pagedData } from '../utils/pagination.js';
import { isOnline } from '../sockets/presence.js';
import {
  conversationJSON,
  countUnread,
  assertCanSend,
  createMessage,
  ensureRequestConversation,
  findExistingConsultation,
  isParticipant,
  loadConversation,
  markConversationRead,
  messageJSON,
} from '../services/chat.service.js';

const USER_ATTRIBUTES = ['id', 'name', 'role', 'avatarUrl', 'phone', 'lastActiveAt'];
const CHAT_REQUEST_STATUSES = ['accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'];

function withPresence(conversation) {
  const raw = conversationJSON(conversation);
  if (raw.customer) raw.customer.online = isOnline(raw.customer.id);
  if (raw.technician) raw.technician.online = isOnline(raw.technician.id);
  return raw;
}

function viewerFilter(viewer) {
  if (viewer.role === 'admin') return {};
  return {
    [Op.or]: [{ customerId: viewer.id }, { technicianId: viewer.id }],
  };
}

async function conversationSummary(conversation, viewer) {
  const raw = withPresence(conversation);
  const otherUser =
    viewer.role === 'customer'
      ? raw.technician
      : viewer.role === 'technician'
        ? raw.customer
        : null;

  const [lastMessage, unreadCount] = await Promise.all([
    Message.findOne({
      where: { conversationId: conversation.id },
      include: [{ association: 'sender', attributes: ['id', 'name', 'avatarUrl'] }],
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    }),
    viewer.role === 'admin'
      ? 0
      : Message.count({
          where: {
            conversationId: conversation.id,
            senderId: { [Op.ne]: viewer.id },
            seenAt: null,
          },
        }),
  ]);

  return {
    ...raw,
    otherUser,
    unreadCount,
    lastMessage: lastMessage ? messageJSON(lastMessage) : null,
  };
}

export const listConversations = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query, 30);
  const conversations = await Conversation.findAll({
    where: viewerFilter(req.user),
    include: [
      { association: 'customer', attributes: USER_ATTRIBUTES },
      { association: 'technician', attributes: USER_ATTRIBUTES },
      {
        association: 'request',
        attributes: ['id', 'status', 'preferredDate', 'timeSlot', 'city'],
        include: [{ association: 'category', attributes: ['id', 'name', 'icon'] }],
      },
    ],
    order: [
      ['lastMessageAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  });

  const visible = conversations.filter(
    (conversation) =>
      req.user.role === 'admin' || conversation.request?.status !== 'pending'
  );
  const items = await Promise.all(
    visible.map((conversation) => conversationSummary(conversation, req.user))
  );

  res.json({
    success: true,
    data: pagedData(items, items.length, page, limit),
  });
});

export const unreadCount = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    return res.json({ success: true, data: { unread: 0 } });
  }
  const conversations = await Conversation.findAll({
    where: viewerFilter(req.user),
    attributes: ['id'],
    include: [{ association: 'request', attributes: ['id', 'status'] }],
  });
  const ids = conversations
    .filter((conversation) => conversation.request?.status !== 'pending')
    .map((conversation) => conversation.id);
  const unread = await countUnread(ids, req.user.id);
  return res.json({ success: true, data: { unread } });
});

export const getConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  const summary = await conversationSummary(conversation, req.user);
  res.json({ success: true, data: { conversation: summary } });
});

export const createConversation = asyncHandler(async (req, res) => {
  const { requestId, technicianId } = req.body;

  if (req.user.role === 'admin') {
    throw ApiError.forbidden('Admins can review conversations but cannot start one');
  }

  let conversation;
  if (requestId) {
    const request = await ServiceRequest.findByPk(requestId);
    if (!request) throw ApiError.notFound('Service request not found');
    if (req.user.role === 'customer' && Number(request.customerId) !== Number(req.user.id)) {
      throw ApiError.notFound('Service request not found');
    }
    if (req.user.role === 'technician' && Number(request.technicianId) !== Number(req.user.id)) {
      throw ApiError.forbidden('You are not assigned to this request');
    }
    if (!request.technicianId) {
      throw ApiError.conflict('Chat opens after a technician accepts the request');
    }
    if (!CHAT_REQUEST_STATUSES.includes(request.status)) {
      throw ApiError.conflict('Chat is not available for this request');
    }
    conversation = await ensureRequestConversation(request);
  } else {
    if (req.user.role !== 'customer') {
      throw ApiError.forbidden('Only customers can start a consultation chat');
    }
    if (Number(technicianId) === Number(req.user.id)) {
      throw ApiError.badRequest('You cannot start a conversation with yourself');
    }
    const profile = await TechnicianProfile.findOne({
      where: { userId: technicianId, verificationStatus: 'verified' },
      include: [
        {
          association: 'user',
          attributes: ['id', 'isActive'],
          where: { isActive: true },
        },
      ],
    });
    if (!profile) {
      throw ApiError.badRequest('This technician is not available for chat');
    }
    conversation = await findExistingConsultation(req.user.id, technicianId);
    if (!conversation) {
      conversation = await Conversation.create({
        requestId: null,
        customerId: req.user.id,
        technicianId,
      });
    }
  }

  const loaded = await loadConversation(conversation.id, req.user);
  const summary = await conversationSummary(loaded, req.user);
  res.status(201).json({
    success: true,
    message: 'Conversation ready',
    data: { conversation: summary },
  });
});

export const listMessages = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  const { page, limit, offset } = getPagination(req.validatedQuery, 30);

  const { count, rows } = await Message.findAndCountAll({
    where: { conversationId: conversation.id },
    include: [
      { association: 'sender', attributes: ['id', 'name', 'avatarUrl', 'role'] },
      { association: 'locationShare' },
    ],
    order: [
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    limit,
    offset,
  });

  await Message.update(
    { deliveredAt: new Date() },
    {
      where: {
        conversationId: conversation.id,
        senderId: { [Op.ne]: req.user.id },
        deliveredAt: null,
      },
    }
  ).catch(() => {});

  const items = rows.reverse().map(messageJSON);
  res.json({
    success: true,
    data: {
      ...pagedData(items, count, page, limit),
      conversation: withPresence(conversation),
    },
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user, {
    includeMessages: true,
  });
  if (req.user.role === 'admin') {
    throw ApiError.forbidden('Admins can review conversations but cannot send messages');
  }
  if (!isParticipant(conversation, req.user.id)) {
    throw ApiError.forbidden('You are not part of this conversation');
  }

  const imageUrl = req.file ? `chat/${req.file.filename}` : null;
  const body = req.body?.body ?? req.body?.text ?? null;
  const type = imageUrl ? 'image' : 'text';

  const message = await createMessage({
    conversation,
    sender: req.user,
    type,
    body,
    imageUrl,
  });

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { message },
  });
});

export const shareRequestLocation = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  if (req.user.role !== 'customer') {
    throw ApiError.forbidden('Only the customer can share the service location');
  }
  if (!conversation.requestId) {
    throw ApiError.conflict('Location sharing is available in service request conversations');
  }
  assertCanSend(conversation, req.user);

  const request = await ServiceRequest.findOne({
    where: { id: conversation.requestId, customerId: req.user.id },
    attributes: ['id', 'status'],
  });
  if (!request) throw ApiError.notFound('Service request not found');
  if (!['accepted', 'on_the_way', 'arrived', 'in_progress'].includes(request.status)) {
    throw ApiError.conflict('The service location can only be shared for an active request');
  }

  const share = await LocationShare.create({
    conversationId: conversation.id,
    requestId: request.id,
    userId: req.user.id,
    lat: req.body.lat,
    lng: req.body.lng,
    mode: 'snapshot',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const message = await createMessage({
    conversation,
    sender: req.user,
    type: 'location',
    body: 'Shared my current location',
    locationShareId: share.id,
  });

  res.status(201).json({
    success: true,
    message: 'Service location shared',
    data: { message },
  });
});

export const readConversation = asyncHandler(async (req, res) => {
  const conversation = await loadConversation(req.params.id, req.user);
  if (req.user.role === 'admin') {
    return res.json({ success: true, data: { updated: 0 } });
  }
  const result = await markConversationRead(conversation, req.user);
  return res.json({ success: true, data: result });
});