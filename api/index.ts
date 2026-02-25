import express from 'express';
import dotenv from 'dotenv';
import sequelize from '../src/models';
import routes from '../src/routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/', routes);

app.get('/', (req, res) => {
    res.send('Bitespeed Identity Reconciliation Service is Live!');
});

// Middleware to ensure DB is synced before handling requests
let isSynced = false;
app.use(async (req, res, next) => {
    if (!isSynced) {
        try {
            console.log('Syncing database before request...');
            await sequelize.sync();
            isSynced = true;
            console.log('Database synced successfully');
        } catch (err) {
            console.error('Failed to sync database during request:', err);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }
    next();
});

// Vercel handles the listening. Only listen locally or in non-production environments.
if (process.env.NODE_ENV !== 'production' && process.env.LOCAL_DEV === 'true') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
