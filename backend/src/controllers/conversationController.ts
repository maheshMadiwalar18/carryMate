import { Response } from 'express';
import { Conversation } from '../models/Conversation';
import { Message } from '../models/Message';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';

export const listMyConversations = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const conversations = await Conversation.find({ participants: req.user!._id })
    .populate('participants', 'name profileImage')
    .populate('deliveryRequestId', 'itemName pickup destination status')
    .sort({ updatedAt: -1 });
  res.json({ success: true, data: conversations });
});

async function assertParticipantOf(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId);
  if (!convo) throw AppError.notFound('Conversation not found');
  if (!convo.participants.some((p) => p.equals(userId))) {
    throw AppError.forbidden('You are not a participant in this conversation');
  }
  return convo;
}

export const getMessages = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await assertParticipantOf(req.params.id, req.user!._id.toString());
  const messages = await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 }).limit(500);
  await Message.updateMany(
    { conversationId: req.params.id, senderId: { $ne: req.user!._id }, readAt: { $exists: false } },
    { readAt: new Date() }
  );
  res.json({ success: true, data: messages });
});

export const sendMessage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const convo = await assertParticipantOf(req.params.id, req.user!._id.toString());
  const message = await Message.create({
    conversationId: convo._id,
    senderId: req.user!._id,
    message: req.body.message,
    messageType: 'TEXT',
  });
  convo.lastMessage = req.body.message;
  convo.lastMessageAt = new Date();
  await convo.save();
  res.status(201).json({ success: true, data: message });
});
