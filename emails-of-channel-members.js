// Import necessary modules
const fs = require('fs');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

// Slack API user token should be set as an environment variable
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

// Get the Slack channel name from CLI arguments
const channelNameInput = process.argv[2];

if (!channelNameInput) {
    console.error('Please provide a Slack channel name as a CLI argument (e.g., #counterspell).');
    process.exit(1);
}

// Remove the '#' if provided
const channelName = channelNameInput.startsWith('#') ? channelNameInput.slice(1) : channelNameInput;

// Fetch all members of the channel with pagination
const fetchAllMembers = async (channelId) => {
    let allMembers = [];
    let cursor = undefined;

    do {
        const membersResponse = await web.conversations.members({
            channel: channelId,
            limit: 1000,
            cursor: cursor
        });

        allMembers = allMembers.concat(membersResponse.members);
        cursor = membersResponse.response_metadata.next_cursor;
    } while (cursor);

    return allMembers;
};

(async () => {
    try {
        // Modify conversations.list to handle pagination
        let channel;
        let cursor;

        do {
            const channelsResponse = await web.conversations.list({
                exclude_archived: true,
                types: 'public_channel,private_channel',
                limit: 1000,
                cursor: cursor
            });

            // Find the channel in the current batch
            channel = channelsResponse.channels.find(ch => ch.name === channelName);
            if (channel) break;

            // Update cursor for the next batch
            cursor = channelsResponse.response_metadata.next_cursor;
        } while (cursor);

        if (!channel) {
            console.error(`Channel named "${channelName}" not found.`);
            process.exit(1);
        }

        // Fetch all members of the channel with pagination
        const memberIds = await fetchAllMembers(channel.id);

        const csvLines = ['Full Name,Email,Username'];

        // Fetch user information for each member
        for (const userId of memberIds) {
            const userResponse = await web.users.info({ user: userId });
            const user = userResponse.user;

            if (!user || user.is_bot) { // Omit bots
                continue; // Skip if user is a bot or information is not available
            }

            const fullName = user.profile.real_name_normalized || '';
            const email = user.profile.email || '';
            const username = user.name || '';

            csvLines.push(`"${fullName}","${email}","${username}"`);
        }

        // Write to channel_members.csv
        fs.writeFileSync('channel_members.csv', csvLines.join('\n'));
        console.log('channel_members.csv has been created.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
