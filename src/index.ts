import express from 'express';
import dotenv from 'dotenv';
import sequelize from './models';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', routes);

app.get('/', (req, res) => {
    res.send('Bitespeed Identity Reconciliation Service');
});

// Sync database and start server
sequelize.sync()
    .then(() => {
        console.log('Database synced');
    })
    .catch((err) => {
        console.error('Failed to sync database:', err);
    });

if (process.env.NODE_ENV !== 'production' || process.env.LOCAL_DEV === 'true') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
