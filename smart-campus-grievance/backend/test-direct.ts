import { prisma } from './src/index.ts';
import { submitComplaint } from './src/controllers/complaint.controller.ts';

const req = {
    body: {
        title: 'Broken projector',
        description: 'The projector in room 302 is broken and needs fixing immediately.',
        category: 'General',
        urgency: 'Low',
        location: '',
        isAnonymous: false
    },
    user: { id: 'c10ed797-a75e-4048-bf53-f8378761a11f', role: 'STUDENT' }
} as any;

const res = {
    status: function (code: any) { console.log('STATUS:', code); return this; },
    json: function (data: any) { console.log('JSON:', data); return this; }
} as any;

async function run() {
    try {
        await submitComplaint(req, res);
    } catch (e) {
        console.error("CAUGHT EXCEPTION", e);
    }
}
run();
