import express from 'express';
import dotenv from 'dotenv';
import sequelize from './models';
import routes from './routes';

dotenv.config();

const app = express();

app.use(express.json());
app.use('/', routes);

app.get('/', (req, res) => {
    res.send('Bitespeed Identity Reconciliation Service is Live!');
});

// Sync database - in serverless, we sync on startup (cold start)
// Note: In production, migrations are preferred, but for this task sync() is used as requested.
sequelize.sync()
    .then(() => {
        console.log('Database synced');
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });

// Vercel handles the listening. Only listen locally or in non-production environments.
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
