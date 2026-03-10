"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftCoach = void 0;
const ai_service_1 = require("../services/ai.service");
const draftCoach = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description } = req.body;
        const { suggestions } = yield (0, ai_service_1.analyzeComplaintDraft)(title || '', description || '');
        res.status(200).json({ suggestions });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.draftCoach = draftCoach;
