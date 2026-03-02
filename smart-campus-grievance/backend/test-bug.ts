import { prisma } from './src/index';
import { submitComplaint } from './src/controllers/complaint.controller';

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

submitComplaint(req, res).then(() => {
    console.log('Done');
    process.exit(0);
}).catch(console.error);
