const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

router.use(authMiddleware);

router.get('/contacts', chatController.getContacts);
router.get('/conversations', chatController.getConversations);
router.post('/conversations', chatController.getOrCreateConversation);
router.get('/conversations/:id', chatController.getConversationWithMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);
router.patch('/messages/:id/read', chatController.markMessageRead);

module.exports = router;
