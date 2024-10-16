# @zrl's assorted Slack scripts

Written with help of AI.

### Setup

1. **Install Dependencies:**

    ```bash
    bun add @slack/web-api dotenv
    ```

2. **Configure Environment Variables:**

    - Create a `.env` file in the root of your project if it doesn't exist.
    - Add your Slack user token to the `.env` file:

      ```
      SLACK_USER_TOKEN=your-slack-user-token
      ```

3. **Running the Script:**

    Execute the script using Bun and pass the Slack message link as an argument:

    ```bash
    bun emails-of-reactors.js "https://yourworkspace.slack.com/archives/C01234567/p1234567890123456"
    ```
