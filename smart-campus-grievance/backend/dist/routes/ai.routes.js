"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/draft-coach', auth_1.authenticateToken, ai_controller_1.draftCoach);
exports.default = router;
