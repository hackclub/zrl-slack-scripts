// Import necessary modules
// Bun supports global modules and global async/await
const fs = require('fs');
const { WebClient } = require('@slack/web-api');
require('dotenv').config();

// Slack API user token should be set as an environment variable
const token = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(token);

// Get the Slack message link from CLI arguments
const messageLink = process.argv[2];

if (!messageLink) {
    console.error('Please provide a Slack message link as a CLI argument.');
    process.exit(1);
}

(async () => {
    // Parse the message link to extract channel ID and message timestamp
    const messageLinkRegex = /https:\/\/[^\/]+\.slack\.com\/archives\/([^\/]+)\/p(\d{10})(\d{6})/;
    const match = messageLink.match(messageLinkRegex);

    if (!match) {
        console.error('Invalid Slack message link format.');
        process.exit(1);
    }

    const channel = match[1];
    const timestamp = `${match[2]}.${match[3]}`;

    try {
        // Get reactions for the message
        const reactionsResponse = await web.reactions.get({
            channel: channel,
            timestamp: timestamp,
            full: true
        });

        const message = reactionsResponse.message;

        if (!message.reactions) {
            console.log('No reactions found for this message.');
            process.exit(0);
        }

        const userReactions = {};

        // Build a mapping of users to their reactions
        for (const reaction of message.reactions) {
            const { users, name: emoji } = reaction;

            for (const userId of users) {
                if (!userReactions[userId]) {
                    userReactions[userId] = new Set();
                }
                userReactions[userId].add(emoji);
            }
        }

        const csvLines = ['Full Name,Email,Username,Reactions'];

        // For each user, get their profile information
        for (const userId of Object.keys(userReactions)) {
            const userResponse = await web.users.info({ user: userId });
            const user = userResponse.user;
            const fullName = user.profile.real_name_normalized || '';
            const email = user.profile.email || '';
            const username = user.name || '';
            const reactions = Array.from(userReactions[userId]).sort().join(',');

            csvLines.push(`"${fullName}","${email}","${username}","${reactions}"`);
        }

        // Write to reactors.csv
        fs.writeFileSync('reactors.csv', csvLines.join('\n'));
        console.log('reactors.csv has been created.');
    } catch (error) {
        console.error('An error occurred:', error);
    }
})();

