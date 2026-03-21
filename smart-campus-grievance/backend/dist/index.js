"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const complaint_routes_1 = __importDefault(require("./routes/complaint.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
exports.prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/complaints', complaint_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
