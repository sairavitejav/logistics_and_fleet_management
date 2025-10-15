const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const migrateUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all users without isActive field or where it's undefined
        const usersToUpdate = await User.find({
            $or: [
                { isActive: { $exists: false } },
                { isActive: null }
            ]
        });

        console.log(`Found ${usersToUpdate.length} users without isActive field`);

        // Update all users to have isActive: true by default
        const result = await User.updateMany(
            {
                $or: [
                    { isActive: { $exists: false } },
                    { isActive: null }
                ]
            },
            { $set: { isActive: true } }
        );

        console.log(`Updated ${result.modifiedCount} users`);

        // Verify the update
        const allUsers = await User.find({}).select('name email isActive');
        console.log('\nAll users after migration:');
        allUsers.forEach(user => {
            console.log(`- ${user.name} (${user.email}): isActive = ${user.isActive}`);
        });

        await mongoose.connection.close();
        console.log('\nMigration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateUsers();
